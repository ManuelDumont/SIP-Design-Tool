import React from 'react';

// Berekent het exacte aansluitpunt op de rand van een component (met optionele voorkeurszijde voor haakse en vloeiende connectoren)
export function getBoxBorderPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  fromX: number,
  fromY: number,
  preferredSide?: 'left' | 'right' | 'top' | 'bottom'
): { x: number; y: number } {
  const halfW = w / 2;
  const halfH = h / 2;

  if (preferredSide === 'left') return { x: Math.round(cx - halfW), y: Math.round(cy) };
  if (preferredSide === 'right') return { x: Math.round(cx + halfW), y: Math.round(cy) };
  if (preferredSide === 'top') return { x: Math.round(cx), y: Math.round(cy - halfH) };
  if (preferredSide === 'bottom') return { x: Math.round(cx), y: Math.round(cy + halfH) };

  const dx = fromX - cx;
  const dy = fromY - cy;
  if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) return { x: cx, y: cy };
  const scale = Math.min(
    Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity,
    Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity
  );
  return {
    x: Math.round(cx + dx * scale),
    y: Math.round(cy + dy * scale)
  };
}

// Wolkvorm SVG padgenerator conform NetworkDiagram (ronde ovale basis-ellips met gelijkmatige bogen)
export function generateCloudPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(60, (w - 36) / 2);
  const ry = Math.max(30, (h - 36) / 2);
  const numLobes = Math.max(8, Math.round((w + h) / 45));
  const halfStep = Math.PI / numLobes;

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

// 1. Core / IP Router SVG (3D cilinder met 4 routing pijlen)
export function CoreRouterSvg({ width = 100, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 40" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="crBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="crTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M 4 12 C 4 5 24 1 50 1 C 76 1 96 5 96 12 L 96 26 C 96 33 76 38 50 38 C 24 38 4 33 4 26 Z" fill="url(#crBodyGrad)" stroke="#1e3a8a" strokeWidth="1.5" />
      <ellipse cx="50" cy="12" rx="46" ry="11" fill="url(#crTopGrad)" stroke="#93c5fd" strokeWidth="1.2" />
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="22" y1="6" x2="38" y2="11" />
        <polyline points="30 8 38 11 35 14" />
        <line x1="56" y1="13" x2="74" y2="18" />
        <polyline points="68 15 74 18 66 19" />
        <line x1="78" y1="6" x2="62" y2="11" />
        <polyline points="70 8 62 11 65 14" />
        <line x1="44" y1="13" x2="26" y2="18" />
        <polyline points="32 15 26 18 34 19" />
      </g>
    </svg>
  );
}

// 2. Mediant Router SVG (AudioCodes CPE: blauw met telefoonbadge)
export function MediantRouterSvg({ width = 100, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 40" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="sbVrBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="sbVrTop" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path d="M 4 12 C 4 5 24 1 50 1 C 76 1 96 5 96 12 L 96 26 C 96 33 76 38 50 38 C 24 38 4 33 4 26 Z" fill="url(#sbVrBody)" stroke="#0369a1" strokeWidth="1.5" />
      <ellipse cx="50" cy="12" rx="46" ry="11" fill="url(#sbVrTop)" stroke="#7dd3fc" strokeWidth="1.2" />
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="22" y1="6" x2="38" y2="11" />
        <polyline points="30 8 38 11 35 14" />
        <line x1="56" y1="13" x2="74" y2="18" />
        <polyline points="68 15 74 18 66 19" />
        <line x1="78" y1="6" x2="62" y2="11" />
        <polyline points="70 8 62 11 65 14" />
        <line x1="44" y1="13" x2="26" y2="18" />
        <polyline points="32 15 26 18 34 19" />
      </g>
      <ellipse cx="50" cy="27" rx="14" ry="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      <path d="M 44.5 26 C 44.5 24.2 46 23.8 47.2 24.2 L 48.2 24.9 C 48.6 25.3 48.6 26 48.2 26.4 L 47.8 26.8 C 48.4 27.7 49.3 28.6 50.3 29.2 L 50.7 28.8 C 51.1 28.4 51.8 28.4 52.2 28.8 L 52.9 29.5 C 53.6 30.2 53.4 31.2 52.4 31.2 C 49.3 31.2 44.5 28.7 44.5 26 Z" fill="#0284c7" />
    </svg>
  );
}

