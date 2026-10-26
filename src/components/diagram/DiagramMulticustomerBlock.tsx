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
  const targetCpeForCard = allMappedCpes.find((c: any) => 
    c.hostname?.includes('007') || 
    c.hostname?.includes('005') || 
    c.hostname === 'UFC-M2600-ASD-002'
  ) || (allMappedCpes.length > 1 ? allMappedCpes[1] : allMappedCpes[0]);
  const defaultCardLeft = targetCpeForCard ? (targetCpeForCard.cpeX + 220) : (TOTAL_WIDTH - 300);
  const defaultCardTop = 240;

  const rawClient = multicustomerInfo.client || '';
  const isKinwel = (
    rawClient === 'Kinwel' ||
    rawClient.includes('Kinwel') ||
    allMappedCpes.some((c: any) => c.serviceType?.includes('Kinwel') || c.multicustomerClient === 'Kinwel')
  );
  const isIpVoice = !isKinwel && (
    rawClient === 'IP Voice Group' || 
    rawClient === 'IP Services Group' || 
    rawClient.includes('IP Voice') || 
    rawClient.includes('IP Services') ||
    allMappedCpes.some((c: any) => c.serviceType?.includes('IP Voice') || c.serviceType?.includes('IP Services') || c.multicustomerClient === 'IP Voice Group' || c.multicustomerClient === 'IP Services Group')
  );
  const clientName = isKinwel ? 'Kinwel' : (isIpVoice ? 'IP Voice Group' : (rawClient || 'Esprit'));
  const espritCfg = getEspritConfigByNumber(multicustomerInfo.configNr, clientName);

  const displayTitle = isKinwel 
    ? 'Kinwel Multicustomer (DS4)' 
    : (isIpVoice ? 'IP Voice Group Multicustomer (UFC)' : 'Esprit Multicustomer (N2G)');
  const hostname006 = espritCfg.hostname006 || (isKinwel ? 'DS4-M2600-ASD-002' : (isIpVoice ? 'UFC-M2600-ASD-006' : 'N2G-M4000-ASD-006'));
  const hostname007 = espritCfg.hostname007 || (isKinwel ? 'DS4-M2600-ASD-005' : (isIpVoice ? 'UFC-M2600-ASD-002' : 'N2G-M4000-ASD-007'));

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
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 font-mono">
          {clientName}
        </span>
      </div>

      {/* Multicustomer Title */}
      <div className="space-y-1.5">
        <div className="font-extrabold text-xs text-blue-700 dark:text-blue-300">
          {displayTitle}
        </div>
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          Multi Customer Mediant
        </div>
        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 space-y-0.5 pt-0.5">
          <div>{hostname006}</div>
          <div>{hostname007}</div>
        </div>
        {espritCfg.vlanNr && (
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between pt-0.5">
            <span>IP-VPN vlan nr:</span>
            <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-600">
              {espritCfg.vlanNr}
            </span>
          </div>
        )}
        <div className="pt-1 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span>config nr. / SRD:</span>
            <DiagramInlineEdit 
              value={multicustomerInfo.configNr}
              placeholder="001"
              onSave={(val) => {
                const digitsOnly = val.replace(/\D/g, '');
                const nr = digitsOnly ? parseInt(digitsOnly, 10) : 1;
                const clamped = Math.max(1, Math.min(125, isNaN(nr) ? 1 : nr));
                const pad = String(clamped).padStart(3, '0');
                handleUpdateMulticustomerField('multicustomerConfigNr', pad);
              }}
              title="Klik om config nr. / SRD direct in het ontwerp aan te passen (bijv. 001 of 002)"
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
