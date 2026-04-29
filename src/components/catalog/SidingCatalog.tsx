import React from 'react';
import { QuickZone, SidingColor } from '../../types';
import { SIDING_OPTIONS } from '../../constants/catalog';
import ColorGrid from './ColorGrid';

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
  const gableZone = quickZones.find(z => z.id === 'qz-gable');

  return (
    <div className="bg-[#111827] p-4 space-y-3">
      {/* 3-column style picker */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#060B18] p-1 rounded-lg">
        {SIDING_OPTIONS.map(line => (
          <button 
            key={line.tier}
            onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-main' ? { ...z, selectedLine: line, selectedColor: line.colors[0] } : z))}
            className={`py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
              mainZone.selectedLine.tier === line.tier 
                ? 'bg-[#1E3A8A] text-[#60A5FA] shadow-md shadow-blue-500/10' 
                : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#111827]'
            }`}
          >
            {line.tier}
          </button>
        ))}
      </div>

      {/* Product label — compact */}
      <div className="flex items-baseline gap-2 px-1">
        <p className="text-[11px] font-bold text-[#E2E8F0]">{mainZone.selectedLine.line}</p>
        <p className="text-[9px] text-[#475569] italic truncate">{mainZone.selectedLine.profileLabel}</p>
      </div>

      {/* Color grid */}
      <ColorGrid 
        colors={mainZone.selectedLine.colors}
        selectedColorId={mainZone.selectedColor.id}
        onSelect={(c) => setQuickZones(prev => prev.map(z => z.id === 'qz-main' ? { ...z, selectedColor: c as any } : z))}
        onMouseEnter={onColorMouseEnter}
        onMouseLeave={onColorMouseLeave}
        isExpanded={expandedZoneId === 'qz-main'}
        onToggleExpand={() => setExpandedZoneId(expandedZoneId === 'qz-main' ? null : 'qz-main')}
        textureImage={mainZone.selectedLine.textureImage}
        textureStyle={mainZone.selectedLine.textureStyle}
      />

      {/* Upper Gable accent zone */}
      {gableZone && (
        <div className="pt-3 border-t border-[#1E293B]">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-gable' ? { ...z, enabled: !z.enabled } : z))}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${gableZone.enabled ? 'bg-[#3B82F6]' : 'bg-[#1E293B] border border-[#334155]'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${gableZone.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <span className={`text-xs font-bold transition-colors ${gableZone.enabled ? 'text-[#E2E8F0]' : 'text-[#475569]'}`}>Upper Gable Accent</span>
            <span className="text-[9px] text-[#475569] ml-auto">optional</span>
          </div>

          {gableZone.enabled && (
            <div className="space-y-2">
              {/* Gable style picker — only Rustic Shingle and Vertical Panel make sense as accents */}
              <div className="grid grid-cols-2 gap-1 mb-2">
                {[SIDING_OPTIONS[1], SIDING_OPTIONS[2]].map(line => (
                  <button 
                    key={line.tier}
                    onClick={() => setQuickZones(prev => prev.map(z => z.id === 'qz-gable' ? { ...z, selectedLine: line, selectedColor: line.colors[0] } : z))}
                    className={`py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                      gableZone.selectedLine.tier === line.tier ? 'bg-[#7C3AED] text-white' : 'bg-[#1E293B] text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    {line.tier}
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
                textureStyle={gableZone.selectedLine.textureStyle}
                ringColor="#7C3AED"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidingCatalog;