// 3. Carrier SBC Cluster SVG: AudioCodes Mediant™ 4000B (exact conform hardware in NetworkDiagram)
export function SbcClusterSvg({ width = 200, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 210 42" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="sbM4kChassis" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="15%" stopColor="#1f2937" />
          <stop offset="85%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="sbM4kTopLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="sbM4kHandle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="sbM4kRj45" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="206" height="38" rx="2" fill="url(#sbM4kChassis)" stroke="#111827" strokeWidth="1" />
      <line x1="3" y1="3.5" x2="207" y2="3.5" stroke="url(#sbM4kTopLid)" strokeWidth="1" strokeOpacity="0.8" />
      <circle cx="4" cy="21" r="1.6" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <rect x="7.5" y="8" width="5" height="26" rx="2.5" fill="none" stroke="url(#sbM4kHandle)" strokeWidth="2.2" />
      <circle cx="10" cy="9.5" r="1.1" fill="#cbd5e1" />
      <circle cx="10" cy="32.5" r="1.1" fill="#cbd5e1" />
      <g transform="translate(16, 11)">
        <circle cx="3" cy="4" r="2.5" fill="none" stroke="#ffffff" strokeWidth="0.9" />
        <circle cx="7" cy="4" r="2.5" fill="none" stroke="#ffffff" strokeWidth="0.9" />
      </g>
      <circle cx="28" cy="24" r="1.2" fill="#22c55e" />
      <rect x="37" y="8" width="32" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      <rect x="37" y="21" width="32" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      <rect x="71" y="6" width="35" height="28" rx="1" fill="#030712" stroke="#4b5563" strokeWidth="0.8" />
      <rect x="86" y="7.5" width="4.5" height="1.8" rx="0.5" fill="#1f2937" stroke="#6b7280" strokeWidth="0.4" />
      <g transform="translate(73, 11)">
        <rect x="0" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="7.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="15" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="22.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
      </g>
      <g transform="translate(73, 20)">
        <rect x="0" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="7.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="15" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
        <rect x="22.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#sbM4kRj45)" strokeWidth="0.6" />
      </g>
      <text x="114" y="24" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">SBC CLUSTER</text>
    </svg>
  );
}

// 4. SIP PBX SVG
export function PbxSvg({ width = 48, height = 48 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 48 48" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="sbPbxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="40" height="36" rx="4" fill="url(#sbPbxGrad)" stroke="#1e3a8a" strokeWidth="1.8" />
      <line x1="4" y1="14" x2="44" y2="14" stroke="#1e3a8a" strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="12" cy="10" r="1.5" fill="#22c55e" />
      <circle cx="16.5" cy="10" r="1.5" fill="#3b82f6" />
      <circle cx="21" cy="10" r="1.5" fill="#10b981" />
      <rect x="9" y="16.5" width="30" height="21" rx="3.5" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.2" />
      <path 
        d="M 18.5 24 C 18.5 21.6 20.3 21 21.8 21.6 L 23 22.5 C 23.5 23 23.5 23.8 22.9 24.3 L 22.3 24.8 C 23.1 26.1 24.2 27.2 25.5 28 L 26 27.4 C 26.5 26.8 27.3 26.8 27.8 27.3 L 28.7 28.5 C 29.7 29.3 29.4 30.8 28 30.8 C 23.8 30.8 18.5 27 18.5 24 Z" 
        fill="#1d4ed8" 
      />
    </svg>
  );
}

// 5. Firewall SVG
export function FirewallSvg({ width = 54, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 54 40" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="sbFwWall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="50" height="36" rx="4" fill="url(#sbFwWall)" stroke="#7f1d1d" strokeWidth="2" />
      <line x1="2" y1="14" x2="52" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="2" y1="26" x2="52" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="18" y1="2" x2="18" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="36" y1="2" x2="36" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="10" y1="14" x2="10" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="27" y1="14" x2="27" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="44" y1="14" x2="44" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <circle cx="27" cy="20" r="7.5" fill="#ffffff" stroke="#991b1b" strokeWidth="1" />
      <path d="M27 15 L31 18 V22 C31 24.5 27 26 27 26 C27 26 23 24.5 23 22 V18 Z" fill="#b91c1c" />
    </svg>
  );
}

// 6. Telefoontoestel / Desktop Phone SVG
export function PhoneSvg({ width = 40, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" className="overflow-visible select-none drop-shadow-md">
      <path 
        d="M5 11 L7 6 H17 L19 11 V17 A2 2 0 0 1 17 19 H7 A2 2 0 0 1 5 17 Z" 
        fill="#475569" 
        stroke="#334155" 
        strokeWidth="1" 
      />
      <rect x="8" y="7.5" width="8" height="2.5" rx="0.5" fill="#cbd5e1" />
      <rect x="8" y="12" width="1.5" height="1.5" fill="#94a3b8" />
      <rect x="11.25" y="12" width="1.5" height="1.5" fill="#94a3b8" />
      <rect x="14.5" y="12" width="1.5" height="1.5" fill="#94a3b8" />
      <rect x="8" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
      <rect x="11.25" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
      <rect x="14.5" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
      <path d="M3 6 Q12 1 21 6" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="1" y="4.5" width="5" height="3.5" rx="1" fill="#0f172a" />
      <rect x="18" y="4.5" width="5" height="3.5" rx="1" fill="#0f172a" />
    </svg>
  );
}

// 7. Network Switch SVG (L2/L3 Core Switch met 4 tegengestelde schakelpijlen)
export function SwitchSvg({ width = 96, height = 36 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 96 36" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="swChassis" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
        <linearGradient id="swBezel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* 1U Chassis */}
      <rect x="2" y="3" width="92" height="30" rx="3" fill="url(#swChassis)" stroke="#0c4a6e" strokeWidth="1.5" />
      <line x1="3" y1="4.5" x2="93" y2="4.5" stroke="url(#swBezel)" strokeWidth="1" strokeOpacity="0.8" />
      
      {/* 4 Opposing Network Switch Arrows (Cisco Standard) */}
      <g stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Pijl 1: Links naar Rechts (boven) */}
        <line x1="26" y1="12" x2="42" y2="12" />
        <polyline points="37 9 42 12 37 15" />
        {/* Pijl 2: Rechts naar Links (boven) */}
        <line x1="70" y1="12" x2="54" y2="12" />
        <polyline points="59 9 54 12 59 15" />
        {/* Pijl 3: Rechts naar Links (onder) */}
        <line x1="42" y1="20" x2="26" y2="20" />
        <polyline points="31 17 26 20 31 23" />
        {/* Pijl 4: Links naar Rechts (onder) */}
        <line x1="54" y1="20" x2="70" y2="20" />
        <polyline points="65 17 70 20 65 23" />
      </g>

      {/* Front status LEDs & Poorten */}
      <circle cx="8" cy="12" r="1.5" fill="#22c55e" />
      <circle cx="13" cy="12" r="1.5" fill="#38bdf8" />
      <circle cx="8" cy="19" r="1.5" fill="#22c55e" />
      <circle cx="13" cy="19" r="1.5" fill="#f59e0b" />
      
      {/* Subtiel RJ45 haven-patroon onderrand */}
      <g fill="#082f49" stroke="#0ea5e9" strokeWidth="0.5">
        <rect x="20" y="27" width="4" height="3" rx="0.5" />
        <rect x="26" y="27" width="4" height="3" rx="0.5" />
        <rect x="32" y="27" width="4" height="3" rx="0.5" />
        <rect x="38" y="27" width="4" height="3" rx="0.5" />
        <rect x="54" y="27" width="4" height="3" rx="0.5" />
        <rect x="60" y="27" width="4" height="3" rx="0.5" />
        <rect x="66" y="27" width="4" height="3" rx="0.5" />
        <rect x="72" y="27" width="4" height="3" rx="0.5" />
      </g>
      <text x="86" y="20" fill="#bae6fd" fontSize="7" fontFamily="sans-serif" fontWeight="bold">L2</text>
    </svg>
  );
}

