import React, { useState } from 'react';
import { LocationConfig, CPEConfig, ServiceType } from '../types';
import { Plus, Trash2, AlertTriangle, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateLocation, getNextMediantHostname } from '../utils/ip';
import { Language, translations } from '../i18n/translations';

interface Props {
  location: LocationConfig;
  allLocations?: LocationConfig[];
  onChange: (location: LocationConfig) => void;
  onDeleteLocation?: (id: string) => void;
  darkMode?: boolean;
  language?: Language;
}

export function LocationForm({ location, allLocations = [], onChange, onDeleteLocation, darkMode = false, language = 'nl' }: Props) {
  const t = translations[language];
  const [expandedCpeId, setExpandedCpeId] = useState<string | null>(location.cpes[0]?.id || null);

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

  const updateCpe = (cpeId: string, field: keyof CPEConfig, value: any) => {
    const updatedCpes = location.cpes.map(cpe => 
      cpe.id === cpeId ? { ...cpe, [field]: value } : cpe
    );
    onChange({ ...location, cpes: updatedCpes });
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

  const SERVICE_TYPES: ServiceType[] = ['VOV', 'CN', 'VOV + CN'];

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
      </div>

      {/* Demarcatielijn Toggle Knop */}
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

      {warnings.length > 0 && (
        <div className={`p-3 rounded shadow-sm border-l-4 ${
          darkMode ? 'bg-amber-950/40 border-amber-500 text-amber-200' : 'bg-amber-50 border-amber-500 text-amber-800'
        }`}>
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 mr-2 shrink-0" />
            <div>
              <h3 className={`text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                {language === 'nl' ? 'Waarschuwing(en)' : language === 'fr' ? 'Avertissement(s)' : 'Warning(s)'}
              </h3>
              <ul className={`mt-1 text-[11px] list-disc list-inside space-y-0.5 ${darkMode ? 'text-amber-200/90' : 'text-amber-700'}`}>
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CPE's Section */}
      <div className="space-y-2 pt-1">
        <div className={`flex items-center justify-between border-b pb-2 ${
          darkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {t.cpeTitle} ({location.cpes.length})
          </span>
          <button 
            onClick={addCpe}
            className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
              darkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> + {t.addCpe}
          </button>
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
                  {location.cpes.length > 1 && (
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
                        className={inputClass}
                        placeholder="Bijv. Mediant-01"
                        value={cpe.hostname || ''}
                        onChange={(e) => updateCpe(cpe.id, 'hostname', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>{t.serviceType}</label>
                      <select 
                        className={inputClass}
                        value={cpe.serviceType || ''}
                        onChange={(e) => updateCpe(cpe.id, 'serviceType', e.target.value as ServiceType)}
                      >
                        <option value="">-- {t.serviceType} --</option>
                        {SERVICE_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

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
                          <label className={labelClass}>{t.wanIp}</label>
                          <input 
                            type="text" 
                            className={inputClass}
                            placeholder="10.183.x.x"
                            value={cpe.wanIp}
                            onChange={(e) => updateCpe(cpe.id, 'wanIp', e.target.value)}
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

                        {/* Alleen tonen bij combi met CN (bijv. VOV + CN, STORM + CN) */}
                        {cpe.serviceType && cpe.serviceType.includes('CN') && (
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
                        <p className="text-[11px] text-slate-400 italic py-1">Geen endpoints geconfigureerd</p>
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
                            title="Endpoint verwijderen"
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
    </div>
  );
}
