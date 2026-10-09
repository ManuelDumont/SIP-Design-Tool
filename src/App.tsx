/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocationConfig } from './types';
import { LocationForm } from './components/LocationForm';
import { NetworkDiagram } from './components/NetworkDiagram';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserGuideModal } from './components/UserGuideModal';
import { ServiceBuilderModal } from './components/ServiceBuilderModal';
import { Language, translations } from './i18n/translations';
import { getNextMediantHostname } from './utils/ip';
import { v4 as uuidv4 } from 'uuid';
import { Sun, Moon, Plus, Building2, MapPin, ArrowRight, FileText, Trash2, Edit2, FolderOpen, Download, Hash, BookOpen, Save, ChevronDown, Folder, Settings, Check, Sliders } from 'lucide-react';

const createBlankLocation = (custName: string, locName: string, currentLocations: LocationConfig[] = []): LocationConfig => {
  const nextHostname = getNextMediantHostname(currentLocations);
  return {
    id: uuidv4(),
    customerName: custName,
    locationName: locName,
    showDemarcationLine: false,
    cpes: [
      {
        id: uuidv4(),
        hostname: nextHostname,
        serviceType: '', // Default leeg laten zoals verzocht
        wanIp: '',
        lanIpCpe: '',
        lanSubnet: '255.255.255.0 (/24)',
        defaultGateway: '',
        cnWanIp: '',
        cnLanIp: '',
        pbxs: [{ id: uuidv4(), ip: '' }]
      }
    ]
  };
};

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sip_designer_theme');
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sip_designer_theme', darkMode ? 'dark' : 'light');
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
 
  // Taalinstellingen (nl, en, fr)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sip_designer_lang');
      if (saved === 'nl' || saved === 'en' || saved === 'fr') return saved;
      return 'nl';
    } catch {
      return 'nl';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sip_designer_lang', language);
    } catch {}
  }, [language]);

  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isServiceBuilderOpen, setIsServiceBuilderOpen] = useState<boolean>(false);
  const [servicesVersion, setServicesVersion] = useState<number>(0);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState<boolean>(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState<boolean>(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const exportPngRef = useRef<(() => void) | null>(null);
  const t = translations[language];

  // Sluit het Bestand-menu en Instellingen-menu als er buiten geklikt wordt
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    if (isFileMenuOpen || isSettingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFileMenuOpen, isSettingsMenuOpen]);

  // Klantnaam en Projectnummer (standaard leeg)
  const [customerName, setCustomerName] = useState<string>('');
  const [inputCustomer, setInputCustomer] = useState<string>('');
  const [projectNumber, setProjectNumber] = useState<string>('');
  const [inputProjectNumber, setInputProjectNumber] = useState<string>('');
  const [hasAskedProject, setHasAskedProject] = useState<boolean>(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState<boolean>(false);

  // Locaties (standaard leeg)
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [inputLocation, setInputLocation] = useState<string>('');
  const [showAddLocationInput, setShowAddLocationInput] = useState<boolean>(false);

  // Houd activeLocationId gesynchroniseerd
  useEffect(() => {
    if (locations.length > 0) {
      if (!activeLocationId || !locations.some(l => l.id === activeLocationId)) {
        setActiveLocationId(locations[0].id);
      }
    } else {
      setActiveLocationId(null);
    }
  }, [locations, activeLocationId]);

  const activeLocation = locations.find(l => l.id === activeLocationId) || locations[0] || null;

  const updateActiveLocation = (updated: LocationConfig) => {
    setLocations(locations.map(loc => loc.id === updated.id ? updated : loc));
  };

  // Stap 1: Klantnaam opslaan, daarna direct projectnummer uitvragen
  const handleConfirmCustomer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCustomer.trim()) return;
    const trimmed = inputCustomer.trim();
    setCustomerName(trimmed);
    setHasAskedProject(false); // trigger vraag voor projectnummer
    // Werk eventuele bestaande locaties bij
    setLocations(prev => prev.map(loc => ({ ...loc, customerName: trimmed })));
  };

  // Stap 2: Projectnummer opslaan (altijd exact 8 tekens/digits, letters altijd als hoofdletters)
  const handleConfirmProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = inputProjectNumber.trim().slice(0, 8).toUpperCase();
    if (cleaned.length !== 8) return;
    setProjectNumber(cleaned);
    setHasAskedProject(true);
  };

  // Opslaan bij bewerken van zowel klant als projectnummer
  const handleSaveCustomerAndProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCustomer.trim()) return;
    const trimmedCust = inputCustomer.trim();
    const cleanedProj = inputProjectNumber.trim().slice(0, 8).toUpperCase();
    // Indien ingevuld moet projectnummer exact 8 tekens zijn
    if (inputProjectNumber.trim() && cleanedProj.length !== 8) return;
    setCustomerName(trimmedCust);
    setProjectNumber(cleanedProj);
    setHasAskedProject(true);
    setIsEditingCustomer(false);
    setLocations(prev => prev.map(loc => ({ ...loc, customerName: trimmedCust })));
  };

  // Direct een nieuwe locatie toevoegen
  const handleAddNewLocationDirect = (name: string = '') => {
    const newLoc = createBlankLocation(customerName, name, locations);
    setLocations([...locations, newLoc]);
    setActiveLocationId(newLoc.id);
    setShowAddLocationInput(false);
  };

  // Locatie toevoegen bij Enter of knop vanuit het formulier
  const handleAddLocation = (e?: React.FormEvent, customLocName?: string) => {
    if (e) e.preventDefault();
    const locName = (customLocName !== undefined ? customLocName : inputLocation).trim();
    handleAddNewLocationDirect(locName);
    setInputLocation('');
  };

  // Locatie verwijderen
  const handleDeleteLocation = (id: string) => {
    const updated = locations.filter(loc => loc.id !== id);
    setLocations(updated);
    if (updated.length > 0) {
      if (activeLocationId === id) {
        setActiveLocationId(updated[0].id);
      }
    } else {
      setActiveLocationId(null);
    }
  };

  // File input ref voor JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exporteer ontwerp als herbruikbaar .json bestand
  const handleExportJSON = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      customerName: customerName.trim(),
      projectNumber: projectNumber.trim(),
      locations
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Bestandsnaam bevat ALLEEN klantnaam en projectnummer (diensten weggelaten op verzoek)
    const parts: string[] = [];
    if (customerName.trim()) parts.push(customerName.trim());
    if (projectNumber.trim()) parts.push(projectNumber.trim());
    if (parts.length === 0) parts.push('SIP-Design');

    const safeTitle = parts.join('_').replace(/[\s/\\:]+/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Notificatie toast status
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Functie om .json bestand te verwerken (zowel via file-input als via drag & drop)
  const processJsonFile = (file: File) => {
    if (!file) return;

    // Controleer extensie of mimetype
    if (!file.name.toLowerCase().endsWith('.json') && file.type && !file.type.includes('json')) {
      showToast(t.invalidJsonError || 'Gelieve een geldig .json bestand te selecteren.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Ongeldig JSON-bestand');
        }

        const loadedCustomer = typeof parsed.customerName === 'string' ? parsed.customerName : '';
        const loadedProject = typeof parsed.projectNumber === 'string' ? parsed.projectNumber : '';
        const loadedLocations = Array.isArray(parsed.locations) ? parsed.locations : [];

        setCustomerName(loadedCustomer);
        setInputCustomer(loadedCustomer);
        setProjectNumber(loadedProject);
        setInputProjectNumber(loadedProject);
        setHasAskedProject(Boolean(loadedCustomer));
        setLocations(loadedLocations);
        if (loadedLocations.length > 0) {
          setActiveLocationId(loadedLocations[0].id);
        } else {
          setActiveLocationId(null);
        }
        setIsEditingCustomer(false);
        showToast(t.designLoadedSuccess || 'Ontwerp succesvol geladen!');
      } catch (err) {
        console.error('Fout bij importeren van JSON:', err);
        showToast(t.invalidJsonError || 'Het bestand kon niet worden geopend.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  // Importeer / laad eerder opgeslagen .json bestand via bestandskiezer
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  // Drag & drop functionaliteit voor .json bestanden op het design scherm
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processJsonFile(file);
    }
  };

  // Prevent default window navigation on accidental drop outside main area
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // Reset naar leeg beginpunt
  const handleResetToBlank = () => {
    setCustomerName('');
    setInputCustomer('');
    setProjectNumber('');
    setInputProjectNumber('');
    setHasAskedProject(false);
    setIsEditingCustomer(false);
    setInputLocation('');
    setShowAddLocationInput(false);
    setLocations([]);
    setActiveLocationId(null);
  };

  // Check of er al iets is ingevuld (klantnaam, projectnummer of locaties)
  const hasContent = Boolean(customerName.trim()) || Boolean(projectNumber.trim()) || locations.length > 0;

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-screen font-sans overflow-hidden transition-colors duration-200 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>
        {/* Verborgen file input voor importeren */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json,application/json" 
          onChange={handleImportJSON} 
          className="hidden" 
        />

        {/* Navigation Bar */}
        <nav className={`flex items-center justify-between px-6 py-3 border-b shadow-sm shrink-0 transition-colors duration-200 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-[#E60000] p-2 rounded-lg text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 002-2h-2a2 2 0 002 2"></path></svg>
            </div>
            <h1 className={`text-base font-bold leading-tight ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              SIP Design Maker
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Pulldown menu genaamd Bestand */}
            <div className="relative" ref={fileMenuRef}>
              <button
                onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isFileMenuOpen 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={t.fileMenu || "Bestand"}
              >
                <Folder className={`w-3.5 h-3.5 ${isFileMenuOpen ? 'text-white' : 'text-blue-500'}`} />
                <span>{t.fileMenu || 'Bestand'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isFileMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {isFileMenuOpen && (
                <div className={`absolute right-0 mt-1.5 w-60 rounded-xl shadow-xl border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {/* Nieuw leeg ontwerp */}
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      handleResetToBlank();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">{t.resetDesign}</span>
                  </button>

                  {/* Ontwerp openen (.json) */}
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">{t.openDesign}</span>
                  </button>

                  <div className={`my-1 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`} />

                  {/* Ontwerp opslaan (.json) */}
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      handleExportJSON();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Save className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold">{t.saveDesign}</span>
                  </button>

                  {/* Exporteer naar PNG */}
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      if (exportPngRef.current) {
                        exportPngRef.current();
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                      darkMode ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">{t.exportPng}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Instellingen pull down menu (Gebruiksaanwijzing, Thema's, Taal instellingen) */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isSettingsMenuOpen 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : darkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title={t.settingsMenu || "Instellingen"}
              >
                <Settings className={`w-3.5 h-3.5 ${isSettingsMenuOpen ? 'text-white' : 'text-blue-500'}`} />
                <span>{t.settingsMenu || 'Instellingen'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {isSettingsMenuOpen && (
                <div className={`absolute right-0 mt-1.5 w-64 rounded-xl shadow-xl border p-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {/* Gebruiksaanwijzing */}
                  <div className="mb-1.5">
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsGuideOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        darkMode 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700' 
                          : 'bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span>{t.userGuide || 'Gebruiksaanwijzing'}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>

                  {/* Diensten Bouwer (Service Builder) */}
                  <div className="mb-2">
                    <button
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsServiceBuilderOpen(true);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        darkMode 
                          ? 'bg-gradient-to-r from-blue-950/70 to-indigo-950/70 hover:from-blue-900/80 hover:to-indigo-900/80 text-blue-200 border border-blue-800/60 shadow-xs' 
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-950 border border-blue-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                          <Sliders className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold flex items-center gap-1.5 leading-tight">
                            <span>{t.serviceBuilder || 'Diensten Bouwer'}</span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-blue-600 text-white leading-none">
                              Nieuw
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                            Configs &amp; onderdelen kiezen
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  </div>

                  <div className={`my-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`} />

                  {/* Thema's */}
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                      <span>{t.themeTitle || "Thema's"}</span>
                    </div>
                    <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-lg border ${
                      darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (darkMode) toggleDarkMode();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          !darkMode 
                            ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sun className={`w-3.5 h-3.5 ${!darkMode ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span>{t.themeLight || 'Licht'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!darkMode) toggleDarkMode();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          darkMode 
                            ? 'bg-blue-600 text-white shadow-xs font-bold' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Moon className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-300' : 'text-slate-500'}`} />
                        <span>{t.themeDark || 'Donker'}</span>
                      </button>
                    </div>
                  </div>

                  <div className={`my-2 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`} />

                  {/* Taal instellingen */}
                  <div className="px-1 py-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
                      <span>{t.languageTitle || "Taal instellingen"}</span>
                    </div>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setLanguage('nl')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          language === 'nl'
                            ? (darkMode ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-blue-50 text-blue-700 border border-blue-200')
                            : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🇳🇱</span>
                          <span>Nederlands (NL)</span>
                        </div>
                        {language === 'nl' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          language === 'en'
                            ? (darkMode ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-blue-50 text-blue-700 border border-blue-200')
                            : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🇬🇧</span>
                          <span>English (EN)</span>
                        </div>
                        {language === 'en' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setLanguage('fr')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          language === 'fr'
                            ? (darkMode ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-blue-50 text-blue-700 border border-blue-200')
                            : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700')
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🇫🇷</span>
                          <span>Français (FR)</span>
                        </div>
                        {language === 'fr' && <Check className="w-3.5 h-3.5 text-blue-500" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Workspace Body: ENKEL paneel links + Diagram rechts */}
        <div className="flex flex-1 overflow-hidden">
          {/* ENKEL configuratiepaneel links (geen dubbele zijbalk meer!) */}
          <aside className={`w-[400px] shrink-0 border-r z-10 shadow-[4px_0_10px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden transition-colors duration-200 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            {/* STAP 1: Vraag Klantnaam als nog niet ingevuld */}
            {!customerName ? (
              <div className="p-6 flex flex-col justify-start">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.customer}</h2>
                </div>
                <form onSubmit={handleConfirmCustomer} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">{t.customerName}</label>
                    <input 
                      type="text"
                      autoFocus
                      placeholder={t.customerPlaceholder}
                      className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      value={inputCustomer}
                      onChange={(e) => setInputCustomer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmCustomer();
                        }
                      }}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!inputCustomer.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{t.nextProjectNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            ) : !hasAskedProject && !projectNumber && !isEditingCustomer ? (
              /* STAP 2: Vraag direct na de klantnaam om het projectnummer */
              <div className="p-6 flex flex-col justify-start">
                <div className={`p-2.5 rounded-lg border mb-4 flex items-center justify-between ${
                  darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold">{customerName}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setCustomerName(''); setInputCustomer(customerName); }} 
                    className="text-[11px] text-blue-500 hover:underline font-semibold"
                  >
                    {t.edit}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <Hash className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.projectNumberTitle}</h2>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {t.projectNumberDesc}
                </p>

                <form onSubmit={handleConfirmProject} className="space-y-3">
                  <div>
                    <div className="relative">
                      <input 
                        type="text"
                        maxLength={8}
                        autoFocus
                        placeholder={t.projectNumberPlaceholder}
                        className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold tracking-wider font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                          darkMode 
                            ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                        value={inputProjectNumber}
                        onChange={(e) => setInputProjectNumber(e.target.value.replace(/\s/g, '').slice(0, 8).toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (inputProjectNumber.length === 8) {
                              handleConfirmProject();
                            }
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
                        {inputProjectNumber.length}/8
                      </span>
                    </div>
                    <div className="text-[11px] mt-1.5 px-0.5">
                      {inputProjectNumber.length > 0 && inputProjectNumber.length < 8 ? (
                        <span className="text-amber-500 font-medium">
                          {t.charsRemaining(8 - inputProjectNumber.length)}
                        </span>
                      ) : inputProjectNumber.length === 0 ? (
                        <span className="text-slate-400">{t.exactCharsHelp}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="submit"
                      disabled={inputProjectNumber.length !== 8}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t.confirm}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectNumber('');
                        setInputProjectNumber('');
                        setHasAskedProject(true);
                      }}
                      className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                        darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {t.skip}
                    </button>
                  </div>
                </form>
              </div>
            ) : isEditingCustomer ? (
              /* Bewerken van Klant & Projectnummer */
              <div className="p-6 flex flex-col justify-start">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-base font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{t.step3Title}</h2>
                </div>
                <form onSubmit={handleSaveCustomerAndProject} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">{t.customerName}</label>
                    <input 
                      type="text"
                      autoFocus
                      placeholder={t.customerPlaceholder}
                      className={`w-full border rounded-lg px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      value={inputCustomer}
                      onChange={(e) => setInputCustomer(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-500">{t.projectNumber} (8)</label>
                      <span className="text-[11px] font-semibold text-slate-400">{inputProjectNumber.length}/8</span>
                    </div>
                    <input 
                      type="text"
                      maxLength={8}
                      placeholder={t.projectNumberPlaceholder}
                      className={`w-full border rounded-lg px-3.5 py-2 text-sm font-semibold tracking-wider font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      value={inputProjectNumber}
                      onChange={(e) => setInputProjectNumber(e.target.value.replace(/\s/g, '').slice(0, 8).toUpperCase())}
                    />
                    {inputProjectNumber.length > 0 && inputProjectNumber.length < 8 && (
                      <div className="text-[11px] text-amber-500 mt-1 font-medium">
                        {t.charsRemaining(8 - inputProjectNumber.length)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      type="submit"
                      disabled={!inputCustomer.trim() || (inputProjectNumber.length > 0 && inputProjectNumber.length !== 8)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>{t.save}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(false)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        darkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.cancel}
                    </button>
                  </div>
                </form>
              </div>
            ) : locations.length === 0 ? (
              /* ZODRA KLANT & PROJECTNUMMER ZIJN INGEVULD EN BEVESTIGD: Vragen om locatie(s) */
              <div className="p-6 flex flex-col h-full overflow-y-auto">
                {/* Klant en projectnummer weergave met wijzigknop */}
                <div className={`p-3 rounded-xl border mb-6 flex items-center justify-between transition-colors ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.customer}</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{customerName}</span>
                    </div>
                    {projectNumber ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.projectNumber}</span>
                        <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{projectNumber}</span>
                      </div>
                    ) : null}
                  </div>
                  <button 
                    onClick={() => {
                      setInputCustomer(customerName);
                      setInputProjectNumber(projectNumber);
                      setIsEditingCustomer(true);
                    }} 
                    className={`text-xs font-semibold hover:underline flex items-center gap-1 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{t.edit}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h2 className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {t.addLocationOptional}
                    </h2>
                    <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t.locationOptionalHelp}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddLocation} className="space-y-3">
                  <div>
                    <input 
                      type="text"
                      autoFocus
                      placeholder={t.locationNameOptionalPlaceholder}
                      className={`w-full border rounded-lg px-3.5 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                      }`}
                      value={inputLocation}
                      onChange={(e) => setInputLocation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <button 
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {inputLocation.trim() ? (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.addLocation}</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>{t.configureFirstCpe}</span>
                        </>
                      )}
                    </button>
                    {inputLocation.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddLocation(undefined, '')}
                        className={`w-full text-center text-[11px] font-medium py-1 hover:underline cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {t.continueWithoutLocation}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              /* ZODRA ER EEN LOCATIE IS: Klantbalk + Locaties tabs + Active Location Form */
              <div className="flex flex-col h-full overflow-hidden">
                {/* Klant header compact (niet tonen bij Multicustomer omdat formulier zelf direct Klant en Projectnummer bevat) */}
                {!locations.some(l => l.isMulticustomer || (l.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.isMulticustomer)) && (
                  <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <Building2 className={`w-4 h-4 shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t.customer}</span>
                          <span className={`text-xs font-bold truncate ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{customerName}</span>
                        </div>
                        {projectNumber ? (
                          <div className="flex items-center gap-1.5 leading-tight mt-0.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.projectNumber}</span>
                            <span className={`text-[11px] font-semibold truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{projectNumber}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setInputCustomer(customerName);
                        setInputProjectNumber(projectNumber);
                        setIsEditingCustomer(true);
                      }} 
                      className={`text-[11px] font-semibold hover:underline shrink-0 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}
                    >
                      {t.edit}
                    </button>
                  </div>
                )}

                {/* Locaties balk (Tabs + Direct toevoegen knop - niet tonen bij Multicustomer) */}
                {!locations.some(l => l.isMulticustomer || (l.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.isMulticustomer)) && (
                  <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
                    darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                        {t.locations}:
                      </span>
                      {locations.map((loc, idx) => (
                        <button
                          key={loc.id}
                          onClick={() => setActiveLocationId(loc.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            activeLocationId === loc.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : darkMode
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {loc.locationName?.trim() || `${t.singleLocation} ${idx + 1}`}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddNewLocationDirect()}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-md transition-all shrink-0 cursor-pointer shadow-xs ${
                        darkMode 
                          ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40' 
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 hover:border-blue-300'
                      }`}
                      title={locations.length === 1 ? t.addSecondLocationFull : t.addExtraLocationFull}
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {locations.length === 1 ? t.addSecondLocation : `+ ${t.singleLocation}`}
                      </span>
                    </button>
                  </div>
                )}

                {/* Formulier voor de actieve locatie */}
                <div className="flex-1 overflow-y-auto">
                  {activeLocation ? (
                    <LocationForm 
                      location={activeLocation} 
                      allLocations={locations}
                      onChange={updateActiveLocation}
                      onDeleteLocation={handleDeleteLocation}
                      onAddLocation={() => handleAddNewLocationDirect()}
                      darkMode={darkMode}
                      language={language}
                      customerName={customerName}
                      projectNumber={projectNumber}
                      onUpdateCustomerName={setCustomerName}
                      onUpdateProjectNumber={setProjectNumber}
                    />
                  ) : null}
                </div>
              </div>
            )}
          </aside>
          
          {/* Rechterzijde: Volledige weergave van het Netwerkdiagram (A4 Landscape) */}
          <main 
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex-1 overflow-hidden relative transition-colors duration-200 ${
              darkMode ? 'bg-slate-950' : 'bg-slate-200'
            }`}
          >
            <NetworkDiagram 
              locations={locations}
              customerName={customerName}
              projectNumber={projectNumber}
              darkMode={darkMode}
              onExportJSON={handleExportJSON}
              onRegisterExportPNG={(fn) => { exportPngRef.current = fn; }}
              language={language}
              onUpdateLocations={setLocations}
              onUpdateCustomerName={setCustomerName}
              onUpdateProjectNumber={setProjectNumber}
            />

            {/* Drag & Drop JSON bestand overlay */}
            {isDraggingFile && (
              <div className="absolute inset-0 z-50 bg-blue-600/25 dark:bg-blue-600/35 backdrop-blur-xs border-4 border-dashed border-blue-500 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-10 py-8 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-700 flex flex-col items-center text-center transform scale-105 transition-transform">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                    <FolderOpen className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {t.dropJsonToLoad}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
                    {t.dropJsonSubtext}
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Toast Notificatie */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-100 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-200 text-xs font-semibold backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
            <FolderOpen className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* User Guide / Handleiding Modal */}
        <UserGuideModal 
          isOpen={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          language={language}
          darkMode={darkMode}
        />

        {/* Diensten Bouwer / Service Builder Modal */}
        <ServiceBuilderModal 
          isOpen={isServiceBuilderOpen}
          onClose={() => setIsServiceBuilderOpen(false)}
          darkMode={darkMode}
          onServicesUpdated={() => {
            setServicesVersion(v => v + 1);
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
