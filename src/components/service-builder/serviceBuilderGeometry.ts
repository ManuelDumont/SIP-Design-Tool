import { BuilderElement } from '../../types';
import { getBoxBorderPoint } from './serviceBuilderSvgs';

// Hulpfunctie: Berekent het exacte raakpunt op de rand van een element
export function getElementBoundaryPoint(
  targetId: string, 
  elements: BuilderElement[], 
  otherPoint: { x: number; y: number },
  canvasWidth = 960
): { x: number; y: number } {
  // 1. IP Voice Access Network wolk bovenaan (ellipse top: 16, h: 120, cx: canvasWidth/2, cy: 76)
  if (targetId === 'ip-voice-cloud') {
    const cx = Math.round(canvasWidth / 2);
    const cy = 76;
    const rx = Math.max(300, Math.min(480, canvasWidth * 0.44));
    const ry = 60;
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

  // 2. Fixed Core Router exact in het midden tegen onderrand (top: 126, cx: canvasWidth/2, cy: 146)
  if (targetId === 'core-router-fixed') {
    const cx = Math.round(canvasWidth / 2);
    const cy = 146;
    return getBoxBorderPoint(cx, cy, 100, 40, otherPoint.x, otherPoint.y);
  }

  // 3. Fixed SBC Cluster links in de wolk (left: 40, cx: 140, cy: 76)
  if (targetId === 'sbc-cluster-fixed') {
    return getBoxBorderPoint(140, 76, 200, 40, otherPoint.x, otherPoint.y);
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
      const rx = Math.max(60, (cw - 36) / 2);
      const ry = Math.max(30, (ch - 36) / 2);
      const dx = otherPoint.x - cx;
      const dy = otherPoint.y - cy;
      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
        return { x: cx, y: Math.round(cy + ry + 6) };
      }
      // Exacte buitencontour van de wolk inclusief de buitenste boogjes
      const angle = Math.atan2(dy / (ry + 6), dx / (rx + 6));
      return {
        x: Math.round(cx + (rx + 6) * Math.cos(angle)),
        y: Math.round(cy + (ry + 6) * Math.sin(angle))
      };
    }
    case 'router':
      return getBoxBorderPoint(el.x, el.y, 96 * scale, 40 * scale, otherPoint.x, otherPoint.y);
    case 'mediant':
      return getBoxBorderPoint(el.x, el.y, 96 * scale, 42 * scale, otherPoint.x, otherPoint.y);
    case 'pbx':
      return getBoxBorderPoint(el.x, el.y, 48 * scale, 48 * scale, otherPoint.x, otherPoint.y);
    case 'firewall':
      return getBoxBorderPoint(el.x, el.y, 54 * scale, 40 * scale, otherPoint.x, otherPoint.y);
    case 'phone':
      return getBoxBorderPoint(el.x, el.y, 40 * scale, 40 * scale, otherPoint.x, otherPoint.y);
    case 'text': {
      const textW = el.width || Math.max(50, Math.min(480, (el.customText?.length || 4) * 8 + 24));
      const textH = el.height || 36;
      return getBoxBorderPoint(el.x, el.y, textW * scale, textH * scale, otherPoint.x, otherPoint.y);
    }
    default:
      return getBoxBorderPoint(el.x, el.y, 80 * scale, 40 * scale, otherPoint.x, otherPoint.y);
  }
}

// Hulpfunctie: Vindt het dichtstbijzijnde element voor magnetische snapping
export function findSnapElementAtPoint(
  x: number, 
  y: number, 
  elements: BuilderElement[], 
  canvasWidth = 960,
  snapDistance = 55
): string | null {
  const midX = Math.round(canvasWidth / 2);

  // 1. Check Core Router exact in het midden tegen onderrand van IP Voice Access Network
  if (Math.abs(x - midX) <= 50 + snapDistance && Math.abs(y - 146) <= 22 + snapDistance) {
    return 'core-router-fixed';
  }

  // 2. Check SBC Cluster links in de wolk
  if (Math.abs(x - 140) <= 100 + snapDistance && Math.abs(y - 76) <= 22 + snapDistance) {
    return 'sbc-cluster-fixed';
  }

  // 3. Check IP Voice Access Network wolk (top: 16px tot 136px)
  if (y >= 10 && y <= 145 && Math.abs(x - midX) <= (canvasWidth * 0.46) + snapDistance) {
    return 'ip-voice-cloud';
  }

  // 4. Check alle canvas elementen (behalve connectoren zelf)
  for (const el of elements) {
    if (el.type === 'connector') continue;
    const scale = el.scale || 1;
    const w = el.type === 'cloud' 
      ? (el.width || 360) 
      : el.type === 'text' 
      ? (el.width || Math.max(50, Math.min(480, (el.customText?.length || 4) * 8 + 24))) 
      : 90 * scale;
    const h = el.type === 'cloud' 
      ? (el.height || 90) 
      : el.type === 'text' 
      ? (el.height || 36) 
      : 45 * scale;
    
    const dx = Math.abs(x - el.x);
    const dy = Math.abs(y - el.y);

    if (dx <= w / 2 + snapDistance && dy <= h / 2 + snapDistance) {
      return el.id;
    }
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

  const getCenter = (id: string): { x: number; y: number } => {
    if (id === 'core-router-fixed') return { x: Math.round(canvasWidth / 2), y: 146 };
    if (id === 'sbc-cluster-fixed') return { x: 140, y: 76 };
    if (id === 'ip-voice-cloud') return { x: Math.round(canvasWidth / 2), y: 76 };
    const found = elements.find(item => item.id === id);
    return found ? { x: found.x, y: found.y } : p1;
  };

  if (el.sourceElementId && el.targetElementId) {
    const c1 = getCenter(el.sourceElementId);
    const c2 = getCenter(el.targetElementId);
    p1 = getElementBoundaryPoint(el.sourceElementId, elements, c2, canvasWidth);
    p2 = getElementBoundaryPoint(el.targetElementId, elements, c1, canvasWidth);
  } else if (el.sourceElementId) {
    p1 = getElementBoundaryPoint(el.sourceElementId, elements, p2, canvasWidth);
  } else if (el.targetElementId) {
    p2 = getElementBoundaryPoint(el.targetElementId, elements, p1, canvasWidth);
  }

  return { p1, p2 };
}