// 8. Data Center / Rack Server SVG
export function ServerSvg({ width = 76, height = 42 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 76 42" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="srvBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {/* 2U Chassis */}
      <rect x="2" y="3" width="72" height="36" rx="2.5" fill="url(#srvBody)" stroke="#090d16" strokeWidth="1.5" />
      <line x1="3" y1="21" x2="73" y2="21" stroke="#475569" strokeWidth="0.8" />
      
      {/* Rack Mount Ears links & rechts */}
      <rect x="0" y="7" width="2.5" height="8" rx="0.5" fill="#64748b" />
      <rect x="0" y="27" width="2.5" height="8" rx="0.5" fill="#64748b" />
      <rect x="73.5" y="7" width="2.5" height="8" rx="0.5" fill="#64748b" />
      <rect x="73.5" y="27" width="2.5" height="8" rx="0.5" fill="#64748b" />

      {/* Drive Caddies rij 1 */}
      <g fill="#1e293b" stroke="#475569" strokeWidth="0.6">
        <rect x="6" y="7" width="9" height="10" rx="0.5" />
        <rect x="17" y="7" width="9" height="10" rx="0.5" />
        <rect x="28" y="7" width="9" height="10" rx="0.5" />
        <rect x="39" y="7" width="9" height="10" rx="0.5" />
      </g>
      {/* Drive Caddies rij 2 */}
      <g fill="#1e293b" stroke="#475569" strokeWidth="0.6">
        <rect x="6" y="25" width="9" height="10" rx="0.5" />
        <rect x="17" y="25" width="9" height="10" rx="0.5" />
        <rect x="28" y="25" width="9" height="10" rx="0.5" />
        <rect x="39" y="25" width="9" height="10" rx="0.5" />
      </g>

      {/* Power Button & Status LEDs */}
      <circle cx="56" cy="12" r="2.2" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8" />
      <circle cx="64" cy="10" r="1.2" fill="#22c55e" />
      <circle cx="68" cy="10" r="1.2" fill="#22c55e" />
      <circle cx="64" cy="14" r="1.2" fill="#38bdf8" />
      <circle cx="68" cy="14" r="1.2" fill="#f59e0b" />

      {/* Ventilatie grill */}
      <line x1="52" y1="26" x2="70" y2="26" stroke="#475569" strokeWidth="1" strokeDasharray="1.5,1.5" />
      <line x1="52" y1="30" x2="70" y2="30" stroke="#475569" strokeWidth="1" strokeDasharray="1.5,1.5" />
      <line x1="52" y1="34" x2="70" y2="34" stroke="#475569" strokeWidth="1" strokeDasharray="1.5,1.5" />
    </svg>
  );
}

