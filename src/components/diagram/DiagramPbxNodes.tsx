import React from 'react';
import { PbxIcon } from './diagramSvgs';
import { DiagramInlineEdit } from './DiagramInlineEdit';

export interface DiagramPbxNodesProps {
  cpe: any;
  group: any;
  isMultiAny: boolean;
  isEspritMulti: boolean;
  startRightDrag: (id: string, e: React.MouseEvent) => void;
  handleUpdateCpeField: (cpeId: string, field: string, val: any) => void;
  handleUpdatePbxField: (cpeId: string, pbxId: string, field: string, val: any) => void;
  handleDeletePbx: (cpeId: string, pbxId: string) => void;
}

export function DiagramPbxNodes({
  cpe,
  group,
  isMultiAny,
  isEspritMulti,
  startRightDrag,
  handleUpdateCpeField,
  handleUpdatePbxField,
  handleDeletePbx,
}: DiagramPbxNodesProps) {
  const isMulticustomer = isMultiAny || isEspritMulti || group.lanClusters.some((cl: any) => cl.isEsprit) || cpe.serviceType === 'Multicustomer' || cpe.isMulticustomer;

  return (
    <>
      {/* Default Gateway: Altijd intekenen als een gateway adres is opgegeven of er gerouteerde endpoints zijn */}
      {cpe.hasGw && (
        <div 
          className="absolute flex items-center z-20 select-none cursor-grab active:cursor-grabbing" 
          style={{ 
            top: cpe.gwY, 
            left: cpe.gwLeft 
          }}
          onMouseDown={e => startRightDrag(`gw-${cpe.id}`, e)}
          onContextMenu={e => e.preventDefault()}
        >
           <div className="w-[70px] h-[35px] bg-blue-500 rounded-[50%] border-2 border-blue-700 shadow-[0_4px_0_#1d4ed8] flex items-center justify-center relative mr-2 shrink-0">
             <span className="text-white text-[9px] font-bold tracking-tight">GATEWAY</span>
           </div>
           <div className="text-red-800 font-bold text-xs whitespace-nowrap bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs flex items-center">
             <DiagramInlineEdit 
               isIp 
               value={cpe.defaultGateway || ''} 
               placeholder="xxx.xxx.xxx.xxx" 
               onSave={(val) => handleUpdateCpeField(cpe.id, 'defaultGateway', val)} 
               title="Klik om Default Gateway IP direct aan te passen"
               className="text-red-800 font-mono font-bold text-xs"
             />
           </div>
        </div>
      )}
      
      {/* SIP PBX (Lokaal) */}
      {!isMulticustomer && cpe.mappedLocalPbxs.map((pbx: any) => {
        const defaultTitle = cpe.serviceType ? `SIP PBX ${cpe.serviceType}` : 'SIP PBX';
        const titleToUse = pbx.name && !pbx.name.startsWith('SIP Endpoint') ? pbx.name : defaultTitle;
        return (
          <div 
            key={pbx.id} 
            className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/pbx" 
            style={{ top: pbx.y, left: pbx.x, transform: 'translateX(-50%)' }}
            onMouseDown={e => startRightDrag(`pbx-local-${pbx.id}`, e)}
            onContextMenu={e => e.preventDefault()}
          >
             <PbxIcon width={48} height={48} isRouted={false} />
             <div className="text-blue-800 text-[10px] font-bold whitespace-nowrap mt-1 flex items-center">
               <DiagramInlineEdit 
                 value={titleToUse} 
                 placeholder="SIP PBX" 
                 onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                 title="Klik om naam van deze SIP PBX direct aan te passen"
                 className="text-blue-800 font-bold text-[10px]"
               />
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDeletePbx(cpe.id, pbx.id);
                 }}
                 title="Verwijder deze SIP PBX"
                 className="opacity-0 group-hover/pbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
               >
                 ×
               </button>
             </div>
              <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 flex items-center">
                <DiagramInlineEdit 
                  isIp 
                  value={pbx.ip || ''} 
                  placeholder="xxx.xxx.xxx.xxx" 
                  onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'ip', val)} 
                  title="Klik om PBX IP adres direct in te voeren of aan te passen"
                  className="text-red-800 font-mono font-bold text-[11px]"
                />
              </div>
          </div>
        );
      })}

      {/* Routed SIP PBX */}
      {!isMulticustomer && cpe.mappedRoutedPbxs.map((pbx: any) => {
        const defaultRoutedTitle = cpe.serviceType ? `Routed SIP PBX ${cpe.serviceType}` : 'Routed SIP PBX';
        const routedTitleToUse = pbx.name && !pbx.name.startsWith('SIP Endpoint') && !pbx.name.startsWith('Routed SIP Endpoint') ? pbx.name : defaultRoutedTitle;
        return (
          <div 
            key={`routed-${pbx.id}`} 
            className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/routedpbx" 
            style={{ top: pbx.y, left: pbx.x, transform: 'translateX(-50%)' }}
            onMouseDown={e => startRightDrag(`pbx-routed-${pbx.id}`, e)}
            onContextMenu={e => e.preventDefault()}
          >
             <PbxIcon width={48} height={48} isRouted={true} />
             <div className="text-amber-700 text-[10px] font-bold whitespace-nowrap mt-1 flex items-center">
               <DiagramInlineEdit 
                 value={routedTitleToUse} 
                 placeholder="Routed SIP PBX" 
                 onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                 title="Klik om naam van deze gerouteerde SIP PBX aan te passen"
                 className="text-amber-700 font-bold text-[10px]"
               />
               <button
                 type="button"
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDeletePbx(cpe.id, pbx.id);
                 }}
                 title="Verwijder deze SIP PBX"
                 className="opacity-0 group-hover/routedpbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
               >
                 ×
               </button>
             </div>
             <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded border border-amber-300 shadow-xs flex items-center">
                <DiagramInlineEdit 
                  isIp 
                  value={pbx.ip || ''} 
                  placeholder="xxx.xxx.xxx.xxx" 
                  onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'ip', val)} 
                  title="Klik om Routed IP adres direct aan te passen"
                  className="text-red-800 font-mono font-bold text-[11px]"
                />
             </div>
          </div>
        );
      })}
    </>
  );
}
