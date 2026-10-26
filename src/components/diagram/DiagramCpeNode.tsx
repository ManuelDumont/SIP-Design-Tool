import React from 'react';
import { VoiceRouterSvg } from './diagramSvgs';
import { DiagramInlineEdit } from './DiagramInlineEdit';
import { findServiceDefinition } from '../../data/servicesStore';

export interface DiagramCpeNodeProps {
  cpe: any;
  cpeIndex: number;
  CPE_Y: number;
  customSizes: Record<string, { scale: number }>;
  startRightDrag: (id: string, e: React.MouseEvent) => void;
  startResizeDrag: (id: string, type: 'cloud' | 'router' | 'pbx', e: React.MouseEvent, currentScale: number, baseW?: number, baseH?: number) => void;
  handleResetItemSize: (id: string) => void;
  resizeDragState: { id: string } | null;
  handleUpdateCpeField: (cpeId: string, field: string, val: any) => void;
  isEspritMulti: boolean;
  multicustomerInfo: any;
}

export function DiagramCpeNode({
  cpe,
  cpeIndex,
  CPE_Y,
  customSizes,
  startRightDrag,
  startResizeDrag,
  handleResetItemSize,
  resizeDragState,
  handleUpdateCpeField,
  isEspritMulti,
  multicustomerInfo,
}: DiagramCpeNodeProps) {
  const cpeKey = `cpe-${cpe.id}`;
  const cpeScale = customSizes[cpeKey]?.scale || 1;
  const cpeWidth = 100 * cpeScale;
  const cpeHeight = 40 * cpeScale;

  const service = cpe.serviceType || '';
  let servicePrefix = '';
  if (service === 'CN') servicePrefix = 'CN ';
  else if (service.startsWith('VOV')) servicePrefix = 'VOV ';

  const isEsprit = Boolean(cpe.isMulticustomer || cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType === 'Multicustomer Esprit' || cpe.serviceType === 'Multicustomer IP Services Group' || cpe.serviceType?.startsWith('Multicustomer') || cpe.multicustomerClient || isEspritMulti);
  const is007 = cpe.hostname?.includes('007') || (isEsprit && cpeIndex === 1);

  return (
    <div 
      className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/cpenode" 
      style={{ top: CPE_Y + cpe.yOffset, left: cpe.cpeX, transform: 'translateX(-50%)' }}
      onMouseDown={e => startRightDrag(`cpe-${cpe.id}`, e)}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="relative">
        <VoiceRouterSvg width={cpeWidth} height={cpeHeight} />
        <div 
          onMouseDown={(e) => startResizeDrag(`cpe-${cpe.id}`, 'router', e, cpeScale, 100, 40)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleResetItemSize(`cpe-${cpe.id}`);
          }}
          className="opacity-0 group-hover/cpenode:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
          title="Sleep om Mediant router te vergroten of verkleinen (dubbelklik voor 100%)"
        >
          ⤡
        </div>
        {resizeDragState?.id === `cpe-${cpe.id}` && (
          <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
            {Math.round(cpeScale * 100)}%
          </div>
        )}
        {/* Naam en Dienst van de CPE (erboven geplaatst - DIRECT BEWERKBAAR) */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 whitespace-nowrap z-30">
          <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-0.5 rounded-full shadow-sm hover:border-blue-400">
            <DiagramInlineEdit 
              value={(cpe.hostname || 'Mediant').toUpperCase()} 
              placeholder="HOSTNAME" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'hostname', val.toUpperCase())}
              title="Klik om Mediant naam direct aan te passen"
              className="uppercase"
              inputClassName="uppercase"
            />
          </span>
          {!(cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType?.startsWith('Multicustomer') || cpe.isMulticustomer || Boolean(cpe.multicustomerClient) || Boolean(multicustomerInfo)) && (
            <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-sm shadow-sm hover:bg-blue-700">
              <DiagramInlineEdit 
                value={cpe.serviceType || 'Dienst'} 
                placeholder="Dienst" 
                onSave={(val) => handleUpdateCpeField(cpe.id, 'serviceType', val)}
                title="Klik om type dienst direct aan te passen (VOV, CN, VOV & CN, Multicustomer - Esprit)"
                className="text-white hover:text-white"
                inputClassName="text-slate-900 font-bold"
              />
            </span>
          )}
        </div>
      </div>

      {/* IP Info labels: Links van Mediant */}
      {service === 'CN' ? (
        <div className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+10px)] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
          <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
            <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN WAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.cnWanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
              title="Klik om CN WAN IP direct aan te passen"
              className="text-blue-700 font-mono font-bold"
            />
            <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN LAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.cnLanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'cnLanIp', val)} 
              title="Klik om CN LAN IP direct aan te passen"
              className="text-blue-700 font-mono font-bold"
            />
          </div>
        </div>
      ) : is007 ? (
        <div className="absolute top-1/2 -translate-y-1/2 left-[110px] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
          <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}WAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.wanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'wanIp', val)} 
              title="Klik om WAN IP direct aan te passen"
              className="text-red-800 font-mono font-bold"
            />
            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}LAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.lanIpCpe || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'lanIpCpe', val)} 
              title="Klik om LAN IP direct aan te passen"
              className="text-red-800 font-mono font-bold"
            />
          </div>
        </div>
      ) : (
        <div className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+10px)] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
          <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}WAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.wanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'wanIp', val)} 
              title="Klik om WAN IP direct aan te passen"
              className="text-red-800 font-mono font-bold"
            />
            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}LAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.lanIpCpe || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'lanIpCpe', val)} 
              title="Klik om LAN IP direct aan te passen"
              className="text-red-800 font-mono font-bold"
            />
          </div>
        </div>
      )}

      {/* IP Info labels: Rechts van Mediant (alleen bij combidienst met CN: VOV & CN) */}
      {(cpe.serviceType === 'VOV & CN' || cpe.serviceType === 'VOV + CN' || Boolean(findServiceDefinition(cpe.serviceType)?.hasCn) || ((cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType?.startsWith('Multicustomer')) && (cpe.multicustomerVariant === 'VOV & CN' || cpe.multicustomerVariant === 'VOV + CN'))) && (
        <div className="absolute top-0 left-[110px] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
          <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
            <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN WAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.cnWanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
              title="Klik om CN WAN IP direct aan te passen"
              className="text-blue-700 font-mono font-bold"
            />
            <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN LAN:</span>
            <DiagramInlineEdit 
              isIp 
              value={cpe.cnLanIp || ''} 
              placeholder="xxx.xxx.xxx.xxx" 
              onSave={(val) => handleUpdateCpeField(cpe.id, 'cnLanIp', val)} 
              title="Klik om CN LAN IP direct aan te passen"
              className="text-blue-700 font-mono font-bold"
            />
          </div>
        </div>
      )}
    </div>
  );
}