// 9. Workstation / PC SVG
export function WorkstationSvg({ width = 48, height = 44 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 48 44" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="pcScreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Monitor Screen */}
      <rect x="2" y="2" width="34" height="25" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
      <rect x="4" y="4" width="30" height="21" rx="1" fill="url(#pcScreen)" />
      {/* Monitor Display inner UI lines */}
      <line x1="8" y1="9" x2="22" y2="9" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="8" y1="13" x2="18" y2="13" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.7" strokeLinecap="round" />
      <rect x="8" y="16" width="12" height="6" rx="0.5" fill="#60a5fa" fillOpacity="0.4" />
      <circle cx="28" cy="19" r="2.5" fill="#67e8f9" />

      {/* Monitor Stand */}
      <path d="M 17 27 L 17 33 L 13 35 L 25 35 L 21 33 L 21 27 Z" fill="#64748b" stroke="#475569" strokeWidth="0.8" />

      {/* Mini Desktop Tower / PC aan de zijkant */}
      <rect x="38" y="7" width="9" height="28" rx="1.5" fill="#334155" stroke="#1e293b" strokeWidth="1" />
      <circle cx="42.5" cy="11" r="1.2" fill="#38bdf8" />
      <rect x="40" y="14" width="5" height="1.5" fill="#64748b" />
      <rect x="40" y="17" width="5" height="1.5" fill="#64748b" />
      <line x1="40" y1="27" x2="45" y2="27" stroke="#64748b" strokeWidth="0.8" />
      <line x1="40" y1="29" x2="45" y2="29" stroke="#64748b" strokeWidth="0.8" />
    </svg>
  );
}

// 10. Access Point (WiFi AP) SVG
export function AccessPointSvg({ width = 44, height = 44 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 44" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <radialGradient id="apBody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
      </defs>
      {/* Enterprise Dome Disc */}
      <circle cx="22" cy="22" r="16" fill="url(#apBody)" stroke="#94a3b8" strokeWidth="1.4" />
      <circle cx="22" cy="22" r="10" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
      
      {/* Center glowing LED */}
      <circle cx="22" cy="22" r="2.8" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      <circle cx="22" cy="22" r="1.2" fill="#ffffff" />

      {/* Wireless RF Waves links & rechts */}
      <path d="M 12 16 A 10 10 0 0 0 12 28" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 7 13 A 16 16 0 0 0 7 31" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,2" />
      <path d="M 32 16 A 10 10 0 0 1 32 28" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 37 13 A 16 16 0 0 1 37 31" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3,2" />
    </svg>
  );
}

