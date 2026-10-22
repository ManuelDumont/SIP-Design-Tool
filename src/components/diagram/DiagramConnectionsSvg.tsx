import React from 'react';
import { getCloudConnectionPoint, getBoxBorderPoint } from './diagramGeometry';

export interface DiagramConnectionsSvgProps {
  groups: any[];
  CORE_Y: number;
  ROUTER_Y: number;
  CPE_Y: number;
  lineColor: string;
  routedLineColor: string;
  isEspritMulti: boolean;
}

export function DiagramConnectionsSvg({
  groups,
  CORE_Y,
  ROUTER_Y,
  CPE_Y,
  lineColor,
  routedLineColor,
  isEspritMulti,
}: DiagramConnectionsSvgProps) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {groups.map((group, i) => (
        <line 
          key={`core-router-${i}`} 
          x1={group.routerX} 
          y1={CORE_Y + 120} 
          x2={group.routerX} 
          y2={ROUTER_Y + group.routerYOffset} 
          stroke={lineColor} 
          strokeWidth="2" 
        />
      ))}
      {groups.map(group => {
        const rCenterX = group.routerX;
        const rCenterY = ROUTER_Y + group.routerYOffset + (group.routerHeight || 40) / 2;
        const rWidth = group.routerWidth || 100;
        const rHeight = group.routerHeight || 40;
        return group.cpes.map((cpe: any) => {
          const cpeWidth = 100;
          const cpeHeight = 40;
          const cpeCenterX = cpe.cpeX;
          const cpeCenterY = CPE_Y + cpe.yOffset + cpeHeight / 2;
          const routerAnchor = getBoxBorderPoint(rCenterX, rCenterY, rWidth, rHeight, cpeCenterX, cpeCenterY);
          const cpeAnchor = getBoxBorderPoint(cpeCenterX, cpeCenterY, cpeWidth, cpeHeight, rCenterX, rCenterY);
          return (
            <line 
              key={`line-${cpe.id}`} 
              x1={routerAnchor.x} 
              y1={routerAnchor.y} 
              x2={cpeAnchor.x} 
              y2={cpeAnchor.y} 
              stroke={lineColor} 
              strokeWidth="2" 
            />
          );
        });
      })}
      {groups.flatMap(g => g.cpes).map((cpe: any) => {
        if (!cpe.hasGw) return null;
        
        // Vind bijbehorende LAN cluster voor het aansluitpunt
        const parentGroup = groups.find(g => g.cpes.some((c: any) => c.id === cpe.id));
        const cluster = parentGroup?.lanClusters.find((cl: any) => cl.cpeIds.includes(cpe.id));
        if (!cluster) return null;

        const gwCenterX = cpe.gwLeft + 35;
        const gwCenterY = cpe.gwY + 17.5;

        // Exacte aansluitpunt op de rand van de wolk naar het gateway center
        const cloudPoint = getCloudConnectionPoint(cluster, gwCenterX, gwCenterY, CPE_Y);

        // Exacte rand van de gateway ovaal (rx=35, ry=17.5) in de richting van het wolk-aansluitpunt
        const angleGwToCloud = Math.atan2(cloudPoint.y - gwCenterY, cloudPoint.x - gwCenterX);
        const gwBorderX = gwCenterX + 35 * Math.cos(angleGwToCloud);
        const gwBorderY = gwCenterY + 17.5 * Math.sin(angleGwToCloud);

        return (
          <line 
            key={`gw-line-${cpe.id}`} 
            x1={cloudPoint.x} 
            y1={cloudPoint.y} 
            x2={gwBorderX} 
            y2={gwBorderY} 
            stroke={lineColor} 
            strokeWidth="2" 
          />
        );
      })}

      {groups.flatMap(g => g.cpes).flatMap((cpe: any) => {
         const lines = [];
         const parentGroup = groups.find(g => g.cpes.some((c: any) => c.id === cpe.id));
         const cluster = parentGroup?.lanClusters.find((cl: any) => cl.cpeIds.includes(cpe.id));

         cpe.mappedLocalPbxs.forEach((pbx: any) => {
           if (cluster?.isEsprit || isEspritMulti || cpe.serviceType === 'Multicustomer' || cpe.isMulticustomer) {
             // SIP PBX is weggelaten bij Multicustomer
             return;
           }
           const pbxCenterX = pbx.x;
           const pbxCenterY = pbx.y + 24;
           const cloudPoint = cluster 
             ? getCloudConnectionPoint(cluster, pbxCenterX, pbxCenterY, CPE_Y)
             : { x: pbx.x, y: CPE_Y + 40 + 160 };
           const pbxPoint = getBoxBorderPoint(pbxCenterX, pbxCenterY, 48, 48, cloudPoint.x, cloudPoint.y);
           lines.push(
             <line 
               key={`pbx-local-${pbx.id}`} 
               x1={cloudPoint.x} 
               y1={cloudPoint.y} 
               x2={pbxPoint.x} 
               y2={pbxPoint.y} 
               stroke={lineColor} 
               strokeWidth="2" 
             />
           );
         });
         cpe.mappedRoutedPbxs.forEach((pbx: any) => {
           const gwCenterX = cpe.gatewayCenterX;
           const gwCenterY = cpe.gwY + 17.5;
           const pbxCenterX = pbx.x;
           const pbxCenterY = pbx.y + 24;
           const angleGwToPbx = Math.atan2(pbxCenterY - gwCenterY, pbxCenterX - gwCenterX);
           const gwBorderX = gwCenterX + 35 * Math.cos(angleGwToPbx);
           const gwBorderY = gwCenterY + 17.5 * Math.sin(angleGwToPbx);
           const pbxPoint = getBoxBorderPoint(pbxCenterX, pbxCenterY, 48, 48, gwBorderX, gwBorderY);
           lines.push(
             <line 
               key={`pbx-routed-${pbx.id}`} 
               x1={gwBorderX} 
               y1={gwBorderY} 
               x2={pbxPoint.x} 
               y2={pbxPoint.y} 
               stroke={routedLineColor} 
               strokeWidth="2" 
               strokeDasharray="4 4" 
             />
           );
         });
         return lines;
      })}
    </svg>
  );
}
