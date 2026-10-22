import React from 'react';
import { getEspritConfigByNumber } from '../../data/espritConfigs';
import { DiagramInlineEdit } from './DiagramInlineEdit';

export interface DiagramMulticustomerBlockProps {
  multicustomerInfo: any;
  groups: any[];
  TOTAL_WIDTH: number;
  customOffsets: Record<string, { x: number; y: number }>;
  startRightDrag: (id: string, e: React.MouseEvent) => void;
  handleUpdateMulticustomerField: (field: string, val: string) => void;
  darkMode?: boolean;
}

export function DiagramMulticustomerBlock({
  multicustomerInfo,
  groups,
  TOTAL_WIDTH,
  customOffsets,
  startRightDrag,
  handleUpdateMulticustomerField,
  darkMode = false,
}: DiagramMulticustomerBlockProps) {
  if (!multicustomerInfo) return null;

  const allMappedCpes = groups.flatMap(g => g.cpes);
  const targetCpeForCard = allMappedCpes.find((c: any) => c.hostname?.includes('007')) || (allMappedCpes.length > 1 ? allMappedCpes[1] : allMappedCpes[0]);
  const defaultCardLeft = targetCpeForCard ? (targetCpeForCard.cpeX + 50) : (TOTAL_WIDTH - 300);
  const defaultCardTop = 240;
  const espritCfg = getEspritConfigByNumber(multicustomerInfo.configNr);

  return (
    <div 
      className={`absolute z-35 select-none p-3.5 rounded-xl border-2 shadow-lg cursor-grab active:cursor-grabbing transition-all ${
        darkMode 
          ? 'bg-slate-900/95 border-blue-500/70 text-slate-100 shadow-blue-950/40' 
          : 'bg-white/95 border-blue-400 text-slate-800 shadow-blue-500/15'
      }`}
      style={{
        top: defaultCardTop + (customOffsets['multicustomer-block']?.y || 0),
        left: defaultCardLeft + (customOffsets['multicustomer-block']?.x || 0),
        minWidth: '220px'
      }}
      onMouseDown={e => startRightDrag('multicustomer-block', e)}
      onContextMenu={e => e.preventDefault()}
      title="Multicustomer Mediant gegevens (versleepbaar met rechtermuisknop)"
    >
      {/* Header badge */}
      <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-2 border-blue-200/50 dark:border-slate-700">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
          Multi Customer Mediant
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          Esprit
        </span>
      </div>

      {/* Esprit Multicustomer (N2G) */}
      <div className="space-y-1.5">
        <div className="font-extrabold text-xs text-blue-700 dark:text-blue-300">
          Esprit Multicustomer (N2G)
        </div>
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Multi Customer Mediant
        </div>
        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 space-y-0.5 pt-0.5">
          <div>N2G-M4000-ASD-006</div>
          <div>N2G-M4000-ASD-007</div>
        </div>
        <div className="pt-1 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span>Config. Nr.</span>
            <DiagramInlineEdit 
              value={multicustomerInfo.configNr}
              placeholder="001"
              onSave={(val) => handleUpdateMulticustomerField('multicustomerConfigNr', val)}
              title="Klik om Config. Nr. direct in het ontwerp aan te passen (bijv. 002 of SRD002)"
              className="text-blue-600 dark:text-blue-400 font-mono font-extrabold bg-blue-50/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-600"
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">
            {espritCfg.customerId}
          </span>
        </div>
      </div>
    </div>
  );
}
