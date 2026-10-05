import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LocationConfig } from '../types';
import { Network, Download, RotateCcw, Save } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getCidrFromSubnetString, isValidIPv4, isInSameSubnet, getSubnetNetworkAddress } from '../utils/ip';
import { Language, translations } from '../i18n/translations';

// Standaard IP Netwerkrouter (geen wireless antennes, 4 routing pijlen)
function CoreRouterSvg({ width = 100, height = 40 }: { width?: number; height?: number }) {
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
      {/* 3D Cylinder Body */}
      <path d="M 4 12 C 4 5 24 1 50 1 C 76 1 96 5 96 12 L 96 26 C 96 33 76 38 50 38 C 24 38 4 33 4 26 Z" fill="url(#crBodyGrad)" stroke="#1e3a8a" strokeWidth="1.5" />
      {/* Top Cap */}
      <ellipse cx="50" cy="12" rx="46" ry="11" fill="url(#crTopGrad)" stroke="#93c5fd" strokeWidth="1.2" />
      {/* 4 Routing Arrows on Top (standard Cisco router arrows: 2 in, 2 out) */}
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top-left inward arrow */}
        <line x1="22" y1="6" x2="38" y2="11" />
        <polyline points="30 8 38 11 35 14" />
        {/* Bottom-right outward arrow */}
        <line x1="56" y1="13" x2="74" y2="18" />
        <polyline points="68 15 74 18 66 19" />
        {/* Top-right inward arrow */}
        <line x1="78" y1="6" x2="62" y2="11" />
        <polyline points="70 8 62 11 65 14" />
        {/* Bottom-left outward arrow */}
        <line x1="44" y1="13" x2="26" y2="18" />
        <polyline points="32 15 26 18 34 19" />
      </g>
    </svg>
  );
}

// Voice Router (AudioCodes Mediant CPE: 4 routing pijlen + Voice Telefoon badge op voorkant)
function VoiceRouterSvg({ width = 100, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 40" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="vrBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="vrTopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* 3D Cylinder Body */}
      <path d="M 4 12 C 4 5 24 1 50 1 C 76 1 96 5 96 12 L 96 26 C 96 33 76 38 50 38 C 24 38 4 33 4 26 Z" fill="url(#vrBodyGrad)" stroke="#0369a1" strokeWidth="1.5" />
      {/* Top Cap */}
      <ellipse cx="50" cy="12" rx="46" ry="11" fill="url(#vrTopGrad)" stroke="#7dd3fc" strokeWidth="1.2" />
      {/* 4 Routing Arrows on Top */}
      <g stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Top-left inward arrow */}
        <line x1="22" y1="6" x2="38" y2="11" />
        <polyline points="30 8 38 11 35 14" />
        {/* Bottom-right outward arrow */}
        <line x1="56" y1="13" x2="74" y2="18" />
        <polyline points="68 15 74 18 66 19" />
        {/* Top-right inward arrow */}
        <line x1="78" y1="6" x2="62" y2="11" />
        <polyline points="70 8 62 11 65 14" />
        {/* Bottom-left outward arrow */}
        <line x1="44" y1="13" x2="26" y2="18" />
        <polyline points="32 15 26 18 34 19" />
      </g>
      {/* Front Badge: Voice / Telephone indicator */}
      <ellipse cx="50" cy="27" rx="14" ry="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
      {/* Phone Handset / Voice symbol in badge */}
      <path d="M 44.5 26 C 44.5 24.2 46 23.8 47.2 24.2 L 48.2 24.9 C 48.6 25.3 48.6 26 48.2 26.4 L 47.8 26.8 C 48.4 27.7 49.3 28.6 50.3 29.2 L 50.7 28.8 C 51.1 28.4 51.8 28.4 52.2 28.8 L 52.9 29.5 C 53.6 30.2 53.4 31.2 52.4 31.2 C 49.3 31.2 44.5 28.7 44.5 26 Z" fill="#0284c7" />
    </svg>
  );
}

