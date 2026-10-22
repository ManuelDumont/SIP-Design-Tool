import React, { useState } from 'react';
import { BuilderElement, IntakeScenario } from '../../types';
import { exportIntakeScenarioToText } from './serviceBuilderScenario';
import { 
  Building2, Hash, MapPin, Network, Server, Shield, 
  Copy, Check, FileText, HelpCircle, CheckCircle2, 
  ArrowRight, AlertCircle, Sparkles, Sliders
} from 'lucide-react';

interface ServiceBuilderScenarioTabProps {
  darkMode: boolean;
  serviceName: string;
  elements: BuilderElement[];
  scenario: IntakeScenario;
  onUpdateScenario?: (updated: IntakeScenario) => void;
  onNavigateToStudio: () => void;
}

export function ServiceBuilderScenarioTab({
  darkMode,
  serviceName,
  elements,
  scenario,
  onUpdateScenario,
  onNavigateToStudio
}: ServiceBuilderScenarioTabProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [testValues, setTestValues] = useState<Record<string, string>>({
    customerName: 'Acme Logistics B.V.',
    projectNumber: 'PRJ20241',
    locations: 'Hoofdkantoor Utrecht, Hub Rotterdam'
  });
  const [viewMode, setViewMode] = useState<'overview' | 'test-form'>('overview');

  const handleCopyText = () => {
    const text = exportIntakeScenarioToText(scenario, serviceName || 'Nieuwe Dienst');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleTestValueChange = (key: string, val: string) => {
    setTestValues(prev => ({ ...prev, [key]: val }));
  };

  const generalQuestions = scenario.questions.filter(q => q.category === 'general');
  const technicalQuestions = scenario.questions.filter(q => q.category !== 'general');

  // Groepeer technische vragen per element
  const groupedTech: Record<string, { type?: string; elementId?: string; questions: typeof technicalQuestions }> = {};
  technicalQuestions.forEach(q => {
    const key = q.elementName || 'Overig';
    if (!groupedTech[key]) {
      groupedTech[key] = {
        type: q.elementType,
        elementId: q.elementId,
        questions: []
      };
    }
    groupedTech[key].questions.push(q);
  });

  const getElementIcon = (type?: string) => {
    switch (type) {
      case 'router': return <Network className="w-4 h-4 text-blue-500" />;
      case 'mediant': return <Server className="w-4 h-4 text-sky-500" />;
      case 'firewall': return <Shield className="w-4 h-4 text-red-500" />;
      case 'pbx': return <Server className="w-4 h-4 text-amber-500" />;
      case 'cloud': return <Network className="w-4 h-4 text-indigo-500" />;
      default: return <Sliders className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* BOVENBALK: Titel en actieknoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold">
              Uitvraagscenario &amp; Intake Checklist
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {technicalQuestions.length} IP-vragen gekoppeld
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Als u elementen aan het canvas toevoegt waar IP-adressen voor nodig zijn (routers, medianten, firewalls, PBXen), wordt hier automatisch het bijbehorende uitvraagscenario opgebouwd. <strong>Sowieso altijd klantnaam, projectnummer en locatie(s)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Overzicht
            </button>
            <button
              type="button"
              onClick={() => setViewMode('test-form')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'test-form'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Test Formulier
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyText}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : darkMode
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
            }`}
            title="Kopieer complete intake-checklist naar klembord voor e-mail of dossier"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Gekopieerd!' : 'Kopieer Checklist'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <div className="space-y-6">
          {/* DEEL 1: ALTIJD VAN TOEPASSING (SOWIESO ALTIJD KLANTNAAM, PROJECTNUMMER, LOCATIE(S)) */}
          <div className={`p-4.5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-bold">
                    Algemene Dossiergegevens (Sowieso Altijd)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Standaard verplichte basisvragen voor elke telecomopdracht conform KPN / operator standaarden
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Altijd Verplicht
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Klantnaam */}
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-bold">Klantnaam</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Officiële handels- of bedrijfsnaam van de klantorganisatie.
                </p>
                <div className="mt-2 text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Veld: Tekstinvoer (Verplicht)
                </div>
              </div>

              {/* Projectnummer */}
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs font-bold">Projectnummer (8 tekens)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exact 8 tekens of cijfers (bijv. PRJ20241 of 12345678).
                </p>
                <div className="mt-2 text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Veld: Vaste 8-tekens code (Verplicht)
                </div>
              </div>

              {/* Locatie(s) */}
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold">Locatie(s)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Eén of meerdere vestigingen / aansluitadressen onder elkaar.
                </p>
                <div className="mt-2 text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Veld: Lijst van locaties (Verplicht)
                </div>
              </div>
            </div>
          </div>

          {/* DEEL 2: ELEMENT-GEDREVEN IP-ADRES UITVRAAG */}
          <div className={`p-4.5 rounded-2xl border transition-all ${
            darkMode ? 'bg-slate-850/80 border-slate-800' : 'bg-slate-50/90 border-slate-200 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <div>
                  <h4 className="text-sm font-bold">
                    Element &amp; IP-adres Uitvraag per Netwerkcomponent
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dynamisch gegenereerd op basis van de apparatuur op het canvas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateToStudio}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Canvas bewerken</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {Object.keys(groupedTech).length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 space-y-2">
                <Network className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                <p className="text-sm font-semibold">Nog geen netwerkelementen met IP-adressen op het canvas</p>
                <p className="text-xs max-w-md mx-auto">
                  Plaats in Templates een <strong>Router</strong>, <strong>Mediant</strong>, <strong>Firewall</strong>, <strong>SIP PBX</strong> of <strong>Wolk</strong>. Zodra u een element toevoegt, bouwt het systeem hier automatisch de uitvraagscenario&apos;s voor!
                </p>
                <button
                  type="button"
                  onClick={onNavigateToStudio}
                  className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Naar Templates gaan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedTech).map(([elemName, group]) => (
                  <div
                    key={elemName}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {getElementIcon(group.type)}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {elemName}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        {group.questions.length} velden
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.questions.map(q => (
                        <div
                          key={q.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-700/60 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {q.label}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              q.required ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                            }`}>
                              {q.required ? 'Verplicht' : 'Optioneel'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {q.description}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            Voorbeeld: <span className="text-slate-700 dark:text-slate-300">{q.placeholder}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TEST FORMULIER MODUS: Live interactief formulier zoals het er voor de gebruiker / engineer uitziet */
        <div className={`p-5 rounded-2xl border max-w-2xl mx-auto space-y-5 ${
          darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="border-b pb-3 border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Live Simulatie van het Uitvraagformulier
              </h4>
              <p className="text-xs text-slate-400">
                Zo ervaart een engineer of klant het invullen van deze dienst
              </p>
            </div>
            <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
              Testmodus
            </span>
          </div>

          {/* Basisgegevens */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Algemene Gegevens
            </h5>
            <div>
              <label className="text-xs font-semibold block mb-1">
                Klantnaam *
              </label>
              <input
                type="text"
                value={testValues.customerName || ''}
                onChange={e => handleTestValueChange('customerName', e.target.value)}
                placeholder="Bijv. Bedrijf B.V."
                className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold">
                  Projectnummer (exact 8 tekens) *
                </label>
                <span className={`text-[10px] font-mono font-bold ${
                  (testValues.projectNumber || '').length === 8 ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  {(testValues.projectNumber || '').length}/8 tekens
                </span>
              </div>
              <input
                type="text"
                maxLength={8}
                value={testValues.projectNumber || ''}
                onChange={e => handleTestValueChange('projectNumber', e.target.value.toUpperCase())}
                placeholder="PRJ20241"
                className={`w-full px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">
                Locatie(s) *
              </label>
              <input
                type="text"
                value={testValues.locations || ''}
                onChange={e => handleTestValueChange('locations', e.target.value)}
                placeholder="Hoofdkantoor Utrecht"
                className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Technische velden */}
          {technicalQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. IP-adressen &amp; Netwerkconfiguratie
              </h5>

              <div className="space-y-3">
                {technicalQuestions.map(q => (
                  <div key={q.id}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold">
                        {q.label} {q.required && '*'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {q.type.toUpperCase()}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={testValues[q.fieldKey] || ''}
                      onChange={e => handleTestValueChange(q.fieldKey, e.target.value)}
                      placeholder={q.placeholder}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border font-mono ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                      }`}
                    />
                    {q.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{q.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-400">
            Dit testformulier controleert de validatie en look &amp; feel van uw uitvraagscenario.
          </div>
        </div>
      )}
    </div>
  );
}
