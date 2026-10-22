import React from 'react';
import { SbcClusterSvg } from './diagramSvgs';

export interface DiagramIpVoiceCloudProps {
  CORE_Y: number;
  TOTAL_WIDTH: number;
  ipVoiceAccessNetworkText: string;
  sbcClusterText: string;
  customSizes: Record<string, { scale: number; width?: number; height?: number }>;
  customOffsets: Record<string, { x: number; y: number }>;
  startRightDrag: (id: string, e: React.MouseEvent) => void;
  startResizeDrag: (id: string, type: 'cloud' | 'router' | 'pbx', e: React.MouseEvent, currentScale: number, baseW?: number, baseH?: number) => void;
  handleResetItemSize: (id: string) => void;
  resizeDragState: { id: string } | null;
}

export function DiagramIpVoiceCloud({
  CORE_Y,
  TOTAL_WIDTH,
  ipVoiceAccessNetworkText,
  sbcClusterText,
  customSizes,
  customOffsets,
  startRightDrag,
  startResizeDrag,
  handleResetItemSize,
  resizeDragState,
}: DiagramIpVoiceCloudProps) {
  const sbcScale = customSizes['sbc-cluster']?.scale || 1;

  return (
    <div 
      className="absolute left-1/2 -translate-x-1/2 h-[120px] border border-blue-500 border-dashed rounded-[100%] flex items-center justify-center z-10"
      style={{ 
        top: CORE_Y, 
        width: `${Math.max(800, TOTAL_WIDTH - 200)}px`,
        backgroundColor: 'rgba(147, 197, 253, 0.35)'
      }}
    >
      <span className="text-4xl text-slate-800 font-light select-none pointer-events-none">
        {ipVoiceAccessNetworkText}
      </span>

      {/* SBC Cluster Node (AudioCodes Mediant™ 4000B) */}
      <div 
        className="absolute left-10 top-1/2 flex flex-col items-center select-none cursor-grab active:cursor-grabbing z-20 group/sbc"
        style={{
          transform: `translate(${customOffsets['sbc-cluster']?.x || 0}px, calc(-50% + ${customOffsets['sbc-cluster']?.y || 0}px))`,
        }}
        onMouseDown={e => startRightDrag('sbc-cluster', e)}
        onContextMenu={e => e.preventDefault()}
        title="SBC Cluster (AudioCodes Mediant™ 4000B)"
      >
        <div className="relative">
          <SbcClusterSvg width={200 * sbcScale} height={40 * sbcScale} />
          <div 
            onMouseDown={(e) => startResizeDrag('sbc-cluster', 'router', e, sbcScale, 200, 40)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleResetItemSize('sbc-cluster');
            }}
            className="opacity-0 group-hover/sbc:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
            title="Sleep om SBC Cluster te vergroten of verkleinen (dubbelklik voor 100%)"
          >
            ⤡
          </div>
          {resizeDragState?.id === 'sbc-cluster' && (
            <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
              {Math.round(sbcScale * 100)}%
            </div>
          )}
        </div>
        <span className="text-xs font-bold text-slate-800 bg-transparent px-1 py-0.5 whitespace-nowrap mt-1 select-none">
          {sbcClusterText}
        </span>
      </div>
    </div>
  );
}
