import React from 'react';
import { QuickZone, SidingLine, SidingColor } from '../../types';
import { SIDING_OPTIONS, VERTICAL_SIDING_OPTIONS, SHUTTER_COLORS, TRIM_COLORS } from '../../constants/catalog';
import ColorGrid from './ColorGrid';
import { ChevronDown } from 'lucide-react';

interface SidingCatalogProps {
  quickZones: QuickZone[];
  setQuickZones: (updated: (prev: QuickZone[]) => QuickZone[]) => void;
  expandedZoneId: string | null;
  setExpandedZoneId: (id: string | null) => void;
  onColorMouseEnter: (color: SidingColor) => void;
  onColorMouseLeave: () => void;
}

const SidingCatalog: React.FC<SidingCatalogProps> = ({
  quickZones,
  setQuickZones,
  expandedZoneId,
  setExpandedZoneId,
  onColorMouseEnter,
  onColorMouseLeave
}) => {
  const mainZone = quickZones.find(z => z.id === 'qz-main')!;
  const gableZone = quickZones.find(z => z.id === 'qz-gable')!;

  return (
    <div className="space-y-4">
      {/* Main siding body — texture preview + color grid */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div>
            <p className="text-[10px] text-[#64748B]">Applied to all exterior walls &amp; gables</p>
          </div>
        </div>

        {/* Texture preview strip */}
        <div className="mb-3 rounded-lg overflow-hidden relative h-[4.5rem] border border-[#334155] shadow-inner">
          <img
            src={mainZone.selectedLine.textureImage}
            alt={mainZone.selectedLine.profileLabel}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E17]/80 via-[#0A0E17]/30 to-transparent" />
          <div className="absolute inset-0 flex items-center px-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#60A5FA] leading-tight">{mainZone.selectedLine.line}</p>
              <p className="text-[10px] font-medium text-[#E2E8F0] leading-tight mt-0.5">{mainZone.selectedLine.profileLabel}</p>
              <p className="text-[8px] text-[#64748B] mt-0.5">{mainZone.selectedLine.colors.length} colors available</p>
            </div>
          </div>
        </div>

        {/* Siding tier tabs */}
        <div className="flex gap-1 mb-3">
          {SIDING_OPTIONS.map(line => (
            <button 
              key={line.line}
              onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-main' ? { ...z, selectedLine: line, selectedColor: line.colors[0] } : z))}
              className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                mainZone.selectedLine.line === line.line ? 'bg-[#1E3A8A] text-[#60A5FA]' : 'bg-[#1E293B] text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {line.tier}
            </button>
          ))}
        </div>

        <ColorGrid 
          colors={mainZone.selectedLine.colors}
          selectedColorId={mainZone.selectedColor.id}
          onSelect={(c) => setQuickZones(prev => prev.map(z => z.id === 'qz-main' ? { ...z, selectedColor: c as any } : z))}
          onMouseEnter={onColorMouseEnter}
          onMouseLeave={onColorMouseLeave}
          isExpanded={expandedZoneId === 'qz-main'}
          onToggleExpand={() => setExpandedZoneId(expandedZoneId === 'qz-main' ? null : 'qz-main')}
          textureImage={mainZone.selectedLine.textureImage}
        />

        {/* Upper Gable optional zone */}
        <div className="mt-3 pt-3 border-t border-[#1E293B]">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-gable' ? { ...z, enabled: !z.enabled } : z))}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${gableZone.enabled ? 'bg-[#3B82F6]' : 'bg-[#1E293B] border border-[#334155]'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${gableZone.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-bold transition-colors ${gableZone.enabled ? 'text-[#E2E8F0]' : 'text-[#475569]'}`}>Upper Gable</span>
            <span className="text-[9px] text-[#475569] ml-auto">optional accent zone</span>
          </div>

          {gableZone.enabled && (
            <div className="space-y-3">
              <div className="mb-2 rounded-lg overflow-hidden relative h-12 border border-[#334155] shadow-inner">
                <img src={gableZone.selectedLine.textureImage} alt={gableZone.selectedLine.profileLabel} className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E17]/80 via-[#0A0E17]/30 to-transparent" />
                <div className="absolute inset-0 flex items-center px-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#A78BFA] leading-tight">{gableZone.selectedLine.line}</p>
                    <p className="text-[10px] font-medium text-[#E2E8F0] leading-tight mt-0.5">{gableZone.selectedLine.profileLabel}</p>
                  </div>
                </div>
              </div>

              {/* Gable tier tabs */}
              <div className="flex gap-1 mb-2">
                {[SIDING_OPTIONS[2], VERTICAL_SIDING_OPTIONS[0]].map(line => (
                  <button 
                    key={line.line}
                    onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-gable' ? { ...z, selectedLine: line, selectedColor: line.colors[0] } : z))}
                    className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      gableZone.selectedLine.line === line.line ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    {line.line.replace('®', '').replace('™', '')}
                  </button>
                ))}
              </div>

              <ColorGrid 
                colors={gableZone.selectedLine.colors}
                selectedColorId={gableZone.selectedColor.id}
                onSelect={(c) => setQuickZones(prev => prev.map(z => z.id === 'qz-gable' ? { ...z, selectedColor: c as any } : z))}
                onMouseEnter={onColorMouseEnter}
                onMouseLeave={onColorMouseLeave}
                isExpanded={expandedZoneId === 'qz-gable'}
                onToggleExpand={() => setExpandedZoneId(expandedZoneId === 'qz-gable' ? null : 'qz-gable')}
                textureImage={gableZone.selectedLine.textureImage}
                ringColor="#7C3AED"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidingCatalog;
