import React from 'react';
import { CustomServiceDefinition } from '../../types';
import { Plus, Trash2, Sliders, Copy } from 'lucide-react';

interface SavedServicesTabProps {
  darkMode: boolean;
  servicesList: CustomServiceDefinition[];
  setActiveTab: (tab: 'studio' | 'scenario' | 'saved') => void;
  onRequestDelete: (service: CustomServiceDefinition) => void;
  onLoadService?: (service: CustomServiceDefinition) => void;
  handleDeleteSaved?: (id: string) => void;
}

export function SavedServicesTab({
  darkMode,
  servicesList,
  setActiveTab,
  onRequestDelete,
  onLoadService,
  handleDeleteSaved
}: SavedServicesTabProps) {
  const [filterCategory, setFilterCategory] = React.useState<'all' | 'voice' | 'data'>('all');

  const filtered = servicesList.filter(s => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'data') return s.category === 'data';
    return s.category !== 'data';
  });

  const handleDeleteClick = (svc: CustomServiceDefinition) => {
    if (onRequestDelete) {
      onRequestDelete(svc);
    } else if (handleDeleteSaved) {
      handleDeleteSaved(svc.id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Bestaande Diensten &amp; Templates
          </h3>
          <p className="text-xs text-slate-400">
            Alle bestaande ingebouwde diensten en eigen templates die beschikbaar zijn. Kies een dienst om als basis te laden in de Studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Categorie Filter Tabs */}
          <div className={`p-1 rounded-xl border flex text-xs font-bold ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Alle ({servicesList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('voice')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterCategory === 'voice'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🎙️ Voice</span>
              <span>({servicesList.filter(s => s.category !== 'data').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('data')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filterCategory === 'data'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🌐 Data</span>
              <span>({servicesList.filter(s => s.category === 'data').length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw Template</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {filtered.map(svc => (
          <div
            key={svc.id}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              svc.isBuiltIn
                ? darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
                : darkMode ? 'bg-slate-800 border-blue-500/50 shadow-sm' : 'bg-blue-50/50 border-blue-200 shadow-sm'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    svc.isBuiltIn ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-blue-600 text-white'
                  }`}>
                    {svc.code}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    svc.category === 'data' 
                      ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300' 
                      : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                  }`}>
                    {svc.category === 'data' ? '🌐 Data' : '🎙️ Voice'}
                  </span>
                </div>
                {svc.isBuiltIn ? (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Ingebouwd</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Eigen Template
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {svc.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                {svc.description || 'Geen toelichting opgegeven.'}
              </p>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 dark:text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700">{svc.cpeCount}x Mediant/CPE</span>
                {svc.hasWan && <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">WAN</span>}
                {svc.hasVoiceLan && <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">LAN</span>}
                {svc.hasCn && <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">CN</span>}
                {svc.hasFirewall && <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">Firewall</span>}
                {svc.hasCustomerLanCloud && <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">LAN Wolk</span>}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-750">
              {onLoadService && (
                <button
                  type="button"
                  onClick={() => onLoadService(svc)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    darkMode 
                      ? 'bg-slate-750 hover:bg-slate-700 text-slate-200 border-slate-650' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="Open dit template in de studio om het te bekijken of te bewerken"
                >
                  {svc.isBuiltIn ? <Copy className="w-3.5 h-3.5 text-blue-500" /> : <Sliders className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{svc.isBuiltIn ? 'Als basis laden' : 'Bewerken in Studio'}</span>
                </button>
              )}

              {!svc.isBuiltIn ? (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(svc)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5 font-bold transition-all cursor-pointer ml-auto"
                  title="Template definitief verwijderen (vereist bevestiging)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Template Verwijderen</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 italic ml-auto select-none">
                  Ingebouwd template
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
