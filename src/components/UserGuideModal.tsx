import React from 'react';
import { X, MousePointer, Move, ZoomIn, Hash, Server, Download, ShieldCheck, BookOpen, Edit3, Maximize2, Network, FolderOpen } from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  darkMode?: boolean;
}

export function UserGuideModal({ isOpen, onClose, language, darkMode = false }: Props) {
  if (!isOpen) return null;

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t.userGuideTitle}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.appSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            title={t.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          <p className="text-slate-500 leading-relaxed text-sm">
            {t.guideIntro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct bewerken in het ontwerp */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/50' : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                  {t.guideInlineEditTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideInlineEditDesc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-1 rounded-md">
                <span>Klik & Typ = Direct Opslaan</span>
              </div>
            </div>

            {/* Handmatig vergroten/verkleinen van routers & wolken */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-cyan-500/50' : 'bg-cyan-50/50 border-cyan-100 hover:border-cyan-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-600 text-white">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-cyan-800 dark:text-cyan-300">
                  {t.guideResizeTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideResizeDesc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-800 dark:text-cyan-400 bg-cyan-100/60 dark:bg-cyan-900/40 px-2 py-1 rounded-md">
                <span>Hoekhandvat ⤡ slepen | Dubbelklik = 100%</span>
              </div>
            </div>

            {/* Rechtermuisknop verplaatsen */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-blue-500/50' : 'bg-blue-50/50 border-blue-100 hover:border-blue-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                  <Move className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300">
                  {t.guideRightClickTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideRightClickDesc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-1 rounded-md">
                <MousePointer className="w-3.5 h-3.5" />
                <span>Right-Click & Drag</span>
              </div>
            </div>

            {/* Slimme Endpoint Routering */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-purple-500/50' : 'bg-purple-50/50 border-purple-100 hover:border-purple-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                  <Network className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-purple-800 dark:text-purple-300">
                  {t.guideSubnetRoutingTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideSubnetRoutingDesc}
              </p>
            </div>

            {/* Panning & Zoom */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  {t.guidePanZoomTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guidePanZoomDesc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-1 rounded-md">
                <span>Left-Click Drag = Pan | Scroll = Zoom</span>
              </div>
            </div>

            {/* Projectnummer & Klant */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Hash className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-300">
                  {t.guideProjectTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideProjectDesc}
              </p>
            </div>

            {/* B2BUA Demarcatie */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-red-500/50' : 'bg-red-50/50 border-red-100 hover:border-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-600 text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-red-700 dark:text-red-300">
                  {t.guideB2buaTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideB2buaDesc}
              </p>
            </div>

            {/* JSON Slepen & Neerzetten (Drag & Drop) */}
            <div className={`p-4 rounded-xl border transition-all ${
              darkMode ? 'bg-slate-800/60 border-slate-700/80 hover:border-amber-500/50' : 'bg-amber-50/50 border-amber-100 hover:border-amber-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                  {t.guideDragDropTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.guideDragDropDesc}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-1 rounded-md">
                <span>📁 .json bestand slepen &amp; direct loslaten op het scherm</span>
              </div>
            </div>
          </div>

          {/* Export card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <Download className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {t.guideExportTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.guideExportDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3.5 border-t flex justify-end ${
          darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
