import { BuilderElement } from '../../types';
import { getBoxBorderPoint } from './serviceBuilderSvgs';

// Hulpfunctie: Berekent het exacte raakpunt op de rand van een element
export function getElementBoundaryPoint(
  targetId: string, 
  elements: BuilderElement[], 
  otherPoint: { x: number; y: number },
  canvasWidth = 960,
  preferredSide?: 'left' | 'right' | 'top' | 'bottom'
): { x: number; y: number } {
  // 1. IP Voice Access Network wolk bovenaan (ellipse top: 16, h: 120, cx: canvasWidth/2, cy: 76)
  if (targetId === 'ip-voice-cloud') {
    const cx = Math.round(canvasWidth / 2);
    const cy = 76;
    const rx = Math.max(280, Math.min(480, (canvasWidth * 0.92) / 2));
    const ry = 58;
    if (preferredSide === 'bottom') return { x: cx, y: cy + ry };
    if (preferredSide === 'top') return { x: cx, y: cy - ry };
    if (preferredSide === 'left') return { x: cx - rx, y: cy };
    if (preferredSide === 'right') return { x: cx + rx, y: cy };
    const dx = otherPoint.x - cx;
    const dy = otherPoint.y - cy;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
      return { x: cx, y: cy + ry };
    }
    const angle = Math.atan2(dy / ry, dx / rx);
    return {
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle))
    };
  }

  // 2. Fixed Core Router exact in het midden tegen onderrand (top: 126, cx: canvasWidth/2, cy: 145)
  if (targetId === 'core-router-fixed') {
    const cx = Math.round(canvasWidth / 2);
    const cy = 145;
    return getBoxBorderPoint(cx, cy, 92, 36, otherPoint.x, otherPoint.y, preferredSide);
  }

  // 3. Fixed SBC Cluster links in de wolk (left: 40, cx: 140, cy: 76)
  if (targetId === 'sbc-cluster-fixed') {
    return getBoxBorderPoint(140, 76, 196, 36, otherPoint.x, otherPoint.y, preferredSide);
  }

  // 4. Overige dynamische canvas elementen
  const el = elements.find(e => e.id === targetId);
  if (!el) return otherPoint;

  const scale = el.scale || 1;

  switch (el.type) {
    case 'cloud': {
      const cw = el.width || 360;
      const ch = el.height || 90;
      const cx = el.x;
      const cy = el.y;
      const rx = Math.max(25, (cw - 4) / 2);
      const ry = Math.max(18, (ch - 4) / 2);
      if (preferredSide === 'left') return { x: Math.round(cx - rx), y: Math.round(cy) };
      if (preferredSide === 'right') return { x: Math.round(cx + rx), y: Math.round(cy) };
      if (preferredSide === 'top') return { x: Math.round(cx), y: Math.round(cy - ry) };
      if (preferredSide === 'bottom') return { x: Math.round(cx), y: Math.round(cy + ry) };
      const dx = otherPoint.x - cx;
      const dy = otherPoint.y - cy;
      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
        return { x: cx, y: Math.round(cy + ry) };
      }
      const angle = Math.atan2(dy / ry, dx / rx);
      return {
        x: Math.round(cx + rx * Math.cos(angle)),
        y: Math.round(cy + ry * Math.sin(angle))
      };
    }
    case 'router':
      return getBoxBorderPoint(el.x, el.y, 88 * scale, 35 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'mediant':
      return getBoxBorderPoint(el.x, el.y, 88 * scale, 35 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'switch':
      return getBoxBorderPoint(el.x, el.y, 88 * scale, 34 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'server':
      return getBoxBorderPoint(el.x, el.y, 72 * scale, 40 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'workstation':
      return getBoxBorderPoint(el.x, el.y, 44 * scale, 40 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'access-point':
      return getBoxBorderPoint(el.x, el.y, 40 * scale, 40 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'pbx':
      return getBoxBorderPoint(el.x, el.y, 40 * scale, 36 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'firewall':
      return getBoxBorderPoint(el.x, el.y, 50 * scale, 36 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'phone':
      return getBoxBorderPoint(el.x, el.y, 38 * scale, 36 * scale, otherPoint.x, otherPoint.y, preferredSide);
    case 'text': {
      const textW = el.width || Math.max(50, Math.min(480, (el.customText?.length || 4) * 8 + 24));
      const textH = el.height || 36;
      return getBoxBorderPoint(el.x, el.y, textW * scale, textH * scale, otherPoint.x, otherPoint.y, preferredSide);
    }
    default:
      return getBoxBorderPoint(el.x, el.y, 80 * scale, 40 * scale, otherPoint.x, otherPoint.y, preferredSide);
  }
}

// Hulpfunctie: Vindt het dichtstbijzijnde element voor magnetische snapping
export function findSnapElementAtPoint(
  x: number, 
  y: number, 
  elements: BuilderElement[], 
  canvasWidth = 960,
  snapDistance = 45,
  isDataMode = false
): string | null {
  const midX = Math.round(canvasWidth / 2);

  // 1. Check dynamische elementen op het canvas (switch, router, server, firewall, etc.) EERST
  for (const el of elements) {
    if (el.type === 'connector') continue;
    const scale = el.scale || 1;
    const w = el.type === 'cloud' 
      ? (el.width || 360) 
      : el.type === 'text' 
      ? (el.width || Math.max(50, Math.min(480, (el.customText?.length || 4) * 8 + 24))) 
      : (el.type === 'mediant' || el.type === 'router' || el.type === 'switch')
      ? 92 * scale
      : (el.type === 'server')
      ? 76 * scale
      : (el.type === 'firewall')
      ? 54 * scale
      : 48 * scale;
    const h = el.type === 'cloud' 
      ? (el.height || 90) 
      : el.type === 'text' 
      ? (el.height || 36) 
      : (el.type === 'server' || el.type === 'workstation' || el.type === 'access-point')
      ? 44 * scale
      : 40 * scale;
    
    const dx = Math.abs(x - el.x);
    const dy = Math.abs(y - el.y);

    if (dx <= w / 2 + snapDistance && dy <= h / 2 + snapDistance) {
      return el.id;
    }
  }

  // Als we in Data-modus zitten, zijn de vaste Voice Cloud en Core Router afwezig
  if (isDataMode) {
    return null;
  }

  // 2. Check Core Router exact in het midden tegen onderrand van IP Voice Access Network
  if (Math.abs(x - midX) <= 50 + snapDistance && Math.abs(y - 146) <= 22 + snapDistance) {
    return 'core-router-fixed';
  }

  // 3. Check SBC Cluster links in de wolk
  if (Math.abs(x - 140) <= 100 + snapDistance && Math.abs(y - 76) <= 22 + snapDistance) {
    return 'sbc-cluster-fixed';
  }

  // 4. Check IP Voice Access Network wolk (top: 16px tot 136px)
  if (y >= 10 && y <= 140 && Math.abs(x - midX) <= (canvasWidth * 0.46) + snapDistance) {
    return 'ip-voice-cloud';
  }

  return null;
}

// Hulpfunctie: Berekent de exacte visuele begin- en eindpunten van een connector op basis van gekoppelde elementen
export function getConnectorEndpoints(
  el: BuilderElement,
  elements: BuilderElement[],
  canvasWidth = 960
): { p1: { x: number; y: number }; p2: { x: number; y: number } } {
  let p1 = { x: el.x1 ?? (el.x - 60), y: el.y1 ?? el.y };
  let p2 = { x: el.x2 ?? (el.x + 60), y: el.y2 ?? el.y };

  const shape = el.connectorShape || 'straight';

  const getCenter = (id: string): { x: number; y: number } => {
    if (id === 'core-router-fixed') return { x: Math.round(canvasWidth / 2), y: 145 };
    if (id === 'sbc-cluster-fixed') return { x: 140, y: 76 };
    if (id === 'ip-voice-cloud') return { x: Math.round(canvasWidth / 2), y: 76 };
    const found = elements.find(item => item.id === id);
    return found ? { x: found.x, y: found.y } : p1;
  };

  if (el.sourceElementId && el.targetElementId) {
    const c1 = getCenter(el.sourceElementId);
    const c2 = getCenter(el.targetElementId);
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;

    if (shape === 'orthogonal' || shape === 'curved') {
      // Bepaal de meest logische aansluitzijden zodat de connector de elementen exact loodrecht en strak raakt
      if (Math.abs(dx) >= Math.abs(dy)) {
        // Horizontaal dominant: stap/boog over de X-as
        const side1 = dx >= 0 ? 'right' : 'left';
        const side2 = dx >= 0 ? 'left' : 'right';
        p1 = getElementBoundaryPoint(el.sourceElementId, elements, c2, canvasWidth, side1);
        p2 = getElementBoundaryPoint(el.targetElementId, elements, c1, canvasWidth, side2);
      } else {
        // Verticaal dominant: stap/boog over de Y-as
        const side1 = dy >= 0 ? 'bottom' : 'top';
        const side2 = dy >= 0 ? 'top' : 'bottom';
        p1 = getElementBoundaryPoint(el.sourceElementId, elements, c2, canvasWidth, side1);
        p2 = getElementBoundaryPoint(el.targetElementId, elements, c1, canvasWidth, side2);
      }
    } else {
      // Recht: directe strakke lijn van de ene rand naar de andere rand
      p1 = getElementBoundaryPoint(el.sourceElementId, elements, c2, canvasWidth);
      p2 = getElementBoundaryPoint(el.targetElementId, elements, c1, canvasWidth);
    }
  } else if (el.sourceElementId) {
    p1 = getElementBoundaryPoint(el.sourceElementId, elements, p2, canvasWidth);
  } else if (el.targetElementId) {
    p2 = getElementBoundaryPoint(el.targetElementId, elements, p1, canvasWidth);
  }

  return { p1, p2 };
}

export type ConnectorShape = 'straight' | 'orthogonal' | 'curved';

export interface ConnectorPathResult {
  pathData: string;
  midPoint: { x: number; y: number };
}

/**
 * Genereert de SVG pad-data voor een connector op basis van de gekozen vorm:
 * - 'straight': strakke directe rechte verbinding
 * - 'orthogonal': 90° haakse bochten met nette afgeronde hoekjes
 * - 'curved': soepele, vloeiende S-boog (Cubic Bezier)
 */
export function getConnectorPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  shape: ConnectorShape = 'straight',
  cornerRounding = 12
): ConnectorPathResult {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 1. Recht
  if (shape === 'straight' || (Math.abs(dx) < 2 && Math.abs(dy) < 2)) {
    return {
      pathData: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      midPoint: {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
      }
    };
  }

  // 2. Vloeiend (Soepele S-curve via Cubic Bezier)
  if (shape === 'curved') {
    let c1x: number, c1y: number, c2x: number, c2y: number;
    if (Math.abs(dx) >= Math.abs(dy)) {
      // Horizontale boog
      c1x = Math.round(p1.x + dx * 0.45);
      c1y = p1.y;
      c2x = Math.round(p2.x - dx * 0.45);
      c2y = p2.y;
    } else {
      // Verticale boog
      c1x = p1.x;
      c1y = Math.round(p1.y + dy * 0.45);
      c2x = p2.x;
      c2y = Math.round(p2.y - dy * 0.45);
    }

    return {
      pathData: `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`,
      midPoint: {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
      }
    };
  }

  // 3. Haaks (90° rechte bochten)
  if (Math.abs(dx) < 4 || Math.abs(dy) < 4) {
    return {
      pathData: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      midPoint: {
        x: Math.round((p1.x + p2.x) / 2),
        y: Math.round((p1.y + p2.y) / 2)
      }
    };
  }

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontaal dominant: stap in het midden van X
    const midX = Math.round(p1.x + dx / 2);
    const midY = Math.round((p1.y + p2.y) / 2);
    const r = Math.min(cornerRounding, Math.abs(dx) / 3, Math.abs(dy) / 3);

    if (r <= 2) {
      return {
        pathData: `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`,
        midPoint: { x: midX, y: midY }
      };
    }

    const signX = Math.sign(dx);
    const signY = Math.sign(dy);

    const corner1Start = { x: midX - signX * r, y: p1.y };
    const corner1End = { x: midX, y: p1.y + signY * r };
    const corner2Start = { x: midX, y: p2.y - signY * r };
    const corner2End = { x: midX + signX * r, y: p2.y };

    const pathData = [
      `M ${p1.x} ${p1.y}`,
      `L ${corner1Start.x} ${corner1Start.y}`,
      `Q ${midX} ${p1.y}, ${corner1End.x} ${corner1End.y}`,
      `L ${corner2Start.x} ${corner2Start.y}`,
      `Q ${midX} ${p2.y}, ${corner2End.x} ${corner2End.y}`,
      `L ${p2.x} ${p2.y}`
    ].join(' ');

    return {
      pathData,
      midPoint: { x: midX, y: midY }
    };
  } else {
    // Verticaal dominant: stap in het midden van Y
    const midY = Math.round(p1.y + dy / 2);
    const midX = Math.round((p1.x + p2.x) / 2);
    const r = Math.min(cornerRounding, Math.abs(dx) / 3, Math.abs(dy) / 3);

    if (r <= 2) {
      return {
        pathData: `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`,
        midPoint: { x: midX, y: midY }
      };
    }

    const signX = Math.sign(dx);
    const signY = Math.sign(dy);

    const corner1Start = { x: p1.x, y: midY - signY * r };
    const corner1End = { x: p1.x + signX * r, y: midY };
    const corner2Start = { x: p2.x - signX * r, y: midY };
    const corner2End = { x: p2.x, y: midY + signY * r };

    const pathData = [
      `M ${p1.x} ${p1.y}`,
      `L ${corner1Start.x} ${corner1Start.y}`,
      `Q ${p1.x} ${midY}, ${corner1End.x} ${corner1End.y}`,
      `L ${corner2Start.x} ${corner2Start.y}`,
      `Q ${p2.x} ${midY}, ${corner2End.x} ${corner2End.y}`,
      `L ${p2.x} ${p2.y}`
    ].join(' ');

    return {
      pathData,
      midPoint: { x: midX, y: midY }
    };
  }
}

export interface RectBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// Berekent de werkelijke afmetingen en omhullende rechthoek van een element
export function getElementBounds(el: BuilderElement): RectBounds {
  const scale = el.scale || 1;
  let w = 80;
  let h = 40;

  switch (el.type) {
    case 'cloud':
      w = el.width || 360;
      h = el.height || 90;
      break;
    case 'router':
      w = 96 * scale;
      h = 38 * scale;
      break;
    case 'mediant':
      w = 96 * scale;
      h = 38 * scale;
      break;
    case 'pbx':
      w = 50 * scale;
      h = 50 * scale;
      break;
    case 'firewall':
      w = 54 * scale;
      h = 40 * scale;
      break;
    case 'phone':
      w = 38 * scale;
      h = 38 * scale;
      break;
    case 'sbc':
      w = 96 * scale;
      h = 44 * scale;
      break;
    case 'switch':
      w = 96 * scale;
      h = 36 * scale;
      break;
    case 'server':
      w = 76 * scale;
      h = 42 * scale;
      break;
    case 'workstation':
      w = 48 * scale;
      h = 44 * scale;
      break;
    case 'access-point':
      w = 44 * scale;
      h = 44 * scale;
      break;
    case 'text':
      w = el.width || Math.max(50, Math.min(480, (el.customText?.length || 4) * 8 + 24));
      h = el.height || 36;
      break;
    default:
      w = 80 * scale;
      h = 40 * scale;
      break;
  }

  return {
    left: el.x - w / 2,
    top: el.y - h / 2,
    right: el.x + w / 2,
    bottom: el.y + h / 2,
    width: w,
    height: h
  };
}

export interface BadgePlacementResult {
  ipSide: 'left' | 'right';
  nameSide: 'top' | 'bottom' | 'left' | 'right';
  showWan: boolean;
  showLan: boolean;
  hasIp: boolean;
  hasName: boolean;
}

/**
 * Berekent de flexibele, 100% overlapvrije plaatsing van IP-adresvelden en naamtags
 * volgens de instructie van de gebruiker:
 * - IP adressen: links of rechts van het element
 * - Namen: links, rechts, onder of boven het element
 * - Gegarandeerd géén overlap met andere elementen, connectors of canvasranden.
 */
export function calculateOptimalBadgesPlacement(
  el: BuilderElement,
  allElements: BuilderElement[],
  canvasWidth = 960,
  canvasHeight = 800
): BadgePlacementResult {
  // 1. Bepaal of IP-adressen (WAN en/of LAN) getoond moeten worden
  // Voor Firewall: het terminerende adres bevindt zich vóór de firewall (showWan = true).
  // De interne IP-adressen en LAN zijn onbekend terrein (showLan default false).
  const showWan = el.showWanIp ?? (el.type === 'mediant' || el.type === 'router' || el.type === 'sbc' || el.type === 'firewall' || Boolean(el.wanIp));
  const showLan = el.showLanIp ?? (el.type === 'mediant' || el.type === 'pbx' || el.type === 'switch' || el.type === 'server' || (el.type === 'firewall' ? false : Boolean(el.lanIp)));
  const hasIp = (showWan || showLan) && ['mediant', 'router', 'firewall', 'pbx', 'sbc', 'switch', 'server', 'workstation', 'access-point'].includes(el.type);

  // 2. Bepaal of naam getoond moet worden: alleen als de gebruiker daadwerkelijk een benaming/label heeft ingevuld
  const hasName = Boolean(el.label && el.label.trim().length > 0);

  // Indien element geen van beide toont, default waarden
  if (!hasIp && !hasName) {
    return {
      ipSide: 'right',
      nameSide: 'bottom',
      showWan: false,
      showLan: false,
      hasIp: false,
      hasName: false
    };
  }

  const elBounds = getElementBounds(el);
  const iconW = elBounds.width;
  const iconH = elBounds.height;

  // Schatting afmetingen badges (rekening houdend met "Term. IP (vóór FW)" op firewall)
  const isFirewall = el.type === 'firewall';
  const ipBadgeWidth = isFirewall ? ((showWan && showLan) ? 150 : 136) : ((showWan && showLan) ? 128 : 108);
  const ipBadgeHeight = (showWan && showLan) ? 46 : 26;

  const labelText = el.label || (el.type === 'mediant' ? 'Mediant' : el.type === 'router' ? 'Core Router' : el.type.toUpperCase());
  const nameBadgeWidth = Math.max(60, Math.min(140, labelText.length * 7.5 + 20));
  const nameBadgeHeight = 22;

  // Verzamel alle obstakels op het canvas (alle andere elementen en connectoren)
  const obstacleBounds: RectBounds[] = [];
  
  // Vaste top elementen op het canvas
  const midX = Math.round(canvasWidth / 2);
  obstacleBounds.push({
    left: midX - 52,
    top: 124,
    right: midX + 52,
    bottom: 168,
    width: 104,
    height: 44
  }); // core-router-fixed
  obstacleBounds.push({
    left: 36,
    top: 54,
    right: 244,
    bottom: 98,
    width: 208,
    height: 44
  }); // sbc-cluster-fixed
  obstacleBounds.push({
    left: midX - 420,
    top: 14,
    right: midX + 420,
    bottom: 138,
    width: 840,
    height: 124
  }); // ip-voice-cloud

  // Dynamische elementen en connectors
  for (const other of allElements) {
    if (other.id === el.id) continue;
    if (other.type === 'connector') {
      // Connectoren die niet op dit element zijn aangesloten vormen een obstakel
      if (other.sourceElementId === el.id || other.targetElementId === el.id) continue;
      const { p1, p2 } = getConnectorEndpoints(other, allElements, canvasWidth);
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      obstacleBounds.push({
        left: minX - 4,
        right: maxX + 4,
        top: minY - 4,
        bottom: maxY + 4,
        width: maxX - minX + 8,
        height: maxY - minY + 8
      });
      continue;
    }
    obstacleBounds.push(getElementBounds(other));
  }

  // Hulpfunctie: Berekent de overlapscore van een rechthoek ten opzichte van alle obstakels en canvasranden
  const getOverlapScore = (rect: { left: number; top: number; right: number; bottom: number }): number => {
    let penalty = 0;

    // Canvas randen overschrijding
    if (rect.left < 8) penalty += (8 - rect.left) * 100 + 5000;
    if (rect.right > canvasWidth - 8) penalty += (rect.right - (canvasWidth - 8)) * 100 + 5000;
    if (rect.top < 8) penalty += (8 - rect.top) * 100 + 5000;
    if (rect.bottom > canvasHeight - 8) penalty += (rect.bottom - (canvasHeight - 8)) * 100 + 5000;

    // Overlap met andere canvas elementen
    const safety = 4;
    for (const obs of obstacleBounds) {
      const xOver = Math.max(0, Math.min(rect.right + safety, obs.right) - Math.max(rect.left - safety, obs.left));
      const yOver = Math.max(0, Math.min(rect.bottom + safety, obs.bottom) - Math.max(rect.top - safety, obs.top));
      if (xOver > 0 && yOver > 0) {
        penalty += (xOver * yOver) + 10000;
      }
    }

    return penalty;
  };

  // Kandidaat rechthoek voor IP badge
  const getIpRect = (side: 'left' | 'right') => {
    if (side === 'right') {
      const left = el.x + iconW / 2 + 8;
      const top = el.y - ipBadgeHeight / 2;
      return { left, top, right: left + ipBadgeWidth, bottom: top + ipBadgeHeight };
    } else {
      const right = el.x - iconW / 2 - 8;
      const left = right - ipBadgeWidth;
      const top = el.y - ipBadgeHeight / 2;
      return { left, top, right, bottom: top + ipBadgeHeight };
    }
  };

  // Kandidaat rechthoek voor Name badge
  const getNameRect = (side: 'top' | 'bottom' | 'left' | 'right') => {
    if (side === 'bottom') {
      const left = el.x - nameBadgeWidth / 2;
      const top = el.y + iconH / 2 + 6;
      return { left, top, right: left + nameBadgeWidth, bottom: top + nameBadgeHeight };
    } else if (side === 'top') {
      const left = el.x - nameBadgeWidth / 2;
      const bottom = el.y - iconH / 2 - 6;
      return { left, top: bottom - nameBadgeHeight, right: left + nameBadgeWidth, bottom };
    } else if (side === 'right') {
      const left = el.x + iconW / 2 + 8;
      const top = el.y - nameBadgeHeight / 2;
      return { left, top, right: left + nameBadgeWidth, bottom: top + nameBadgeHeight };
    } else {
      const right = el.x - iconW / 2 - 8;
      const left = right - nameBadgeWidth;
      const top = el.y - nameBadgeHeight / 2;
      return { left, top, right, bottom: top + nameBadgeHeight };
    }
  };

  const ipSides: ('right' | 'left')[] = ['right', 'left'];
  const nameSides: ('bottom' | 'top' | 'right' | 'left')[] = ['bottom', 'top', 'right', 'left'];

  // Test alle geldige combinaties en vind die met minimale overlap
  let bestScore = Infinity;
  let bestIpSide: 'left' | 'right' = 'right';
  let bestNameSide: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

  for (const ipSide of ipSides) {
    for (const nameSide of nameSides) {
      // Indien zowel IP als naam getoond worden, mogen ze niet op dezelfde flank staan
      if (hasIp && hasName && ipSide === nameSide) {
        continue;
      }

      let pairPenalty = 0;

      if (hasIp) {
        const ipRect = getIpRect(ipSide);
        pairPenalty += getOverlapScore(ipRect);
        
        // Gebruikersvoorkeur indien handmatig ingesteld
        if (el.ipPlacement && el.ipPlacement !== 'auto') {
          if (el.ipPlacement !== ipSide) pairPenalty += 50;
        } else {
          // Lichte natuurlijke voorkeur voor rechts
          if (ipSide === 'right') pairPenalty -= 4;
        }
      }

      if (hasName) {
        const nameRect = getNameRect(nameSide);
        pairPenalty += getOverlapScore(nameRect);

        // Gebruikersvoorkeur indien handmatig ingesteld
        if (el.namePlacement && el.namePlacement !== 'auto') {
          if (el.namePlacement !== nameSide) pairPenalty += 50;
        } else {
          // Lichte natuurlijke voorkeur voor onder, daarna boven
          if (nameSide === 'bottom') pairPenalty -= 4;
          else if (nameSide === 'top') pairPenalty -= 2;
        }
      }

      if (pairPenalty < bestScore) {
        bestScore = pairPenalty;
        bestIpSide = ipSide;
        bestNameSide = nameSide;
      }
    }
  }

  return {
    ipSide: bestIpSide,
    nameSide: bestNameSide,
    showWan,
    showLan,
    hasIp,
    hasName
  };
}
