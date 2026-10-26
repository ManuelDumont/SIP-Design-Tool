import React from 'react';
import { BuilderElement } from '../../types';
import { Sliders, Trash2, Copy, Link2, Unlink, Plus, Minus, Move, FileText, Network, CheckCircle2, ChevronRight, ShieldAlert, Phone, Layers } from 'lucide-react';

interface ServiceBuilderPropertiesPanelProps {
  selectedIds: string[];
  selectedElement: BuilderElement | null;
  elements: BuilderElement[];
  darkMode: boolean;
  templateCategory?: 'voice' | 'data';
  handleDeleteSelected: () => void;
  handleDuplicateElement: (id: string) => void;
  handleDeleteElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<BuilderElement>) => void;
  adjustElementScale: (id: string, delta: number) => void;
  getTargetName: (targetId?: string) => string;
  onOpenScenarioTab?: () => void;
  onAddBehindFirewall?: (firewallId: string, type: 'direct-pbx' | 'cloud-pbx') => void;
}

export function ServiceBuilderPropertiesPanel({
  selectedIds,
  selectedElement,
  elements = [],
  darkMode,
  templateCategory = 'voice',
  handleDeleteSelected,
  handleDuplicateElement,
  handleDeleteElement,
  updateElement,
  adjustElementScale,
  getTargetName,
  onOpenScenarioTab,
  onAddBehindFirewall
}: ServiceBuilderPropertiesPanelProps) {
  if (selectedIds.length > 1) {
    return (
      <div className={`p-3 rounded-xl border space-y-3 ${
        darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Groep ({selectedIds.length} elementen geselecteerd)
          </span>
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 transition-colors cursor-pointer flex items-center gap-1"
            title="Alle geselecteerde elementen wissen (DEL)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">Alles DEL</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          U heeft <strong>{selectedIds.length} elementen</strong> tegelijk geselecteerd met de Shift-toets. Sleep één van de elementen om de groep gezamenlijk te verplaatsen. Aangesloten connectoren bewegen automatisch mee.
        </p>
      </div>
    );
  }

  if (selectedElement) {
    return (
      <div className={`p-3 rounded-xl border space-y-3 ${
        darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            Geselecteerd: {selectedElement.type === 'phone' ? 'TELEFOONTOESTEL' : selectedElement.type.toUpperCase()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleDuplicateElement(selectedElement.id)}
              className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Dupliceren"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteElement(selectedElement.id)}
              className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 transition-colors cursor-pointer flex items-center gap-1"
              title="Verwijderen (of druk op DEL)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[10px]">DEL</span>
            </button>
          </div>
        </div>

        {/* CONNECTOR SPECIFIEKE BEDIENING: ZONDER VAST DROPDOWN-MENU */}
        {selectedElement.type === 'connector' && (
          <div className="space-y-2.5">
            {/* Directe Verwijderknop voor connector */}
            <button
              type="button"
              onClick={() => handleDeleteElement(selectedElement.id)}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              title="Deze connector verwijderen (of druk op DEL)"
            >
              <Trash2 className="w-4 h-4" />
              <span>Connector Verwijderen (DEL)</span>
            </button>

            <div className="p-2.5 rounded bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong className="block mb-1 flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <Link2 className="w-3.5 h-3.5" />
                Aansluitende Connectoren:
              </strong>
              Sleep de ronde handvatten (begin- en eindpunt) op het canvas naar de gewenste elementen. Zodra u een handvat op een element loslaat, sluit de connector er automatisch strak op aan. U kunt ook op het midden van de connector klikken en op &quot;Verwijderen&quot; of DEL drukken.
            </div>

            {/* Status begin- en eindpunt met mogelijkheid tot ontkoppelen */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Beginpunt</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {getTargetName(selectedElement.sourceElementId)}
                  </span>
                </div>
                {selectedElement.sourceElementId && (
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { sourceElementId: undefined })}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                    title="Maak beginpunt vrij"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Vrijmaken</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Eindpunt</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {getTargetName(selectedElement.targetElementId)}
                  </span>
                </div>
                {selectedElement.targetElementId && (
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { targetElementId: undefined })}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                    title="Maak eindpunt vrij"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Vrijmaken</span>
                  </button>
                )}
              </div>
            </div>

            {/* VORM / TRACÉ VAN DE CONNECTOR: Naar keuze Recht, Haaks of Vloeiend */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center justify-between">
                <span>Vorm / Tracé van verbinding</span>
                <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 lowercase">
                  {(selectedElement.connectorShape || 'straight') === 'orthogonal'
                    ? '90° haaks'
                    : (selectedElement.connectorShape || 'straight') === 'curved'
                    ? 'vloeiend'
                    : 'recht'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1.5">
                {/* 1. Recht */}
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { connectorShape: 'straight' })}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    (selectedElement.connectorShape || 'straight') === 'straight'
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-2xs ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title="Recht: directe rechte lijn van punt naar punt"
                >
                  <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="20" x2="21" y2="4" />
                  </svg>
                  <span className="text-[11px] leading-tight">Recht</span>
                  <span className="text-[9px] text-slate-400">Direct</span>
                </button>

                {/* 2. Haaks */}
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { connectorShape: 'orthogonal' })}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    selectedElement.connectorShape === 'orthogonal'
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-2xs ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title="Haaks: professionele 90° rechte bochten (schema tracé)"
                >
                  <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 3 20 L 12 20 L 12 4 L 21 4" />
                  </svg>
                  <span className="text-[11px] leading-tight">Haaks</span>
                  <span className="text-[9px] text-slate-400">90° bochten</span>
                </button>

                {/* 3. Vloeiend */}
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { connectorShape: 'curved' })}
                  className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    selectedElement.connectorShape === 'curved'
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-2xs ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  title="Vloeiend: soepele, natuurlijke vloeiende boog"
                >
                  <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M 3 20 C 12 20, 12 4, 21 4" />
                  </svg>
                  <span className="text-[11px] leading-tight">Vloeiend</span>
                  <span className="text-[9px] text-slate-400">S-boog</span>
                </button>
              </div>
            </div>

            {/* Lijnstijl, dikte en kleur */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Lijnstijl</label>
                <select
                  value={selectedElement.lineStyle || 'solid'}
                  onChange={e => updateElement(selectedElement.id, { lineStyle: e.target.value as any })}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="solid">Doorlopend</option>
                  <option value="dashed">Gestreept</option>
                  <option value="dotted">Gestippeld</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Lijndikte</label>
                <select
                  value={selectedElement.strokeWidth || 2.5}
                  onChange={e => updateElement(selectedElement.id, { strokeWidth: parseFloat(e.target.value) })}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="1.5">Fijn (1.5px)</option>
                  <option value="2.5">Normaal (2.5px)</option>
                  <option value="4">Dik (4px)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Kleur</label>
              <select
                value={selectedElement.color || '#2563eb'}
                onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                className={`w-full px-2 py-1 text-xs rounded border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              >
                <option value="#2563eb">Blauw (Operator)</option>
                <option value="#64748b">Grijs (Standaard)</option>
                <option value="#ef4444">Rood (Demarcatie/Beveiligd)</option>
                <option value="#10b981">Groen (LAN)</option>
                <option value="#8b5cf6">Paars (Corporate Net)</option>
                <option value="#f59e0b">Oranje (PBX Routed)</option>
              </select>
            </div>
          </div>
        )}

        {/* GROOTTE / FORMAAT REGELAAR (voor alle elementen behalve connectoren) */}
        {selectedElement.type !== 'connector' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Grootte / Schaal
              </label>
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                {Math.round((selectedElement.scale || 1) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustElementScale(selectedElement.id, -0.1)}
                className={`w-7 h-7 rounded border font-bold flex items-center justify-center cursor-pointer transition-colors ${
                  darkMode ? 'bg-slate-750 border-slate-650 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
                title="Kleiner maken"
              >
                <Minus className="w-3 h-3" />
              </button>

              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.05"
                value={selectedElement.scale || 1}
                onChange={e => updateElement(selectedElement.id, { scale: parseFloat(e.target.value) })}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => adjustElementScale(selectedElement.id, 0.1)}
                className={`w-7 h-7 rounded border font-bold flex items-center justify-center cursor-pointer transition-colors ${
                  darkMode ? 'bg-slate-750 border-slate-650 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                }`}
                title="Groter maken"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Breedte & Hoogte bij Wolk en Tekst */}
        {(selectedElement.type === 'cloud' || selectedElement.type === 'text') && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Breedte (px)</label>
              <input
                type="number"
                value={selectedElement.width || 120}
                onChange={e => updateElement(selectedElement.id, { width: Math.max(30, parseInt(e.target.value, 10) || 50) })}
                className={`w-full px-2 py-1 text-xs rounded border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Hoogte (px)</label>
              <input
                type="number"
                value={selectedElement.height || 40}
                onChange={e => updateElement(selectedElement.id, { height: Math.max(15, parseInt(e.target.value, 10) || 20) })}
                className={`w-full px-2 py-1 text-xs rounded border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>
        )}

        {/* Tekst op maat instellen */}
        {selectedElement.type === 'text' && (
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] font-semibold text-slate-400">Tekst inhoud</label>
                {(selectedElement.width !== undefined || selectedElement.height !== undefined) && (
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { width: undefined, height: undefined })}
                    className="text-[9px] text-blue-500 hover:underline cursor-pointer"
                    title="Tekstveld automatisch passend maken aan de tekst"
                  >
                    Auto breedte/hoogte
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={selectedElement.customText || ''}
                onChange={e => updateElement(selectedElement.id, { customText: e.target.value })}
                placeholder="Typ tekst hier..."
                className={`w-full px-2.5 py-1 text-xs rounded border resize-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Lettergrootte</label>
                <select
                  value={selectedElement.fontSize || 'sm'}
                  onChange={e => updateElement(selectedElement.id, { fontSize: e.target.value as any })}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="xs">Extra klein (XS)</option>
                  <option value="sm">Standaard (SM)</option>
                  <option value="base">Normaal</option>
                  <option value="lg">Groot (Titel)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Uitlijning</label>
                <select
                  value={selectedElement.textAlign || 'center'}
                  onChange={e => updateElement(selectedElement.id, { textAlign: e.target.value as any })}
                  className={`w-full px-2 py-1 text-xs rounded border ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                  }`}
                >
                  <option value="center">Centreren</option>
                  <option value="left">Links</option>
                  <option value="right">Rechts</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Stijl &amp; Achtergrond</label>
              <select
                value={selectedElement.badgeStyle || 'badge-blue'}
                onChange={e => updateElement(selectedElement.id, { badgeStyle: e.target.value as any })}
                className={`w-full px-2 py-1 text-xs rounded border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              >
                <option value="badge-blue">Blauw Kader</option>
                <option value="badge-gray">Grijs Kader</option>
                <option value="badge-yellow">Geel Kader (Let op)</option>
                <option value="badge-red">Rood Kader (Beveiligd)</option>
                <option value="badge-green">Groen Kader (LAN)</option>
                <option value="card">Witte Kaart met schaduw</option>
                <option value="transparent">Transparant (alleen tekst)</option>
              </select>
            </div>
          </div>
        )}

        {/* Label & Positie voor hardware-elementen */}
        {(selectedElement.type === 'mediant' || selectedElement.type === 'router' || selectedElement.type === 'cloud' || selectedElement.type === 'pbx' || selectedElement.type === 'firewall' || selectedElement.type === 'phone' || selectedElement.type === 'sbc' || selectedElement.type === 'switch' || selectedElement.type === 'server' || selectedElement.type === 'workstation' || selectedElement.type === 'access-point') && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Label / Benaming</label>
              <input
                type="text"
                value={selectedElement.label || ''}
                onChange={e => updateElement(selectedElement.id, { label: e.target.value })}
                placeholder="Geen label (leeg voor strak canvas)"
                className={`w-full px-2.5 py-1 text-xs rounded border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>

            {selectedElement.type !== 'cloud' && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                  Positie van de naam (Label)
                </label>
                <select
                  value={selectedElement.namePlacement || 'auto'}
                  onChange={e => updateElement(selectedElement.id, { namePlacement: e.target.value as any })}
                  className={`w-full px-2 py-1 text-xs rounded border cursor-pointer ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="auto">Automatisch (slim ontwijken - overlapvrij)</option>
                  <option value="bottom">Onder het element</option>
                  <option value="top">Boven het element</option>
                  <option value="left">Links van het element</option>
                  <option value="right">Rechts van het element</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* FIREWALL SPECIFIEKE UITLEG: ONBEKEND TERREIN QUA IP-ADRESSERING */}
        {selectedElement.type === 'firewall' && (
          templateCategory === 'data' ? (
            <div className="p-3 rounded-lg border border-blue-300 dark:border-blue-700/60 bg-blue-50/90 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 space-y-2 mt-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Firewall (Data Dienst): WAN IP is terminerend adres</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
                Voor data diensten termineert de verbinding vóór de firewall op een <strong>WAN IP-adres</strong>. De firewall zelf en het achterliggende interne netwerk zijn <strong>klantbeheer / onbekend terrein</strong>. Er wordt géén PBX achter geplaatst.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 space-y-2 mt-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Firewall (Voice Dienst): PBX-adres is terminerend adres</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                Bij gebruik van een voice firewall door de klant is <strong>altijd het PBX-adres het adres waar we termineren vóór de firewall</strong>.
                De firewall zelf en het achterliggende interne netwerk zijn <strong>onbekend terrein</strong> (klantbeheer). 
                Er wordt <strong>géén fictief voorbeeldadres</strong> gebruikt.
              </p>

              {(() => {
                const pbxEl = elements.find(e => e.type === 'pbx');
                if (!pbxEl) return null;
                const pbxIp = pbxEl.lanIp || pbxEl.wanIp;
                return (
                  <div className="p-2 bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded text-[11px] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold block truncate">Gekoppelde PBX: {pbxEl.label || 'SIP PBX'}</span>
                      <span className="font-mono text-[10px] text-amber-900/80 dark:text-amber-200/80">
                        {pbxIp ? `PBX IP: ${pbxIp}` : 'Nog geen IP ingevuld op PBX'}
                      </span>
                    </div>
                    {pbxIp && pbxIp !== selectedElement.wanIp && (
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { wanIp: pbxIp })}
                        className="shrink-0 px-2 py-1 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded cursor-pointer transition-colors shadow-2xs"
                        title="PBX-adres overnemen als terminerend adres vóór de firewall"
                      >
                        Overnemen
                      </button>
                    )}
                  </div>
                );
              })()}

              {onAddBehindFirewall && (
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider block">
                    Achter de firewall plaatsen:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAddBehindFirewall(selectedElement.id, 'direct-pbx')}
                      className="w-full py-1.5 px-2.5 rounded text-[11px] font-semibold text-amber-900 dark:text-amber-100 bg-white/95 dark:bg-slate-800 hover:bg-amber-100/80 dark:hover:bg-slate-750 border border-amber-300 dark:border-amber-700 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ PBX direct achter Firewall</span>
                      </span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-mono">1-klik</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddBehindFirewall(selectedElement.id, 'cloud-pbx')}
                      className="w-full py-1.5 px-2.5 rounded text-[11px] font-semibold text-amber-900 dark:text-amber-100 bg-white/95 dark:bg-slate-800 hover:bg-amber-100/80 dark:hover:bg-slate-750 border border-amber-300 dark:border-amber-700 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>+ LAN-wolk &amp; PBX achter Firewall</span>
                      </span>
                      <span className="text-[9px] text-amber-700 dark:text-amber-400 font-mono">1-klik</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* PBX SPECIFIEKE UITLEG ALS ER EEN FIREWALL IN HET ONTWERP IS (ALLEEN VOICE) */}
        {selectedElement.type === 'pbx' && templateCategory !== 'data' && elements.some(e => e.type === 'firewall') && (
          <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Klant gebruikt een firewall</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
              Dit PBX-adres is tevens het adres waar getermineerd wordt vóór de firewall. Wijzigingen worden gesynchroniseerd.
            </p>
          </div>
        )}

        {/* WAN EN LAN IP-ADRESSEN OP HET CANVAS (Flexibele overlapvrije weergave) */}
        {['mediant', 'router', 'firewall', 'pbx', 'sbc', 'switch', 'server', 'workstation', 'access-point'].includes(selectedElement.type) && (
          <div className={`p-2.5 rounded-lg border space-y-2.5 mt-2 transition-all ${
            darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between border-b pb-1.5 border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Network className="w-3.5 h-3.5" />
                {selectedElement.type === 'firewall' 
                  ? (templateCategory === 'data' ? 'Terminerend WAN IP (vóór FW)' : 'Terminerend PBX-adres (vóór FW)')
                  : 'WAN & LAN IP-Adressen'}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">Canvas weergave</span>
            </div>

            {/* WAN IP / Terminerend IP Veld */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-blue-700 dark:text-blue-400">
                  <input
                    type="checkbox"
                    checked={selectedElement.showWanIp ?? (selectedElement.type === 'mediant' || selectedElement.type === 'router' || selectedElement.type === 'sbc' || selectedElement.type === 'firewall' || Boolean(selectedElement.wanIp))}
                    onChange={e => updateElement(selectedElement.id, { showWanIp: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                  />
                  <span>
                    {selectedElement.type === 'firewall' 
                      ? (templateCategory === 'data' ? 'WAN IP-adres (terminerend vóór FW)' : 'PBX-adres (terminerend vóór FW)') 
                      : 'WAN IP-adres'}
                  </span>
                </label>
                <span className="text-[9px] text-slate-400 font-mono">
                  {(selectedElement.showWanIp ?? (selectedElement.type === 'mediant' || selectedElement.type === 'router' || selectedElement.type === 'sbc' || selectedElement.type === 'firewall' || Boolean(selectedElement.wanIp))) ? 'Zichtbaar' : 'Verborgen'}
                </span>
              </div>
              <input
                type="text"
                value={selectedElement.wanIp || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateElement(selectedElement.id, { wanIp: val });
                  // Als dit een voice firewall is, synchroniseer ook met de gekoppelde PBX
                  if (selectedElement.type === 'firewall' && templateCategory !== 'data') {
                    const pbxEl = elements.find(el => el.type === 'pbx');
                    if (pbxEl) {
                      updateElement(pbxEl.id, { lanIp: val });
                    }
                  }
                }}
                placeholder="x.x.x.x"
                className={`w-full px-2.5 py-1 text-xs rounded border font-mono ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-blue-300' : 'bg-white border-slate-300 text-blue-900'
                }`}
              />
              {selectedElement.type === 'firewall' && (
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight">
                  {templateCategory === 'data' 
                    ? 'Het WAN IP-adres termineert vóór de firewall. Geen voorbeeldadres (x.x.x.x).' 
                    : 'Het PBX-adres is altijd het adres waar getermineerd wordt vóór de firewall. Geen voorbeeldadres.'}
                </p>
              )}
            </div>

            {/* LAN IP Veld */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-bold ${
                  selectedElement.type === 'firewall' ? 'text-slate-600 dark:text-slate-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedElement.showLanIp ?? (selectedElement.type === 'mediant' || selectedElement.type === 'pbx' || (selectedElement.type === 'firewall' ? false : Boolean(selectedElement.lanIp)))}
                    onChange={e => updateElement(selectedElement.id, { showLanIp: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                  />
                  <span>
                    {selectedElement.type === 'firewall' ? 'Achterliggend LAN (Onbekend terrein)' : 'LAN IP-adres'}
                  </span>
                </label>
                <span className="text-[9px] text-slate-400 font-mono">
                  {(selectedElement.showLanIp ?? (selectedElement.type === 'mediant' || selectedElement.type === 'pbx' || (selectedElement.type === 'firewall' ? false : Boolean(selectedElement.lanIp)))) ? 'Zichtbaar' : 'Verborgen'}
                </span>
              </div>
              <input
                type="text"
                value={selectedElement.lanIp || ''}
                onChange={e => {
                  const val = e.target.value;
                  updateElement(selectedElement.id, { lanIp: val });
                  // Als dit een PBX is en er is een firewall in het ontwerp, synchroniseer het terminerende adres vóór de firewall
                  if (selectedElement.type === 'pbx') {
                    const fwEl = elements.find(el => el.type === 'firewall');
                    if (fwEl) {
                      updateElement(fwEl.id, { wanIp: val });
                    }
                  }
                }}
                placeholder={selectedElement.type === 'firewall' ? 'Onbekend (Klantbeheer)' : selectedElement.type === 'pbx' ? 'PBX IP-adres' : 'IP-adres'}
                className={`w-full px-2.5 py-1 text-xs rounded border font-mono ${
                  darkMode ? 'bg-slate-950 border-slate-700 text-emerald-300' : 'bg-white border-slate-300 text-emerald-900'
                }`}
              />
              {selectedElement.type === 'firewall' && (
                <p className="text-[9px] text-slate-400 leading-tight">
                  Interne IP-adressen op en achter de firewall zijn klantbeheer (onbekend terrein).
                </p>
              )}
            </div>

            {/* Positie van IP-adres veldjes */}
            <div className="pt-1">
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                Positie IP-adres veldjes
              </label>
              <select
                value={selectedElement.ipPlacement || 'auto'}
                onChange={e => updateElement(selectedElement.id, { ipPlacement: e.target.value as any })}
                className={`w-full px-2 py-1 text-xs rounded border cursor-pointer ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="auto">Automatisch (links of rechts - 100% overlapvrij)</option>
                <option value="right">Rechts van het element</option>
                <option value="left">Links van het element</option>
              </select>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                Veldjes schakelen automatisch tussen links en rechts zodra een ander element of connector in de weg staat.
              </p>
            </div>
          </div>
        )}

        {/* IP-ADRES UITVRAAGSCENARIO KOPPELING VOOR DIT ELEMENT */}
        {['router', 'mediant', 'firewall', 'pbx', 'cloud', 'sbc'].includes(selectedElement.type) && (
          <div className={`p-2.5 rounded-lg border space-y-2 mt-2 transition-all ${
            selectedElement.requiresIp === false
              ? darkMode ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-100/60 border-slate-200 opacity-70'
              : darkMode ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50/70 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Network className="w-3 h-3" />
                IP-Uitvraagscenario
              </span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold">
                <input
                  type="checkbox"
                  checked={selectedElement.requiresIp !== false}
                  onChange={e => updateElement(selectedElement.id, { requiresIp: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                  {selectedElement.requiresIp !== false ? 'Actief' : 'Uit'}
                </span>
              </label>
            </div>

            {selectedElement.requiresIp !== false ? (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Dit element genereert automatisch IP-invoervelden in het uitvraagscenario:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedElement.type === 'mediant' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Voice WAN IP</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Voice LAN IP</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Subnetmasker</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Gateway</span>
                    </>
                  )}
                  {selectedElement.type === 'router' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">WAN IP</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Default Gateway</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">LAN Interface</span>
                    </>
                  )}
                  {selectedElement.type === 'firewall' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-semibold">Terminerend IP (vóór FW)</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">Achterliggende Topologie (Onbekend)</span>
                    </>
                  )}
                  {selectedElement.type === 'pbx' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">SIP PBX IP</span>
                    </>
                  )}
                  {selectedElement.type === 'cloud' && (
                    <span className="text-[9px] text-slate-500 italic">
                      {templateCategory === 'data' ? 'LAN-subnet gedekt door Router invulvelden' : 'LAN-subnet reeds gedekt door Mediant invulvelden'}
                    </span>
                  )}
                  {selectedElement.type === 'sbc' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">SBC Peering IP</span>
                    </>
                  )}
                  {selectedElement.type === 'switch' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Switch Mgmt IP</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Default Gateway</span>
                    </>
                  )}
                  {selectedElement.type === 'server' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Server IP</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Subnetmasker</span>
                    </>
                  )}
                  {selectedElement.type === 'workstation' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">Client IP</span>
                    </>
                  )}
                  {selectedElement.type === 'access-point' && (
                    <>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">AP Mgmt IP</span>
                    </>
                  )}
                </div>

                {onOpenScenarioTab && (
                  <button
                    type="button"
                    onClick={onOpenScenarioTab}
                    className="w-full mt-1 py-1 px-2 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-750 border border-blue-200 dark:border-blue-900 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Bekijk in Uitvraagscenario tab</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                IP-uitvraag uitgeschakeld voor dit specifieke element.
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border text-center ${
      darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-100/60 border-slate-200 text-slate-500'
    }`}>
      <Move className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
      <p className="text-xs font-semibold">Geen element geselecteerd</p>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Klik op een element op het canvas om grootte en eigenschappen aan te passen of toets <kbd className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[9px] font-bold">DEL</kbd> om te verwijderen.
      </p>
    </div>
  );
}
