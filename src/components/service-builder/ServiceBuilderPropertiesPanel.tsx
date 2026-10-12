import React from 'react';
import { BuilderElement } from '../../types';
import { Sliders, Trash2, Copy, Link2, Unlink, Plus, Minus, Move } from 'lucide-react';

interface ServiceBuilderPropertiesPanelProps {
  selectedIds: string[];
  selectedElement: BuilderElement | null;
  elements: BuilderElement[];
  darkMode: boolean;
  handleDeleteSelected: () => void;
  handleDuplicateElement: (id: string) => void;
  handleDeleteElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<BuilderElement>) => void;
  adjustElementScale: (id: string, delta: number) => void;
  getTargetName: (targetId?: string) => string;
}

export function ServiceBuilderPropertiesPanel({
  selectedIds,
  selectedElement,
  darkMode,
  handleDeleteSelected,
  handleDuplicateElement,
  handleDeleteElement,
  updateElement,
  adjustElementScale,
  getTargetName
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
            Geselecteerd: {selectedElement.type.toUpperCase()}
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
            <div className="p-2.5 rounded bg-blue-50/80 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
              <strong className="block mb-1 flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <Link2 className="w-3.5 h-3.5" />
                Aansluitende Connectoren:
              </strong>
              Sleep de ronde handvatten (begin- en eindpunt) op het canvas naar de gewenste elementen. Zodra u een handvat op een element loslaat, sluit de connector er automatisch strak op aan. U kunt ook op het midden van de connector klikken en slepen om hem in zijn geheel te verplaatsen.
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
                <option value="#8b5cf6">Paars (Corporate Network)</option>
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

        {/* Label bewerken voor hardware-elementen */}
        {(selectedElement.type === 'mediant' || selectedElement.type === 'router' || selectedElement.type === 'cloud' || selectedElement.type === 'pbx' || selectedElement.type === 'firewall') && (
          <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Label / Benaming</label>
            <input
              type="text"
              value={selectedElement.label || ''}
              onChange={e => updateElement(selectedElement.id, { label: e.target.value })}
              className={`w-full px-2.5 py-1 text-xs rounded border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
              }`}
            />
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
