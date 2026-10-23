import React, { useEffect } from 'react';
import { CustomServiceDefinition } from '../../types';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

interface ConfirmDeleteTemplateModalProps {
  isOpen: boolean;
  service: CustomServiceDefinition | null;
  darkMode?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteTemplateModal({
  isOpen,
  service,
  darkMode = false,
  onConfirm,
  onCancel
}: ConfirmDeleteTemplateModalProps) {
  // ESC key cancels dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !service) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden transition-all animate-in zoom-in-95 duration-150 ${
          darkMode 
            ? 'bg-slate-900 border-red-900/60 text-slate-100' 
            : 'bg-white border-red-200 text-slate-800'
        }`}
      >
        {/* Rode waarschuwingsbalk bovenaan */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="p-6">
          {/* Header met waarschuwingsicoon en sluitknop */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Template Definitief Verwijderen?
                </h3>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Bevestiging vereist voor verwijdering
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Annuleren"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Template Info Kaart */}
          <div className={`p-3.5 rounded-xl border mb-4 ${
            darkMode ? 'bg-slate-850/80 border-slate-750' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-2xs">
                  {service.code}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  service.category === 'data' 
                    ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300' 
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                }`}>
                  {service.category === 'data' ? '🌐 Data Netwerk' : '🎙️ Voice Netwerk'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {service.builderElements?.length || 0} canvas elementen
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {service.name}
            </h4>
            {service.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          {/* Waarschuwing tekstblok */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 mb-6 ${
            darkMode 
              ? 'bg-red-950/30 border-red-800/50 text-red-200' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold text-red-700 dark:text-red-300">
                Waarschuwing: Deze template wordt daadwerkelijk en permanent verwijderd!
              </p>
              <p className="opacity-90">
                Weet je zeker dat je <strong>&quot;{service.name}&quot;</strong> wilt verwijderen? Deze actie kan <strong>niet ongedaan</strong> worden gemaakt.
              </p>
              <p className="text-[11px] opacity-75">
                Bestaande locaties die deze template reeds gebruiken blijven behouden, maar de template kan daarna niet meer opnieuw gekozen worden in de selector.
              </p>
            </div>
          </div>

          {/* Knoppen: Annuleren & Bevestigen */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              Annuleren (Behouden)
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-98 text-white shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Ja, Definitief Verwijderen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
