import React, { useState, useEffect } from 'react';
import { BuilderElement, IntakeScenario } from '../../types';
import { exportIntakeScenarioToText } from './serviceBuilderScenario';
import { 
  Building2, Hash, MapPin, Server, Shield, 
  Copy, Check, ChevronDown, ChevronRight,
  Phone, Network, Edit2, RotateCcw, ArrowRight, Plus
} from 'lucide-react';

interface ServiceBuilderScenarioTabProps {
  darkMode: boolean;
  serviceName: string;
  elements: BuilderElement[];
  scenario: IntakeScenario;
  onUpdateScenario?: (updated: IntakeScenario) => void;
  onNavigateToStudio: () => void;
}

const SUBNETS = [
  "255.255.255.252 (/30)",
  "255.255.255.248 (/29)",
  "255.255.255.240 (/28)",
  "255.255.255.224 (/27)",
  "255.255.255.192 (/26)",
  "255.255.255.128 (/25)",
  "255.255.255.0 (/24)",
  "255.255.254.0 (/23)",
  "255.255.252.0 (/22)",
  "255.255.248.0 (/21)",
  "255.255.240.0 (/20)",
  "255.255.224.0 (/19)",
  "255.255.192.0 (/18)",
  "255.255.128.0 (/17)",
  "255.255.0.0 (/16)",
];

