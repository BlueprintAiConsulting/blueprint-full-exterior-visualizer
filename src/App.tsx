import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Package, Undo, Redo, Sparkles, Loader2, Pencil, Info, Home, ChevronDown
} from 'lucide-react';

// Types & Constants
import { Section, SidingLine, SidingColor, QuickZone, QuickRoofZone } from './types';
import { 
  SIDING_OPTIONS, DEFAULT_QUICK_ZONES, DEFAULT_QUICK_ROOF_ZONES, SECTION_COLORS,
  SHUTTER_COLORS, TRIM_COLORS
} from './constants/catalog';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import QuoteModal from './components/modals/QuoteModal';
import { TermsOfUseModal as TermsModal, PrivacyPolicyModal as PrivacyModal } from './components/modals/LegalModals';
import InfoModal from './components/modals/InfoModal';
import SourceAsset from './components/visualizer/SourceAsset';
import AISectionSeparator from './components/visualizer/AISectionSeparator';
import VisualizerCanvas from './components/visualizer/VisualizerCanvas';
import SidingCatalog from './components/catalog/SidingCatalog';
import RoofingCatalog from './components/catalog/RoofingCatalog';
import AdvancedCatalog from './components/catalog/AdvancedCatalog';

// Hooks & Utils
import { useHistory } from './hooks/useHistory';
import { useZoomPan } from './hooks/useZoomPan';
import { useAIProcessing } from './hooks/useAIProcessing';
import { downscaleImage } from './utils/image';
import { API_BASE } from './utils/apiConfig';

// ---------------------------------------------------------------------------
// FEATURE FLAGS
// SIDING_ENABLED     — set true when siding integration is ready
// LEAD_CAPTURE_ENABLED — set true when client upgrades to Pro/Premium tier
//                        (enables quote form + email lead delivery)
// ---------------------------------------------------------------------------
const SIDING_ENABLED = true;
const LEAD_CAPTURE_ENABLED = true;
const ADVANCED_ENABLED = true; // Advanced Mode enabled for siding



