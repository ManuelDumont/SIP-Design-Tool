import { getCidrFromSubnetString, isValidIPv4, isInSameSubnet } from '../../utils/ip';
import { findServiceDefinition } from '../../data/servicesStore';

export function isCombiServiceWithCn(serviceType?: string, multicustomerVariant?: string): boolean {
  if (!serviceType) return false;
  if (serviceType === 'VOV+CN' || serviceType === 'VOV & CN' || serviceType === 'VOV + CN') return true;
  if (serviceType === 'CN') return false; // Pure CN is NOT a combi service
  if (
    serviceType === 'Multicustomer' || 
    serviceType === 'Multicustomer - Esprit' || 
    serviceType === 'Multicustomer Esprit' || 
    serviceType.startsWith('Multicustomer')
  ) {
    return multicustomerVariant === 'VOV & CN' || multicustomerVariant === 'VOV + CN';
  }
  const def = findServiceDefinition(serviceType);
  return Boolean(def?.hasCn && def?.hasWan);
}

export function areCpesInSameLanSubnet(cpeA: any, cpeB: any): boolean {
  const cidrA = getCidrFromSubnetString(cpeA.lanSubnet);
  const cidrB = getCidrFromSubnetString(cpeB.lanSubnet);
  
  if (cidrA === null || cidrB === null || cidrA !== cidrB) {
    return false;
  }

  const ipA = (cpeA.serviceType === 'CN' && cpeA.cnLanIp) ? cpeA.cnLanIp : cpeA.lanIpCpe;
  const ipB = (cpeB.serviceType === 'CN' && cpeB.cnLanIp) ? cpeB.cnLanIp : cpeB.lanIpCpe;

  // If both have valid IPv4 LAN IPs
  if (isValidIPv4(ipA) && isValidIPv4(ipB)) {
    return isInSameSubnet(ipA, ipB, cidrA);
  }

  // If neither has an IP yet, but they have identical subnet masks
  if (!ipA && !ipB && cpeA.lanSubnet === cpeB.lanSubnet) {
    return true;
  }

  return false;
}

