import React from 'react';
import { QuickRoofZone, RoofingColor } from '../../types';
import { ROOFING_OPTIONS } from '../../constants/catalog';
import ColorGrid from './ColorGrid';

interface RoofingCatalogProps {
  quickRoofZones: QuickRoofZone[];
  setQuickRoofZones: (updated: (prev: QuickRoofZone[]) => QuickRoofZone[]) => void;
  expandedRoofZoneId: string | null;
  setExpandedRoofZoneId: (id: string | null) => void;
  onColorMouseEnter: (color: RoofingColor) => void;
  onColorMouseLeave: () => void;
  detectedZones: string[];
}

const RoofingCatalog: React.FC<RoofingCatalogProps> = ({
  quickRoofZones,
  setQuickRoofZones,
  expandedRoofZoneId,
  setExpandedRoofZoneId,
  onColorMouseEnter,
  onColorMouseLeave,
  detectedZones,
}) => {
  const mainZone = quickRoofZones.find((z) => z.id === 'rz-main')!;
  const guttersZone = quickRoofZones.find((z) => z.id === 'rz-gutters');

  if (!mainZone) return null;

  return (
    <div className="bg-[#111827] p-4 space-y-3">
      {/* 4-column tier picker */}
      <div className="grid grid-cols-4 gap-1 bg-[#060B18] p-1 rounded-lg">
        {ROOFING_OPTIONS.map((line) => {
          const isSelected = mainZone.selectedLine.tier === line.tier;
          return (
            <button
              key={line.tier}
              onClick={() =>
                setQuickRoofZones((prev) =>
                  prev.map((z) =>
                    z.id === mainZone.id
                      ? { ...z, selectedLine: line, selectedColor: line.colors[0], enabled: true }
                      : z
                  )
                )
              }
              className={`py-2 px-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-150 ${
                isSelected
                  ? 'bg-[#1E3A8A] text-[#60A5FA] shadow-md shadow-blue-500/10'
                  : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-[#111827]'
              }`}
            >
              {line.tier}
            </button>
          );
        })}
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
        onSelect={(c) =>
          setQuickRoofZones((prev) =>
            prev.map((z) =>
              z.id === mainZone.id ? { ...z, selectedColor: c as any, enabled: true } : z
            )
          )
        }
        onMouseEnter={onColorMouseEnter}
        onMouseLeave={onColorMouseLeave}
        isExpanded={expandedRoofZoneId === mainZone.id}
        onToggleExpand={() => setExpandedRoofZoneId(expandedRoofZoneId === mainZone.id ? null : mainZone.id)}
        ringColor="#3B82F6"
        textureImage={mainZone.selectedLine.textureImage}
        textureStyle={mainZone.selectedLine.textureStyle}
      />

      {/* Gutters accent zone */}
      {guttersZone && detectedZones.includes('rz-gutters') && (
        <div className="pt-3 border-t border-[#1E293B]">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() =>
                setQuickRoofZones((prev) =>
                  prev.map((z) => (z.id === 'rz-gutters' ? { ...z, enabled: !z.enabled } : z))
                )
              }
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                guttersZone.enabled ? 'bg-[#3B82F6]' : 'bg-[#1E293B] border border-[#334155]'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  guttersZone.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-xs font-bold transition-colors ${
                guttersZone.enabled ? 'text-[#E2E8F0]' : 'text-[#475569]'
              }`}
            >
              Seamless Gutters
            </span>
            <span className="text-[9px] text-[#475569] ml-auto">optional</span>
          </div>

          {guttersZone.enabled && (
            <div className="space-y-2">
              <ColorGrid
                colors={guttersZone.selectedLine.colors}
                selectedColorId={guttersZone.selectedColor.id}
                onSelect={(c) =>
                  setQuickRoofZones((prev) =>
                    prev.map((z) => (z.id === 'rz-gutters' ? { ...z, selectedColor: c as any } : z))
                  )
                }
                onMouseEnter={onColorMouseEnter}
                onMouseLeave={onColorMouseLeave}
                isExpanded={expandedRoofZoneId === 'rz-gutters'}
                onToggleExpand={() =>
                  setExpandedRoofZoneId(expandedRoofZoneId === 'rz-gutters' ? null : 'rz-gutters')
                }
                ringColor="#3B82F6"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoofingCatalog;
