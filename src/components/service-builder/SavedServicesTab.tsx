import React from 'react';
import { CustomServiceDefinition } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface SavedServicesTabProps {
  darkMode: boolean;
  servicesList: CustomServiceDefinition[];
  setActiveTab: (tab: 'studio' | 'saved') => void;
  handleDeleteSaved: (id: string) => void;
}

export function SavedServicesTab({
  darkMode,
  servicesList,
  setActiveTab,
  handleDeleteSaved
}: SavedServicesTabProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Beheer van Ingebouwde &amp; Zelf Samengestelde Diensten
          </h3>
          <p className="text-xs text-slate-400">
            Alle diensten die beschikbaar zijn in de dropdown-lijsten van locaties en Medianten.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Dienst Samenstellen</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
        {servicesList.map(svc => (
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
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  svc.isBuiltIn ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'bg-blue-600 text-white'
                }`}>
                  {svc.code}
                </span>
                {svc.isBuiltIn ? (
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Ingebouwd</span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Eigen Dienst
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

            {!svc.isBuiltIn && (
              <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleDeleteSaved(svc.id)}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Verwijderen</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