export function generateCloudPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  // Ovale/ronde basis-ellips
  const rx = Math.max(80, (w - 36) / 2);
  const ry = Math.max(48, (h - 48) / 2);
  const numLobes = Math.max(10, Math.round((w + h) / 45));
  const halfStep = Math.PI / numLobes;

  // Genereer punten langs een vloeiende ovale/ronde wolk-ellips
  // Door te starten bij -PI/2 - halfStep zit de bovenste ronde wolkboog exact gecentreerd op 12 uur
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numLobes; i++) {
    const angle = -Math.PI / 2 - halfStep + (2 * Math.PI * i) / numLobes;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    points.push({ x: px, y: py });
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} `;
  for (let i = 0; i < numLobes; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % numLobes];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const r = dist * 0.68;
    d += `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} `;
  }
  d += 'Z';
  return d;
}

export const CLOUD_Y_OFFSET = 34;

export function getCloudTopY(cluster: { width: number; height: number; centerX: number; yOffset: number }, absX: number, cpeY: number): number {
  const w = cluster.width;
  const cx = w / 2;
  const cy = cluster.height / 2;
  const rx = Math.max(80, (w - 36) / 2);
  const ry = Math.max(48, (cluster.height - 48) / 2);

  const relX = absX - (cluster.centerX - w / 2);
  const dx = Math.abs(relX - cx);
  const normX = Math.min(1, dx / rx);
  const ellipseY = ry * Math.sqrt(Math.max(0, 1 - normX * normX));
  const puff = 18 * (1 - 0.2 * normX);
  const y = Math.max(2, cy - ellipseY - puff);

  return cpeY + CLOUD_Y_OFFSET + cluster.yOffset + y;
}

export function getCloudBottomY(cluster: { width: number; height: number; centerX: number; yOffset: number }, absX: number, cpeY: number): number {
  const w = cluster.width;
  const h = cluster.height;
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(80, (w - 36) / 2);
  const ry = Math.max(48, (h - 48) / 2);

  const relX = absX - (cluster.centerX - w / 2);
  const dx = Math.abs(relX - cx);
  const normX = Math.min(1, dx / rx);
  const ellipseY = ry * Math.sqrt(Math.max(0, 1 - normX * normX));
  const puff = 18 * (1 - 0.2 * normX);
  const y = Math.min(h - 2, cy + ellipseY + puff);

  return cpeY + CLOUD_Y_OFFSET + cluster.yOffset + y;
}

// Berekent het exacte aansluitpunt op de rand van een rechthoekige component (Mediant router, PBX endpoint)
export function getBoxBorderPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  fromX: number,
  fromY: number
): { x: number; y: number } {
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return { x: cx, y: cy };
  const halfW = w / 2;
  const halfH = h / 2;
  const scale = Math.min(
    Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity,
    Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity
  );
  return {
    x: cx + dx * scale,
    y: cy + dy * scale
  };
}

// Berekent het exacte aansluitpunt op de buitencontour van de LAN wolk naar elk extern punt (Mediant, PBX, Gateway)
export function getCloudConnectionPoint(
  cluster: { width: number; height: number; centerX: number; yOffset: number },
  px: number,
  py: number,
  cpeY: number
): { x: number; y: number } {
  const w = cluster.width;
  const h = cluster.height;
  const cx = cluster.centerX;
  const cy = cpeY + CLOUD_Y_OFFSET + cluster.yOffset + h / 2;
  const rx = Math.max(80, (w - 36) / 2);
  const ry = Math.max(48, (h - 48) / 2);

  const dx = px - cx;
  const dy = py - cy;

  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
    return { x: cx, y: cy + ry + 10 };
  }

  // Exacte ellipsvormige buitencontour inclusief de buitenste wolkbogen (+10px) in de richting van (px, py)
  const angle = Math.atan2(dy / (ry + 10), dx / (rx + 10));
  const edgeX = cx + (rx + 10) * Math.cos(angle);
  const edgeY = cy + (ry + 10) * Math.sin(angle);
  return { x: edgeX, y: edgeY };
}

export function getCpeExtents(cpe: any) {
  const isCombiCn = isCombiServiceWithCn(cpe.serviceType, cpe.multicustomerVariant);
  const cidr = getCidrFromSubnetString(cpe.lanSubnet) ?? 24;
  const effectiveLanIp = 
    (cpe.serviceType === 'CN' && isValidIPv4(cpe.cnLanIp) ? cpe.cnLanIp : '') ||
    (isValidIPv4(cpe.lanIpCpe) ? cpe.lanIpCpe : '') ||
    (isValidIPv4(cpe.defaultGateway) ? cpe.defaultGateway : '') ||
    '192.168.1.1';
  
  let localCount = 0;
  let routedCount = 0;
  if (cpe.pbxs && cpe.pbxs.length > 0) {
    cpe.pbxs.forEach((pbx: any) => {
      const hasIp = Boolean(pbx.ip && isValidIPv4(pbx.ip));
      if (hasIp && !isInSameSubnet(effectiveLanIp, pbx.ip, cidr)) {
        routedCount++;
      } else {
        localCount++;
      }
    });
  } else {
    localCount = 1;
  }

  const isEsprit = (cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType === 'Multicustomer Esprit' || cpe.serviceType?.startsWith('Multicustomer') || cpe.isMulticustomer) && cpe.multicustomerClient === 'Esprit';
  const hasGw = !isEsprit && (Boolean(cpe.defaultGateway && cpe.defaultGateway.trim()) || routedCount > 0);
  const is007 = cpe.hostname?.includes('007');

  // Ruimte links van de CPE:
  // De IP-box links (WAN/LAN of CN WAN/LAN) is ~180px breed en staat op 10px van de Mediant (50px half = 240px van centrum)
  // Lokale endpoints breiden naar links uit als er meerdere zijn
  const localPbxLeft = (localCount > 1) ? ((localCount - 1) * 70 + (hasGw ? 35 : 0) + 70) : 0;
  const leftExtent = is007 
    ? Math.max(120, localPbxLeft) 
    : Math.max(260, localPbxLeft);

  // Ruimte rechts van de CPE:
  // Mediant router (50px) + dienstbadge (~60px) = basis 130px
  let rightExtent = 130;

  // Combi CN IP-box rechts (VOV+CN) of Esprit 007 WAN/LAN box rechts:
  if (isCombiCn || is007) {
    rightExtent = Math.max(rightExtent, 260);
  }

  // Gateway en gerouteerde PBX'en rechts:
  if (hasGw) {
    const gwStart = isCombiCn ? 280 : 190;
    const gwTotalRight = gwStart + 220; // 70px gateway disk + 10px marge + 140px IP tekst
    const routedTotalRight = (gwStart + 35) + Math.max(0, (routedCount - 1) * 70) + 75;
    rightExtent = Math.max(rightExtent, gwTotalRight, routedTotalRight);
  }

  return { leftExtent, rightExtent, localCount, routedCount, hasGw, isCombiCn };
}