export function ServiceBuilderScenarioTab({
  darkMode,
  serviceName,
  elements,
  scenario,
  onUpdateScenario,
  onNavigateToStudio
}: ServiceBuilderScenarioTabProps) {
  const [copied, setCopied] = useState<boolean>(false);
  
  // Locatie vraag kan aan of uitgezet worden
  const [includeLocations, setIncludeLocations] = useState<boolean>(
    scenario.includeLocations !== false
  );

  useEffect(() => {
    if (typeof scenario.includeLocations === 'boolean') {
      setIncludeLocations(scenario.includeLocations);
    }
  }, [scenario.includeLocations]);

  // Weergave: 'form' (direct het formulier zoals bij VOV) of 'steps' (de intake stappen)
  const [activeView, setActiveView] = useState<'form' | 'steps'>('form');

  // Intake flow stappen (bij 'steps' weergave)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Formulier waarden identiek aan het configuratiepaneel van de applicatie (starten leeg zonder vooringevulde voorbeelddata)
  const [customerName, setCustomerName] = useState<string>('');
  const [projectNumber, setProjectNumber] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);
  const [showDemarc, setShowDemarc] = useState<boolean>(false);

  // Dynamische CPE's op basis van elementen op het canvas
  const cpeElements = elements.filter(e => 
    e.type === 'mediant' || e.type === 'router' || e.type === 'switch'
  );

  const effectiveCpes = cpeElements.length > 0 ? cpeElements : [
    {
      id: 'default-cpe-1',
      type: 'mediant' as const,
      label: 'Mediant 1',
      x: 0,
      y: 0
    }
  ];

  // Gegevens per CPE (starten leeg)
  const [cpeValues, setCpeValues] = useState<Record<string, {
    hostname: string;
    wanIp: string;
    lanIp: string;
    subnet: string;
    gateway: string;
    pbxIp?: string;
    firewallIp?: string;
    cnWanIp?: string;
    cnLanIp?: string;
  }>>({});

  useEffect(() => {
    setCpeValues(prev => {
      const next = { ...prev };
      effectiveCpes.forEach((cpe, idx) => {
        if (!next[cpe.id]) {
          next[cpe.id] = {
            hostname: cpe.label || (cpe.type === 'router' ? `ROUTER 0${idx + 1}` : `MEDIANT 0${idx + 1}`),
            wanIp: '',
            lanIp: '',
            subnet: '255.255.255.0 (/24)',
            gateway: '',
            pbxIp: '',
            firewallIp: '',
            cnWanIp: '',
            cnLanIp: ''
          };
        }
      });
      return next;
    });
  }, [elements]);

  const [expandedCpeId, setExpandedCpeId] = useState<string | null>(effectiveCpes[0]?.id || null);

  const hasPbx = elements.some(e => e.type === 'pbx');
  const hasFirewall = elements.some(e => e.type === 'firewall');
  const hasCn = elements.some(e => (e.label || '').toUpperCase().includes('CN'));

  const handleToggleLocations = (val: boolean) => {
    setIncludeLocations(val);
    if (onUpdateScenario) {
      onUpdateScenario({
        ...scenario,
        includeLocations: val,
        locationsRequired: false
      });
    }
  };

  const handleCopyText = () => {
    const text = exportIntakeScenarioToText(
      { ...scenario, includeLocations, locationsRequired: false },
      serviceName || 'VOV'
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetToDefaults = () => {
    setCustomerName('');
    setProjectNumber('');
    setLocationName('');
    setIsEditingCustomer(false);
    setActiveStep(1);
  };

  const updateCpeField = (cpeId: string, field: string, val: string) => {
    setCpeValues(prev => ({
      ...prev,
      [cpeId]: {
        ...prev[cpeId],
        [field]: val
      }
    }));
  };

  const inputClass = `w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${
    darkMode 
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
  }`;
  const labelClass = `block text-[11px] font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const sectionClass = `text-sm font-bold border-b pb-2 mb-3 mt-4 ${
    darkMode ? 'text-slate-200 border-slate-800' : 'text-slate-700 border-slate-100'
  }`;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      {/* BOVENBALK: Dienstnaam, weergave-toggle en acties */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {serviceName || 'VOV'}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Uitvraagscenario &amp; Configuratie
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Exacte weergave zoals de dienst wordt geconfigureerd in het zijpaneel
            </p>
          </div>
        </div>

        {/* Midden / Rechts: Locatie schakelaar, Weergave switcher, Kopieerknop */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Locatie Aan / Uit Schakelaar */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            darkMode ? 'bg-slate-900 border-slate-750' : 'bg-slate-50 border-slate-200'
          }`}>
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Locatie</span>
            <span className={`text-[11px] font-bold ${includeLocations ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
              {includeLocations ? 'Aan' : 'Uit'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={includeLocations}
              onClick={() => handleToggleLocations(!includeLocations)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                includeLocations ? 'bg-blue-600' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
              }`}
              title="Locatie-uitvraag in- of uitschakelen"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  includeLocations ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Weergave Tabs */}
          <div className={`p-1 rounded-xl border flex text-xs font-semibold ${
            darkMode ? 'bg-slate-900 border-slate-750' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setActiveView('form')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Formulier
            </button>
            <button
              type="button"
              onClick={() => setActiveView('steps')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeView === 'steps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Intakestappen
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyText}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : darkMode
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title="Kopieer intake-checklist naar klembord"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Gekopieerd!' : 'Kopieer Checklist'}</span>
          </button>
        </div>
      </div>

      {/* WEERGAVE 1: HET VOLLEDIGE FORMULIER (EXACT ZOALS IN DE ZIJBALK BIJ VOV) */}
      {activeView === 'form' && (
        <div className="flex justify-center">
          <div className={`w-full max-w-[430px] rounded-2xl border shadow-lg overflow-hidden flex flex-col transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Klant & Project header compact (zoals in de echte zijbalk) */}
            <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <Building2 className={`w-4 h-4 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div className="truncate">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Klant</span>
                    <span className={`text-xs font-bold truncate ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {customerName || 'Klantnaam'}
                    </span>
                  </div>
                  {projectNumber && (
                    <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Project</span>
                      <span className={`text-[11px] font-semibold truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {projectNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditingCustomer(!isEditingCustomer)} 
                className={`text-[11px] font-semibold hover:underline shrink-0 cursor-pointer flex items-center gap-1 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingCustomer ? 'Sluiten' : 'Wijzigen'}</span>
              </button>
            </div>

            {/* Klant & Projectnummer bewerken inline */}
            {isEditingCustomer && (
              <div className={`p-4 border-b space-y-3 ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-blue-50/40 border-blue-100'
              }`}>
                <div>
                  <label className={labelClass}>Klantnaam</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Klantnaam"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Projectnummer</label>
                    <span className="text-[10px] font-mono text-slate-400">{projectNumber.length}/8</span>
                  </div>
                  <input
                    type="text"
                    maxLength={8}
                    value={projectNumber}
                    onChange={e => setProjectNumber(e.target.value.toUpperCase())}
                    placeholder="PRJ12345"
                    className={`${inputClass} font-mono uppercase`}
                  />
                </div>
              </div>
            )}

            {/* Inhoud van het formulier */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
              {/* Locatie blok (indien ingeschakeld) */}
              {includeLocations && (
                <div className={`p-3 rounded-lg border space-y-1.5 transition-colors ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      darkMode ? 'text-blue-400' : 'text-blue-700'
                    }`}>
                      <MapPin className="w-3.5 h-3.5" /> Locatienaam
                    </label>
                  </div>
                  <input 
                    type="text" 
                    className={`w-full border rounded px-2.5 py-1.5 text-sm font-bold focus:ring-1 focus:ring-blue-500 transition-colors ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="Locatienaam"
                    value={locationName}
                    onChange={e => setLocationName(e.target.value)}
                  />
                  <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Geef deze locatie een herkenbare naam.
                  </p>
                </div>
              )}

              {/* Demarcatielijn toggle */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
                darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col pr-2">
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Demarcatielijn
                  </span>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Toon de gestippelde scheidingslijn
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemarc(!showDemarc)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showDemarc ? 'bg-blue-600' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={showDemarc}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      showDemarc ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* CPE's / Apparatuur Sectie */}
              <div className="space-y-2 pt-1">
                <div className={`flex items-center justify-between border-b pb-2 ${
                  darkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    Apparatuur ({effectiveCpes.length})
                  </span>
                </div>

                <div className="space-y-2.5">
                  {effectiveCpes.map((cpe, cpeIndex) => {
                    const isExpanded = expandedCpeId === cpe.id;
                    const vals = cpeValues[cpe.id] || {
                      hostname: cpe.label || `Mediant ${cpeIndex + 1}`,
                      wanIp: cpe.wanIp || '',
                      lanIp: cpe.lanIp || '',
                      subnet: '255.255.255.0 (/24)',
                      gateway: ''
                    };

                    return (
                      <div 
                        key={cpe.id} 
                        className={`border rounded-lg overflow-hidden shadow-xs transition-colors ${
                          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* CPE Header accordion */}
                        <div 
                          className={`flex items-center justify-between p-2.5 cursor-pointer select-none transition-colors ${
                            isExpanded 
                              ? darkMode ? 'bg-slate-800 border-b border-slate-700' : 'bg-blue-50/50 border-b border-slate-200' 
                              : darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setExpandedCpeId(isExpanded ? null : cpe.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                            <span className={`font-semibold text-xs ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {vals.hostname}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {serviceName || 'VOV'}
                            </span>
                          </div>
                        </div>

                        {/* CPE Formulier Velden */}
                        {isExpanded && (
                          <div className={`p-3 space-y-3 ${darkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
                            {/* Hostname */}
                            <div>
                              <label className={labelClass}>Hostname</label>
                              <input 
                                type="text" 
                                className={`${inputClass} uppercase`}
                                placeholder="Bijv. MEDIANT-01"
                                value={vals.hostname}
                                onChange={e => updateCpeField(cpe.id, 'hostname', e.target.value.toUpperCase())}
                              />
                            </div>

                            {/* Diensttype */}
                            <div>
                              <label className={labelClass}>Diensttype</label>
                              <div className={`px-3 py-1.5 rounded border text-xs font-bold ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-50 border-slate-200 text-blue-600'
                              }`}>
                                {serviceName || 'VOV'}
                              </div>
                            </div>

                            {/* Toegang / WAN IP */}
                            <div>
                              <label className={labelClass}>Toegang / WAN IP</label>
                              <input 
                                type="text" 
                                className={inputClass}
                                placeholder="10.183.57.xxx"
                                value={vals.wanIp}
                                onChange={e => updateCpeField(cpe.id, 'wanIp', e.target.value)}
                              />
                            </div>

                            {/* IP-adressen Kop */}
                            <h4 className={sectionClass}>IP-adressen</h4>

                            {/* LAN IP & Subnet */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Voice LAN IP</label>
                                <input 
                                  type="text" 
                                  className={inputClass}
                                  placeholder="192.168.1.1"
                                  value={vals.lanIp}
                                  onChange={e => updateCpeField(cpe.id, 'lanIp', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Subnetmasker</label>
                                <select 
                                  className={inputClass}
                                  value={vals.subnet}
                                  onChange={e => updateCpeField(cpe.id, 'subnet', e.target.value)}
                                >
                                  {SUBNETS.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Default Gateway */}
                            <div>
                              <label className={labelClass}>Default Gateway</label>
                              <input 
                                type="text" 
                                className={inputClass}
                                placeholder="192.168.1.254"
                                value={vals.gateway}
                                onChange={e => updateCpeField(cpe.id, 'gateway', e.target.value)}
                              />
                            </div>

                            {/* PBX IP (indien PBX aanwezig) */}
                            {hasPbx && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                <label className={labelClass}>SIP PBX IP-adres</label>
                                <input 
                                  type="text" 
                                  className={inputClass}
                                  placeholder="192.168.1.10"
                                  value={vals.pbxIp || ''}
                                  onChange={e => updateCpeField(cpe.id, 'pbxIp', e.target.value)}
                                />
                              </div>
                            )}

                            {/* Firewall IP (indien Firewall aanwezig) */}
                            {hasFirewall && (
                              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                <label className={labelClass}>Firewall IP (Terminerend adres vóór FW)</label>
                                <input 
                                  type="text" 
                                  className={inputClass}
                                  placeholder="192.168.1.254"
                                  value={vals.firewallIp || ''}
                                  onChange={e => updateCpeField(cpe.id, 'firewallIp', e.target.value)}
                                />
                              </div>
                            )}

                            {/* CN IP's (indien CN aanwezig) */}
                            {hasCn && (
                              <div className={`p-2.5 rounded-lg border space-y-2 mt-2 ${
                                darkMode ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50/70 border-blue-200'
                              }`}>
                                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                  Corporate Net (CN) Instellingen
                                </div>
                                <div>
                                  <label className={labelClass}>CN WAN IP</label>
                                  <input 
                                    type="text" 
                                    className={inputClass}
                                    placeholder="10.x.x.x"
                                    value={vals.cnWanIp || ''}
                                    onChange={e => updateCpeField(cpe.id, 'cnWanIp', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>CN LAN IP</label>
                                  <input 
                                    type="text" 
                                    className={inputClass}
                                    placeholder="192.168.x.x"
                                    value={vals.cnLanIp || ''}
                                    onChange={e => updateCpeField(cpe.id, 'cnLanIp', e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* WEERGAVE 2: STAP-VOOR-STAP INTAKE (KLANT → PROJECTNUMMER → LOCATIE → APPARATUUR) */}
      {activeView === 'steps' && (
        <div className="flex justify-center">
          <div className={`w-full max-w-[430px] rounded-2xl border shadow-lg overflow-hidden flex flex-col transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Gekozen Dienst Badge bovenaan */}
            <div className={`p-3 border-b flex items-center justify-between ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gekozen Dienst:</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {serviceName || 'VOV'}
                </span>
              </div>
              {/* Stap indicator */}
              <div className="flex items-center gap-1">
                {[1, 2, ...(includeLocations ? [3] : []), 4].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveStep(s as any)}
                    className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                      activeStep === s
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* STAP 1: Klantnaam */}
            {activeStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    Klant
                  </h3>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Klantnaam</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Bijv. Acme Logistics B.V."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Volgende: Projectnummer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* STAP 2: Projectnummer */}
            {activeStep === 2 && (
              <div className="p-6 space-y-4">
                {/* Klant badge */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold">{customerName || 'Klantnaam'}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(1)} 
                    className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                  >
                    Wijzigen
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Hash className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    Projectnummer (8 tekens)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Voer het 8-tekens dossier- of projectnummer in
                </p>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    autoFocus
                    placeholder="PRJ12345"
                    value={projectNumber}
                    onChange={e => setProjectNumber(e.target.value.replace(/\s/g, '').slice(0, 8).toUpperCase())}
                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold tracking-wider font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 font-mono">
                    {projectNumber.length}/8
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(includeLocations ? 3 : 4)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Bevestigen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(includeLocations ? 3 : 4)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Overslaan
                  </button>
                </div>
              </div>
            )}

            {/* STAP 3: Locatie (indien ingeschakeld) */}
            {activeStep === 3 && includeLocations && (
              <div className="p-6 space-y-4">
                {/* Klant en projectbadge */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Klant</span>
                      <span className="text-xs font-bold">{customerName || 'Klantnaam'}</span>
                    </div>
                    {projectNumber && (
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Project: <span className="font-mono font-semibold">{projectNumber}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(1)} 
                    className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer"
                  >
                    Wijzigen
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <MapPin className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h3 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Locatienaam toevoegen
                    </h3>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Geef een vestiging of site op
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  autoFocus
                  placeholder="Locatienaam"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                    darkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Locatie toevoegen &amp; Apparatuur configureren</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationName('');
                      setActiveStep(4);
                    }}
                    className={`w-full text-center text-[11px] font-medium py-1 hover:underline cursor-pointer ${
                      darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Doorgaan zonder locatie
                  </button>
                </div>
              </div>
            )}

            {/* STAP 4: Voltooide configuratie (doorverwijzing naar het formulier) */}
            {activeStep === 4 && (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Dossier Klaargezet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Klant, projectnummer {includeLocations ? 'en locatie' : ''} zijn ingegeven. De apparatuurparameters kunnen direct ingevuld worden.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView('form')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Volledig Formulier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
