import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Loader2, Pencil, Info, Home, ChevronDown, Lock, ShieldCheck } from 'lucide-react';

// Types & Constants
import { QuickZone, QuickRoofZone } from './types';
import { 
  DEFAULT_QUICK_ZONES, DEFAULT_QUICK_ROOF_ZONES, SECTION_COLORS,
  SHUTTER_COLORS, TRIM_COLORS
} from './constants/catalog';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import QuoteModal from './components/modals/QuoteModal';
import { TermsOfUseModal as TermsModal, PrivacyPolicyModal as PrivacyModal } from './components/modals/LegalModals';
import InfoModal from './components/modals/InfoModal';
import SourceAsset from './components/visualizer/SourceAsset';
import VisualizerCanvas from './components/visualizer/VisualizerCanvas';
import SidingCatalog from './components/catalog/SidingCatalog';
import RoofingCatalog from './components/catalog/RoofingCatalog';

// Hooks & Utils
import { useZoomPan } from './hooks/useZoomPan';
import { useAIProcessing } from './hooks/useAIProcessing';
import { downscaleImage } from './utils/image';
import { API_BASE } from './utils/apiConfig';

// ---------------------------------------------------------------------------
// FEATURE FLAGS
// ---------------------------------------------------------------------------
const LEAD_CAPTURE_ENABLED = true;

// ---------------------------------------------------------------------------
// ACCESS GATE — change this code to control who can use the app
// ---------------------------------------------------------------------------
const ACCESS_CODE = 'blueprint2026';
const ACCESS_KEY = 'bpenv_access';

const AccessGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(ACCESS_KEY) === 'granted'; } catch { return false; }
  });
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === ACCESS_CODE.toLowerCase()) {
      try { localStorage.setItem(ACCESS_KEY, 'granted'); } catch {}
      setUnlocked(true);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#050810',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <form onSubmit={handleSubmit} style={{
        position: 'relative', zIndex: 1,
        background: '#0F172A', border: '1px solid #1E293B',
        borderRadius: 20, padding: '48px 40px', maxWidth: 400, width: '90%',
        textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(59,130,246,0.1)',
        animation: shaking ? 'shake 0.4s ease' : undefined,
      }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          .gate-input:focus { outline: none; border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.2) !important; }
        `}</style>

        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(59,130,246,0.35)',
        }}>
          <Lock style={{ width: 24, height: 24, color: 'white' }} />
        </div>

        <h2 style={{
          fontSize: 20, fontWeight: 800, color: '#F1F5F9',
          letterSpacing: '-0.03em', marginBottom: 6,
        }}>BlueprintEnvision</h2>
        <p style={{
          fontSize: 12, color: '#64748B', marginBottom: 28,
          fontWeight: 500, letterSpacing: '0.02em',
        }}>Enter your access code to continue</p>

        <input
          className="gate-input"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          autoFocus
          style={{
            width: '100%', padding: '14px 16px',
            background: '#0A0E17', border: '1px solid #1E293B',
            borderRadius: 12, color: '#F1F5F9', fontSize: 14,
            fontFamily: 'inherit', fontWeight: 600,
            letterSpacing: '0.1em', textAlign: 'center',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />

        {error && (
          <p style={{
            fontSize: 11, color: '#EF4444', fontWeight: 600,
            marginTop: 10, letterSpacing: '0.04em',
          }}>Invalid access code</p>
        )}

        <button type="submit" style={{
          width: '100%', marginTop: 16, padding: '14px',
          borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #0EA5E9, #3B82F6)',
          color: 'white', fontSize: 13, fontWeight: 800,
          fontFamily: 'inherit', textTransform: 'uppercase',
          letterSpacing: '0.1em', cursor: 'pointer',
          boxShadow: '0 0 24px rgba(14,165,233,0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(14,165,233,0.45)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(14,165,233,0.3)'; }}
        >
          Unlock
        </button>

        <p style={{
          fontSize: 10, color: '#475569', marginTop: 20,
          fontWeight: 500,
        }}>Need access? Contact <a href="mailto:drew@blueprintaiconsulting.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>drew@blueprintaiconsulting.com</a></p>
      </form>
    </div>
  );
};



const App: React.FC = () => {
  // --- CORE STATE ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  
  // --- MODAL STATE ---
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEnhancePrompt, setShowEnhancePrompt] = useState(false);
  
  // --- QUICK MODE STATE ---
  const [quickZones, setQuickZones] = useState<QuickZone[]>(DEFAULT_QUICK_ZONES);
  const [quickRoofZones, setQuickRoofZones] = useState<QuickRoofZone[]>(DEFAULT_QUICK_ROOF_ZONES);
  const [expandedRoofZoneId, setExpandedRoofZoneId] = useState<string | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [detectedZones, setDetectedZones] = useState<string[]>(['rz-main', 'qz-main', 'qz-gable', 'qz-dormer', 'qz-shutters', 'qz-trim', 'qz-garage', 'rz-gutters']);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // --- UI & CANVAS STATE ---
  const [sliderPos, setSliderPos] = useState(100);
  const [swatchPreviewHex, setSwatchPreviewHex] = useState<string | null>(null);
  const [swatchPreviewName, setSwatchPreviewName] = useState<string | null>(null);
  const [swatchPreviewImage, setSwatchPreviewImage] = useState<string | null>(null);
  const [swatchPreviewTextureStyle, setSwatchPreviewTextureStyle] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  const [imageOptimizeInfo, setImageOptimizeInfo] = useState<string | null>(null);

  // --- PIPELINE STATE ---
  const [renderPhase, setRenderPhase] = useState<'idle' | 'roof' | 'siding' | 'done'>('idle');
  const [roofPassResult, setRoofPassResult] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>('roof');

  // --- REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HOOKS ---
  const zoomPan = useZoomPan();
  const ai = useAIProcessing();

  // --- EFFECTS ---

  // Preload a demo home image on first mount so the preview isn't empty
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}demo-pa-colonial.png`)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setSelectedImage(dataUrl);
          setSelectedImageName('demo-pa-colonial.png');
          setShowEnhancePrompt(false); // Don't prompt enhance for the default image
          const img = new Image();
          img.onload = () => setImageDimensions({ width: img.width, height: img.height });
          img.src = dataUrl;
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {}); // Silently fail if asset missing
  }, []);

  // Run background AI detection whenever the active image changes
  useEffect(() => {
    if (!selectedImage) return;

    const urlLower = (selectedImageName || '').toLowerCase();
    
    // Quick, zero-latency defaults for demo images to avoid redundant API hits and look instant
    if (urlLower.includes('demo-pa-colonial.png')) {
      setDetectedZones(['rz-main', 'qz-main', 'qz-gable', 'qz-shutters', 'qz-trim', 'rz-gutters']);
    } else if (urlLower.includes('demo-pa-ranch.png')) {
      setDetectedZones(['rz-main', 'qz-main', 'qz-trim', 'qz-garage', 'rz-gutters']);
      return;
    } else if (urlLower.includes('demo-pa-cape-cod.png')) {
      setDetectedZones(['rz-main', 'qz-main', 'qz-dormer', 'qz-trim', 'qz-shutters', 'rz-gutters']);
      return;
    } else if (
      urlLower.includes('demo-pa-bi-level.png') || 
      urlLower.includes('demo-pa-split-level.png') || 
      urlLower.includes('demo-pa-two-story.png')
    ) {
      setDetectedZones(['rz-main', 'qz-main', 'qz-trim', 'qz-garage', 'qz-gable', 'rz-gutters']);
      return;
    }

    // For custom user uploaded photos, run parallel queries to detect siding and roofing zones
    const detectHouseFeatures = async () => {
      setIsDetecting(true);
      try {
        const base64 = selectedImage.split(',')[1];
        const mime = selectedImage.split(';')[0].split(':')[1] || 'image/jpeg';

        const [sidingRes, roofRes] = await Promise.all([
          fetch(`${API_BASE}/api/detect-sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
          }),
          fetch(`${API_BASE}/api/roof-detect-sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
          }),
        ]);

        const zonesList = ['rz-main', 'qz-main'];

        if (sidingRes.ok) {
          const sidingData = await sidingRes.json();
          const names = [
            ...(sidingData.sections || []).map((s: any) => s.name.toLowerCase()),
            ...(sidingData.optionalSections || []).map((s: any) => s.name.toLowerCase()),
          ];

          if (names.some((n) => n.includes('gable'))) zonesList.push('qz-gable');
          if (names.some((n) => n.includes('dormer'))) zonesList.push('qz-dormer');
          if (names.some((n) => n.includes('garage'))) zonesList.push('qz-garage');
          if (names.some((n) => n.includes('shutter'))) zonesList.push('qz-shutters');
          if (names.some((n) => n.includes('trim') || n.includes('corner'))) zonesList.push('qz-trim');
        }

        if (roofRes.ok) {
          const roofData = await roofRes.json();
          const names = [
            ...(roofData.sections || []).map((s: any) => s.name.toLowerCase()),
            ...(roofData.optionalSections || []).map((s: any) => s.name.toLowerCase()),
          ];

          if (names.some((n) => n.includes('gutter'))) zonesList.push('rz-gutters');
        }

        // Apply detected list if we got valid responses, otherwise fallback to show all
        if (zonesList.length > 2) {
          setDetectedZones(zonesList);
        } else {
          setDetectedZones(['rz-main', 'qz-main', 'qz-gable', 'qz-dormer', 'qz-shutters', 'qz-trim', 'qz-garage', 'rz-gutters']);
        }
      } catch (err) {
        console.error('Detection failed:', err);
        setDetectedZones(['rz-main', 'qz-main', 'qz-gable', 'qz-dormer', 'qz-shutters', 'qz-trim', 'qz-garage', 'rz-gutters']);
      } finally {
        setIsDetecting(false);
      }
    };

    detectHouseFeatures();
  }, [selectedImage]);

  // --- HANDLERS ---
  const handleUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setSelectedImageName(file.name);
      setQuickResult(null);
      setResultImage(null);
      setEnhancedImage(null);

      setShowEnhancePrompt(true);
      
      const img = new Image();
      img.onload = () => setImageDimensions({ width: img.width, height: img.height });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleStartOver = () => {
    const hasResult = !!(quickResult || resultImage);
    if (hasResult && !confirm('Are you sure you want to start over? Your visualization will be lost.')) return;
    setSelectedImage(null);
    setSelectedImageName(null);
    setQuickResult(null);
    setResultImage(null);
    setEnhancedImage(null);
    setShowEnhancePrompt(false);
    setQuickZones(DEFAULT_QUICK_ZONES);
    setQuickRoofZones(DEFAULT_QUICK_ROOF_ZONES);
    setDetectedZones(['rz-main', 'qz-main', 'qz-gable', 'qz-dormer', 'qz-shutters', 'qz-trim', 'qz-garage', 'rz-gutters']);
    setImageOptimizeInfo(null);
    zoomPan.resetView();
  };



  const togglePanel = (panel: string) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const rawRoofChanges = quickRoofZones.some(z => z.enabled);
  const rawSidingChanges = quickZones.some(z => z.enabled);

  // If the user hasn't selected anything yet, default to the currently active panel
  const hasRoofChanges = rawRoofChanges || (!rawRoofChanges && !rawSidingChanges && activePanel === 'roof');
  const hasSidingChanges = rawSidingChanges || (!rawRoofChanges && !rawSidingChanges && activePanel === 'siding');

  const handleGenerate = async () => {
    if (!selectedImage) return;
    
    {
      ai.setIsQuickGenerating(true);
      ai.setError(null);
      setRoofPassResult(null);
      
      try {
        let currentImage = selectedImage;

        // --- PASS 1: ROOF + GUTTERS ---
        if (hasRoofChanges) {
          setRenderPhase('roof');
          const roofZonesPayload = quickRoofZones
            .filter(z => (z.enabled || z.id === 'rz-main') && detectedZones.includes(z.id))
            .map(z => ({
              name: z.name,
              productName: z.selectedLine.line,
              colorName: z.selectedColor.name,
              colorHex: z.selectedColor.hex,
              hue: z.selectedColor.hue,
              materialType: z.selectedLine.materialType || 'Architectural Shingles'
            }));

          const base64 = currentImage.split(',')[1];
          const mime = currentImage.split(';')[0].split(':')[1];
          const roofRes = await fetch(`${API_BASE}/api/roof-quick-render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: mime, zones: roofZonesPayload }),
          });
          const roofData = await roofRes.json();
          if (!roofRes.ok) throw new Error(roofData.error || 'Roof render failed.');
          currentImage = roofData.resultImage;
          setRoofPassResult(currentImage);
        }

        // --- PASS 2: SIDING + TRIM + SHUTTERS ---
        if (hasSidingChanges) {
          setRenderPhase('siding');
          const sidingZonesPayload = quickZones
            .filter(z => (z.enabled || z.id === 'qz-main') && detectedZones.includes(z.id))
            .map(z => ({
              name: z.name,
              lineName: z.selectedLine.line,
              colorName: z.selectedColor.name,
              colorHex: z.selectedColor.hex,
              hue: z.selectedColor.hue,
              style: z.selectedLine.style,
              textureStyle: z.selectedLine.textureStyle
            }));

          const base64 = currentImage.split(',')[1];
          const mime = currentImage.split(';')[0].split(':')[1] || 'image/png';
          const sidingRes = await fetch(`${API_BASE}/api/quick-render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, mimeType: mime, zones: sidingZonesPayload }),
          });
          const sidingData = await sidingRes.json();
          if (!sidingRes.ok) throw new Error(sidingData.error || 'Siding render failed.');
          currentImage = sidingData.resultImage;
        }

        setRenderPhase('done');
        setQuickResult(currentImage);
      } catch (err: any) {
        ai.setError(err.message || 'Generation failed.');
      } finally {
        ai.setIsQuickGenerating(false);
        setTimeout(() => setRenderPhase('idle'), 2000);
      }
    }
  };

  const handleEnhance = async () => {
    if (!selectedImage) return;
    ai.setIsProcessing(true);
    ai.setError(null);
    try {
      const scaled = await downscaleImage(selectedImage, 1536);
      const res = await fetch(`${API_BASE}/api/enhance-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: scaled.split(',')[1] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Optimization failed');
      if (data.enhancedImageBase64) {
        const mime = data.mimeType || 'image/png';
        setEnhancedImage(`data:${mime};base64,${data.enhancedImageBase64}`);
      } else {
        throw new Error('No enhanced image returned');
      }
    } catch (e: unknown) {
      ai.setError(e instanceof Error ? e.message : 'Optimization failed.');
    } finally {
      ai.setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060B18] text-[#E2E8F0] font-sans antialiased overflow-x-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Header 
        hasImage={!!selectedImage} 
        onStartOver={handleStartOver} 
        onQuoteClick={() => setShowQuoteModal(true)}
        isQuoteAvailable={!!(quickResult || resultImage)}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-4 space-y-3 lg:space-y-6">

            <SourceAsset 
              selectedImage={selectedImage}
              onUpload={handleUpload}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleUpload(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              onReplaceClick={() => fileInputRef.current?.click()}
              imageOptimizeInfo={imageOptimizeInfo}
              showEnhancePrompt={showEnhancePrompt}
              setShowEnhancePrompt={setShowEnhancePrompt}
              isEnhancing={ai.isProcessing && !enhancedImage}
              enhancedImage={enhancedImage}
              enhanceError={ai.error}
              onEnhance={handleEnhance}
              onAcceptEnhanced={() => { 
                setSelectedImage(enhancedImage); 
                setEnhancedImage(null); 
                setShowEnhancePrompt(false);
                setImageOptimizeInfo('House photo optimized for visualization');
              }}
              fileInputRef={fileInputRef}
            />

            {/* Catalog Area */}
            {
              <div className="space-y-4">
                {/* --- ROOFING SECTION --- */}
                <div className={`rounded-xl border overflow-hidden transition-colors ${activePanel === 'roof' ? 'border-[#334155]' : 'border-[#1E293B]'}`}>
                  <button
                    onClick={() => togglePanel('roof')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0">01</div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Roofing</h2>
                      {/* Collapsed summary — show selected color chip */}
                      {activePanel !== 'roof' && (
                        <div className="flex items-center gap-2 ml-1">
                          <div className="w-4 h-4 rounded-sm border border-white/15 shrink-0" style={{ backgroundColor: quickRoofZones[0]?.selectedColor.hex }} />
                          <span className="text-[10px] text-[#94A3B8] truncate max-w-[100px]">
                            {quickRoofZones[0]?.selectedColor.name} · {quickRoofZones[0]?.selectedLine.tier}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderPhase === 'roof' && <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />}
                      {renderPhase === 'done' && hasRoofChanges && <span className="text-[9px] text-[#10B981] font-bold">✓</span>}
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${activePanel === 'roof' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {activePanel === 'roof' && (
                    <div className="border-t border-[#1E293B]">
                      <RoofingCatalog 
                        quickRoofZones={quickRoofZones}
                        setQuickRoofZones={setQuickRoofZones}
                        expandedRoofZoneId={expandedRoofZoneId}
                        setExpandedRoofZoneId={setExpandedRoofZoneId}
                        onColorMouseEnter={(c) => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(c.swatchImage || null); setSwatchPreviewTextureStyle(quickRoofZones[0]?.selectedLine.textureStyle || null); }}
                        onColorMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); setSwatchPreviewTextureStyle(null); }}
                        detectedZones={detectedZones}
                      />
                    </div>
                  )}
                </div>

                {/* --- SIDING SECTION --- */}
                {
                <div className={`rounded-xl border overflow-hidden transition-colors ${activePanel === 'siding' ? 'border-[#334155]' : 'border-[#1E293B]'}`}>
                  <button
                    onClick={() => togglePanel('siding')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0">02</div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Siding</h2>
                      {/* Collapsed summary */}
                      {activePanel !== 'siding' && (() => {
                        const mainZ = quickZones.find(z => z.id === 'qz-main');
                        return mainZ ? (
                          <div className="flex items-center gap-2 ml-1">
                            <div className="w-4 h-4 rounded-sm border border-white/15 shrink-0" style={{ backgroundColor: mainZ.selectedColor.hex }} />
                            <span className="text-[10px] text-[#94A3B8] truncate max-w-[100px]">
                              {mainZ.selectedColor.name} · {mainZ.selectedLine.tier}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderPhase === 'siding' && <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />}
                      {renderPhase === 'done' && hasSidingChanges && <span className="text-[9px] text-[#10B981] font-bold">✓</span>}
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${activePanel === 'siding' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {activePanel === 'siding' && (
                    <div className="border-t border-[#1E293B]">
                      <SidingCatalog 
                        quickZones={quickZones}
                        setQuickZones={setQuickZones}
                        expandedZoneId={expandedZoneId}
                        setExpandedZoneId={setExpandedZoneId}
                        onColorMouseEnter={(c) => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(null); setSwatchPreviewTextureStyle(quickZones.find(z => z.id === 'qz-main')?.selectedLine.textureStyle || null); }}
                        onColorMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); setSwatchPreviewTextureStyle(null); }}
                        detectedZones={detectedZones}
                      />
                    </div>
                  )}
                </div>
                }

                {/* --- ACCENTS SECTION (Trim & Shutters) --- */}
                {
                <div className={`rounded-xl border overflow-hidden transition-colors ${activePanel === 'accents' ? 'border-[#334155]' : 'border-[#1E293B]'}`}>
                  <button
                    onClick={() => togglePanel('accents')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0">03</div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Accents</h2>
                      {/* Collapsed summary */}
                      {activePanel !== 'accents' && (() => {
                        const trimZ = quickZones.find(z => z.id === 'qz-trim');
                        const shutterZ = quickZones.find(z => z.id === 'qz-shutters');
                        return (
                          <div className="flex items-center gap-1.5 ml-1">
                            {trimZ && trimZ.enabled && (
                              <div className="w-4 h-4 rounded-sm border border-white/15 shrink-0" style={{ backgroundColor: trimZ.selectedColor.hex }} title={`Trim: ${trimZ.selectedColor.name}`} />
                            )}
                            {shutterZ && shutterZ.enabled && (
                              <div className="w-4 h-4 rounded-sm border border-white/15 shrink-0" style={{ backgroundColor: shutterZ.selectedColor.hex }} title={`Shutters: ${shutterZ.selectedColor.name}`} />
                            )}
                            <span className="text-[10px] text-[#94A3B8]">Trim & Shutters</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${activePanel === 'accents' ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {activePanel === 'accents' && (
                    <div className="border-t border-[#1E293B] bg-[#111827] p-4 space-y-2">
                      {quickZones.filter(z => ['qz-shutters', 'qz-trim'].includes(z.id) && detectedZones.includes(z.id)).map((zone) => {
                        const palette = zone.id === 'qz-shutters' ? SHUTTER_COLORS : TRIM_COLORS;
                        const paletteLabel = zone.id === 'qz-shutters' ? 'Shutter Colors' : 'Trim Colors';
                        const isExpanded = expandedZoneId === zone.id;
                        
                        return (
                          <div key={zone.id} className={`rounded-lg border overflow-hidden transition-all ${zone.enabled ? 'border-[#334155] bg-[#0F172A]' : 'border-[#1E293B] bg-[#0A0E17]'}`}>
                            <div className="flex items-center gap-3 p-3">
                              <button
                                onClick={() => setQuickZones(prev => prev.map(z => z.id === zone.id ? { ...z, enabled: !z.enabled } : z))}
                                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${zone.enabled ? 'bg-[#3B82F6]' : 'bg-[#1E293B] border border-[#334155]'}`}
                              >
                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${zone.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                              </button>
                              <span className={`text-xs font-bold flex-1 transition-colors ${zone.enabled ? 'text-[#E2E8F0]' : 'text-[#475569]'}`}>{zone.name}</span>
                              {zone.enabled && (
                                <button onClick={() => setExpandedZoneId(isExpanded ? null : zone.id)} className="flex items-center gap-1.5 group">
                                  <div className="w-4 h-4 rounded-sm border border-white/20 shrink-0" style={{ backgroundColor: zone.selectedColor.hex }} />
                                  <span className="text-[9px] text-[#94A3B8] group-hover:text-[#E2E8F0] truncate max-w-[72px] transition-colors">{zone.selectedColor.name}</span>
                                  <ChevronDown className={`w-3 h-3 text-[#64748B] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>
                            {zone.enabled && isExpanded && (
                              <div className="border-t border-[#1E293B] bg-[#0A0E17]/80 p-3">
                                <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest mb-2">{paletteLabel}</p>
                                <div className="grid grid-cols-6 gap-2">
                                  {palette.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => setQuickZones(prev => prev.map(z => z.id === zone.id ? { ...z, selectedColor: c as any } : z))}
                                      onMouseEnter={() => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(null); }}
                                      onMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); }}
                                      className={`aspect-square rounded-md border-2 transition-all hover:scale-110 ${
                                        zone.selectedColor.id === c.id ? 'border-[#3B82F6] ring-1 ring-[#3B82F6] scale-110' : 'border-transparent hover:border-[#64748B]'
                                      }`}
                                      style={{ backgroundColor: c.hex }}
                                      title={c.name}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                }

                {/* --- RENDER PROGRESS --- */}
                {renderPhase !== 'idle' && (
                  <div className="bg-[#0A0E17] rounded-xl border border-[#1E293B] p-4">
                    <div className="flex items-center gap-2">
                      {renderPhase === 'done'
                        ? <span className="text-[#10B981] text-xs">✓</span>
                        : <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />}
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${renderPhase === 'done' ? 'text-[#10B981]' : 'text-[#60A5FA]'}`}>
                        {renderPhase === 'done' ? '✦ Visualization complete' : renderPhase === 'roof' ? 'Rendering roof…' : 'Rendering siding…'}
                      </span>
                    </div>
                  </div>
                )}

                {ai.error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-xs font-medium space-y-1">
                    <p className="font-bold text-red-500 uppercase tracking-widest text-[10px]">Visualization Error</p>
                    <p className="text-red-300/90 leading-relaxed">{ai.error}</p>
                  </div>
                )}
              </div>
            }

            {/* Disclaimer & Action Button */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-[#0A0E17] border border-[#1E293B] rounded-lg">
              <Info className="w-3 h-3 text-[#475569] shrink-0 mt-0.5" />
              <p className="text-[8.5px] text-[#475569] leading-relaxed">
                Color values are best-effort digital approximations — <span className="text-[#64748B]">physical samples are the authoritative reference</span>.
              </p>
            </div>

            <div className="flex gap-2 mt-3 sm:mt-4">
              {(quickResult || resultImage) && (
                <button 
                  onClick={() => { setQuickResult(null); setResultImage(null); }} 
                  className="w-[100px] sm:w-[120px] py-3.5 sm:py-4 rounded-lg font-bold text-[#94A3B8] bg-[#1E293B] hover:bg-[#334155] hover:text-white active:scale-[0.97] transition-all text-[10px] tracking-widest uppercase border border-[#334155] flex flex-col items-center justify-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <button 
                disabled={ai.isQuickGenerating || ai.isProcessing || !selectedImage} 
                onClick={handleGenerate}
                className={`flex-1 py-3.5 sm:py-4 min-h-[52px] rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 sm:gap-3 transition-all uppercase tracking-wider text-[10px] sm:text-[11px] active:scale-[0.97] ${ai.isQuickGenerating || ai.isProcessing || !selectedImage ? 'bg-[#1E293B] text-[#64748B] cursor-not-allowed border border-[#334155]' : (quickResult || resultImage) ? 'bg-[#1D4ED8] hover:bg-[#1E3A8A] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[0_0_20px_rgba(59,130,246,0.35)]'}`}
              >
                {ai.isQuickGenerating || ai.isProcessing 
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</>
                  : (quickResult || resultImage) 
                    ? <><Sparkles className="w-4 h-4" /> Re-Generate</> 
                    : <><Home className="w-4 h-4" /> Visualize Exterior</>}
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 lg:sticky lg:top-4 self-start">
            <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-1 flex flex-col shadow-2xl overflow-hidden" style={{ height: 'min(calc(100vh - 100px), 900px)', minHeight: '260px' }}>
              <div className="bg-[#0F172A] border-b border-[#1E293B] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Engine Active</span>
                  </div>
                  {isDetecting && (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
                      <span className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-widest">Analyzing house features…</span>
                    </div>
                  )}
                </div>

              </div>

              <VisualizerCanvas 
                selectedImage={selectedImage}
                resultImage={resultImage}
                quickResult={quickResult}
                isProcessing={ai.isProcessing}
                isQuickGenerating={ai.isQuickGenerating}
                sliderPos={sliderPos}
                setSliderPos={setSliderPos}
                zoom={zoomPan.zoom}
                setZoom={zoomPan.setZoom}
                pan={zoomPan.pan}
                setPan={zoomPan.setPan}
                isPanMode={zoomPan.isPanMode}
                setIsPanMode={zoomPan.setIsPanMode}
                isDraggingPan={zoomPan.isDraggingPan}
                onStartPan={zoomPan.startPan}
                onMovePan={zoomPan.movePan}
                onEndPan={zoomPan.endPan}
                appMode={'quick'}
                onQuoteClick={() => setShowQuoteModal(true)}
                swatchPreviewHex={swatchPreviewHex}
                swatchPreviewName={swatchPreviewName}
                swatchPreviewImage={swatchPreviewImage}
                swatchPreviewTextureStyle={swatchPreviewTextureStyle}
                sections={[]}
                currentSectionId={null}
                hoveredSectionId={null}
                imageDimensions={imageDimensions}
                canvasRef={canvasRef}
                SECTION_COLORS={SECTION_COLORS}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer onShowToS={() => setShowTermsModal(true)} onShowPrivacy={() => setShowPrivacyModal(true)} />
      <QuoteModal 
        isOpen={showQuoteModal} 
        onClose={() => setShowQuoteModal(false)} 
        leadCaptureEnabled={LEAD_CAPTURE_ENABLED}
        visualizationImage={quickResult || resultImage}
        roofZones={quickRoofZones}
        sidingZones={quickZones}
        onShowToS={() => { setShowQuoteModal(false); setTimeout(() => setShowTermsModal(true), 200); }}
        onShowPrivacy={() => { setShowQuoteModal(false); setTimeout(() => setShowPrivacyModal(true), 200); }}
      />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
};

// Wrap the app with the access gate
const ProtectedApp: React.FC = () => (
  <AccessGate>
    <App />
  </AccessGate>
);

export default ProtectedApp;
