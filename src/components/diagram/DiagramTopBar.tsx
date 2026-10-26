import React from 'react';
import { VodafoneZiggoLogo } from '../VodafoneZiggoLogo';
import { DiagramInlineEdit } from './DiagramInlineEdit';

export interface DiagramTopBarProps {
  isEspritMulti: boolean;
  clientName?: string;
  effectiveCustomerName: string;
  effectiveProjectNumber: string;
  onUpdateCustomerName?: (name: string) => void;
  onUpdateProjectNumber?: (num: string) => void;
  servicesText: string;
  isMultiAny: boolean;
}

export function DiagramTopBar({
  isEspritMulti,
  clientName = 'Esprit',
  effectiveCustomerName,
  effectiveProjectNumber,
  onUpdateCustomerName,
  onUpdateProjectNumber,
  servicesText,
  isMultiAny,
}: DiagramTopBarProps) {
  return (
    <div className="h-[60px] bg-[#E60000] flex items-center justify-between px-6 z-20 shrink-0 w-full">
      <div className="flex items-center gap-3">
        <div className="text-white text-2xl font-medium tracking-tight flex items-center gap-2">
          {isEspritMulti ? (
            <>
              <span className="font-semibold whitespace-nowrap">{clientName} MultiCustomer:</span>
              <DiagramInlineEdit 
                value={effectiveCustomerName} 
                placeholder="Klantnaam" 
                onSave={(val) => {
                  if (onUpdateCustomerName) onUpdateCustomerName(val);
                }}
                className="text-white hover:bg-white/20 hover:text-white hover:ring-white/50"
                inputClassName="text-slate-900 text-lg font-medium"
                title="Klik om klantnaam direct in het ontwerp aan te passen"
              />
            </>
          ) : (
            <>
              <span className="font-semibold tracking-wide">SIP DESIGN</span>
              <span className="text-white/60 font-light">-</span>
              <DiagramInlineEdit 
                value={effectiveCustomerName} 
                placeholder="Klantnaam" 
                onSave={(val) => {
                  if (onUpdateCustomerName) onUpdateCustomerName(val);
                }}
                className="text-white hover:bg-white/20 hover:text-white hover:ring-white/50"
                inputClassName="text-slate-900 text-lg font-medium"
                title="Klik om klantnaam direct in het ontwerp aan te passen"
              />
            </>
          )}
          {(effectiveProjectNumber || onUpdateProjectNumber) && (
            <>
              <span className="text-white/60 font-light">-</span>
              <DiagramInlineEdit 
                value={effectiveProjectNumber} 
                placeholder="Projectnummer" 
                onSave={(val) => {
                  if (onUpdateProjectNumber) onUpdateProjectNumber(val);
                }}
                className="text-white/90 hover:bg-white/20 hover:text-white hover:ring-white/50 text-xl font-light"
                inputClassName="text-slate-900 text-base"
                title="Klik om projectnummer direct in het ontwerp aan te passen"
              />
            </>
          )}
        </div>
      </div>
      
      {/* Rechterzijde van de titelbalk: eventueel dienstenlabel + officieel VodafoneZiggo Logo */}
      <div className="flex items-center gap-3.5">
        {servicesText && !isMultiAny && !isEspritMulti && (
          <div className="text-white/90 text-sm font-semibold bg-white/15 px-3 py-1 rounded-full border border-white/20 select-none">
            {servicesText}
          </div>
        )}
        {/* VodafoneZiggo Logo rechts in de titelbalk (origineel logo, passend geschaald) */}
        <div className="bg-white px-2.5 py-1 rounded-md flex items-center shadow-xs shrink-0 select-none" title="VodafoneZiggo">
          <VodafoneZiggoLogo className="h-7 w-auto max-h-[30px]" />
        </div>
      </div>
    </div>
  );
}
