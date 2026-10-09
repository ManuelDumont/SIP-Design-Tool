import React, { useState, useEffect } from 'react';
import { LocationConfig, CPEConfig, ServiceType, MulticustomerClient } from '../types';
import { Plus, Trash2, AlertTriangle, ChevronDown, ChevronRight, MapPin, Building2, Server, Hash, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateLocation, getNextMediantHostname, padTo3Digits } from '../utils/ip';
import { getEspritConfigByNumber } from '../data/espritConfigs';
import { getAllServices, findServiceDefinition } from '../data/servicesStore';
import { Language, translations } from '../i18n/translations';

interface Props {
  location: LocationConfig;
  allLocations?: LocationConfig[];
  onChange: (location: LocationConfig) => void;
  onDeleteLocation?: (id: string) => void;
  onAddLocation?: () => void;
  darkMode?: boolean;
  language?: Language;
  customerName?: string;
  projectNumber?: string;
  onUpdateCustomerName?: (name: string) => void;
  onUpdateProjectNumber?: (num: string) => void;
}

export function LocationForm({ 
  location, 
  allLocations = [], 
  onChange, 
  onDeleteLocation, 
  onAddLocation, 
  darkMode = false, 
  language = 'nl',
  customerName = '',
  projectNumber = '',
  onUpdateCustomerName,
  onUpdateProjectNumber
}: Props) {
  const t = translations[language];
  const [expandedCpeId, setExpandedCpeId] = useState<string | null>(location.cpes[0]?.id || null);

  // Local state voor het Config Nr. / SRD invoerveld zodat de gebruiker vrij kan typen zonder verspringen
  const currentConfigNr = location.multicustomerConfigNr || location.cpes?.[0]?.multicustomerConfigNr || '001';
  const [configInputVal, setConfigInputVal] = useState<string>(currentConfigNr);

  useEffect(() => {
    const locCfg = location.multicustomerConfigNr || location.cpes?.[0]?.multicustomerConfigNr;
    if (locCfg && locCfg !== configInputVal) {
      setConfigInputVal(locCfg);
    }
  }, [location.multicustomerConfigNr, location.cpes]);

  const handleLocationNameChange = (name: string) => {
    onChange({ ...location, locationName: name });
  };

  const addCpe = () => {
    const locationsToConsider = allLocations.length > 0 
      ? allLocations.map(l => l.id === location.id ? location : l)
      : [location];
    const nextHostname = getNextMediantHostname(locationsToConsider);

    const newCpe: CPEConfig = {
      id: uuidv4(),
      hostname: nextHostname,
      serviceType: '',
      wanIp: '',
      lanIpCpe: '',
      lanSubnet: '255.255.255.0 (/24)',
      defaultGateway: '',
      cnWanIp: '',
      cnLanIp: '',
      pbxs: [{ id: uuidv4(), ip: '' }]
    };
    onChange({ ...location, cpes: [...location.cpes, newCpe] });
    setExpandedCpeId(newCpe.id);
  };

  const removeCpe = (cpeId: string) => {
    onChange({ ...location, cpes: location.cpes.filter(c => c.id !== cpeId) });
  };

  const updateCpeMultiple = (cpeId: string, fields: Partial<CPEConfig>) => {
    const updatedCpes = location.cpes.map(cpe => 
      cpe.id === cpeId ? { ...cpe, ...fields } : cpe
    );
    onChange({ ...location, cpes: updatedCpes });
  };

  const handleSelectEspritClient = (initialCfg: string = '001') => {
    const cfg = getEspritConfigByNumber(initialCfg);
    const existing0 = location.cpes[0] as Partial<CPEConfig> | undefined;
    const existing1 = location.cpes[1] as Partial<CPEConfig> | undefined;

    const cpe1: CPEConfig = {
      id: existing0?.id || uuidv4(),
      hostname: 'Mediant 006',
      serviceType: 'Multicustomer',
      multicustomerClient: 'Esprit',
      multicustomerVariant: existing0?.multicustomerVariant || 'VOV',
      multicustomerConfigNr: cfg.configNr,
      wanIp: cfg.mediant006.wanIp,
      lanIpCpe: cfg.mediant006.lanIp,
      lanSubnet: '255.255.252.0 (/22)',
      defaultGateway: cfg.sipLanIpGw,
      pbxs: [{
        id: existing0?.pbxs?.[0]?.id || uuidv4(),
        name: existing0?.pbxs?.[0]?.name || 'SIP PBX',
        ip: cfg.primaryPbxIp,
        brand: existing0?.pbxs?.[0]?.brand || 'Overig'
      }]
    };

    const cpe2: CPEConfig = {
      id: existing1?.id || uuidv4(),
      hostname: 'Mediant 007',
      serviceType: 'Multicustomer',
      multicustomerClient: 'Esprit',
      multicustomerVariant: existing1?.multicustomerVariant || 'VOV',
      multicustomerConfigNr: cfg.configNr,
      wanIp: cfg.mediant007.wanIp,
      lanIpCpe: cfg.mediant007.lanIp,
      lanSubnet: '255.255.252.0 (/22)',
      defaultGateway: cfg.sipLanIpGw,
      pbxs: []
    };

    onChange({
      ...location,
      isMulticustomer: true,
      multicustomerClient: 'Esprit',
      multicustomerConfigNr: cfg.configNr,
      showDemarcationLine: false,
      cpes: [cpe1, cpe2]
    });
  };

  const handleEspritConfigNrChange = (rawVal: string) => {
    const cfg = getEspritConfigByNumber(rawVal);
    const updatedCpes = location.cpes.map((c, idx) => {
      const is006 = idx === 0 || c.hostname.includes('006');
      const medData = is006 ? cfg.mediant006 : cfg.mediant007;
      return {
        ...c,
        multicustomerConfigNr: cfg.configNr,
        wanIp: medData.wanIp,
        lanIpCpe: medData.lanIp,
        lanSubnet: '255.255.252.0 (/22)',
        defaultGateway: cfg.sipLanIpGw,
        ...(is006 ? {
          pbxs: [{
            id: c.pbxs?.[0]?.id || uuidv4(),
            name: c.pbxs?.[0]?.name || 'SIP PBX',
            ip: cfg.primaryPbxIp,
            brand: c.pbxs?.[0]?.brand || 'Overig'
          }]
        } : {})
      };
    });
    onChange({
      ...location,
      multicustomerConfigNr: cfg.configNr,
      cpes: updatedCpes
    });
  };

  const handleConfigInputChange = (val: string) => {
    setConfigInputVal(val);
    const match = val.match(/\d+/);
    if (match) {
      const nr = parseInt(match[0], 10);
      if (nr >= 1 && nr <= 125) {
        handleEspritConfigNrChange(String(nr));
      }
    }
  };

  const handleConfigInputBlur = () => {
    const match = configInputVal.match(/\d+/);
    const nr = match ? parseInt(match[0], 10) : 1;
    const clamped = Math.max(1, Math.min(125, isNaN(nr) ? 1 : nr));
    const pad = String(clamped).padStart(3, '0');
    const display = configInputVal.toUpperCase().startsWith('SRD') ? `SRD${pad}` : pad;
    setConfigInputVal(display);
    handleEspritConfigNrChange(pad);
  };

  const updateCpe = (cpeId: string, field: keyof CPEConfig, value: any) => {
    if (field === 'serviceType' && value === 'Multicustomer') {
      const currentClient = location.cpes.find(c => c.id === cpeId)?.multicustomerClient || 'Esprit';
      if (currentClient === 'Esprit') {
        handleSelectEspritClient('001');
        return;
      }
    }

    const finalValue = (field === 'hostname' && typeof value === 'string') ? value.toUpperCase() : value;
    const customSvc = field === 'serviceType' ? findServiceDefinition(value) : undefined;

    let updatedCpes = location.cpes.map(cpe => {
      if (cpe.id === cpeId) {
        const updated = { ...cpe, [field]: finalValue };
        if (field === 'serviceType') {
          if (value === 'Multicustomer') {
            updated.isMulticustomer = true;
            updated.multicustomerVariant = updated.multicustomerVariant || 'VOV';
            updated.multicustomerClient = updated.multicustomerClient || 'Esprit';
            updated.multicustomerConfigNr = updated.multicustomerConfigNr || '---';
            updated.multicustomerTrunkId = updated.multicustomerTrunkId || 'xxx';
            updated.multicustomerCpeCount = updated.multicustomerCpeCount || (location.cpes.length >= 2 ? 2 : 1);
          } else {
            updated.isMulticustomer = false;
            if (customSvc?.defaultSubnet) {
              updated.lanSubnet = customSvc.defaultSubnet;
            }
          }
        }
        return updated;
      }
      return cpe;
    });

    let newShowDemarc = location.showDemarcationLine;
    if (customSvc) {
      if (customSvc.cpeCount === 2 && updatedCpes.length === 1) {
        const cpe0 = updatedCpes[0];
        const secondCpe: CPEConfig = {
          id: uuidv4(),
          hostname: `${customSvc.hostnamePrefix || 'Mediant'} 002`,
          serviceType: customSvc.code,
          wanIp: '',
          lanIpCpe: '',
          lanSubnet: customSvc.defaultSubnet || cpe0?.lanSubnet || '255.255.255.0 (/24)',
          defaultGateway: '',
          pbxs: [{ id: uuidv4(), ip: '' }]
        };
        updatedCpes = [updatedCpes[0], secondCpe];
      }
      if (customSvc.allowDemarcationLine === false) {
        newShowDemarc = false;
      }
    }

    onChange({ ...location, showDemarcationLine: newShowDemarc, cpes: updatedCpes });
  };

  const updatePbx = (cpeId: string, pbxId: string, ip: string) => {
    const updatedCpes = location.cpes.map(cpe => {
      if (cpe.id === cpeId) {
        return {
          ...cpe,
          pbxs: cpe.pbxs.map(pbx => pbx.id === pbxId ? { ...pbx, ip } : pbx)
        };
      }
      return cpe;
    });
    onChange({ ...location, cpes: updatedCpes });
  };

  const addPbx = (cpeId: string) => {
    const updatedCpes = location.cpes.map(cpe => {
      if (cpe.id === cpeId) {
        return { ...cpe, pbxs: [...cpe.pbxs, { id: uuidv4(), ip: '' }] };
      }
      return cpe;
    });
    onChange({ ...location, cpes: updatedCpes });
  };

  const removePbx = (cpeId: string, pbxId: string) => {
    const updatedCpes = location.cpes.map(cpe => {
      if (cpe.id === cpeId) {
        return { ...cpe, pbxs: cpe.pbxs.filter(p => p.id !== pbxId) };
      }
      return cpe;
    });
    onChange({ ...location, cpes: updatedCpes });
  };

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

  const SERVICE_TYPES: ServiceType[] = ['VOV', 'CN', 'VOV + CN', 'Multicustomer'];

  const inputClass = `w-full border rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 font-mono transition-colors ${
    darkMode 
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
  }`;
  const labelClass = `block text-[11px] font-semibold mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const sectionClass = `text-sm font-bold border-b pb-2 mb-3 mt-4 ${
    darkMode ? 'text-slate-200 border-slate-800' : 'text-slate-700 border-slate-100'
  }`;

  const warnings = validateLocation(location);
  const isMultiLocation = location.isMulticustomer || (location.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.isMulticustomer);

  // MULTICUSTOMER: Slechts 3 velden uitvragen (Klant, Projectnummer, Config nr./SRD)
  if (isMultiLocation) {
    return (
      <div className={`p-4 h-full overflow-y-auto flex flex-col gap-3 transition-colors duration-200 ${
        darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
      }`}>
        {/* 1. Klant (Klantnaam) */}
        <div className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            darkMode ? 'text-slate-200' : 'text-slate-700'
          }`}>
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            1. {t.customerName}
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Bijv. Bedrijfsnaam BV"
            value={customerName || location.customerName || ''}
            onChange={(e) => {
              const val = e.target.value;
              if (onUpdateCustomerName) onUpdateCustomerName(val);
              onChange({ ...location, customerName: val });
            }}
          />
        </div>

        {/* 2. Projectnummer (exact 8 tekens) */}
        <div className={`p-3.5 rounded-xl border space-y-2 transition-colors ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex justify-between items-center">
            <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              darkMode ? 'text-slate-200' : 'text-slate-700'
            }`}>
              <Hash className="w-3.5 h-3.5 text-blue-500" />
              2. {t.projectNumber} (8 tekens)
            </label>
            <span className={`text-[10px] font-mono font-semibold ${
              (projectNumber?.length || 0) === 8 ? 'text-emerald-500 font-bold' : 'text-slate-400'
            }`}>
              {(projectNumber || '').length}/8
            </span>
          </div>
          <input
            type="text"
            maxLength={8}
            className={`${inputClass} font-mono uppercase font-semibold tracking-wider`}
            placeholder="Bijv. 12345678 of PRJ20241"
            value={projectNumber || ''}
            onChange={(e) => {
              const clean = e.target.value.toUpperCase();
              if (onUpdateProjectNumber) onUpdateProjectNumber(clean);
            }}
          />
        </div>

        {/* 3. Config nr. / SRD */}
        <div className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${
          darkMode ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50/70 border-blue-200'
        }`}>
          <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            darkMode ? 'text-blue-300' : 'text-blue-900'
          }`}>
            <Server className="w-3.5 h-3.5 text-blue-600" />
            3. Config nr. / SRD (1-125)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className={`${inputClass} font-bold font-mono text-base text-blue-600 dark:text-blue-400`}
              placeholder="001 of SRD001"
              maxLength={7}
              value={configInputVal}
              onChange={(e) => handleConfigInputChange(e.target.value)}
              onBlur={handleConfigInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                title="Volgende configuratie (+1)"
                onClick={() => {
                  const match = configInputVal.match(/\d+/);
                  const cur = match ? parseInt(match[0], 10) : 1;
                  const next = Math.min(125, cur + 1);
                  const pad = String(next).padStart(3, '0');
                  const display = configInputVal.toUpperCase().startsWith('SRD') ? `SRD${pad}` : pad;
                  setConfigInputVal(display);
                  handleEspritConfigNrChange(pad);
                }}
                className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-100 border-slate-300'
                }`}
              >
                ▲
              </button>
              <button
                type="button"
                title="Vorige configuratie (-1)"
                onClick={() => {
                  const match = configInputVal.match(/\d+/);
                  const cur = match ? parseInt(match[0], 10) : 1;
                  const prev = Math.max(1, cur - 1);
                  const pad = String(prev).padStart(3, '0');
                  const display = configInputVal.toUpperCase().startsWith('SRD') ? `SRD${pad}` : pad;
                  setConfigInputVal(display);
                  handleEspritConfigNrChange(pad);
                }}
                className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                  darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-slate-100 border-slate-300'
                }`}
              >
                ▼
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Vul een confignummer (1 - 125, bijv. <strong className="text-blue-600 font-bold">002</strong>) of SRD-code (bijv. <strong className="text-blue-600 font-bold">SRD002</strong>) in. Alle IP-adressen worden direct overgenomen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 h-full overflow-y-auto flex flex-col gap-3 transition-colors duration-200 ${
      darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
    }`}>
      
      {/* Location Name Header */}
      <div className={`p-3 rounded-lg border space-y-1.5 transition-colors ${
        darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            darkMode ? 'text-blue-400' : 'text-blue-700'
          }`}>
            <MapPin className="w-3.5 h-3.5" /> {t.locationName}
          </label>
          <div className="flex items-center gap-2">
            {location.customerName && (
              <span className={`text-[11px] truncate font-medium max-w-[140px] ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {t.customer}: <strong className={darkMode ? 'text-slate-200' : 'text-slate-700'}>{location.customerName}</strong>
              </span>
            )}
            {onDeleteLocation && (
              <button
                type="button"
                onClick={() => onDeleteLocation(location.id)}
                className={`p-1 rounded transition-colors ${
                  darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                }`}
                title={t.deleteLocation}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <input 
          type="text" 
          className={`w-full border rounded px-2.5 py-1.5 text-sm font-bold focus:ring-1 focus:ring-blue-500 transition-colors ${
            darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
          }`}
          placeholder={t.locationPlaceholder}
          value={location.locationName || ''}
          onChange={(e) => handleLocationNameChange(e.target.value)}
        />
        <p className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {t.locationOptionalFormHelp}
        </p>
      </div>

      {/* Demarcatielijn Toggle Knop - niet aanbieden bij Multicustomer */}
      {!isMultiLocation && (
        <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-colors ${
          darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col pr-2">
            <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              {t.demarcationToggle}
            </span>
            <span className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.demarcationDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...location, showDemarcationLine: !location.showDemarcationLine })}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              location.showDemarcationLine ? 'bg-blue-600' : darkMode ? 'bg-slate-700' : 'bg-slate-300'
            }`}
            role="switch"
            aria-checked={Boolean(location.showDemarcationLine)}
            title={t.demarcationDesc}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                location.showDemarcationLine ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {warnings.length > 0 && (
        <div className={`p-3 rounded shadow-sm border-l-4 ${
          darkMode ? 'bg-amber-950/40 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-500 text-amber-800'
        }`}>
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 mr-2 shrink-0" />
            <div>
              <h3 className={`text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                {t.warningsLabel}
              </h3>
              <ul className={`mt-1 text-[11px] list-disc list-inside space-y-0.5 ${darkMode ? 'text-amber-200/90' : 'text-amber-700'}`}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CPE's Section */}
      {(() => {
        const isMultiLocation = location.isMulticustomer || (location.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.isMulticustomer);

        return (
          <div className="space-y-2 pt-1">
            <div className={`flex items-center justify-between border-b pb-2 ${
              darkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {t.cpeTitle} ({location.cpes.length})
              </span>
              {!isMultiLocation && (
                <button 
                  onClick={addCpe}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> + {t.addCpe}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {location.cpes.map((cpe, cpeIndex) => {
                const isExpanded = expandedCpeId === cpe.id;
                
                return (
                  <div key={cpe.id} className={`border rounded-lg overflow-hidden shadow-sm transition-colors ${
                    darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
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
                          {cpe.hostname || `Mediant ${cpeIndex + 1}`}
                        </span>
                        {cpe.serviceType && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            darkMode ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {cpe.serviceType}
                          </span>
                        )}
                      </div>
                      {!isMultiLocation && location.cpes.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeCpe(cpe.id); }}
                          className={`p-1 rounded transition-colors ${
                            darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                          }`}
                          title={t.deleteCpe}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                {isExpanded && (
                  <div className={`p-3 space-y-3 ${darkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
                    <div>
                      <label className={labelClass}>{t.hostname}</label>
                      <input 
                        type="text" 
                        className={`${inputClass} uppercase`}
                        placeholder="Bijv. MEDIANT-01"
                        value={cpe.hostname || ''}
                        onChange={(e) => updateCpe(cpe.id, 'hostname', e.target.value.toUpperCase())}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelClass}>{t.serviceType}</label>
                        <span className="text-[10px] text-blue-500 font-medium">
                          {getAllServices().length} types beschikbaar
                        </span>
                      </div>
                      <select 
                        className={inputClass}
                        value={cpe.serviceType || ''}
                        onChange={(e) => updateCpe(cpe.id, 'serviceType', e.target.value as ServiceType)}
                      >
                        <option value="">-- {t.serviceType} --</option>
                        {getAllServices().map(svc => (
                          <option key={svc.id} value={svc.code}>
                            {svc.code} {svc.name && svc.name !== svc.code ? `- ${svc.name}` : ''} {!svc.isBuiltIn ? '(Eigen dienst)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {cpe.serviceType === 'Multicustomer' && (
                      <div className={`p-3.5 rounded-xl border space-y-3 transition-colors ${
                        darkMode ? 'bg-indigo-950/40 border-indigo-700/60' : 'bg-indigo-50/80 border-indigo-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-indigo-500" />
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${
                              darkMode ? 'text-indigo-300' : 'text-indigo-900'
                            }`}>
                              {t.multitenantCustomer || 'Multitenant Klant'}
                            </h4>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-mono">
                            Multi Customer Mediant
                          </span>
                        </div>

                        {/* Omgevingstype variant: VOV of VOV + CN */}
                        <div>
                          <label className={labelClass}>
                            {t.multicustomerVariant || 'Omgevingstype'}
                          </label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => updateCpe(cpe.id, 'multicustomerVariant', 'VOV')}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                (cpe.multicustomerVariant || 'VOV') === 'VOV'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : darkMode
                                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              VOV
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCpe(cpe.id, 'multicustomerVariant', 'VOV + CN')}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                cpe.multicustomerVariant === 'VOV + CN'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : darkMode
                                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              VOV + CN
                            </button>
                          </div>
                        </div>

                        {/* Config. Nr. */}
                        <div>
                          <label className={labelClass}>{t.configNr || 'Config. Nr.'} (3 cijfers, bijv. 002)</label>
                          <input
                            type="text"
                            className={`${inputClass} font-bold text-blue-600 dark:text-blue-400`}
                            placeholder="001"
                            maxLength={3}
                            value={cpe.multicustomerConfigNr || '001'}
                            onChange={(e) => handleEspritConfigNrChange(e.target.value)}
                          />
                          <span className="text-[10px] text-slate-400">
                            Bepaalt automatisch de WAN adressen (10.183.57.xxx &amp; 10.183.58.xxx) en Firewall (10.20.2.xxx).
                          </span>
                        </div>

                        {/* Preview van het tekstblok in het design */}
                        <div className={`p-2.5 rounded-lg border text-[11px] font-mono leading-relaxed ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                        }`}>
                          <div className="font-bold text-blue-600 dark:text-blue-400">
                            Esprit Multicustomer (N2G)
                          </div>
                          <div className="text-slate-500 mt-0.5">Multi Customer Mediant</div>
                          <div>N2G-M4000-ASD-006</div>
                          <div>N2G-M4000-ASD-007</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                            Config. Nr. {cpe.multicustomerConfigNr || '001'}
                          </div>
                        </div>
                      </div>
                    )}

                    {cpe.serviceType === 'CN' ? (
                      /* Alleen CN (geen combi met VOV/STORM): uitsluitend CN WAN en CN LAN uitvragen */
                      <>
                        <div>
                          <label className={labelClass}>{t.cnWanIp}</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="10.x.x.x"
                            value={cpe.cnWanIp || ''}
                            onChange={(e) => updateCpe(cpe.id, 'cnWanIp', e.target.value)}
                          />
                        </div>

                        <h3 className={sectionClass}>{t.ipAddresses}</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>{t.cnLanIp}</label>
                            <input 
                              type="text" 
                              className={inputClass}
                              placeholder="192.168.x.x"
                              value={cpe.cnLanIp || ''}
                              onChange={(e) => updateCpe(cpe.id, 'cnLanIp', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>{t.subnetMask}</label>
                            <select 
                              className={inputClass}
                              value={cpe.lanSubnet}
                              onChange={(e) => updateCpe(cpe.id, 'lanSubnet', e.target.value)}
                            >
                              <option value="" disabled>{t.subnetMask}</option>
                              {SUBNETS.map(subnet => (
                                <option key={subnet} value={subnet}>{subnet}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className={labelClass}>{t.defaultGateway}</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="192.168.1.254"
                            value={cpe.defaultGateway}
                            onChange={(e) => updateCpe(cpe.id, 'defaultGateway', e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      /* Regulier (VOV, STORM) of Combi (VOV + CN, STORM + CN) */
                      <>
                        <div>
                          <label className={labelClass}>
                            {t.wanIp} {cpe.multicustomerClient === 'Esprit' ? `(${cpe.hostname || 'Mediant'})` : ''}
                          </label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder={cpe.hostname?.includes('007') ? '10.183.58.xxx' : '10.183.57.xxx'}
                            value={cpe.wanIp}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateCpe(cpe.id, 'wanIp', val);
                              if (cpe.multicustomerClient === 'Esprit') {
                                const match = val.trim().match(/\.(\d{1,3})$/);
                                if (match) {
                                  handleEspritConfigNrChange(match[1]);
                                }
                              }
                            }}
                          />
                        </div>

                        <h3 className={sectionClass}>{t.ipAddresses}</h3>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>{t.lanIp}</label>
                            <input 
                              type="text" 
                              className={inputClass}
                              placeholder="192.168.1.1"
                              value={cpe.lanIpCpe}
                              onChange={(e) => updateCpe(cpe.id, 'lanIpCpe', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>{t.subnetMask}</label>
                            <select 
                              className={inputClass}
                              value={cpe.lanSubnet}
                              onChange={(e) => updateCpe(cpe.id, 'lanSubnet', e.target.value)}
                            >
                              <option value="" disabled>{t.subnetMask}</option>
                              {SUBNETS.map(subnet => (
                                <option key={subnet} value={subnet}>{subnet}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className={labelClass}>{t.defaultGateway}</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="192.168.1.254"
                            value={cpe.defaultGateway}
                            onChange={(e) => updateCpe(cpe.id, 'defaultGateway', e.target.value)}
                          />
                        </div>

                        {/* Alleen tonen bij combi met CN (bijv. VOV + CN, of Multicustomer met VOV + CN) */}
                        {((cpe.serviceType && cpe.serviceType.includes('CN')) || 
                          (cpe.serviceType === 'Multicustomer' && cpe.multicustomerVariant === 'VOV + CN')) && (
                          <div className={`p-3 rounded-lg border space-y-2 mt-2 transition-colors ${
                            darkMode ? 'bg-blue-950/30 border-blue-800/60' : 'bg-blue-50/70 border-blue-200'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                                darkMode ? 'text-blue-300' : 'text-blue-900'
                              }`}>
                                Corporate Network (CN) IP
                              </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>{t.cnWanIp}</label>
                                <input 
                                  type="text" 
                                  className={inputClass}
                                  placeholder="10.x.x.x"
                                  value={cpe.cnWanIp || ''}
                                  onChange={(e) => updateCpe(cpe.id, 'cnWanIp', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>{t.cnLanIp}</label>
                                <input 
                                  type="text" 
                                  className={inputClass}
                                  placeholder="192.168.x.x"
                                  value={cpe.cnLanIp || ''}
                                  onChange={(e) => updateCpe(cpe.id, 'cnLanIp', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className={`flex justify-between items-center border-b pb-1.5 mb-2 mt-3 ${
                      darkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <h3 className={`text-xs font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{t.endpoints}</h3>
                      <button 
                        onClick={() => addPbx(cpe.id)}
                        className={`text-[10px] font-bold uppercase transition-colors ${
                          darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
                        }`}
                      >
                        + {t.addEndpoint}
                      </button>
                    </div>
                    
                    <div className="space-y-1.5">
                      {cpe.pbxs.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic py-1">Geen SIP PBX geconfigureerd</p>
                      )}
                      {cpe.pbxs.map((pbx, index) => (
                        <div key={pbx.id} className="flex gap-1.5 items-center">
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder={`${t.endpointTitle} ${index + 1} IP`}
                            value={pbx.ip}
                            onChange={(e) => updatePbx(cpe.id, pbx.id, e.target.value)}
                          />
                          <button 
                            onClick={() => removePbx(cpe.id, pbx.id)}
                            title="SIP PBX verwijderen"
                            className={`p-1 rounded transition-colors ${
                              darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  })()}

      {!location.isMulticustomer && !(location.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.isMulticustomer) && onAddLocation && (
        <div className="pt-2 pb-4">
          <button
            type="button"
            onClick={onAddLocation}
            className={`w-full py-2.5 px-3 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
              darkMode 
                ? 'border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10' 
                : 'border-slate-300 text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-500" />
            <span>
              {allLocations.length === 1 ? t.addSecondLocationFull : t.addExtraLocationFull}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