const App: React.FC = () => {
  // --- CORE STATE ---
  const [appMode, setAppMode] = useState<'quick' | 'advanced'>('quick');
  const [exteriorType, setExteriorType] = useState<'siding' | 'roofing'>(SIDING_ENABLED ? 'siding' : 'roofing');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  
  // --- MODAL STATE ---
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEnhancePrompt, setShowEnhancePrompt] = useState(false);
  
  // --- ADVANCED MODE STATE ---
  const { 
    state: sections, 
    setState: setSections, 
    undo, redo, saveState: saveHistory,
    canUndo, canRedo 
  } = useHistory<Section[]>([]);
  
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [optionalSections, setOptionalSections] = useState<{name: string, maskTarget: string}[]>([]);
  
  // --- QUICK MODE STATE ---
  const [quickZones, setQuickZones] = useState<QuickZone[]>(DEFAULT_QUICK_ZONES);
  const [quickRoofZones, setQuickRoofZones] = useState<QuickRoofZone[]>(DEFAULT_QUICK_ROOF_ZONES);
  const [expandedRoofZoneId, setExpandedRoofZoneId] = useState<string | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [expandedColorZones, setExpandedColorZones] = useState<Set<string>>(new Set());
  
  // --- UI & CANVAS STATE ---
  const [sliderPos, setSliderPos] = useState(100);
  const [swatchPreviewHex, setSwatchPreviewHex] = useState<string | null>(null);
  const [swatchPreviewName, setSwatchPreviewName] = useState<string | null>(null);
  const [swatchPreviewImage, setSwatchPreviewImage] = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  const [imageOptimizeInfo, setImageOptimizeInfo] = useState<string | null>(null);

  // --- PIPELINE STATE ---
  const [renderPhase, setRenderPhase] = useState<'idle' | 'roof' | 'siding' | 'done'>('idle');
  const [roofPassResult, setRoofPassResult] = useState<string | null>(null);
  const [collapsedPanels, setCollapsedPanels] = useState<Set<string>>(new Set());

  // --- REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- HOOKS ---
  const zoomPan = useZoomPan();
  const ai = useAIProcessing();

  const currentSection = sections.find(s => s.id === currentSectionId) || null;

  // --- EFFECTS ---
  useEffect(() => {
    if (ai.isProcessing || ai.isQuickGenerating) {
      setElapsedSecs(0);
      timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ai.isProcessing, ai.isQuickGenerating]);



  // --- HANDLERS ---
  const handleUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setQuickResult(null);
      setResultImage(null);
      setEnhancedImage(null);
      setSections([]);
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
    setQuickResult(null);
    setResultImage(null);
    setEnhancedImage(null);
    setShowEnhancePrompt(false);
    setSections([]);
    setQuickZones(DEFAULT_QUICK_ZONES);
    setQuickRoofZones(DEFAULT_QUICK_ROOF_ZONES);
    setImageOptimizeInfo(null);
    zoomPan.resetView();
  };

  const detectAndMaskSections = async () => {
    if (!selectedImage) return;
    ai.setIsDetectingSections(true);
    ai.setDetectionProgress('Analyzing architecture...');
    try {
      const scaled = await downscaleImage(selectedImage, 1024);
      const res = await fetch(`${API_BASE}/api/detect-sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: scaled.split(',')[1], 
          mimeType: 'image/jpeg', 
          type: exteriorType 
        }),
      });
      const data = await res.json();
      if (data.sections) {
        setSections(data.sections);
        setOptionalSections(data.optional || []);
        if (data.sections.length > 0) setCurrentSectionId(data.sections[0].id);
        ai.setDetectionProgress('✓ Sections defined');
      }
    } catch (e) {
      ai.setError('Failed to detect sections.');
    } finally {
      ai.setIsDetectingSections(false);
    }
  };

  const togglePanel = (panel: string) => {
    setCollapsedPanels(prev => {
      const next = new Set(prev);
      if (next.has(panel)) next.delete(panel); else next.add(panel);
      return next;
    });
  };

  const hasRoofChanges = quickRoofZones.some(z => z.enabled || z.id === 'rz-main');
  const hasSidingChanges = SIDING_ENABLED && quickZones.some(z => z.enabled);

  const handleGenerate = async () => {
    if (!selectedImage) return;
    
    if (appMode === 'quick') {
      ai.setIsQuickGenerating(true);
      ai.setError(null);
      setRoofPassResult(null);
      
      try {
        let currentImage = selectedImage;

        // --- PASS 1: ROOF + GUTTERS ---
        if (hasRoofChanges) {
          setRenderPhase('roof');
          const roofZonesPayload = quickRoofZones
            .filter(z => z.enabled || z.id === 'rz-main')
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
            .filter(z => z.enabled || z.id === 'qz-main')
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
    } else {
      // Advanced generation logic (unchanged)
      ai.setIsProcessing(true);
      try {
        const scaled = await downscaleImage(selectedImage, 1536);
        const res = await fetch(exteriorType === 'roofing' ? `${API_BASE}/api/roof-generate` : `${API_BASE}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: scaled.split(',')[1],
            sections: sections.map(s => ({
              maskBase64: s.maskData?.split(',')[1],
              color_hex: s.selectedColor.hex,
              texture: s.selectedLine.textureImage
            }))
          })
        });
        const data = await res.json();
        if (data.resultImage) setResultImage(data.resultImage);
      } catch (e) {
        ai.setError('Generation failed.');
      } finally {
        ai.setIsProcessing(false);
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
            {/* Mode Toggles — only shown when Advanced Mode is enabled */}
            {ADVANCED_ENABLED && (
            <div className="flex bg-[#111827] rounded-xl p-1.5 border border-[#1E293B] shadow-lg">
              <button 
                onClick={() => setAppMode('quick')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${appMode === 'quick' ? 'bg-[#1E3A8A] text-[#60A5FA] shadow-lg border border-[#3B82F6]/30' : 'text-[#64748B] hover:text-[#94A3B8]'}`}
              >
                <Zap className="w-3.5 h-3.5" /> Quick Mode
              </button>
              <button 
                onClick={() => setAppMode('advanced')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${appMode === 'advanced' ? 'bg-[#1E3A8A] text-[#60A5FA] shadow-lg border border-[#3B82F6]/30' : 'text-[#64748B] hover:text-[#94A3B8]'}`}
              >
                <Package className="w-3.5 h-3.5" /> Advanced
              </button>
            </div>
            )}

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
            {appMode === 'quick' ? (
              <div className="space-y-4">
                {/* --- ROOFING SECTION --- */}
                <div className="rounded-xl border border-[#1E293B] overflow-hidden">
                  <button
                    onClick={() => togglePanel('roof')}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[10px] font-bold">01</div>
                      <div className="text-left">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Roofing</h2>
                        <p className="text-[9px] text-[#64748B] mt-0.5">Shingle Collections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderPhase === 'roof' && <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />}
                      {renderPhase === 'done' && hasRoofChanges && <span className="text-[9px] text-[#10B981] font-bold">✓</span>}
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${collapsedPanels.has('roof') ? '' : 'rotate-180'}`} />
                    </div>
                  </button>
                  {!collapsedPanels.has('roof') && (
                    <div className="border-t border-[#1E293B]">
                      <RoofingCatalog 
                        quickRoofZones={quickRoofZones}
                        setQuickRoofZones={setQuickRoofZones}
                        expandedRoofZoneId={expandedRoofZoneId}
                        setExpandedRoofZoneId={setExpandedRoofZoneId}
                        onColorMouseEnter={(c) => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(c.swatchImage || null); }}
                        onColorMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); }}
                      />
                    </div>
                  )}
                </div>

                {/* --- SIDING SECTION --- */}
                {SIDING_ENABLED && (
                <div className="rounded-xl border border-[#1E293B] overflow-hidden">
                  <button
                    onClick={() => togglePanel('siding')}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[10px] font-bold">02</div>
                      <div className="text-left">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Siding</h2>
                        <p className="text-[9px] text-[#64748B] mt-0.5">Siding Collections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderPhase === 'siding' && <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />}
                      {renderPhase === 'done' && hasSidingChanges && <span className="text-[9px] text-[#10B981] font-bold">✓</span>}
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${collapsedPanels.has('siding') ? '' : 'rotate-180'}`} />
                    </div>
                  </button>
                  {!collapsedPanels.has('siding') && (
                    <div className="border-t border-[#1E293B]">
                      <SidingCatalog 
                        quickZones={quickZones}
                        setQuickZones={setQuickZones}
                        expandedZoneId={expandedZoneId}
                        setExpandedZoneId={setExpandedZoneId}
                        onColorMouseEnter={(c) => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(null); }}
                        onColorMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); }}
                      />
                    </div>
                  )}
                </div>
                )}

                {/* --- ACCENTS SECTION (Trim & Shutters) --- */}
                {SIDING_ENABLED && (
                <div className="rounded-xl border border-[#1E293B] overflow-hidden">
                  <button
                    onClick={() => togglePanel('accents')}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-[#111827] hover:bg-[#0F172A] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#1E3A8A] text-[#60A5FA] rounded-lg flex items-center justify-center text-[10px] font-bold">03</div>
                      <div className="text-left">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Accents</h2>
                        <p className="text-[9px] text-[#64748B] mt-0.5">Shutters &amp; Trim — standard paint colors</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${collapsedPanels.has('accents') ? '' : 'rotate-180'}`} />
                    </div>
                  </button>
                  {!collapsedPanels.has('accents') && (
                    <div className="border-t border-[#1E293B] bg-[#111827] p-4 space-y-2">
                      {quickZones.filter(z => ['qz-shutters', 'qz-trim'].includes(z.id)).map((zone) => {
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
                )}

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
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex bg-[#111827] rounded-xl p-1 border border-[#1E293B]">
                  <button onClick={() => setExteriorType('siding')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${exteriorType === 'siding' ? 'bg-[#0F172A] text-[#60A5FA]' : 'text-[#475569] hover:text-[#94A3B8]'}`}>Siding</button>
                  <button onClick={() => setExteriorType('roofing')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${exteriorType === 'roofing' ? 'bg-[#0F172A] text-[#60A5FA]' : 'text-[#475569] hover:text-[#94A3B8]'}`}>Roofing</button>
                </div>
                <AISectionSeparator 
                  selectedImage={selectedImage}
                  exteriorType={exteriorType}
                  isDetectingSections={ai.isDetectingSections}
                  detectionProgress={ai.detectionProgress}
                  onDetectSections={detectAndMaskSections}
                  sections={sections}
                  currentSectionId={currentSectionId}
                  onSwitchSection={setCurrentSectionId}
                  onRemoveSection={(id) => setSections(prev => prev.filter(s => s.id !== id))}
                  onSetSections={setSections}
                  setHoveredSectionId={setHoveredSectionId}
                />
                <AdvancedCatalog 
                  currentSection={currentSection}
                  onUpdateSection={setSections}
                  onSaveHistory={saveHistory}
                  onColorMouseEnter={(c) => { setSwatchPreviewHex(c.hex); setSwatchPreviewName(c.name); setSwatchPreviewImage(null); }}
                  onColorMouseLeave={() => { setSwatchPreviewHex(null); setSwatchPreviewName(null); setSwatchPreviewImage(null); }}
                  expandedColorZones={expandedColorZones}
                  onToggleColorZone={(key) => {
                    setExpandedColorZones(prev => {
                      const next = new Set(prev);
                      if (next.has(key)) next.delete(key); else next.add(key);
                      return next;
                    });
                  }}
                />
              </div>
            )}

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
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /><span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Engine Active</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={undo} disabled={!canUndo} className={`p-1.5 rounded ${!canUndo ? 'text-[#334155]' : 'text-[#94A3B8] hover:bg-[#1E293B]'}`}><Undo className="w-3.5 h-3.5" /></button>
                  <button onClick={redo} disabled={!canRedo} className={`p-1.5 rounded ${!canRedo ? 'text-[#334155]' : 'text-[#94A3B8] hover:bg-[#1E293B]'}`}><Redo className="w-3.5 h-3.5" /></button>
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
                elapsedSecs={elapsedSecs}
                appMode={appMode}
                onQuoteClick={() => setShowQuoteModal(true)}
                swatchPreviewHex={swatchPreviewHex}
                swatchPreviewName={swatchPreviewName}
                swatchPreviewImage={swatchPreviewImage}
                sections={sections}
                currentSectionId={currentSectionId}
                hoveredSectionId={hoveredSectionId}
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
        onShowToS={() => { setShowQuoteModal(false); setTimeout(() => setShowTermsModal(true), 200); }}
        onShowPrivacy={() => { setShowQuoteModal(false); setTimeout(() => setShowPrivacyModal(true), 200); }}
      />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
};

export default App;
