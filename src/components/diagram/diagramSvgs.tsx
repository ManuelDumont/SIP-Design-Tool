import React from 'react';

// Standaard IP Netwerkrouter (geen wireless antennes, 4 routing pijlen)
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
export function VoiceRouterSvg({ width = 100, height = 40 }: { width?: number; height?: number }) {
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
export function PbxIcon({ width = 48, height = 48, isRouted = false }: { width?: number; height?: number; isRouted?: boolean }) {
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

// Firewall Icoon (voor o.a. Esprit Multicustomer architectuur)
export function FirewallSvg({ width = 54, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 54 40" className="overflow-visible select-none drop-shadow-md">
      <defs>
        <linearGradient id="fwWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      {/* Brick Wall body */}
      <rect x="2" y="2" width="50" height="36" rx="4" fill="url(#fwWallGrad)" stroke="#7f1d1d" strokeWidth="2" />
      {/* Mortar horizontal lines */}
      <line x1="2" y1="14" x2="52" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="2" y1="26" x2="52" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      {/* Vertical brick lines Row 1 */}
      <line x1="18" y1="2" x2="18" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="36" y1="2" x2="36" y2="14" stroke="#fecaca" strokeWidth="1.5" />
      {/* Vertical brick lines Row 2 */}
      <line x1="10" y1="14" x2="10" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="27" y1="14" x2="27" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="44" y1="14" x2="44" y2="26" stroke="#fecaca" strokeWidth="1.5" />
      {/* Vertical brick lines Row 3 */}
      <line x1="18" y1="26" x2="18" y2="38" stroke="#fecaca" strokeWidth="1.5" />
      <line x1="36" y1="26" x2="36" y2="38" stroke="#fecaca" strokeWidth="1.5" />
      {/* Center Shield Badge */}
      <circle cx="27" cy="20" r="8" fill="#ffffff" stroke="#991b1b" strokeWidth="1" opacity="0.95" />
      <path d="M27 15 L32 18 V22 C32 24.8 27 26.5 27 26.5 C27 26.5 22 24.8 22 22 V18 Z" fill="#b91c1c" />
    </svg>
  );
}

// Carrier SBC Cluster Icoon: AudioCodes Mediant™ 4000B (exact conform geüploade hardware-afbeelding)
export function SbcClusterSvg({ width = 210, height = 42 }: { width?: number; height?: number }) {
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
