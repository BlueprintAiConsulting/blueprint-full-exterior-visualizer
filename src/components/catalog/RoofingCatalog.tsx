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
}

const RoofingCatalog: React.FC<RoofingCatalogProps> = ({
  quickRoofZones,
  setQuickRoofZones,
  expandedRoofZoneId,
  setExpandedRoofZoneId,
  onColorMouseEnter,
  onColorMouseLeave,
}) => {
  const zone = quickRoofZones[0];
  if (!zone) return null;

  return (
    <div className="bg-[#111827] p-4 space-y-3">
      {/* 3-column tier picker */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#060B18] p-1 rounded-lg">
        {ROOFING_OPTIONS.map((line) => {
          const isSelected = zone.selectedLine.tier === line.tier;
          return (
            <button
              key={line.tier}
              onClick={() =>
                setQuickRoofZones((prev) =>
                  prev.map((z) =>
                    z.id === zone.id
                      ? { ...z, selectedLine: line, selectedColor: line.colors[0] }
                      : z
                  )
                )
              }
              className={`py-2.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all duration-150 ${
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
        <p className="text-[11px] font-bold text-[#E2E8F0]">{zone.selectedLine.line}</p>
        <p className="text-[9px] text-[#475569] italic truncate">{zone.selectedLine.profileLabel}</p>
      </div>

      {/* Color grid */}
      <ColorGrid
        colors={zone.selectedLine.colors}
        selectedColorId={zone.selectedColor.id}
        onSelect={(c) =>
          setQuickRoofZones((prev) =>
            prev.map((z) =>
              z.id === zone.id ? { ...z, selectedColor: c as any } : z
            )
          )
        }
        onMouseEnter={onColorMouseEnter}
        onMouseLeave={onColorMouseLeave}
        isExpanded={expandedRoofZoneId === zone.id}
        onToggleExpand={() => setExpandedRoofZoneId(expandedRoofZoneId === zone.id ? null : zone.id)}
        ringColor="#3B82F6"
        textureStyle={zone.selectedLine.textureStyle}
      />
    </div>
  );
};

export default RoofingCatalog;