// SIP PBX Endpoint Icoon (Private Branch Exchange Telefooncentrale)
function PbxIcon({ width = 48, height = 48, isRouted = false }: { width?: number; height?: number; isRouted?: boolean }) {
  const strokeColor = isRouted ? '#b45309' : '#1e3a8a';
  const badgeColor = isRouted ? '#b45309' : '#1d4ed8';
  const bodyGradStart = isRouted ? '#fef3c7' : '#f0f9ff';
  const bodyGradEnd = isRouted ? '#fde68a' : '#dbeafe';

  return (
    <svg width={width} height={height} viewBox="0 0 48 48" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id={`pbxGrad-${isRouted ? 'routed' : 'local'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bodyGradStart} />
          <stop offset="100%" stopColor={bodyGradEnd} />
        </linearGradient>
      </defs>
      
      {/* PBX Chassis Main Body */}
      <rect x="4" y="6" width="40" height="36" rx="4" fill={`url(#pbxGrad-${isRouted ? 'routed' : 'local'})`} stroke={strokeColor} strokeWidth="1.8" />
      
      {/* Front Faceplate Top Bevel */}
      <line x1="4" y1="14" x2="44" y2="14" stroke={strokeColor} strokeWidth="1" strokeOpacity="0.3" />
      
      {/* Rack Mount Ears / Screws */}
      <circle cx="7" cy="10" r="1.2" fill={strokeColor} />
      <circle cx="41" cy="10" r="1.2" fill={strokeColor} />
      <circle cx="7" cy="38" r="1.2" fill={strokeColor} />
      <circle cx="41" cy="38" r="1.2" fill={strokeColor} />
      
      {/* Status LEDs (Power, Link, SIP) */}
      <circle cx="12" cy="10" r="1.5" fill="#22c55e" />
      <circle cx="16.5" cy="10" r="1.5" fill={isRouted ? '#f59e0b' : '#3b82f6'} />
      <circle cx="21" cy="10" r="1.5" fill="#10b981" />
      
      {/* RJ45 Ethernet / Trunk Ports on front panel */}
      <g fill="#475569" stroke="#334155" strokeWidth="0.5">
        <rect x="28" y="8" width="4.5" height="4" rx="0.5" />
        <rect x="34.5" y="8" width="4.5" height="4" rx="0.5" />
      </g>
      
      {/* Telephony Endpoint Screen in Center */}
      <rect x="9" y="16.5" width="30" height="21" rx="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="1.2" />
      
      {/* Telephone Handset Symbol (gecentreerd in het scherm, zonder 'PBX' tekst) */}
      <path 
        d="M 18.5 24 C 18.5 21.6 20.3 21 21.8 21.6 L 23 22.5 C 23.5 23 23.5 23.8 22.9 24.3 L 22.3 24.8 C 23.1 26.1 24.2 27.2 25.5 28 L 26 27.4 C 26.5 26.8 27.3 26.8 27.8 27.3 L 28.7 28.5 C 29.7 29.3 29.4 30.8 28 30.8 C 23.8 30.8 18.5 27 18.5 24 Z" 
        fill={badgeColor} 
      />
    </svg>
  );
}

// Carrier SBC Cluster Icoon: AudioCodes Mediant™ 4000B (exact conform geüploade hardware-afbeelding)
function SbcClusterSvg({ width = 210, height = 42 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 210 42" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="m4kChassis" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="15%" stopColor="#1f2937" />
          <stop offset="85%" stopColor="#111827" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
        <linearGradient id="m4kTopLid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id="m4kHandle" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="m4kRj45" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>

      {/* Main Metal Rack Chassis Body */}
      <rect x="2" y="2" width="206" height="38" rx="2" fill="url(#m4kChassis)" stroke="#111827" strokeWidth="1" />
      
      {/* Top Lid Lighting Bevel Highlight */}
      <line x1="3" y1="3.5" x2="207" y2="3.5" stroke="url(#m4kTopLid)" strokeWidth="1" strokeOpacity="0.8" />
      
      {/* Left Rack Ear & Mounting Screw */}
      <circle cx="4" cy="21" r="1.6" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <line x1="2.8" y1="21" x2="5.2" y2="21" stroke="#334155" strokeWidth="0.5" />

      {/* Left Heavy-Duty Vertical Rack Handle */}
      <rect x="7.5" y="8" width="5" height="26" rx="2.5" fill="none" stroke="url(#m4kHandle)" strokeWidth="2.2" />
      <circle cx="10" cy="9.5" r="1.1" fill="#cbd5e1" />
      <circle cx="10" cy="32.5" r="1.1" fill="#cbd5e1" />

      {/* AudioCodes Ribbon Logo on left faceplate (zonder tekst) */}
      <g transform="translate(16, 11)">
        <circle cx="3" cy="4" r="2.5" fill="none" stroke="#ffffff" strokeWidth="0.9" />
        <circle cx="7" cy="4" r="2.5" fill="none" stroke="#ffffff" strokeWidth="0.9" />
      </g>
      
      {/* Left Status LED */}
      <circle cx="28" cy="24" r="1.2" fill="#22c55e" />

      {/* Center-Left Modular Bays */}
      <rect x="37" y="8" width="32" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      <rect x="37" y="21" width="32" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      {/* Ejector handles */}
      <rect x="67" y="11" width="1.5" height="6" rx="0.5" fill="#4b5563" />
      <rect x="67" y="24" width="1.5" height="6" rx="0.5" fill="#4b5563" />

      {/* Center Network Port Block (8 Gigabit Ethernet Ports) */}
      <rect x="71" y="6" width="35" height="28" rx="1" fill="#030712" stroke="#4b5563" strokeWidth="0.8" />
      {/* Top console / micro USB port */}
      <rect x="86" y="7.5" width="4.5" height="1.8" rx="0.5" fill="#1f2937" stroke="#6b7280" strokeWidth="0.4" />
      {/* Port row 1 (ports 1-4) */}
      <g transform="translate(73, 11)">
        <rect x="0" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="7.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="15" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="22.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        {/* Link LEDs */}
        <circle cx="3.2" cy="-1" r="0.6" fill="#22c55e" />
        <circle cx="10.7" cy="-1" r="0.6" fill="#22c55e" />
        <circle cx="18.2" cy="-1" r="0.6" fill="#22c55e" />
        <circle cx="25.7" cy="-1" r="0.6" fill="#22c55e" />
      </g>
      {/* Port row 2 (ports 5-8) */}
      <g transform="translate(73, 20)">
        <rect x="0" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="7.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="15" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        <rect x="22.5" y="0" width="6.5" height="6" rx="0.5" fill="#1e293b" stroke="url(#m4kRj45)" strokeWidth="0.6" />
        {/* Link LEDs */}
        <circle cx="3.2" cy="7" r="0.6" fill="#22c55e" />
        <circle cx="10.7" cy="7" r="0.6" fill="#22c55e" />
        <circle cx="18.2" cy="7" r="0.6" fill="#22c55e" />
        <circle cx="25.7" cy="7" r="0.6" fill="#22c55e" />
      </g>

      {/* Center-Right Modular Bays 1 */}
      <rect x="108" y="8" width="34" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      <rect x="108" y="21" width="34" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      {/* Ejector handles */}
      <rect x="139" y="11" width="1.5" height="6" rx="0.5" fill="#4b5563" />
      <rect x="139" y="24" width="1.5" height="6" rx="0.5" fill="#4b5563" />

      {/* Center-Right Modular Bays 2 */}
      <rect x="144" y="8" width="34" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      <rect x="144" y="21" width="34" height="12" rx="0.5" fill="#111827" stroke="#374151" strokeWidth="0.7" />
      {/* Ejector handles */}
      <rect x="175" y="11" width="1.5" height="6" rx="0.5" fill="#4b5563" />
      <rect x="175" y="24" width="1.5" height="6" rx="0.5" fill="#4b5563" />

      {/* Right Fan Matrix Display */}
      <rect x="171" y="9" width="22" height="9" rx="0.5" fill="#030712" stroke="#4b5563" strokeWidth="0.6" />
      <g fill="#22c55e">
        <circle cx="174" cy="12" r="0.6" />
        <circle cx="177" cy="12" r="0.6" />
        <circle cx="180" cy="12" r="0.6" />
        <circle cx="183" cy="12" r="0.6" />
        <circle cx="186" cy="12" r="0.6" />
        <circle cx="189" cy="12" r="0.6" />
        <circle cx="174" cy="15" r="0.6" />
        <circle cx="177" cy="15" r="0.6" />
        <circle cx="180" cy="15" r="0.6" />
        <circle cx="183" cy="15" r="0.6" />
        <circle cx="186" cy="15" r="0.6" />
        <circle cx="189" cy="15" r="0.6" />
      </g>

      {/* Right Status LED */}
      <circle cx="182" cy="24" r="1.1" fill="#22c55e" />

      {/* Right Heavy-Duty Vertical Rack Handle */}
      <rect x="197.5" y="8" width="5" height="26" rx="2.5" fill="none" stroke="url(#m4kHandle)" strokeWidth="2.2" />
      <circle cx="200" cy="9.5" r="1.1" fill="#cbd5e1" />
      <circle cx="200" cy="32.5" r="1.1" fill="#cbd5e1" />

      {/* Right Rack Ear & Mounting Screw */}
      <circle cx="206" cy="21" r="1.6" fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
      <line x1="204.8" y1="21" x2="207.2" y2="21" stroke="#334155" strokeWidth="0.5" />
    </svg>
  );
}

function areCpesInSameLanSubnet(cpeA: any, cpeB: any): boolean {
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

function generateCloudPath(w: number, h: number): string {
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

const CLOUD_Y_OFFSET = 34;

function getCloudTopY(cluster: { width: number; height: number; centerX: number; yOffset: number }, absX: number, cpeY: number): number {
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

function getCloudBottomY(cluster: { width: number; height: number; centerX: number; yOffset: number }, absX: number, cpeY: number): number {
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
function getBoxBorderPoint(
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
function getCloudConnectionPoint(
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

function getCpeExtents(cpe: any) {
  const isVovCn = cpe.serviceType === 'VOV + CN';
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

  const hasGw = Boolean(cpe.defaultGateway && cpe.defaultGateway.trim()) || routedCount > 0;

  // Ruimte links van de CPE (WAN/LAN labels + eventuele lokale PBX'en)
  const leftExtent = Math.max(200, (localCount - 1) * 70 + 170);

  // Ruimte rechts van de CPE (CN labels + Gateway + gerouteerde PBX'en)
  let rightExtent = 180;
  if (isVovCn) rightExtent = Math.max(rightExtent, 280);
  if (hasGw) {
    const gwStart = isVovCn ? 280 : 190;
    const gwTotalRight = gwStart + 185; // Gateway disc + IP tekst
    const routedTotalRight = (gwStart + 35) + Math.max(0, (routedCount - 1) * 70) + 70;
    rightExtent = Math.max(rightExtent, gwTotalRight, routedTotalRight);
  }

  return { leftExtent, rightExtent, localCount, routedCount, hasGw };
}

interface InlineEditProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => void;
  className?: string;
  inputClassName?: string;
  isIp?: boolean;
  title?: string;
}

function InlineEdit({
  value,
  placeholder = 'Klik om in te voeren',
  onSave,
  className = '',
  inputClassName = '',
  isIp = false,
  title = 'Klik om direct aan te passen'
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      onSave(currentVal.trim());
    } else if (e.key === 'Escape') {
      setCurrentVal(value);
      setIsEditing(false);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    onSave(currentVal.trim());
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentVal}
        onChange={(e) => setCurrentVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`px-1.5 py-0.5 rounded border border-blue-500 bg-white text-slate-900 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 z-[100] relative pointer-events-auto font-mono text-xs ${inputClassName}`}
        style={{ minWidth: isIp ? '125px' : '90px' }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  const displayVal = value || placeholder;
  const isPlaceholder = !value;

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title={title}
      className={`cursor-pointer transition-all duration-150 rounded px-1 -mx-0.5 hover:bg-blue-50 hover:text-blue-900 hover:ring-1 hover:ring-blue-400 relative z-30 group/edit pointer-events-auto ${isPlaceholder ? 'opacity-50 italic' : ''} ${className}`}
    >
      {displayVal}
      <span className="inline-block opacity-0 group-hover/edit:opacity-100 transition-opacity ml-1 text-blue-500 text-[10px]">
        ✎
      </span>
    </span>
  );
}

interface Props {
  locations: LocationConfig[];
  customerName?: string;
  projectNumber?: string;
  darkMode?: boolean;
  onExportJSON?: () => void;
  onRegisterExportPNG?: (fn: () => void) => void;
  language?: Language;
  onUpdateLocations?: (locations: LocationConfig[]) => void;
  onUpdateCustomerName?: (name: string) => void;
  onUpdateProjectNumber?: (num: string) => void;
}

export function NetworkDiagram({ 
  locations, 
  customerName, 
  projectNumber, 
  darkMode = false, 
  onExportJSON, 
  onRegisterExportPNG,
  language = 'nl',
  onUpdateLocations,
  onUpdateCustomerName,
  onUpdateProjectNumber
}: Props) {
  const t = translations[language];
  const diagramRef = useRef<HTMLDivElement>(null);

  // Custom position offsets from right-click dragging
  const [customOffsets, setCustomOffsets] = useState<Record<string, { x: number; y: number }>>({});
  
  // Custom sizes for routers (scale: 0.5 - 2.5) and clouds (width & height)
  const [customSizes, setCustomSizes] = useState<Record<string, {
    scale?: number;
    width?: number;
    height?: number;
  }>>({});

  const [resizeDragState, setResizeDragState] = useState<{
    id: string;
    type: 'router' | 'cloud' | 'core-cloud';
    startX: number;
    startY: number;
    initialScale: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const hasUserInteracted = useRef(false);
  const autoFitRef = useRef<(force?: boolean) => void>(() => {});
  const [rightDragState, setRightDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const startRightDrag = (id: string, e: React.MouseEvent) => {
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      const current = customOffsets[id] || { x: 0, y: 0 };
      setRightDragState({
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialX: current.x,
        initialY: current.y,
      });
    }
  };

  const startResizeDrag = (
    id: string,
    type: 'router' | 'cloud' | 'core-cloud',
    e: React.MouseEvent,
    initialScale = 1,
    initialWidth = 100,
    initialHeight = 40
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeDragState({
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialScale,
      initialWidth,
      initialHeight,
    });
  };

  const handleStepScale = (id: string, step: number, min = 0.5, max = 2.5) => {
    setCustomSizes(prev => {
      const current = prev[id]?.scale || 1;
      const next = Math.max(min, Math.min(max, Number((current + step).toFixed(1))));
      return {
        ...prev,
        [id]: {
          ...prev[id],
          scale: next
        }
      };
    });
  };

  const handleStepCloudSize = (id: string, baseW: number, baseH: number, deltaW: number, deltaH: number) => {
    setCustomSizes(prev => {
      const currW = prev[id]?.width || baseW;
      const currH = prev[id]?.height || baseH;
      const nextW = Math.max(260, currW + deltaW);
      const nextH = Math.max(100, currH + deltaH);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          width: nextW,
          height: nextH
        }
      };
    });
  };

  const handleResetItemSize = (id: string) => {
    setCustomSizes(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Direct editing helpers
  const handleUpdateLocationName = (locId: string, newName: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(l => l.id === locId ? { ...l, name: newName } : l);
    onUpdateLocations(updated);
  };

  const handleUpdateCpeField = (cpeId: string, field: string, value: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => cpe.id === cpeId ? { ...cpe, [field]: value } : cpe)
    }));
    onUpdateLocations(updated);
  };

  const handleUpdatePbxField = (cpeId: string, pbxId: string, field: string, value: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        return {
          ...cpe,
          pbxs: (cpe.pbxs || []).map(p => p.id === pbxId ? { ...p, [field]: value } : p)
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleAddPbxWithIp = (cpeId: string, ip: string) => {
    if (!onUpdateLocations || !ip) return;
    const cleanIp = ip.trim();
    const currentLoc = locations.find(l => (l.cpes || []).some(c => c.id === cpeId));
    const currentCpe = currentLoc?.cpes?.find(c => c.id === cpeId);
    const validCount = (currentCpe?.pbxs || []).filter(p => p.ip?.trim()).length;
    const newPbx = {
      id: `pbx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `SIP Endpoint ${validCount + 1}`,
      ip: cleanIp,
      brand: 'Overig'
    };
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        const validPbxs = (cpe.pbxs || []).filter(p => p.ip && p.ip.trim());
        return {
          ...cpe,
          pbxs: [...validPbxs, newPbx]
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleUpdateClusterSubnet = (cpeIds: string[], newSubnetStr: string) => {
    if (!onUpdateLocations || !newSubnetStr) return;
    const trimmed = newSubnetStr.trim();
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (!cpeIds.includes(cpe.id)) return cpe;
        return {
          ...cpe,
          lanSubnet: trimmed
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleDeletePbx = (cpeId: string, pbxId: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        return {
          ...cpe,
          pbxs: (cpe.pbxs || []).filter(p => p.id !== pbxId)
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleAddPbx = (cpeId: string) => {
    if (!onUpdateLocations) return;
    const currentLoc = locations.find(l => (l.cpes || []).some(c => c.id === cpeId));
    const currentCpe = currentLoc?.cpes?.find(c => c.id === cpeId);
    const validCount = (currentCpe?.pbxs || []).filter(p => p.ip?.trim()).length;
    const newPbx = {
      id: `pbx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `SIP Endpoint ${validCount + 1}`,
      ip: '',
      brand: 'Overig'
    };
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        const validPbxs = (cpe.pbxs || []).filter(p => p.ip && p.ip.trim());
        return {
          ...cpe,
          pbxs: [...validPbxs, newPbx]
        };
      })
    }));
    onUpdateLocations(updated);
  };

  // Window listeners voor soepel verslepen en formaat aanpassen
  useEffect(() => {
    if (!rightDragState && !resizeDragState) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const currentScale = scaleRef.current || 1;
      
      if (rightDragState) {
        const deltaX = (e.clientX - rightDragState.startX) / currentScale;
        const deltaY = (e.clientY - rightDragState.startY) / currentScale;

        setCustomOffsets(prev => ({
          ...prev,
          [rightDragState.id]: {
            x: Math.round(rightDragState.initialX + deltaX),
            y: Math.round(rightDragState.initialY + deltaY),
          }
        }));
      }

      if (resizeDragState) {
        const deltaX = (e.clientX - resizeDragState.startX) / currentScale;
        const deltaY = (e.clientY - resizeDragState.startY) / currentScale;

        if (resizeDragState.type === 'router') {
          const factor = 1 + (deltaX + deltaY) / 100;
          const newScale = Math.max(0.5, Math.min(2.5, Number((resizeDragState.initialScale * factor).toFixed(2))));
          setCustomSizes(prev => ({
            ...prev,
            [resizeDragState.id]: {
              ...prev[resizeDragState.id],
              scale: newScale
            }
          }));
        } else if (resizeDragState.type === 'cloud' || resizeDragState.type === 'core-cloud') {
          const newWidth = Math.max(260, Math.round(resizeDragState.initialWidth + deltaX * 2));
          const newHeight = Math.max(100, Math.round(resizeDragState.initialHeight + deltaY));
          setCustomSizes(prev => ({
            ...prev,
            [resizeDragState.id]: {
              ...prev[resizeDragState.id],
              width: newWidth,
              height: newHeight
            }
          }));
        }
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.buttons === 0) {
        setRightDragState(null);
      }
      setResizeDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [rightDragState, resizeDragState]);

  const handleResetPositions = () => {
    setCustomOffsets({});
    setCustomSizes({});
    hasUserInteracted.current = false;
    autoFitRef.current(true);
  };

  const effectiveCustomerName = customerName || locations[0]?.customerName || '';
  const effectiveProjectNumber = projectNumber || '';
  
  // Verzamel alle unieke individuele diensten (elke dienst mag maar 1x voorkomen in de titel)
  const allServices = Array.from(
    new Set(
      locations
        .flatMap(loc => loc.cpes || [])
        .map(c => c.serviceType)
        .filter((s): s is NonNullable<typeof s> => Boolean(s && s.trim()))
        .flatMap(s => s.split('+').map(item => item.trim()))
        .filter(Boolean)
    )
  );
  const servicesText = allServices.join(' + ');

  // Titel in de rode bovenbalk: "sIP Design" blijft altijd staan,
  // en eventuele klantgegevens en projectnummer worden daarachter geplaatst.
  const customerParts: string[] = [];
  if (effectiveCustomerName.trim()) {
    customerParts.push(effectiveCustomerName.trim());
  }
  if (effectiveProjectNumber.trim()) {
    customerParts.push(effectiveProjectNumber.trim());
  }

  const headerTitle = customerParts.length > 0
    ? `sIP Design - ${customerParts.join(' - ')}`
    : 'sIP Design';

  const handleExportPNG = useCallback(async () => {
    if (!diagramRef.current) return;
    
    try {
      const dataUrl = await toPng(diagramRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node) => {
          // Filter out buttons from the PNG
          if (node.tagName === 'BUTTON') return false;
          return true;
        }
      });
      
      const link = document.createElement('a');
      // Bestandsnaam bevat ALLEEN klantnaam en projectnummer (diensten weggelaten op verzoek)
      const parts: string[] = [];
      if (effectiveCustomerName.trim()) parts.push(effectiveCustomerName.trim());
      if (effectiveProjectNumber.trim()) parts.push(effectiveProjectNumber.trim());
      if (parts.length === 0) parts.push('SIP-Design');

      const safeTitle = parts.join('_').replace(/[\s/\\:]+/g, '_');
      link.download = `${safeTitle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  }, [effectiveCustomerName, effectiveProjectNumber]);

  useEffect(() => {
    if (onRegisterExportPNG) {
      onRegisterExportPNG(handleExportPNG);
    }
  }, [onRegisterExportPNG, handleExportPNG]);
  
  const totalCpes = locations.reduce((sum, loc) => sum + (loc.cpes?.length || 0), 0);
  const hasContent = Boolean(effectiveCustomerName.trim()) || totalCpes > 0;
  const hasAnyDemarcation = locations.some(loc => Boolean(loc.showDemarcationLine));
  const hasAnyVovCn = locations.some(loc => loc.cpes?.some(c => c.serviceType === 'VOV + CN'));
  const shouldStagger = totalCpes > 2;
  
  // Als VOV+CN geselecteerd is, plaats de CPE's ruimer (540px) zodat beide WAN/LAN reeksen perfect leesbaar zijn en elkaar nooit overlappen
  const CPE_SPACING = hasAnyVovCn ? 540 : 320;
  const baseStartX = shouldStagger ? 180 : 80;

  // Bereken natuurlijke breedtes per locatie op basis van dynamische CPE afmetingen
  const estimatedGroupWidths = locations.map(loc => {
    const cpes = loc.cpes || [];
    if (cpes.length === 0) return 400;
    let locWidth = 0;
    cpes.forEach((cpe, idx) => {
      const ext = getCpeExtents(cpe);
      if (idx === 0) {
        locWidth += ext.leftExtent + 20;
      } else {
        const prevExt = getCpeExtents(cpes[idx - 1]);
        locWidth += prevExt.rightExtent + ext.leftExtent + 60;
      }
    });
    const lastExt = getCpeExtents(cpes[cpes.length - 1]);
    locWidth += lastExt.rightExtent + 60;
    return Math.max(500, locWidth);
  });
  const totalLocationsWidth = estimatedGroupWidths.reduce((a, b) => a + b, 0) + Math.max(0, locations.length - 1) * 100;
  const rawContentWidth = baseStartX + Math.max(700, totalLocationsWidth) + baseStartX;
  
  const customCloudHeights = Object.entries(customSizes)
    .filter(([k]) => k.includes('cluster'))
    .map(([, s]) => s.height || 160);
  const maxCustomCloudHeight = customCloudHeights.length > 0 ? Math.max(160, ...customCloudHeights) : 160;
  const extraCloudHeight = Math.max(0, maxCustomCloudHeight - 160);

  const minWidth = Math.max(1200, rawContentWidth);
  const minDiagramHeight = (shouldStagger ? 1300 : 1000) + extraCloudHeight * 1.5;
  const topBarHeight = 60;
  const minTotalHeight = minDiagramHeight + topBarHeight;
  
  // A4 Landscape aspect ratio (297 / 210)
  const A4_RATIO = 297 / 210;
  
  let finalWidth = minWidth;
  let finalTotalHeight = finalWidth / A4_RATIO;
  
  if (finalTotalHeight < minTotalHeight) {
    finalTotalHeight = minTotalHeight;
    finalWidth = finalTotalHeight * A4_RATIO;
  }
  
  const TOTAL_WIDTH = finalWidth;
  const CONTAINER_HEIGHT = finalTotalHeight - topBarHeight;
  
  const extraHeight = Math.max(0, CONTAINER_HEIGHT - minDiagramHeight);
  
  const CORE_Y = 100 + extraHeight * 0.1;
  const ROUTER_Y = 220 + extraHeight * 0.25;
  const CPE_Y = 460 + extraHeight * 0.55;
  const STAGGER_OFFSET = shouldStagger ? (280 + extraHeight * 0.35) : 0;
  
  const LAN_Y_OFFSET = 95 + extraHeight * 0.02;
  const GW_Y_OFFSET = 120 + extraHeight * 0.05;
  const PBX_Y_OFFSET = 190 + extraHeight * 0.08;
  
  // Calculate horizontal offset to center the network graph
  const xOffset = (TOTAL_WIDTH - rawContentWidth) / 2;
  let currentX = baseStartX + Math.max(0, xOffset); 
  let globalCpeIndex = 0;
  
  const groups = locations.map((loc, groupIdx) => {
    const locName = loc.locationName || 'Onbekende Locatie';
    const showDemarcationLine = Boolean(loc.showDemarcationLine);
    const cpes = loc.cpes;
    
    // Determine LAN subnet clusters for CPEs in this location
    const cpeClusterMap = new Map<string, number>();
    let nextClusterId = 0;

    cpes.forEach((cpe) => {
      if (cpeClusterMap.has(cpe.id)) return;
      cpeClusterMap.set(cpe.id, nextClusterId);
      
      cpes.forEach((other) => {
        if (!cpeClusterMap.has(other.id) && areCpesInSameLanSubnet(cpe, other)) {
          cpeClusterMap.set(other.id, nextClusterId);
        }
      });
      nextClusterId++;
    });

    // Bereken dynamische afmetingen en posities per cluster met gegarandeerde tussenruimte
    const clusterMetaList: {
      cId: number;
      cpeIds: string[];
      width: number;
      yOffset: number;
      startX: number;
      cpeRelXList: number[];
    }[] = [];

    const groupStartX = currentX;
    let clusterCurrentX = groupStartX;

    for (let cId = 0; cId < nextClusterId; cId++) {
      const clusterCpeItems = cpes.filter(c => cpeClusterMap.get(c.id) === cId);
      const k = clusterCpeItems.length;
      
      // Bepaal de relatieve posities van de CPE's binnen dit cluster
      const cpeRelXList: number[] = [];
      let currentRel = 0;
      clusterCpeItems.forEach((cpeItem, idx) => {
        const ext = getCpeExtents(cpeItem);
        if (idx === 0) {
          currentRel = ext.leftExtent + 20;
          cpeRelXList.push(currentRel);
        } else {
          const prevExt = getCpeExtents(clusterCpeItems[idx - 1]);
          // Afstand tussen CPE's = rechterbereik van vorige + linkerbereik van huidige + 60px marge
          const spacing = prevExt.rightExtent + ext.leftExtent + 60;
          currentRel += spacing;
          cpeRelXList.push(currentRel);
        }
      });

      const lastExt = getCpeExtents(clusterCpeItems[k - 1]);
      const clusterWidth = currentRel + lastExt.rightExtent + 40;
      const yOffset = shouldStagger ? (globalCpeIndex % 2) * STAGGER_OFFSET : 0;
      globalCpeIndex++;

      const startX = clusterCurrentX;
      clusterCurrentX += clusterWidth + 100; // 100px tussen verschillende clusters

      clusterMetaList.push({
        cId,
        cpeIds: clusterCpeItems.map(c => c.id),
        width: clusterWidth,
        yOffset,
        startX,
        cpeRelXList
      });
    }

    const groupWidth = clusterCurrentX - groupStartX;
    currentX = clusterCurrentX + 80; // 80px tussen verschillende locaties
    
    const mappedCpes = cpes.map((cpe) => {
      const clusterId = cpeClusterMap.get(cpe.id) ?? 0;
      const clusterMeta = clusterMetaList.find(m => m.cId === clusterId)!;
      const clusterCpeIds = clusterMeta.cpeIds;
      const indexInCluster = clusterCpeIds.indexOf(cpe.id);

      const cloudId = `loc-${loc.id || groupIdx}-cluster-${clusterId}`;
      const cloudOffset = customOffsets[`cloud-${cloudId}`] || { x: 0, y: 0 };
      const cpeOffset = customOffsets[`cpe-${cpe.id}`] || { x: 0, y: 0 };

      // Gezamenlijke verticale en horizontale offset: CPE en wolk bewegen synchroon
      const clusterXOffset = cloudOffset.x + cpeOffset.x;
      const clusterYOffset = cloudOffset.y + cpeOffset.y;

      // Horizontale positie van de CPE
      const baseCpeX = clusterMeta.startX + clusterMeta.cpeRelXList[indexInCluster];
      const cpeX = baseCpeX + clusterXOffset;
      const yOffset = clusterMeta.yOffset + clusterYOffset;
      
      const cidr = getCidrFromSubnetString(cpe.lanSubnet) ?? 24;
      const clusterCpesAll = loc.cpes || [];
      const subnetIpMatch = (cpe.lanSubnet || '').match(/(\d+\.\d+\.\d+\.\d+)/);
      const subnetIp = subnetIpMatch && isValidIPv4(subnetIpMatch[1]) ? subnetIpMatch[1] : '';

      const effectiveLanIp = 
        (cpe.serviceType === 'CN' && isValidIPv4(cpe.cnLanIp) ? cpe.cnLanIp.trim() : '') ||
        (isValidIPv4(cpe.lanIpCpe) ? cpe.lanIpCpe.trim() : '') ||
        (isValidIPv4(cpe.defaultGateway) ? cpe.defaultGateway.trim() : '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.lanIpCpe))?.lanIpCpe?.trim() || '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.cnLanIp))?.cnLanIp?.trim() || '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.defaultGateway))?.defaultGateway?.trim() || '') ||
        subnetIp ||
        '192.168.1.1';
      
      const rawPbxs = cpe.pbxs || [];
      const validPbxs: any[] = [];
      const emptyPbxs: any[] = [];

      rawPbxs.forEach((pbx, pbxIndex) => {
        const cleanIp = (pbx.ip || '').trim().split('/')[0].split(':')[0].trim();
        const hasIp = Boolean(cleanIp && isValidIPv4(cleanIp));
        if (hasIp) {
          validPbxs.push({ ...pbx, ip: cleanIp, originalIndex: pbxIndex });
        } else {
          emptyPbxs.push({ ...pbx, ip: '', originalIndex: pbxIndex });
        }
      });

      const localPbxs: any[] = [];
      const routedPbxs: any[] = [];

      validPbxs.forEach(pbx => {
        if (!isInSameSubnet(effectiveLanIp, pbx.ip, cidr)) {
          // Ligt buiten het LAN segment -> Achter de gateway!
          routedPbxs.push(pbx);
        } else {
          // Ligt binnen het LAN segment -> Lokaal aan de wolk
          localPbxs.push(pbx);
        }
      });

      // Gebruikerswens:
      // "als ik maar 1 sip endpoint opgeef dmv ip adres en dan zit buiten het lan segment dus over de gateway routeren dan meot het default en nog niet ingevulde endpoint verdwijnen tot ik een nieuw endpoint wil hebben"
      // Als er ten minste 1 geldig endpoint is geconfigureerd en er zijn geen nieuw aangevraagde lege endpoints,
      // dan verdwijnt het default niet-ingevulde endpoint volledig!
      if (validPbxs.length === 0) {
        if (emptyPbxs.length > 0) {
          localPbxs.push(emptyPbxs[0]);
        }
      } else {
        // Als de gebruiker expliciet via "+ Endpoint" een nieuw leeg endpoint heeft aangevraagd
        emptyPbxs.forEach(ep => {
          localPbxs.push(ep);
        });
      }

      const isVovCn = cpe.serviceType === 'VOV + CN';
      const hasGw = Boolean(cpe.defaultGateway && cpe.defaultGateway.trim()) || routedPbxs.length > 0;
      
      // Gateway basispositie gekoppeld aan cpeX, beweegt mee met de cluster maar kan ook individueel versleept worden
      const baseGwLeft = cpeX + (isVovCn ? 280 : 190);
      const gwOffset = customOffsets[`gw-${cpe.id}`] || { x: 0, y: 0 };
      const gwLeft = baseGwLeft + gwOffset.x;
      const gwYOffset = yOffset + gwOffset.y;
      const gatewayCenterX = gwLeft + 35;

      // Lokale PBX'en onder de CPE (basispositie gekoppeld aan cpeX, elk onafhankelijk versleepbaar)
      const localCount = localPbxs.length;
      const baseLocalCenter = hasGw ? (cpeX - 35) : cpeX;
      const baseLocalStartX = baseLocalCenter - Math.max(0, localCount - 1) * 140 / 2;
      
      const mappedLocalPbxs = localPbxs.map((pbx, idx) => {
        const pbxOffset = customOffsets[`pbx-local-${pbx.id}`] || { x: 0, y: 0 };
        return {
          ...pbx,
          x: baseLocalStartX + idx * 140 + pbxOffset.x,
          y: CPE_Y + PBX_Y_OFFSET + yOffset + pbxOffset.y
        };
      });

      const dummyOffset = customOffsets[`pbx-dummy-${cpe.id}`] || { x: 0, y: 0 };
      const dummyLocalX = baseLocalCenter + dummyOffset.x;
      const dummyLocalY = CPE_Y + PBX_Y_OFFSET + yOffset + dummyOffset.y;

      // Gerouteerde PBX'en recht onder de Gateway (elk onafhankelijk versleepbaar)
      const routedCount = routedPbxs.length;
      const baseGatewayCenterX = gatewayCenterX;
      const baseRoutedStartX = baseGatewayCenterX - Math.max(0, routedCount - 1) * 140 / 2;

      const mappedRoutedPbxs = routedPbxs.map((pbx, idx) => {
        const routedOffset = customOffsets[`pbx-routed-${pbx.id}`] || { x: 0, y: 0 };
        return {
          ...pbx,
          x: baseRoutedStartX + idx * 140 + routedOffset.x,
          y: CPE_Y + GW_Y_OFFSET + 75 + yOffset + routedOffset.y
        };
      });
      
      return { 
        ...cpe, 
        baseCpeX,
        cpeX, 
        yOffset,
        clusterId,
        gwLeft,
        gwYOffset,
        gwY: CPE_Y + GW_Y_OFFSET + gwYOffset,
        gatewayCenterX, 
        hasGw,
        mappedLocalPbxs, 
        mappedRoutedPbxs,
        hasDummyLocal: false,
        dummyLocalX,
        dummyLocalY
      };
    });

    // Build lanClusters: De wolk omsluit altijd alle CPE's en volgt hun posities
    const lanClusters: {
      id: string;
      cpeIds: string[];
      minX: number;
      maxX: number;
      centerX: number;
      width: number;
      height: number;
      subnetLabel: string;
      yOffset: number;
      isMulti: boolean;
    }[] = [];

    for (let cId = 0; cId < nextClusterId; cId++) {
      const meta = clusterMetaList.find(m => m.cId === cId)!;
      const clusterCpes = mappedCpes.filter(c => c.clusterId === cId);
      if (clusterCpes.length === 0) continue;

      const cloudId = `loc-${loc.id || groupIdx}-cluster-${cId}`;
      const cloudOffset = customOffsets[`cloud-${cloudId}`] || { x: 0, y: 0 };

      // Verzamel eventuele verticale verplaatsing van CPE's in dit cluster zodat de wolk meebeweegt
      const cpeVertDrag = clusterCpes.reduce((max, c) => {
        const off = customOffsets[`cpe-${c.id}`]?.y || 0;
        return Math.abs(off) > Math.abs(max) ? off : max;
      }, 0);
      const clusterCloudYOffset = meta.yOffset + cloudOffset.y + cpeVertDrag;

      // Gebruik de actuele cpeX van de CPE's zodat de wolk altijd perfect onder de CPE's blijft
      const minX = Math.min(...clusterCpes.map(c => c.cpeX));
      const maxX = Math.max(...clusterCpes.map(c => c.cpeX));
      const isMulti = clusterCpes.length > 1;
      
      const cloudLeft = minX - 190;
      const lastCpe = clusterCpes[clusterCpes.length - 1];
      const cloudRight = maxX + (lastCpe.serviceType === 'VOV + CN' ? 240 : 190);
      const defaultWidth = Math.max(380, cloudRight - cloudLeft);
      const customCloud = customSizes[cloudId];
      const width = customCloud?.width || defaultWidth;
      const height = customCloud?.height || 160;
      const centerX = (cloudLeft + cloudRight) / 2;

      const firstWithValidIp = clusterCpes.find(c => {
        const ip = (c.serviceType === 'CN' && c.cnLanIp) ? c.cnLanIp : c.lanIpCpe;
        return isValidIPv4(ip);
      });

      let subnetLabel = clusterCpes[0]?.lanSubnet || 'xxx.xxx.xxx.0/24';
      if (firstWithValidIp) {
        const ip = (firstWithValidIp.serviceType === 'CN' && firstWithValidIp.cnLanIp) ? firstWithValidIp.cnLanIp : firstWithValidIp.lanIpCpe;
        const cidr = getCidrFromSubnetString(firstWithValidIp.lanSubnet);
        if (cidr !== null) {
          const netAddr = getSubnetNetworkAddress(ip, cidr);
          subnetLabel = `${netAddr}/${cidr}`;
        }
      }

      lanClusters.push({
        id: cloudId,
        cpeIds: clusterCpes.map(c => c.id),
        minX,
        maxX,
        centerX,
        width,
        height,
        subnetLabel,
        yOffset: clusterCloudYOffset,
        isMulti
      });
    }

    // SLUIT ALLE CPE's PERMANENT EN EXACT AAN OP DE BOVENRAND VAN DE WOLK
    mappedCpes.forEach(cpe => {
      const cluster = lanClusters.find(cl => cl.id === `loc-${loc.id || groupIdx}-cluster-${cpe.clusterId}`);
      if (cluster) {
        const cpeKey = `cpe-${cpe.id}`;
        const cpeScale = customSizes[cpeKey]?.scale || 1;
        const cpeHeight = 40 * cpeScale;

        // Bepaal de exacte bovenrand van de wolk op de horizontale x-positie van deze CPE
        const cloudBorderY = getCloudTopY(cluster, cpe.cpeX, CPE_Y);
        // De Mediant is cpeHeight px hoog. De onderzijde rust exact 5px in de wolkboog (geen kier!)
        const exactCpeTopY = cloudBorderY - (cpeHeight - 5);
        cpe.yOffset = exactCpeTopY - CPE_Y;

        // Synchroniseer Gateway en PBX Y-posities direct met de onderzijde van de wolk
        const LOCAL_PBX_GAP = 28;
        cpe.mappedLocalPbxs.forEach((pbx: any) => {
          const pbxOffset = customOffsets[`pbx-local-${pbx.id}`] || { x: 0, y: 0 };
          const cloudBottom = getCloudBottomY(cluster, pbx.x, CPE_Y);
          // Voldoende ruimte tussen de onderrand van de wolk en het SIP Endpoint icoon (met nette verbindingslijn)
          pbx.y = cloudBottom + LOCAL_PBX_GAP + pbxOffset.y;
        });
        const dummyOffset = customOffsets[`pbx-dummy-${cpe.id}`] || { x: 0, y: 0 };
        const dummyCloudBottom = getCloudBottomY(cluster, cpe.dummyLocalX, CPE_Y);
        cpe.dummyLocalY = dummyCloudBottom + LOCAL_PBX_GAP + dummyOffset.y;

        // Bepaal de onderrand van de wolk op de horizontale x-positie van de Default Gateway
        const gwCloudBottom = getCloudBottomY(cluster, cpe.gatewayCenterX, CPE_Y);
        const gwOffset = customOffsets[`gw-${cpe.id}`] || { x: 0, y: 0 };
        const GW_GAP = 28;
        // Gateway bevindt zich netjes onder de rand van de wolk, exact zoals de lokale PBX, en volgt schaalwijzigingen van de wolk
        cpe.gwY = gwCloudBottom + GW_GAP + gwOffset.y;

        cpe.mappedRoutedPbxs.forEach((pbx: any) => {
          const routedOffset = customOffsets[`pbx-routed-${pbx.id}`] || { x: 0, y: 0 };
          // Gerouteerde PBX'en hangen direct onder de Default Gateway
          pbx.y = cpe.gwY + 70 + routedOffset.y;
        });
      }
    });
    
    const routerOffset = customOffsets[`router-${loc.id || groupIdx}`] || { x: 0, y: 0 };
    const routerKey = `router-${loc.id || groupIdx}`;
    const routerScale = customSizes[routerKey]?.scale || 1;
    const routerWidth = 100 * routerScale;
    const routerHeight = 40 * routerScale;

    // Router basispositie gebaseerd op baseCpeX (Mediant verslepen verschuift router niet)
    const baseRouterX = mappedCpes.length > 0 
      ? mappedCpes.reduce((acc, c) => acc + c.baseCpeX, 0) / mappedCpes.length 
      : groupStartX + (groupWidth > 0 ? groupWidth / 2 : 200);
    const routerX = baseRouterX + routerOffset.x;
    const routerYOffset = routerOffset.y;
    
    return { locId: loc.id || `loc-${groupIdx}`, groupIdx, locName, showDemarcationLine, cpes: mappedCpes, lanClusters, groupStartX, groupWidth, routerX, routerYOffset, routerScale, routerWidth, routerHeight };
  });

  // Pan and Zoom State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { positionRef.current = position; }, [position]);

  // Auto-fit and centering logic with robust bounds checking
  const autoFitDiagram = useCallback((force = false) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const fitScale = Math.max(0.1, Math.min(1, rect.width / TOTAL_WIDTH, rect.height / CONTAINER_HEIGHT) * 0.95);
    if (isNaN(fitScale) || fitScale <= 0) return;

    if (force || !hasUserInteracted.current || scaleRef.current <= 0.1) {
      setScale(fitScale);
      const initialX = (rect.width - TOTAL_WIDTH * fitScale) / 2;
      const initialY = (rect.height - CONTAINER_HEIGHT * fitScale) / 2;
      setPosition({ x: initialX, y: initialY });
    }
  }, [TOTAL_WIDTH, CONTAINER_HEIGHT]);

  useEffect(() => {
    autoFitRef.current = autoFitDiagram;
  }, [autoFitDiagram]);

  // Initial and Resize Auto-fit with ResizeObserver and window resize listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Run immediately and in the next animation frame to guarantee layout completion
    autoFitDiagram();
    const rafId = requestAnimationFrame(() => {
      autoFitDiagram();
    });

    const ro = new ResizeObserver(() => {
      autoFitDiagram();
    });
    ro.observe(container);

    const handleWindowResize = () => {
      autoFitDiagram();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [autoFitDiagram]);

  // Automatically auto-fit when locations or CPEs change (unless user manually panned/zoomed)
  useEffect(() => {
    if (!hasUserInteracted.current) {
      autoFitDiagram(true);
    }
  }, [locations, totalCpes, autoFitDiagram]);

  // Handle Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      hasUserInteracted.current = true;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; 
      const currentScale = scaleRef.current;
      let newScale = currentScale * zoomFactor;
      newScale = Math.min(Math.max(0.1, newScale), 5);
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x, y } = positionRef.current;

      const newX = mouseX - (mouseX - x) * (newScale / currentScale);
      const newY = mouseY - (mouseY - y) * (newScale / currentScale);

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging if clicking buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    hasUserInteracted.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const lineColor = '#94a3b8';
  const routedLineColor = '#94a3b8';

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-slate-200'}`}>
      {/* Fixed Toolbar with Reset Positions Button */}
      {hasContent && Object.keys(customOffsets).length > 0 && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={handleResetPositions}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-md border border-slate-300 transition-colors"
            title={t.resetPositionsTooltip}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.resetPositions}</span>
          </button>
        </div>
      )}

      {/* Interactive Pan/Zoom Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: TOTAL_WIDTH,
            height: CONTAINER_HEIGHT,
            transition: isDragging ? 'none' : 'transform 0.05s linear'
          }}
        >
          {/* THE DESIGN SHEET: Always remains in the pristine Light Schema */}
          <div 
            ref={diagramRef} 
            className="bg-white flex flex-col relative shadow-2xl border border-slate-300 font-sans shrink-0 w-full h-full"
          >
            {/* Customer Top Bar */}
            <div className="h-[60px] bg-[#E60000] flex items-center justify-between px-6 z-20 shrink-0 w-full">
              <div className="flex items-center gap-3">
                <div className="text-white text-2xl font-medium tracking-tight flex items-center gap-2">
                  <span className="font-semibold">sIP Design</span>
                  <span className="text-white/60 font-light">-</span>
                  <InlineEdit 
                    value={effectiveCustomerName} 
                    placeholder="Klantnaam" 
                    onSave={(val) => {
                      if (onUpdateCustomerName) onUpdateCustomerName(val);
                    }}
                    className="text-white hover:bg-white/20 hover:text-white hover:ring-white/50"
                    inputClassName="text-slate-900 text-lg font-medium"
                    title="Klik om klantnaam direct in het ontwerp aan te passen"
                  />
                  {(effectiveProjectNumber || onUpdateProjectNumber) && (
                    <>
                      <span className="text-white/60 font-light">-</span>
                      <InlineEdit 
                        value={effectiveProjectNumber} 
                        placeholder="Projectnummer" 
                        onSave={(val) => {
                          if (onUpdateProjectNumber) onUpdateProjectNumber(val);
                        }}
                        className="text-white/90 hover:bg-white/20 hover:text-white hover:ring-white/50 text-xl font-light"
                        inputClassName="text-slate-900 text-base"
                        title="Klik om projectnummer direct in het ontwerp aan te passen"
                      />
                    </>
                  )}
                </div>
              </div>
              {servicesText && (
                <div className="text-white/90 text-sm font-semibold bg-white/15 px-3 py-1 rounded-full border border-white/20 select-none">
                  {servicesText}
                </div>
              )}
            </div>

        {/* Diagram Area (Light Schema) */}
        <div className="relative w-full bg-transparent overflow-hidden shrink-0 z-10"
             style={{
               height: `${CONTAINER_HEIGHT}px`,
               backgroundImage: rightDragState ? 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)' : 'none',
               backgroundSize: '20px 20px'
             }}>

          {totalCpes === 0 && (
            <div className="absolute inset-0 top-[260px] flex flex-col items-center justify-center pointer-events-none text-slate-400 z-30">
              <Network className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
              <span className="font-semibold text-sm text-slate-600">{t.noCpesYet}</span>
              <span className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                {t.noCpesDesc}
              </span>
            </div>
          )}
          
          {/* SVG CONNECTION LINES */}
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
            {groups.map(group => (
              group.cpes.map(cpe => (
                <line 
                  key={`line-${cpe.id}`} 
                  x1={group.routerX} 
                  y1={ROUTER_Y + group.routerYOffset + 40} 
                  x2={cpe.cpeX} 
                  y2={CPE_Y + cpe.yOffset} 
                  stroke={lineColor} 
                  strokeWidth="2" 
                />
              ))
            ))}
            {groups.flatMap(g => g.cpes).map(cpe => {
              if (!cpe.hasGw) return null;
              
              // Vind bijbehorende LAN cluster voor het aansluitpunt
              const parentGroup = groups.find(g => g.cpes.some(c => c.id === cpe.id));
              const cluster = parentGroup?.lanClusters.find(cl => cl.cpeIds.includes(cpe.id));
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
            {groups.flatMap(g => g.cpes).flatMap(cpe => {
               const lines = [];
               const parentGroup = groups.find(g => g.cpes.some(c => c.id === cpe.id));
               const cluster = parentGroup?.lanClusters.find(cl => cl.cpeIds.includes(cpe.id));

               cpe.mappedLocalPbxs.forEach(pbx => {
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
               cpe.mappedRoutedPbxs.forEach(pbx => {
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

          {/* IP Voice Core Ellipse */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 h-[120px] border border-blue-500 border-dashed rounded-[100%] flex items-center justify-center z-10"
            style={{ 
              top: CORE_Y, 
              width: `${Math.max(800, TOTAL_WIDTH - 200)}px`,
              backgroundColor: 'rgba(147, 197, 253, 0.35)'
            }}
          >
            <span className="text-4xl text-slate-800 font-light select-none pointer-events-none">IP Voice core</span>
            {/* SBC Cluster Node (AudioCodes Mediant™ 4000B conform geüploade hardware-afbeelding) */}
            {(() => {
              const sbcScale = customSizes['sbc-cluster']?.scale || 1;
              return (
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
                    {t.sbcCluster || 'SBC Cluster'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Nodes grouped by Location */}
          {groups.map((group, groupIdx) => (
            <React.Fragment key={`group-${groupIdx}`}>
              {/* Core Router (gewone enterprise netwerkrouter, geen wireless) */}
              <div 
                className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/node" 
                style={{ top: ROUTER_Y + group.routerYOffset, left: group.routerX, transform: 'translateX(-50%)' }}
                onMouseDown={e => startRightDrag(`router-${group.locId || groupIdx}`, e)}
                onContextMenu={e => e.preventDefault()}
              >
                <div className="relative">
                  <CoreRouterSvg width={group.routerWidth} height={group.routerHeight} />
                  <div 
                    onMouseDown={(e) => startResizeDrag(`router-${group.locId || groupIdx}`, 'router', e, group.routerScale, 100, 40)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleResetItemSize(`router-${group.locId || groupIdx}`);
                    }}
                    className="opacity-0 group-hover/node:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
                    title="Sleep om router te vergroten of verkleinen (dubbelklik voor 100%)"
                  >
                    ⤡
                  </div>
                  {resizeDragState?.id === `router-${group.locId || groupIdx}` && (
                    <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
                      {Math.round(group.routerScale * 100)}%
                    </div>
                  )}
                </div>
                {/* Locatienaam bij de hoofdrouter per locatie - DIRECT BEWERKBAAR */}
                <div className="absolute -bottom-8 flex flex-col items-center z-30">
                  <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm hover:border-blue-400">
                    <InlineEdit 
                      value={group.locName} 
                      placeholder="Locatienaam" 
                      onSave={(val) => handleUpdateLocationName(group.locId, val)}
                      title="Klik om locatienaam direct aan te passen"
                    />
                  </span>
                </div>
              </div>

              {/* Customer LAN Wolken per subnet cluster in deze locatie (grenst direct aan de CPE's) */}
              {group.lanClusters.map(cluster => (
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
                      <span className="text-blue-900 text-xs font-bold tracking-tight bg-white/95 px-3 py-0.5 rounded-full border border-blue-200 shadow-xs mb-1">
                        {t.customerLan || 'Customer LAN (SIP)'}
                      </span>
                      <span className="text-red-600 font-extrabold text-sm drop-shadow-xs bg-white/80 px-2 py-0.5 rounded border border-blue-200/50">
                        <InlineEdit 
                          value={cluster.subnetLabel} 
                          placeholder="Subnet (bijv. 192.168.1.0/24)" 
                          onSave={(val) => handleUpdateClusterSubnet(cluster.cpeIds, val)}
                          title="Klik om LAN subnet direct in het ontwerp aan te passen"
                          className="text-red-600 font-extrabold text-sm"
                          inputClassName="text-red-700 font-bold text-center"
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
                </React.Fragment>
              ))}
              
              {/* Demarcatielijn per locatie, past zich automatisch aan de positie van de Mediant(s) aan bij verplaatsen */}
              {group.showDemarcationLine && group.cpes.length > 0 && (() => {
                // Groepeer op Y-hoogte zodat bij verplaatsen van een Mediant de demarcatielijn exact op Mediant-hoogte meebeweegt
                const yGroups = new Map<number, typeof group.cpes>();
                group.cpes.forEach(cpe => {
                  const yVal = CPE_Y + cpe.yOffset + 20;
                  let matchedY: number | null = null;
                  for (const existingY of yGroups.keys()) {
                    if (Math.abs(existingY - yVal) <= 15) {
                      matchedY = existingY;
                      break;
                    }
                  }
                  const finalY = matchedY ?? yVal;
                  const list = yGroups.get(finalY) || [];
                  list.push(cpe);
                  yGroups.set(finalY, list);
                });

                return Array.from(yGroups.entries()).map(([demY, cpesAtY], idx) => {
                  const minX = Math.min(...cpesAtY.map(c => c.cpeX));
                  const maxX = Math.max(...cpesAtY.map(c => c.cpeX));
                  const demLeft = minX - 220;
                  const demWidth = (maxX - minX) + 440;
                  return (
                    <div 
                      key={`dem-${group.locId || groupIdx}-${idx}`}
                      className="absolute pointer-events-none z-25 flex items-center" 
                      style={{ 
                        top: demY, 
                        left: demLeft, 
                        width: `${demWidth}px`
                      }}
                    >
                      <div className="w-full border-t-2 border-dashed border-red-500 shadow-xs" />
                    </div>
                  );
                });
              })()}

              {/* CPEs for this Location */}
              {group.cpes.map(cpe => {
                const mediantLabel = cpe.hostname || 'Mediant';
                const cpeKey = `cpe-${cpe.id}`;
                const cpeScale = customSizes[cpeKey]?.scale || 1;
                const cpeWidth = 100 * cpeScale;
                const cpeHeight = 40 * cpeScale;

                return (
                <React.Fragment key={cpe.id}>
                  {/* CPE Mediant Voice Router (geen wireless, 4 routing pijlen + voice telefoon badge) */}
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
                          <InlineEdit 
                            value={cpe.hostname || 'Mediant'} 
                            placeholder="Hostname" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'hostname', val)}
                            title="Klik om Mediant naam direct aan te passen"
                          />
                        </span>
                        <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-sm shadow-sm hover:bg-blue-700">
                          <InlineEdit 
                            value={cpe.serviceType || 'Dienst'} 
                            placeholder="Dienst" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'serviceType', val)}
                            title="Klik om type dienst direct aan te passen (VOV, CN, VOV + CN)"
                            className="text-white hover:text-white"
                            inputClassName="text-slate-900 font-bold"
                          />
                        </span>
                      </div>
                    </div>
                    {/* IP Info labels: Links van Mediant - DIRECT BEWERKBAAR */}
                    {(() => {
                      const service = cpe.serviceType || '';
                      let servicePrefix = '';
                      if (service === 'CN') servicePrefix = 'CN ';
                      else if (service.startsWith('VOV')) servicePrefix = 'VOV ';

                      if (service === 'CN') {
                        return (
                          <div className="absolute top-0 -left-[185px] text-right whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30 flex flex-col items-end">
                            <div className="text-blue-700 font-bold text-[11px] leading-tight pb-0.5 flex items-center gap-1">
                              <span>CN WAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.cnWanIp || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
                                title="Klik om CN WAN IP direct aan te passen"
                                className="text-blue-700 font-mono font-bold"
                              />
                            </div>
                            <div className="text-blue-700 font-bold text-[11px] leading-tight pt-0.5 flex items-center gap-1">
                              <span>CN LAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.cnLanIp || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'cnLanIp', val)} 
                                title="Klik om CN LAN IP direct aan te passen"
                                className="text-blue-700 font-mono font-bold"
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="absolute top-0 -left-[185px] text-right whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30 flex flex-col items-end">
                          <div className="text-red-800 font-bold text-[11px] leading-tight pb-0.5 flex items-center gap-1">
                            <span>{servicePrefix}WAN:</span>
                            <InlineEdit 
                              isIp 
                              value={cpe.wanIp || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdateCpeField(cpe.id, 'wanIp', val)} 
                              title="Klik om WAN IP direct aan te passen"
                              className="text-red-800 font-mono font-bold"
                            />
                          </div>
                          <div className="text-red-800 font-bold text-[11px] leading-tight pt-0.5 flex items-center gap-1">
                            <span>{servicePrefix}LAN:</span>
                            <InlineEdit 
                              isIp 
                              value={cpe.lanIpCpe || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdateCpeField(cpe.id, 'lanIpCpe', val)} 
                              title="Klik om LAN IP direct aan te passen"
                              className="text-red-800 font-mono font-bold"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* IP Info labels: Rechts van Mediant (alleen bij combidienst met CN: VOV + CN) - DIRECT BEWERKBAAR */}
                    {cpe.serviceType === 'VOV + CN' && (
                      <div className="absolute top-0 left-[110px] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30 flex flex-col items-start">
                        <div className="text-blue-700 font-bold text-[11px] leading-tight pb-0.5 flex items-center gap-1">
                          <span>CN WAN:</span>
                          <InlineEdit 
                            isIp 
                            value={cpe.cnWanIp || ''} 
                            placeholder="xxx.xxx.xxx.xxx" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
                            title="Klik om CN WAN IP direct aan te passen"
                            className="text-blue-700 font-mono font-bold"
                          />
                        </div>
                        <div className="text-blue-700 font-bold text-[11px] leading-tight pt-0.5 flex items-center gap-1">
                          <span>CN LAN:</span>
                          <InlineEdit 
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
                         <InlineEdit 
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
                  
                  {/* SIP Endpoints (Lokaal - sluiten naadloos aan op onderzijde van de Customer LAN wolk) */}
                  {cpe.mappedLocalPbxs.map((pbx: any) => {
                    const endpointTitle = cpe.serviceType ? `SIP Endpoint ${cpe.serviceType}` : 'SIP Endpoint';
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
                           <InlineEdit 
                             value={pbx.name || endpointTitle} 
                             placeholder="Endpoint" 
                             onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                             title="Klik om naam van dit endpoint direct aan te passen"
                             className="text-blue-800 font-bold text-[10px]"
                           />
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePbx(cpe.id, pbx.id);
                             }}
                             title="Verwijder dit endpoint"
                             className="opacity-0 group-hover/pbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
                           >
                             ×
                           </button>
                         </div>
                         <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 flex items-center">
                            <InlineEdit 
                              isIp 
                              value={pbx.ip || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'ip', val)} 
                              title="Klik om IP adres direct in te voeren of aan te passen"
                              className="text-red-800 font-mono font-bold text-[11px]"
                            />
                         </div>
                      </div>
                    );
                  })}
                  {/* Als er geen enkel lokaal endpoint is (bijvoorbeeld omdat het endpoint buiten het LAN over de gateway routeert),
                      verdwijnt het default niet-ingevulde endpoint en verschijnt een discrete toevoegknop */}
                  {cpe.mappedLocalPbxs.length === 0 && (
                    <div 
                      className="absolute flex flex-col items-center z-20 pointer-events-auto" 
                      style={{ top: cpe.dummyLocalY, left: cpe.dummyLocalX, transform: 'translateX(-50%)' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleAddPbx(cpe.id)}
                        title="Klik om een nieuw SIP Endpoint toe te voegen"
                        className="text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-500 rounded-full px-3 py-1 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer select-none"
                      >
                        <span className="text-base font-bold leading-none text-blue-600">+</span>
                        <span>{t.addEndpoint || 'Endpoint toevoegen'}</span>
                      </button>
                    </div>
                  )}
                  {cpe.mappedRoutedPbxs.map((pbx: any) => {
                    const routedTitle = cpe.serviceType ? `Routed SIP Endpoint ${cpe.serviceType}` : 'Routed SIP Endpoint';
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
                           <InlineEdit 
                             value={pbx.name || routedTitle} 
                             placeholder="Routed Endpoint" 
                             onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                             title="Klik om naam van dit gerouteerde endpoint aan te passen"
                             className="text-amber-700 font-bold text-[10px]"
                           />
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePbx(cpe.id, pbx.id);
                             }}
                             title="Verwijder dit endpoint"
                             className="opacity-0 group-hover/routedpbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
                           >
                             ×
                           </button>
                         </div>
                         <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded border border-amber-300 shadow-xs flex items-center">
                            <InlineEdit 
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
                </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legenda (zichtbaar in diagram én op de geëxporteerde PDF) */}
        {hasAnyDemarcation && (
          <div className="absolute bottom-4 left-6 z-30 bg-white border border-slate-300 rounded-lg px-4 py-2 shadow-md flex items-center gap-3 select-none">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.legend}
            </span>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-8 border-t-2 border-dashed border-red-500"></div>
              <span className="text-xs font-bold text-slate-700">
                {t.demarcationLineLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {t.demarcationDomainDesc}
              </span>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
