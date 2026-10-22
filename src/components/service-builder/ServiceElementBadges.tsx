import React from 'react';
import { BuilderElement } from '../../types';
import { BadgePlacementResult } from './serviceBuilderGeometry';
import { BuilderInlineEdit } from './BuilderInlineEdit';

interface ServiceElementBadgesProps {
  el: BuilderElement;
  placement: BadgePlacementResult | null | undefined;
  updateElement: (id: string, updates: Partial<BuilderElement>) => void;
  onSelect: () => void;
  elements?: BuilderElement[];
}

/**
 * ServiceElementBadges:
 * Flexibele, overlapvrije weergave van:
 * 1. Elementnaam (Label): Onder, boven, links of rechts van het element
 * 2. IP-adressen (WAN & LAN): Links of rechts van het element
 * 
 * Volgt strikt:
 * - Geen fictieve voorbeeldadressen gebruiken.
 * - Bij gebruik van een firewall door de klant is het PBX-adres het adres waar getermineerd wordt vóór de firewall.
 * - Intern LAN achter de firewall is onbekend terrein (klantbeheer).
 */
export const ServiceElementBadges: React.FC<ServiceElementBadgesProps> = ({
  el,
  placement,
  updateElement,
  onSelect,
  elements = []
}) => {
  if (!placement) return null;

  return (
    <>
      {/* 1. NAAMVELD (Onder, boven, links of rechts - 100% overlapvrij met andere elementen) */}
      {placement.hasName && (
        <div
          className={`absolute pointer-events-auto z-30 transition-all select-none ${
            placement.nameSide === 'bottom'
              ? 'top-[calc(100%+4px)] left-1/2 -translate-x-1/2'
              : placement.nameSide === 'top'
              ? 'bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2'
              : placement.nameSide === 'left'
              ? 'right-[calc(100%+6px)] top-1/2 -translate-y-1/2'
              : 'left-[calc(100%+6px)] top-1/2 -translate-y-1/2'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div 
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 hover:bg-slate-900 text-white shadow-xs border border-slate-700/60 text-[10px] font-mono font-bold whitespace-nowrap cursor-pointer"
            title="Elementnaam (Klik om direct aan te passen)"
          >
            <BuilderInlineEdit
              value={el.label || ''}
              placeholder={el.type === 'mediant' ? 'Mediant' : el.type === 'router' ? 'Core Router' : el.type.toUpperCase()}
              onSave={(val) => updateElement(el.id, { label: val })}
              className="text-white hover:text-blue-200"
              inputClassName="text-slate-900 text-[10px] py-0 px-1"
              title="Klik om de naam van dit element direct aan te passen"
            />
          </div>
        </div>
      )}

      {/* 2. IP-ADRES VELDJES (WAN & LAN: links of rechts van het element - 100% overlapvrij) */}
      {placement.hasIp && (
        <div
          className={`absolute pointer-events-auto z-30 transition-all select-none ${
            placement.ipSide === 'right'
              ? 'left-[calc(100%+6px)] top-1/2 -translate-y-1/2'
              : 'right-[calc(100%+6px)] top-1/2 -translate-y-1/2'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1 p-1 rounded-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-xs text-[9px] font-mono leading-tight whitespace-nowrap">
            {placement.showWan && (
              <div
                className="flex items-center gap-1.5"
                title={el.type === 'firewall' ? "PBX-adres: terminerend adres vóór de firewall (geen voorbeeldadres)" : "Klik om WAN IP-adres aan te passen"}
              >
                <span className={`px-1 py-0.2 rounded font-bold text-[8px] tracking-tight ${
                  el.type === 'firewall'
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                }`}>
                  {el.type === 'firewall' ? 'PBX-adres (vóór FW)' : 'WAN'}
                </span>
                {(() => {
                  const linkedPbx = elements.find(e => e.type === 'pbx');
                  const firewallTermIp = el.type === 'firewall'
                    ? (el.wanIp || (linkedPbx ? (linkedPbx.lanIp || linkedPbx.wanIp) : '') || '')
                    : (el.wanIp || '');
                  return (
                    <BuilderInlineEdit
                      value={firewallTermIp}
                      placeholder={el.type === 'firewall' ? 'PBX-adres vóór FW' : 'IP-adres'}
                      isIp
                      onSave={(val) => {
                        updateElement(el.id, { wanIp: val });
                        // Bij gebruik van firewall is het PBX-adres het adres waar getermineerd wordt vóór de firewall
                        if (el.type === 'firewall' && linkedPbx) {
                          updateElement(linkedPbx.id, { lanIp: val });
                        }
                      }}
                      className={`${
                        el.type === 'firewall'
                          ? 'text-amber-950 dark:text-amber-200 font-bold hover:text-amber-600'
                          : 'text-blue-950 dark:text-blue-200 font-semibold hover:text-blue-600'
                      }`}
                      inputClassName="text-slate-900 text-[9px] py-0 px-1"
                      title={el.type === 'firewall' ? "Terminerend PBX-adres vóór firewall (geen voorbeeldadres)" : "Klik om WAN IP direct aan te passen"}
                    />
                  );
                })()}
              </div>
            )}
            {placement.showLan && (
              <div
                className="flex items-center gap-1.5"
                title={el.type === 'firewall' ? "Achterliggend LAN (Onbekend terrein - Klantbeheer)" : "Klik om LAN IP-adres aan te passen"}
              >
                <span className={`px-1 py-0.2 rounded font-bold text-[8px] tracking-tight ${
                  el.type === 'firewall'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {el.type === 'firewall' ? 'LAN (Klant)' : 'LAN'}
                </span>
                <BuilderInlineEdit
                  value={el.lanIp || ''}
                  placeholder={el.type === 'firewall' ? 'Onbekend (Klant)' : el.type === 'pbx' ? 'PBX IP' : 'IP-adres'}
                  isIp={el.type !== 'firewall'}
                  onSave={(val) => {
                    updateElement(el.id, { lanIp: val });
                    // Als PBX gewijzigd wordt en er is een firewall in het ontwerp, synchroniseer het terminerende adres vóór de firewall
                    if (el.type === 'pbx') {
                      const fw = elements.find(e => e.type === 'firewall');
                      if (fw) {
                        updateElement(fw.id, { wanIp: val });
                      }
                    }
                  }}
                  className={`${
                    el.type === 'firewall'
                      ? 'text-slate-600 dark:text-slate-400 italic hover:text-slate-900 dark:hover:text-slate-200'
                      : 'text-emerald-950 dark:text-emerald-200 font-semibold hover:text-emerald-600'
                  }`}
                  inputClassName="text-slate-900 text-[9px] py-0 px-1"
                  title={el.type === 'firewall' ? "Achterliggend LAN (Klantbeheer - intern onbekend)" : "Klik om LAN IP direct aan te passen"}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
