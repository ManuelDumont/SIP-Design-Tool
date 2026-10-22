import React from 'react';
import { generateCloudPath, getCloudBottomY, CLOUD_Y_OFFSET } from './diagramGeometry';
import { FirewallSvg } from './diagramSvgs';
import { DiagramInlineEdit } from './DiagramInlineEdit';
import { getEspritConfigByNumber } from '../../data/espritConfigs';

export interface DiagramCustomerLanCloudProps {
  cluster: any;
  group: any;
  CPE_Y: number;
  customOffsets: Record<string, { x: number; y: number }>;
  startRightDrag: (id: string, e: React.MouseEvent) => void;
  startResizeDrag: (id: string, type: 'cloud' | 'router' | 'pbx', e: React.MouseEvent, currentScale: number, baseW?: number, baseH?: number) => void;
  handleResetItemSize: (id: string) => void;
  resizeDragState: { id: string } | null;
  customerLanText: string;
  handleUpdateClusterSubnet: (cpeIds: string[], val: string) => void;
  handleUpdatePbxField: (cpeId: string, pbxId: string, field: string, val: any) => void;
  handleAddPbxWithIp: (cpeId: string, ip: string) => void;
}

export function DiagramCustomerLanCloud({
  cluster,
  group,
  CPE_Y,
  customOffsets,
  startRightDrag,
  startResizeDrag,
  handleResetItemSize,
  resizeDragState,
  customerLanText,
  handleUpdateClusterSubnet,
  handleUpdatePbxField,
  handleAddPbxWithIp,
}: DiagramCustomerLanCloudProps) {
  return (
    <React.Fragment key={cluster.id}>
      {/* Echte Wolk (SVG met wolkbogen) als 1 geheel met IP-veld, tekst en telefoonicoon */}
      <div 
        className="absolute z-10 select-none cursor-grab active:cursor-grabbing group/cloud"
        style={{ 
          top: CPE_Y + CLOUD_Y_OFFSET + cluster.yOffset, 
          left: cluster.centerX, 
          width: `${cluster.width}px`, 
          height: `${cluster.height}px`, 
          transform: 'translateX(-50%)' 
        }}
        onMouseDown={e => startRightDrag(`cloud-${cluster.id}`, e)}
        onContextMenu={e => e.preventDefault()}
        title="Customer LAN (Wolk als 1 geheel verslepen met rechtermuisknop)"
      >
        {/* Corner Drag Handle for the Cloud */}
        <div 
          onMouseDown={(e) => startResizeDrag(cluster.id, 'cloud', e, 1, cluster.width, cluster.height)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleResetItemSize(cluster.id);
          }}
          className="opacity-0 group-hover/cloud:opacity-100 transition-opacity absolute bottom-1 right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[10px] text-white"
          title="Sleep om de wolk handmatig breder of hoger te maken (dubbelklik voor standaard)"
        >
          ⤡
        </div>
        {resizeDragState?.id === cluster.id && (
          <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
            {Math.round(cluster.width)} × {Math.round(cluster.height)}
          </div>
        )}

        <svg 
          width={cluster.width} 
          height={cluster.height} 
          viewBox={`0 0 ${cluster.width} ${cluster.height}`} 
          className="absolute inset-0 overflow-visible pointer-events-none"
        >
          <defs>
            <linearGradient id={`cloudGrad-${cluster.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dbeafe" stopOpacity="1" />
              <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path 
            d={generateCloudPath(cluster.width, cluster.height)} 
            fill={`url(#cloudGrad-${cluster.id})`}
            stroke="#2563eb" 
            strokeWidth="2.5" 
            style={{ filter: 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.18))' }}
          />
        </svg>

        {/* Customer LAN tekstlabel en IP-veld gecentreerd in de wolk (1 geheel) - DIRECT BEWERKBAAR */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center select-none z-15"
        >
          <span className="text-blue-900 text-xs font-bold tracking-tight bg-white/95 px-3 py-0.5 rounded-full border border-blue-200 shadow-xs mb-1 leading-none">
            {customerLanText || 'Customer LAN (SIP)'}
          </span>
          <span className="text-red-600 font-extrabold text-xs drop-shadow-xs bg-[#dbeafe] px-2.5 h-6 max-h-6 rounded border border-blue-300/70 whitespace-nowrap inline-flex flex-nowrap items-center justify-center leading-none select-none">
            <DiagramInlineEdit 
              value={cluster.subnetLabel} 
              placeholder="Subnet (bijv. 192.168.1.0/24)" 
              onSave={(val) => handleUpdateClusterSubnet(cluster.cpeIds, val)}
              title="Klik om LAN subnet direct in het ontwerp aan te passen"
              className="text-red-600 font-extrabold text-xs whitespace-nowrap inline-flex flex-nowrap items-center leading-none"
              inputClassName="text-red-700 font-bold text-center bg-[#dbeafe] border-blue-400 whitespace-nowrap h-5 leading-none text-xs"
            />
          </span>
        </div>

        {/* 1 Telefoonicoon altijd EXACT tegen de linkerrand van de wolk (als 1 geheel meebewegend) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-[4px] z-20 flex items-center pointer-events-none"
          title="Customer LAN Desk Phone"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" className="drop-shadow-md">
            {/* Base */}
            <path 
              d="M5 11 L7 6 H17 L19 11 V17 A2 2 0 0 1 17 19 H7 A2 2 0 0 1 5 17 Z" 
              fill="#475569" 
              stroke="#334155" 
              strokeWidth="1" 
            />
            {/* Screen */}
            <rect x="8" y="7.5" width="8" height="2.5" rx="0.5" fill="#cbd5e1" />
            {/* Buttons */}
            <rect x="8" y="12" width="1.5" height="1.5" fill="#94a3b8" />
            <rect x="11.25" y="12" width="1.5" height="1.5" fill="#94a3b8" />
            <rect x="14.5" y="12" width="1.5" height="1.5" fill="#94a3b8" />
            <rect x="8" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
            <rect x="11.25" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
            <rect x="14.5" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
            {/* Handset Handle */}
            <path d="M3 6 Q12 1 21 6" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
            {/* Handset Earpieces */}
            <rect x="1" y="4.5" width="5" height="3.5" rx="1" fill="#1e293b" />
            <rect x="18" y="4.5" width="5" height="3.5" rx="1" fill="#1e293b" />
          </svg>
        </div>
      </div>

      {/* Esprit Multicustomer Architectuur: Firewall + Nieuwe kleinere Customer LAN wolk */}
      {cluster.isEsprit && (() => {
        const fwOffset = customOffsets[`fw-${cluster.id}`] || { x: 0, y: 0 };
        const smallCloudOffset = customOffsets[`small-cloud-${cluster.id}`] || { x: 0, y: 0 };
        const smallCloudWidth = 180;
        const smallCloudHeight = 75;
        const smallCloudX = cluster.centerX + smallCloudOffset.x;

        // Plaatsing strak en netjes aansluitend tussen beide Customer LAN wolken:
        const mainCloudBottom = getCloudBottomY(cluster, cluster.centerX, CPE_Y);

        // Firewall hoogte is 40. Bovenrand ligt strak aan tegen de onderrand van de bovenste wolk:
        const fwY = (mainCloudBottom - 2) + fwOffset.y;
        const fwX = cluster.centerX + fwOffset.x;

        // Kleine Customer LAN wolk sluit direct aan op de onderzijde van de firewall:
        const smallCloudY = (mainCloudBottom + 38) + smallCloudOffset.y;

        const cfg3 = cluster.configNr3 || '001';
        const espritCfg = getEspritConfigByNumber(cfg3);
        const cpe0 = group.cpes.find((c: any) => cluster.cpeIds.includes(c.id)) || group.cpes[0];
        const pbxIp = cpe0?.pbxs?.[0]?.ip || espritCfg.primaryPbxIp || '10.20.2.1';

        return (
          <React.Fragment key={`esprit-fw-elements-${cluster.id}`}>
            {/* Firewall Icoon (zonder titel, zonder connectoren, precies tussen de customer lans) */}
            <div
              className="absolute z-20 flex flex-col items-center select-none cursor-grab active:cursor-grabbing group/fw"
              style={{ top: fwY, left: fwX, transform: 'translateX(-50%)' }}
              onMouseDown={e => startRightDrag(`fw-${cluster.id}`, e)}
              title="Firewall (versleepbaar met rechtermuisknop)"
            >
              <div className="relative flex items-center justify-center">
                <FirewallSvg width={54} height={40} />
                {/* IP adres van de SIP PBX links naast de firewall */}
                <div 
                  className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 text-red-800 font-mono font-bold text-[11px] leading-none text-left"
                  title={`SIP PBX IP: ${pbxIp}`}
                >
                  <DiagramInlineEdit 
                    isIp
                    value={pbxIp}
                    placeholder={espritCfg.primaryPbxIp || "10.20.2.1"}
                    onSave={(val) => {
                      if (cpe0) {
                        const pbxId = cpe0.pbxs?.[0]?.id;
                        if (pbxId) {
                          handleUpdatePbxField(cpe0.id, pbxId, 'ip', val);
                        } else {
                          handleAddPbxWithIp(cpe0.id, val);
                        }
                      }
                    }}
                    title="Klik om PBX IP adres direct aan te passen"
                    className="text-red-800 font-mono font-bold text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Nieuwe kleinere Customer LAN wolk achter/onder de firewall */}
            <div
              className="absolute z-15 select-none cursor-grab active:cursor-grabbing group/smallcloud"
              style={{ 
                top: smallCloudY, 
                left: smallCloudX - smallCloudWidth / 2,
                width: smallCloudWidth,
                height: smallCloudHeight 
              }}
              onMouseDown={e => startRightDrag(`small-cloud-${cluster.id}`, e)}
              title="Customer LAN (Wolk als 1 geheel verslepen met rechtermuisknop)"
            >
              <svg 
                width={smallCloudWidth} 
                height={smallCloudHeight} 
                viewBox={`0 0 ${smallCloudWidth} ${smallCloudHeight}`} 
                className="absolute inset-0 overflow-visible"
              >
                <defs>
                  <linearGradient id={`smallCloudGrad-${cluster.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#dbeafe" stopOpacity="1" />
                    <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path 
                  d={generateCloudPath(smallCloudWidth, smallCloudHeight)} 
                  fill={`url(#smallCloudGrad-${cluster.id})`}
                  stroke="#2563eb" 
                  strokeWidth="2" 
                  style={{ filter: 'drop-shadow(0 4px 10px rgba(37, 99, 235, 0.15))' }}
                />
              </svg>

              {/* Label in de kleine wolk */}
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none z-15">
                <span className="text-blue-900 text-[11px] font-bold tracking-tight bg-white/95 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-xs leading-none">
                  Customer LAN
                </span>
              </div>

              {/* Telefoonicoon linkerrand */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-[2px] z-20 flex items-center pointer-events-none"
                title="Customer LAN Desk Phone"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-xs">
                  <path d="M5 11 L7 6 H17 L19 11 V17 A2 2 0 0 1 17 19 H7 A2 2 0 0 1 5 17 Z" fill="#475569" stroke="#334155" strokeWidth="1" />
                  <rect x="8" y="7.5" width="8" height="2.5" rx="0.5" fill="#cbd5e1" />
                  <rect x="8" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                  <rect x="11.25" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                  <rect x="14.5" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                  <path d="M3 6 Q12 1 21 6" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </React.Fragment>
        );
      })()}
    </React.Fragment>
  );
}
