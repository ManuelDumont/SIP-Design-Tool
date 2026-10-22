import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LocationConfig } from '../types';
import { Network, Download, RotateCcw, Save, Plus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getCidrFromSubnetString, isValidIPv4, isInSameSubnet, getSubnetNetworkAddress, padTo3Digits } from '../utils/ip';
import { getEspritConfigByNumber } from '../data/espritConfigs';
import { findServiceDefinition } from '../data/servicesStore';
import { Language, translations } from '../i18n/translations';
import { VodafoneZiggoLogo } from './VodafoneZiggoLogo';

import { CoreRouterSvg, VoiceRouterSvg, PbxIcon, FirewallSvg, SbcClusterSvg } from './diagram/diagramSvgs';
import {
  areCpesInSameLanSubnet,
  generateCloudPath,
  CLOUD_Y_OFFSET,
  getCloudTopY,
  getCloudBottomY,
  getBoxBorderPoint,
  getCloudConnectionPoint,
  getCpeExtents,
  isCombiServiceWithCn
} from './diagram/diagramGeometry';
import { DiagramInlineEdit as InlineEdit } from './diagram/DiagramInlineEdit';
import { DiagramTopBar } from './diagram/DiagramTopBar';
import { DiagramConnectionsSvg } from './diagram/DiagramConnectionsSvg';
import { DiagramIpVoiceCloud } from './diagram/DiagramIpVoiceCloud';
import { DiagramMulticustomerBlock } from './diagram/DiagramMulticustomerBlock';
import { DiagramCustomerLanCloud } from './diagram/DiagramCustomerLanCloud';
import { DiagramCpeNode } from './diagram/DiagramCpeNode';
import { DiagramPbxNodes } from './diagram/DiagramPbxNodes';

interface Props {
  locations: LocationConfig[];
  customerName?: string;
  projectNumber?: string;
  darkMode?: boolean;
  onExportJSON?: () => void;
  onRegisterExportPNG?: (fn: () => void) => void;
  language?: Language;
  onUpdateLocations?: (locations: LocationConfig[]) => void;
  onUpdateCustomerName?: (name: string) => void;
  onUpdateProjectNumber?: (num: string) => void;
}

export function NetworkDiagram({ 
  locations, 
  customerName, 
  projectNumber, 
  darkMode = false, 
  onExportJSON, 
  onRegisterExportPNG,
  language = 'nl',
  onUpdateLocations,
  onUpdateCustomerName,
  onUpdateProjectNumber
}: Props) {
  const t = translations[language];
  const diagramRef = useRef<HTMLDivElement>(null);

  // Custom position offsets from right-click dragging
  const [customOffsets, setCustomOffsets] = useState<Record<string, { x: number; y: number }>>({});
  
  // Custom sizes for routers (scale: 0.5 - 2.5) and clouds (width & height)
  const [customSizes, setCustomSizes] = useState<Record<string, {
    scale?: number;
    width?: number;
    height?: number;
  }>>({});

  const [resizeDragState, setResizeDragState] = useState<{
    id: string;
    type: 'router' | 'cloud' | 'core-cloud';
    startX: number;
    startY: number;
    initialScale: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const hasUserInteracted = useRef(false);
  const autoFitRef = useRef<(force?: boolean) => void>(() => {});
  const [rightDragState, setRightDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const startRightDrag = (id: string, e: React.MouseEvent) => {
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      const current = customOffsets[id] || { x: 0, y: 0 };
      setRightDragState({
        id,
        startX: e.clientX,
        startY: e.clientY,
        initialX: current.x,
        initialY: current.y,
      });
    }
  };

  const startResizeDrag = (
    id: string,
    type: 'router' | 'cloud' | 'core-cloud',
    e: React.MouseEvent,
    initialScale = 1,
    initialWidth = 100,
    initialHeight = 40
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizeDragState({
      id,
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialScale,
      initialWidth,
      initialHeight,
    });
  };

  const handleStepScale = (id: string, step: number, min = 0.5, max = 2.5) => {
    setCustomSizes(prev => {
      const current = prev[id]?.scale || 1;
      const next = Math.max(min, Math.min(max, Number((current + step).toFixed(1))));
      return {
        ...prev,
        [id]: {
          ...prev[id],
          scale: next
        }
      };
    });
  };

  const handleStepCloudSize = (id: string, baseW: number, baseH: number, deltaW: number, deltaH: number) => {
    setCustomSizes(prev => {
      const currW = prev[id]?.width || baseW;
      const currH = prev[id]?.height || baseH;
      const nextW = Math.max(260, currW + deltaW);
      const nextH = Math.max(100, currH + deltaH);
      return {
        ...prev,
        [id]: {
          ...prev[id],
          width: nextW,
          height: nextH
        }
      };
    });
  };

  const handleResetItemSize = (id: string) => {
    setCustomSizes(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Direct editing helpers
  const handleUpdateLocationName = (locId: string, newName: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(l => l.id === locId ? { ...l, locationName: newName } : l);
    onUpdateLocations(updated);
  };

  const handleUpdateCpeField = (cpeId: string, field: string, value: string) => {
    if (!onUpdateLocations) return;
    const finalValue = field === 'hostname' ? value.toUpperCase() : value;
    
    const locWithCpe = locations.find(l => (l.cpes || []).some(c => c.id === cpeId));
    const targetCpe = locWithCpe?.cpes?.find(c => c.id === cpeId);
    const isEsprit = targetCpe && (targetCpe.serviceType === 'Multicustomer' || targetCpe.isMulticustomer) && (targetCpe.multicustomerClient === 'Esprit' || locWithCpe?.multicustomerClient === 'Esprit');

    if (isEsprit && field === 'wanIp') {
      const match = value.trim().match(/\.(\d{1,3})$/);
      const cfgDigits = match ? padTo3Digits(match[1]) : undefined;
      const updated = locations.map(loc => ({
        ...loc,
        cpes: (loc.cpes || []).map(cpe => {
          if (cpe.id !== cpeId) return cpe;
          return {
            ...cpe,
            wanIp: finalValue,
            ...(cfgDigits ? { multicustomerConfigNr: cfgDigits } : {})
          };
        })
      }));
      onUpdateLocations(updated);
      return;
    }

    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => cpe.id === cpeId ? { ...cpe, [field]: finalValue } : cpe)
    }));
    onUpdateLocations(updated);
  };

  const handleUpdatePbxField = (cpeId: string, pbxId: string, field: string, value: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        return {
          ...cpe,
          pbxs: (cpe.pbxs || []).map(p => p.id === pbxId ? { ...p, [field]: value } : p)
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleAddPbxWithIp = (cpeId: string, ip: string) => {
    if (!onUpdateLocations || !ip) return;
    const cleanIp = ip.trim();
    const currentLoc = locations.find(l => (l.cpes || []).some(c => c.id === cpeId));
    const currentCpe = currentLoc?.cpes?.find(c => c.id === cpeId);
    const validCount = (currentCpe?.pbxs || []).filter(p => p.ip?.trim()).length;
    const newPbx = {
      id: `pbx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `SIP PBX ${validCount + 1}`,
      ip: cleanIp,
      brand: 'Overig'
    };
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        const validPbxs = (cpe.pbxs || []).filter(p => p.ip && p.ip.trim());
        return {
          ...cpe,
          pbxs: [...validPbxs, newPbx]
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleUpdateClusterSubnet = (cpeIds: string[], newSubnetStr: string) => {
    if (!onUpdateLocations || !newSubnetStr) return;
    const trimmed = newSubnetStr.replace(/[\r\n]+/g, ' ').trim();
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (!cpeIds.includes(cpe.id)) return cpe;
        return {
          ...cpe,
          lanSubnet: trimmed
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleUpdateMulticustomerField = (field: 'multicustomerConfigNr' | 'multicustomerTrunkId', val: string) => {
    if (!onUpdateLocations) return;
    const cleanVal = val.trim();
    const updated = locations.map(loc => {
      const locHasMulti = loc.isMulticustomer || (loc.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.serviceType === 'Multicustomer Esprit' || c.serviceType === 'Multicustomer - Esprit' || c.serviceType?.startsWith('Multicustomer') || c.isMulticustomer);
      if (!locHasMulti) return loc;

      const isEsprit = loc.multicustomerClient === 'Esprit' || (loc.cpes || []).some(c => c.multicustomerClient === 'Esprit' || c.serviceType === 'Multicustomer Esprit' || c.serviceType === 'Multicustomer - Esprit');

      if (isEsprit && field === 'multicustomerConfigNr') {
        const espritCfg = getEspritConfigByNumber(cleanVal);
        const cfg3 = espritCfg.configNr;
        return {
          ...loc,
          multicustomerConfigNr: cfg3,
          cpes: (loc.cpes || []).map((cpe, idx) => {
            if (cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer Esprit' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType?.startsWith('Multicustomer') || cpe.isMulticustomer) {
              const is006 = idx === 0 || cpe.hostname.includes('006');
              const medData = is006 ? espritCfg.mediant006 : espritCfg.mediant007;
              return {
                ...cpe,
                multicustomerConfigNr: cfg3,
                wanIp: medData.wanIp,
                lanIpCpe: medData.lanIp,
                lanSubnet: '255.255.252.0 (/22)',
                defaultGateway: espritCfg.sipLanIpGw,
                ...(is006 ? {
                  pbxs: [{
                    id: cpe.pbxs?.[0]?.id || `pbx-${Date.now()}`,
                    name: cpe.pbxs?.[0]?.name || 'SIP PBX',
                    ip: espritCfg.primaryPbxIp,
                    brand: cpe.pbxs?.[0]?.brand || 'Overig'
                  }]
                } : {})
              };
            }
            return cpe;
          })
        };
      }

      const cfg3 = field === 'multicustomerConfigNr' ? (padTo3Digits(cleanVal) || '001') : (loc.multicustomerConfigNr || '001');

      return {
        ...loc,
        [field]: cleanVal,
        cpes: (loc.cpes || []).map((cpe) => {
          if (cpe.serviceType === 'Multicustomer' || cpe.isMulticustomer) {
            return {
              ...cpe,
              [field]: cleanVal
            };
          }
          return cpe;
        })
      };
    });
    onUpdateLocations(updated);
  };

  const handleDeletePbx = (cpeId: string, pbxId: string) => {
    if (!onUpdateLocations) return;
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        return {
          ...cpe,
          pbxs: (cpe.pbxs || []).filter(p => p.id !== pbxId)
        };
      })
    }));
    onUpdateLocations(updated);
  };

  const handleAddPbx = (cpeId: string) => {
    if (!onUpdateLocations) return;
    const currentLoc = locations.find(l => (l.cpes || []).some(c => c.id === cpeId));
    const currentCpe = currentLoc?.cpes?.find(c => c.id === cpeId);
    const validCount = (currentCpe?.pbxs || []).filter(p => p.ip?.trim()).length;
    const newPbx = {
      id: `pbx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `SIP PBX ${validCount + 1}`,
      ip: '',
      brand: 'Overig'
    };
    const updated = locations.map(loc => ({
      ...loc,
      cpes: (loc.cpes || []).map(cpe => {
        if (cpe.id !== cpeId) return cpe;
        const validPbxs = (cpe.pbxs || []).filter(p => p.ip && p.ip.trim());
        return {
          ...cpe,
          pbxs: [...validPbxs, newPbx]
        };
      })
    }));
    onUpdateLocations(updated);
  };

  // Window listeners voor soepel verslepen en formaat aanpassen
  useEffect(() => {
    if (!rightDragState && !resizeDragState) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const currentScale = scaleRef.current || 1;
      
      if (rightDragState) {
        const deltaX = (e.clientX - rightDragState.startX) / currentScale;
        const deltaY = (e.clientY - rightDragState.startY) / currentScale;

        setCustomOffsets(prev => ({
          ...prev,
          [rightDragState.id]: {
            x: Math.round(rightDragState.initialX + deltaX),
            y: Math.round(rightDragState.initialY + deltaY),
          }
        }));
      }

      if (resizeDragState) {
        const deltaX = (e.clientX - resizeDragState.startX) / currentScale;
        const deltaY = (e.clientY - resizeDragState.startY) / currentScale;

        if (resizeDragState.type === 'router') {
          const factor = 1 + (deltaX + deltaY) / 100;
          const newScale = Math.max(0.5, Math.min(2.5, Number((resizeDragState.initialScale * factor).toFixed(2))));
          setCustomSizes(prev => ({
            ...prev,
            [resizeDragState.id]: {
              ...prev[resizeDragState.id],
              scale: newScale
            }
          }));
        } else if (resizeDragState.type === 'cloud' || resizeDragState.type === 'core-cloud') {
          const newWidth = Math.max(260, Math.round(resizeDragState.initialWidth + deltaX * 2));
          const newHeight = Math.max(100, Math.round(resizeDragState.initialHeight + deltaY));
          setCustomSizes(prev => ({
            ...prev,
            [resizeDragState.id]: {
              ...prev[resizeDragState.id],
              width: newWidth,
              height: newHeight
            }
          }));
        }
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || e.buttons === 0) {
        setRightDragState(null);
      }
      setResizeDragState(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [rightDragState, resizeDragState]);

  const handleResetPositions = () => {
    setCustomOffsets({});
    setCustomSizes({});
    hasUserInteracted.current = false;
    autoFitRef.current(true);
  };

  const effectiveCustomerName = customerName || locations[0]?.customerName || '';
  const effectiveProjectNumber = projectNumber || '';
  
  // Multicustomer info uitvragen over alle locaties/cpes
  const multicustomerInfo = (() => {
    for (const loc of locations) {
      if (loc.isMulticustomer && loc.multicustomerClient) {
        return {
          client: loc.multicustomerClient,
          configNr: loc.multicustomerConfigNr || '001',
          trunkId: loc.multicustomerTrunkId || 'xxx',
          cpeCount: loc.multicustomerCpeCount || (loc.cpes.length >= 2 ? 2 : 1),
          locId: loc.id
        };
      }
      const cpe = loc.cpes?.find(c => 
        c.serviceType === 'Multicustomer' || 
        c.serviceType === 'Multicustomer - Esprit' || 
        c.serviceType === 'Multicustomer Esprit' || 
        c.serviceType?.startsWith('Multicustomer') || 
        c.isMulticustomer || 
        c.multicustomerClient === 'Esprit'
      );
      if (cpe) {
        return {
          client: cpe.multicustomerClient || loc.multicustomerClient || 'Esprit',
          configNr: cpe.multicustomerConfigNr || loc.multicustomerConfigNr || '001',
          trunkId: cpe.multicustomerTrunkId || loc.multicustomerTrunkId || 'xxx',
          cpeCount: cpe.multicustomerCpeCount || (loc.cpes.length >= 2 ? 2 : 1),
          cpeId: cpe.id,
          locId: loc.id
        };
      }
    }
    return null;
  })();

  const isEspritMulti = multicustomerInfo?.client === 'Esprit' || locations.some(loc => 
    loc.multicustomerClient === 'Esprit' || 
    (loc.cpes || []).some(c => 
      c.multicustomerClient === 'Esprit' || 
      c.serviceType === 'Multicustomer Esprit' || 
      c.serviceType === 'Multicustomer - Esprit'
    )
  );

  const isMultiAny = Boolean(multicustomerInfo) || isEspritMulti || locations.some(loc => 
    loc.isMulticustomer || (loc.cpes || []).some(c => 
      c.serviceType === 'Multicustomer' || 
      c.serviceType === 'Multicustomer - Esprit' || 
      c.serviceType === 'Multicustomer Esprit' || 
      c.serviceType?.startsWith('Multicustomer') || 
      c.isMulticustomer
    )
  );
  const allServices = Array.from(
    new Set(
      locations
        .flatMap(loc => loc.cpes || [])
        .map(c => c.serviceType)
        .filter((s): s is NonNullable<typeof s> => Boolean(s && s.trim() && s !== 'Multicustomer' && s !== 'Multicustomer - Esprit' && !s.startsWith('Multicustomer')))
        .flatMap(s => s.split(/[+&]/).map(item => item.trim()))
        .filter(s => Boolean(s && s !== 'Multicustomer' && s !== 'Multicustomer - Esprit'))
    )
  );
  const servicesText = allServices.join(' & ');

  // Titel in de rode bovenbalk: "SIP Design" blijft standaard staan,
  // Voor Esprit Multicustomer wordt de titel conform verzoek: "Esprit  MultiCustomer: " + klantnaam
  const customerParts: string[] = [];
  if (effectiveCustomerName.trim()) {
    customerParts.push(effectiveCustomerName.trim());
  }
  if (effectiveProjectNumber.trim()) {
    customerParts.push(effectiveProjectNumber.trim());
  }

  const headerTitle = isEspritMulti
    ? `Esprit MultiCustomer: ${effectiveCustomerName.trim()}${effectiveProjectNumber.trim() ? ` - ${effectiveProjectNumber.trim()}` : ''}`
    : (customerParts.length > 0
        ? `SIP Design - ${customerParts.join(' - ')}`
        : 'SIP Design');

  const handleExportPNG = useCallback(async () => {
    if (!diagramRef.current) return;
    
    try {
      const dataUrl = await toPng(diagramRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node) => {
          // Filter out buttons from the PNG
          if (node.tagName === 'BUTTON') return false;
          return true;
        }
      });
      
      const link = document.createElement('a');
      // Bestandsnaam bevat ALLEEN klantnaam en projectnummer (diensten weggelaten op verzoek)
      const parts: string[] = [];
      if (isEspritMulti) {
        parts.push(`Esprit_MultiCustomer_${effectiveCustomerName.trim() || 'Design'}`);
      } else if (effectiveCustomerName.trim()) {
        parts.push(effectiveCustomerName.trim());
      }
      if (effectiveProjectNumber.trim()) parts.push(effectiveProjectNumber.trim());
      if (parts.length === 0) parts.push('SIP-Design');

      const safeTitle = parts.join('_').replace(/[\s/\\:]+/g, '_');
      link.download = `${safeTitle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  }, [effectiveCustomerName, effectiveProjectNumber, isEspritMulti]);

  useEffect(() => {
    if (onRegisterExportPNG) {
      onRegisterExportPNG(handleExportPNG);
    }
  }, [onRegisterExportPNG, handleExportPNG]);
  
  const totalCpes = locations.reduce((sum, loc) => sum + (loc.cpes?.length || 0), 0);
  const hasContent = Boolean(effectiveCustomerName.trim()) || totalCpes > 0;
  const hasAnyDemarcation = locations.some(loc => {
    const isLocMulti = isMultiAny || loc.isMulticustomer || (loc.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.serviceType === 'Multicustomer - Esprit' || c.serviceType === 'Multicustomer Esprit' || c.serviceType?.startsWith('Multicustomer') || c.isMulticustomer);
    return isLocMulti ? false : Boolean(loc.showDemarcationLine);
  });
  const hasAnyVovCn = locations.some(loc => loc.cpes?.some(c => isCombiServiceWithCn(c.serviceType, c.multicustomerVariant)));
  const shouldStagger = totalCpes > 2;
  
  // Als VOV & CN geselecteerd is, plaats de CPE's ruimer zodat beide WAN/LAN reeksen perfect leesbaar zijn en elkaar nooit overlappen
  const CPE_SPACING = hasAnyVovCn ? 600 : 360;
  const baseStartX = shouldStagger ? 180 : 80;

  // Bereken natuurlijke breedtes per locatie op basis van dynamische CPE afmetingen
  const estimatedGroupWidths = locations.map(loc => {
    const cpes = loc.cpes || [];
    if (cpes.length === 0) return 400;
    let locWidth = 0;
    cpes.forEach((cpe, idx) => {
      const ext = getCpeExtents(cpe);
      if (idx === 0) {
        locWidth += ext.leftExtent + 20;
      } else {
        const prevExt = getCpeExtents(cpes[idx - 1]);
        locWidth += prevExt.rightExtent + ext.leftExtent + 80;
      }
    });
    const lastExt = getCpeExtents(cpes[cpes.length - 1]);
    locWidth += lastExt.rightExtent + 40;
    return Math.max(500, locWidth);
  });
  const totalLocationsWidth = estimatedGroupWidths.reduce((a, b) => a + b, 0) + Math.max(0, locations.length - 1) * 100;
  const rawContentWidth = baseStartX + Math.max(700, totalLocationsWidth) + baseStartX;
  
  const customCloudHeights = Object.entries(customSizes)
    .filter(([k]) => k.includes('cluster'))
    .map(([, s]) => s.height || 160);
  const maxCustomCloudHeight = customCloudHeights.length > 0 ? Math.max(160, ...customCloudHeights) : 160;
  const extraCloudHeight = Math.max(0, maxCustomCloudHeight - 160);

  const minWidth = Math.max(1200, rawContentWidth);
  const minDiagramHeight = (shouldStagger ? 1300 : 1000) + extraCloudHeight * 1.5 + (isEspritMulti ? 180 : 0);
  const topBarHeight = 60;
  const minTotalHeight = minDiagramHeight + topBarHeight;
  
  // A4 Landscape aspect ratio (297 / 210)
  const A4_RATIO = 297 / 210;
  
  let finalWidth = minWidth;
  let finalTotalHeight = finalWidth / A4_RATIO;
  
  if (finalTotalHeight < minTotalHeight) {
    finalTotalHeight = minTotalHeight;
    finalWidth = finalTotalHeight * A4_RATIO;
  }
  
  const TOTAL_WIDTH = finalWidth;
  const CONTAINER_HEIGHT = finalTotalHeight - topBarHeight;
  
  const extraHeight = Math.max(0, CONTAINER_HEIGHT - minDiagramHeight);
  
  const CORE_Y = 100 + extraHeight * 0.1;
  const ROUTER_Y = 220 + extraHeight * 0.25;
  const CPE_Y = 460 + extraHeight * 0.55;
  const STAGGER_OFFSET = shouldStagger ? (280 + extraHeight * 0.35) : 0;
  
  const LAN_Y_OFFSET = 95 + extraHeight * 0.02;
  const GW_Y_OFFSET = 120 + extraHeight * 0.05;
  const PBX_Y_OFFSET = 190 + extraHeight * 0.08;
  
  // Calculate horizontal offset to center the network graph
  const xOffset = (TOTAL_WIDTH - rawContentWidth) / 2;
  let currentX = baseStartX + Math.max(0, xOffset); 
  let globalCpeIndex = 0;
  
  const groups = locations.map((loc, groupIdx) => {
    const locName = (loc.locationName || '').trim();
    const isLocMulti = isMultiAny || loc.isMulticustomer || (loc.cpes || []).some(c => c.serviceType === 'Multicustomer' || c.serviceType === 'Multicustomer - Esprit' || c.serviceType === 'Multicustomer Esprit' || c.serviceType?.startsWith('Multicustomer') || c.isMulticustomer);
    const showDemarcationLine = isLocMulti 
      ? false 
      : Boolean(loc.showDemarcationLine);
    const cpes = loc.cpes;
    
    // Determine LAN subnet clusters for CPEs in this location
    const cpeClusterMap = new Map<string, number>();
    let nextClusterId = 0;

    cpes.forEach((cpe) => {
      if (cpeClusterMap.has(cpe.id)) return;
      cpeClusterMap.set(cpe.id, nextClusterId);
      
      cpes.forEach((other) => {
        if (!cpeClusterMap.has(other.id) && areCpesInSameLanSubnet(cpe, other)) {
          cpeClusterMap.set(other.id, nextClusterId);
        }
      });
      nextClusterId++;
    });

    // Bereken dynamische afmetingen en posities per cluster met gegarandeerde tussenruimte
    const clusterMetaList: {
      cId: number;
      cpeIds: string[];
      width: number;
      yOffset: number;
      startX: number;
      cpeRelXList: number[];
    }[] = [];

    const groupStartX = currentX;
    let clusterCurrentX = groupStartX;

    for (let cId = 0; cId < nextClusterId; cId++) {
      const clusterCpeItems = cpes.filter(c => cpeClusterMap.get(c.id) === cId);
      const k = clusterCpeItems.length;
      
      // Bepaal de relatieve posities van de CPE's binnen dit cluster
      const cpeRelXList: number[] = [];
      let currentRel = 0;
      clusterCpeItems.forEach((cpeItem, idx) => {
        const ext = getCpeExtents(cpeItem);
        if (idx === 0) {
          currentRel = ext.leftExtent + 20;
          cpeRelXList.push(currentRel);
        } else {
          const prevExt = getCpeExtents(clusterCpeItems[idx - 1]);
          // Afstand tussen CPE's = rechterbereik van vorige + linkerbereik van huidige + 90px marge
          const spacing = prevExt.rightExtent + ext.leftExtent + 90;
          currentRel += spacing;
          cpeRelXList.push(currentRel);
        }
      });

      const lastExt = getCpeExtents(clusterCpeItems[k - 1]);
      const clusterWidth = currentRel + lastExt.rightExtent + 40;
      const yOffset = shouldStagger ? (globalCpeIndex % 2) * STAGGER_OFFSET : 0;
      globalCpeIndex++;

      const startX = clusterCurrentX;
      clusterCurrentX += clusterWidth + 100; // 100px tussen verschillende clusters

      clusterMetaList.push({
        cId,
        cpeIds: clusterCpeItems.map(c => c.id),
        width: clusterWidth,
        yOffset,
        startX,
        cpeRelXList
      });
    }

    const groupWidth = clusterCurrentX - groupStartX;
    currentX = clusterCurrentX + 80; // 80px tussen verschillende locaties
    
    const mappedCpes = cpes.map((cpe) => {
      const clusterId = cpeClusterMap.get(cpe.id) ?? 0;
      const clusterMeta = clusterMetaList.find(m => m.cId === clusterId)!;
      const clusterCpeIds = clusterMeta.cpeIds;
      const indexInCluster = clusterCpeIds.indexOf(cpe.id);

      const cloudId = `loc-${loc.id || groupIdx}-cluster-${clusterId}`;
      const cloudOffset = customOffsets[`cloud-${cloudId}`] || { x: 0, y: 0 };
      const cpeOffset = customOffsets[`cpe-${cpe.id}`] || { x: 0, y: 0 };

      // Gezamenlijke verticale en horizontale offset: CPE en wolk bewegen synchroon
      const clusterXOffset = cloudOffset.x + cpeOffset.x;
      const clusterYOffset = cloudOffset.y + cpeOffset.y;

      // Horizontale positie van de CPE
      const baseCpeX = clusterMeta.startX + clusterMeta.cpeRelXList[indexInCluster];
      const cpeX = baseCpeX + clusterXOffset;
      const yOffset = clusterMeta.yOffset + clusterYOffset;
      
      const cidr = getCidrFromSubnetString(cpe.lanSubnet) ?? 24;
      const clusterCpesAll = loc.cpes || [];
      const subnetIpMatch = (cpe.lanSubnet || '').match(/(\d+\.\d+\.\d+\.\d+)/);
      const subnetIp = subnetIpMatch && isValidIPv4(subnetIpMatch[1]) ? subnetIpMatch[1] : '';

      const effectiveLanIp = 
        (cpe.serviceType === 'CN' && isValidIPv4(cpe.cnLanIp) ? cpe.cnLanIp.trim() : '') ||
        (isValidIPv4(cpe.lanIpCpe) ? cpe.lanIpCpe.trim() : '') ||
        (isValidIPv4(cpe.defaultGateway) ? cpe.defaultGateway.trim() : '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.lanIpCpe))?.lanIpCpe?.trim() || '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.cnLanIp))?.cnLanIp?.trim() || '') ||
        (clusterCpesAll.find(c => isValidIPv4(c.defaultGateway))?.defaultGateway?.trim() || '') ||
        subnetIp ||
        '192.168.1.1';
      
      const rawPbxs = cpe.pbxs || [];
      const validPbxs: any[] = [];
      const emptyPbxs: any[] = [];

      rawPbxs.forEach((pbx, pbxIndex) => {
        const cleanIp = (pbx.ip || '').trim().split('/')[0].split(':')[0].trim();
        const hasIp = Boolean(cleanIp && isValidIPv4(cleanIp));
        if (hasIp) {
          validPbxs.push({ ...pbx, ip: cleanIp, originalIndex: pbxIndex });
        } else {
          emptyPbxs.push({ ...pbx, ip: '', originalIndex: pbxIndex });
        }
      });

      const localPbxs: any[] = [];
      const routedPbxs: any[] = [];

      validPbxs.forEach(pbx => {
        if (!isInSameSubnet(effectiveLanIp, pbx.ip, cidr)) {
          // Ligt buiten het LAN segment -> Achter de gateway!
          routedPbxs.push(pbx);
        } else {
          // Ligt binnen het LAN segment -> Lokaal aan de wolk
          localPbxs.push(pbx);
        }
      });

      // Gebruikerswens:
      // "als ik maar 1 sip endpoint opgeef dmv ip adres en dan zit buiten het lan segment dus over de gateway routeren dan meot het default en nog niet ingevulde endpoint verdwijnen tot ik een nieuw endpoint wil hebben"
      // Als er ten minste 1 geldig endpoint is geconfigureerd en er zijn geen nieuw aangevraagde lege endpoints,
      // dan verdwijnt het default niet-ingevulde endpoint volledig!
      if (validPbxs.length === 0) {
        if (emptyPbxs.length > 0) {
          localPbxs.push(emptyPbxs[0]);
        }
      } else {
        // Als de gebruiker expliciet via "+ Endpoint" een nieuw leeg endpoint heeft aangevraagd
        emptyPbxs.forEach(ep => {
          localPbxs.push(ep);
        });
      }

      const isVovCn = isCombiServiceWithCn(cpe.serviceType, cpe.multicustomerVariant);
      const isEsprit = (cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType?.startsWith('Multicustomer') || cpe.isMulticustomer) && (cpe.multicustomerClient === 'Esprit' || loc.multicustomerClient === 'Esprit');
      const hasGw = !isEsprit && (Boolean(cpe.defaultGateway && cpe.defaultGateway.trim()) || routedPbxs.length > 0);
      
      // Gateway basispositie gekoppeld aan cpeX, beweegt mee met de cluster maar kan ook individueel versleept worden
      const baseGwLeft = cpeX + (isVovCn ? 280 : 190);
      const gwOffset = customOffsets[`gw-${cpe.id}`] || { x: 0, y: 0 };
      const gwLeft = baseGwLeft + gwOffset.x;
      const gwYOffset = yOffset + gwOffset.y;
      const gatewayCenterX = gwLeft + 35;

      // Lokale PBX'en onder de CPE (basispositie gekoppeld aan cpeX, elk onafhankelijk versleepbaar)
      const localCount = localPbxs.length;
      const baseLocalCenter = hasGw ? (cpeX - 35) : cpeX;
      const baseLocalStartX = baseLocalCenter - Math.max(0, localCount - 1) * 140 / 2;
      
      const mappedLocalPbxs = localPbxs.map((pbx, idx) => {
        const pbxOffset = customOffsets[`pbx-local-${pbx.id}`] || { x: 0, y: 0 };
        return {
          ...pbx,
          x: baseLocalStartX + idx * 140 + pbxOffset.x,
          y: CPE_Y + PBX_Y_OFFSET + yOffset + pbxOffset.y
        };
      });

      const dummyOffset = customOffsets[`pbx-dummy-${cpe.id}`] || { x: 0, y: 0 };
      const dummyLocalX = baseLocalCenter + dummyOffset.x;
      const dummyLocalY = CPE_Y + PBX_Y_OFFSET + yOffset + dummyOffset.y;

      // Gerouteerde PBX'en recht onder de Gateway (elk onafhankelijk versleepbaar)
      const routedCount = routedPbxs.length;
      const baseGatewayCenterX = gatewayCenterX;
      const baseRoutedStartX = baseGatewayCenterX - Math.max(0, routedCount - 1) * 140 / 2;

      const mappedRoutedPbxs = routedPbxs.map((pbx, idx) => {
        const routedOffset = customOffsets[`pbx-routed-${pbx.id}`] || { x: 0, y: 0 };
        return {
          ...pbx,
          x: baseRoutedStartX + idx * 140 + routedOffset.x,
          y: CPE_Y + GW_Y_OFFSET + 75 + yOffset + routedOffset.y
        };
      });
      
      return { 
        ...cpe, 
        baseCpeX,
        cpeX, 
        yOffset,
        clusterId,
        gwLeft,
        gwYOffset,
        gwY: CPE_Y + GW_Y_OFFSET + gwYOffset,
        gatewayCenterX, 
        hasGw,
        mappedLocalPbxs, 
        mappedRoutedPbxs,
        hasDummyLocal: false,
        dummyLocalX,
        dummyLocalY
      };
    });

    // Build lanClusters: De wolk omsluit altijd alle CPE's en volgt hun posities
    const lanClusters: {
      id: string;
      cpeIds: string[];
      minX: number;
      maxX: number;
      centerX: number;
      width: number;
      height: number;
      subnetLabel: string;
      yOffset: number;
      isMulti: boolean;
      isEsprit?: boolean;
      configNr3?: string;
    }[] = [];

    for (let cId = 0; cId < nextClusterId; cId++) {
      const meta = clusterMetaList.find(m => m.cId === cId)!;
      const clusterCpes = mappedCpes.filter(c => c.clusterId === cId);
      if (clusterCpes.length === 0) continue;

      const cloudId = `loc-${loc.id || groupIdx}-cluster-${cId}`;
      const cloudOffset = customOffsets[`cloud-${cloudId}`] || { x: 0, y: 0 };

      // Verzamel eventuele verticale verplaatsing van CPE's in dit cluster zodat de wolk meebeweegt
      const cpeVertDrag = clusterCpes.reduce((max, c) => {
        const off = customOffsets[`cpe-${c.id}`]?.y || 0;
        return Math.abs(off) > Math.abs(max) ? off : max;
      }, 0);
      const clusterCloudYOffset = meta.yOffset + cloudOffset.y + cpeVertDrag;

      // Gebruik de actuele cpeX van de CPE's zodat de wolk altijd perfect onder de CPE's blijft
      const minX = Math.min(...clusterCpes.map(c => c.cpeX));
      const maxX = Math.max(...clusterCpes.map(c => c.cpeX));
      const isMulti = clusterCpes.length > 1;
      
      const isEspritCluster = clusterCpes.some(c => 
        (c.serviceType === 'Multicustomer' || c.serviceType === 'Multicustomer - Esprit' || c.serviceType?.startsWith('Multicustomer') || c.isMulticustomer) &&
        (c.multicustomerClient === 'Esprit' || loc.multicustomerClient === 'Esprit')
      );

      const firstCpe = clusterCpes[0];
      const firstExt = getCpeExtents(firstCpe);
      const cloudLeft = isEspritCluster ? (minX - 70) : (minX - firstExt.leftExtent - 35);
      const lastCpe = clusterCpes[clusterCpes.length - 1];
      const lastExt = getCpeExtents(lastCpe);
      const cloudRight = isEspritCluster ? (maxX + 70) : (maxX + lastExt.rightExtent + 35);
      const defaultWidth = isEspritCluster ? Math.max(340, cloudRight - cloudLeft) : Math.max(420, cloudRight - cloudLeft);
      const customCloud = customSizes[cloudId];
      const width = customCloud?.width || defaultWidth;
      const height = customCloud?.height || 160;
      const centerX = (cloudLeft + cloudRight) / 2;
      const configNr3 = isEspritCluster
        ? padTo3Digits(clusterCpes.find(c => c.multicustomerConfigNr)?.multicustomerConfigNr || loc.multicustomerConfigNr || '001')
        : undefined;

      const firstWithValidIp = clusterCpes.find(c => {
        const ip = (c.serviceType === 'CN' && c.cnLanIp) ? c.cnLanIp : c.lanIpCpe;
        return isValidIPv4(ip);
      });

      let subnetLabel = clusterCpes[0]?.lanSubnet || 'xxx.xxx.xxx.0/24';
      if (isEspritCluster) {
        subnetLabel = '10.20.0.0/22';
      } else if (firstWithValidIp) {
        const ip = (firstWithValidIp.serviceType === 'CN' && firstWithValidIp.cnLanIp) ? firstWithValidIp.cnLanIp : firstWithValidIp.lanIpCpe;
        const cidr = getCidrFromSubnetString(firstWithValidIp.lanSubnet);
        if (cidr !== null) {
          const netAddr = getSubnetNetworkAddress(ip, cidr);
          subnetLabel = `${netAddr}/${cidr}`;
        }
      }

      lanClusters.push({
        id: cloudId,
        cpeIds: clusterCpes.map(c => c.id),
        minX,
        maxX,
        centerX,
        width,
        height,
        subnetLabel,
        yOffset: clusterCloudYOffset,
        isMulti,
        isEsprit: isEspritCluster,
        configNr3
      });
    }

    // SLUIT ALLE CPE's PERMANENT EN EXACT AAN OP DE BOVENRAND VAN DE WOLK
    mappedCpes.forEach(cpe => {
      const cluster = lanClusters.find(cl => cl.id === `loc-${loc.id || groupIdx}-cluster-${cpe.clusterId}`);
      if (cluster) {
        const cpeKey = `cpe-${cpe.id}`;
        const cpeScale = customSizes[cpeKey]?.scale || 1;
        const cpeHeight = 40 * cpeScale;

        // Bepaal de exacte bovenrand van de wolk op de horizontale x-positie van deze CPE
        const cloudBorderY = getCloudTopY(cluster, cpe.cpeX, CPE_Y);
        // De Mediant is cpeHeight px hoog. De onderzijde rust exact 5px in de wolkboog (geen kier!)
        const exactCpeTopY = cloudBorderY - (cpeHeight - 5);
        cpe.yOffset = exactCpeTopY - CPE_Y;

        // Synchroniseer Gateway en PBX Y-posities direct met de onderzijde van de wolk
        const LOCAL_PBX_GAP = 28;
        const isEspritCluster = cluster.isEsprit;

        cpe.mappedLocalPbxs.forEach((pbx: any, pbxIdx: number) => {
          const pbxOffset = customOffsets[`pbx-local-${pbx.id}`] || { x: 0, y: 0 };
          const cloudBottom = getCloudBottomY(cluster, pbx.x, CPE_Y);

          if (isEspritCluster) {
            // Esprit architectuur:
            // 1. Firewall (hoogte 40) op cloudBottom + 35
            // 2. Kleinere Customer LAN wolk (hoogte 75) op cloudBottom + 35 + 40 + 30 = cloudBottom + 105
            // 3. PBX daaraan vast op kleine wolk onderzijde + 25
            const smallCloudBottom = cloudBottom + 105 + 75;
            pbx.y = smallCloudBottom + 25 + pbxOffset.y;
            pbx.x = cluster.centerX + pbxOffset.x + (pbxIdx * 130 - (cpe.mappedLocalPbxs.length - 1) * 65);
          } else {
            // Voldoende ruimte tussen de onderrand van de wolk en het SIP Endpoint icoon (met nette verbindingslijn)
            pbx.y = cloudBottom + LOCAL_PBX_GAP + pbxOffset.y;
          }
        });
        const dummyOffset = customOffsets[`pbx-dummy-${cpe.id}`] || { x: 0, y: 0 };
        const dummyCloudBottom = getCloudBottomY(cluster, cpe.dummyLocalX, CPE_Y);
        cpe.dummyLocalY = isEspritCluster
          ? (dummyCloudBottom + 105 + 75 + 25 + dummyOffset.y)
          : (dummyCloudBottom + LOCAL_PBX_GAP + dummyOffset.y);

        // Bepaal de onderrand van de wolk op de horizontale x-positie van de Default Gateway
        const gwCloudBottom = getCloudBottomY(cluster, cpe.gatewayCenterX, CPE_Y);
        const gwOffset = customOffsets[`gw-${cpe.id}`] || { x: 0, y: 0 };
        const GW_GAP = 28;
        // Gateway bevindt zich netjes onder de rand van de wolk, exact zoals de lokale PBX, en volgt schaalwijzigingen van de wolk
        cpe.gwY = gwCloudBottom + GW_GAP + gwOffset.y;

        cpe.mappedRoutedPbxs.forEach((pbx: any) => {
          const routedOffset = customOffsets[`pbx-routed-${pbx.id}`] || { x: 0, y: 0 };
          // Gerouteerde PBX'en hangen direct onder de Default Gateway
          pbx.y = cpe.gwY + 70 + routedOffset.y;
        });
      }
    });
    
    const routerOffset = customOffsets[`router-${loc.id || groupIdx}`] || { x: 0, y: 0 };
    const routerKey = `router-${loc.id || groupIdx}`;
    const routerScale = customSizes[routerKey]?.scale || 1;
    const routerWidth = 100 * routerScale;
    const routerHeight = 40 * routerScale;

    // Router basispositie gebaseerd op baseCpeX (Mediant verslepen verschuift router niet)
    const baseRouterX = mappedCpes.length > 0 
      ? mappedCpes.reduce((acc, c) => acc + c.baseCpeX, 0) / mappedCpes.length 
      : groupStartX + (groupWidth > 0 ? groupWidth / 2 : 200);
    const routerX = baseRouterX + routerOffset.x;
    const routerYOffset = routerOffset.y;
    
    return { locId: loc.id || `loc-${groupIdx}`, groupIdx, locName, showDemarcationLine, cpes: mappedCpes, lanClusters, groupStartX, groupWidth, routerX, routerYOffset, routerScale, routerWidth, routerHeight };
  });

  // Pan and Zoom State
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { positionRef.current = position; }, [position]);

  // Auto-fit and centering logic with robust bounds checking
  const autoFitDiagram = useCallback((force = false) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const fitScale = Math.max(0.1, Math.min(1, rect.width / TOTAL_WIDTH, rect.height / CONTAINER_HEIGHT) * 0.95);
    if (isNaN(fitScale) || fitScale <= 0) return;

    if (force || !hasUserInteracted.current || scaleRef.current <= 0.1) {
      setScale(fitScale);
      const initialX = (rect.width - TOTAL_WIDTH * fitScale) / 2;
      const initialY = (rect.height - CONTAINER_HEIGHT * fitScale) / 2;
      setPosition({ x: initialX, y: initialY });
    }
  }, [TOTAL_WIDTH, CONTAINER_HEIGHT]);

  useEffect(() => {
    autoFitRef.current = autoFitDiagram;
  }, [autoFitDiagram]);

  // Initial and Resize Auto-fit with ResizeObserver and window resize listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Run immediately and in the next animation frame to guarantee layout completion
    autoFitDiagram();
    const rafId = requestAnimationFrame(() => {
      autoFitDiagram();
    });

    const ro = new ResizeObserver(() => {
      autoFitDiagram();
    });
    ro.observe(container);

    const handleWindowResize = () => {
      autoFitDiagram();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [autoFitDiagram]);

  // Automatically auto-fit when locations or CPEs change (unless user manually panned/zoomed)
  useEffect(() => {
    if (!hasUserInteracted.current) {
      autoFitDiagram(true);
    }
  }, [locations, totalCpes, autoFitDiagram]);

  // Handle Wheel Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      hasUserInteracted.current = true;
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; 
      const currentScale = scaleRef.current;
      let newScale = currentScale * zoomFactor;
      newScale = Math.min(Math.max(0.1, newScale), 5);
      
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x, y } = positionRef.current;

      const newX = mouseX - (mouseX - x) * (newScale / currentScale);
      const newY = mouseY - (mouseY - y) * (newScale / currentScale);

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging if clicking buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    setIsDragging(true);
    hasUserInteracted.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const lineColor = '#94a3b8';
  const routedLineColor = '#94a3b8';

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-950' : 'bg-slate-200'}`}>
      {/* Fixed Toolbar with Reset Positions Button */}
      {hasContent && Object.keys(customOffsets).length > 0 && (
        <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
          <button
            onClick={handleResetPositions}
            className="bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-md border border-slate-300 transition-colors"
            title={t.resetPositionsTooltip}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.resetPositions}</span>
          </button>
        </div>
      )}

      {/* Interactive Pan/Zoom Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: TOTAL_WIDTH,
            height: CONTAINER_HEIGHT,
            transition: isDragging ? 'none' : 'transform 0.05s linear'
          }}
        >
          {/* THE DESIGN SHEET: Always remains in the pristine Light Schema */}
          <div 
            ref={diagramRef} 
            className="bg-white flex flex-col relative shadow-2xl border border-slate-300 font-sans shrink-0 w-full h-full"
          >
            {/* Customer Top Bar */}
            <div className="h-[60px] bg-[#E60000] flex items-center justify-between px-6 z-20 shrink-0 w-full">
              <div className="flex items-center gap-3">
                <div className="text-white text-2xl font-medium tracking-tight flex items-center gap-2">
                  {isEspritMulti ? (
                    <>
                      <span className="font-semibold whitespace-nowrap">Esprit MultiCustomer:</span>
                      <InlineEdit 
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
                      <InlineEdit 
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
                      <InlineEdit 
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

        {/* Diagram Area (Light Schema) */}
        <div className="relative w-full bg-transparent overflow-hidden shrink-0 z-10"
             style={{
               height: `${CONTAINER_HEIGHT}px`,
               backgroundImage: rightDragState ? 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)' : 'none',
               backgroundSize: '20px 20px'
             }}>

          {totalCpes === 0 && (
            <div className="absolute inset-0 top-[260px] flex flex-col items-center justify-center pointer-events-none text-slate-400 z-30">
              <Network className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
              <span className="font-semibold text-sm text-slate-600">{t.noCpesYet}</span>
              <span className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                {t.noCpesDesc}
              </span>
            </div>
          )}
          
          {/* SVG CONNECTION LINES */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {groups.map((group, i) => (
              <line 
                key={`core-router-${i}`} 
                x1={group.routerX} 
                y1={CORE_Y + 120} 
                x2={group.routerX} 
                y2={ROUTER_Y + group.routerYOffset} 
                stroke={lineColor} 
                strokeWidth="2" 
              />
            ))}
            {groups.map(group => {
              const rCenterX = group.routerX;
              const rCenterY = ROUTER_Y + group.routerYOffset + group.routerHeight / 2;
              return group.cpes.map(cpe => {
                const cpeKey = `cpe-${cpe.id}`;
                const cpeScale = customSizes[cpeKey]?.scale || 1;
                const cpeWidth = 100 * cpeScale;
                const cpeHeight = 40 * cpeScale;
                const cpeCenterX = cpe.cpeX;
                const cpeCenterY = CPE_Y + cpe.yOffset + cpeHeight / 2;

                const routerAnchor = getBoxBorderPoint(rCenterX, rCenterY, group.routerWidth, group.routerHeight, cpeCenterX, cpeCenterY);
                const cpeAnchor = getBoxBorderPoint(cpeCenterX, cpeCenterY, cpeWidth, cpeHeight, rCenterX, rCenterY);

                return (
                  <line 
                    key={`line-${cpe.id}`} 
                    x1={routerAnchor.x} 
                    y1={routerAnchor.y} 
                    x2={cpeAnchor.x} 
                    y2={cpeAnchor.y} 
                    stroke={lineColor} 
                    strokeWidth="2" 
                  />
                );
              });
            })}
            {groups.flatMap(g => g.cpes).map(cpe => {
              if (!cpe.hasGw) return null;
              
              // Vind bijbehorende LAN cluster voor het aansluitpunt
              const parentGroup = groups.find(g => g.cpes.some(c => c.id === cpe.id));
              const cluster = parentGroup?.lanClusters.find(cl => cl.cpeIds.includes(cpe.id));
              if (!cluster) return null;

              const gwCenterX = cpe.gwLeft + 35;
              const cloudBottom = getCloudBottomY(cluster, gwCenterX, CPE_Y);

              return (
                <line 
                  key={`gw-line-${cpe.id}`} 
                  x1={gwCenterX} 
                  y1={cloudBottom} 
                  x2={gwCenterX} 
                  y2={cpe.gwY} 
                  stroke={lineColor} 
                  strokeWidth="2" 
                />
              );
            })}

            {groups.flatMap(g => g.cpes).flatMap(cpe => {
               const lines = [];
               const parentGroup = groups.find(g => g.cpes.some(c => c.id === cpe.id));
               const cluster = parentGroup?.lanClusters.find(cl => cl.cpeIds.includes(cpe.id));

               cpe.mappedLocalPbxs.forEach(pbx => {
                 if (cluster?.isEsprit || isEspritMulti || cpe.serviceType === 'Multicustomer' || cpe.isMulticustomer) {
                   // SIP PBX is weggelaten bij Multicustomer
                   return;
                 }
                 const pbxCenterX = pbx.x;
                 const cloudBottom = cluster 
                   ? getCloudBottomY(cluster, pbxCenterX, CPE_Y)
                   : CPE_Y + 40 + 160;
                 lines.push(
                   <line 
                     key={`pbx-local-${pbx.id}`} 
                     x1={pbxCenterX} 
                     y1={cloudBottom} 
                     x2={pbxCenterX} 
                     y2={pbx.y} 
                     stroke={lineColor} 
                     strokeWidth="2" 
                   />
                 );
               });
               cpe.mappedRoutedPbxs.forEach(pbx => {
                 const gwCenterX = cpe.gatewayCenterX;
                 const gwCenterY = cpe.gwY + 17.5;
                 const pbxCenterX = pbx.x;
                 const pbxCenterY = pbx.y + 24;
                 const angleGwToPbx = Math.atan2(pbxCenterY - gwCenterY, pbxCenterX - gwCenterX);
                 const gwBorderX = gwCenterX + 35 * Math.cos(angleGwToPbx);
                 const gwBorderY = gwCenterY + 17.5 * Math.sin(angleGwToPbx);
                 const pbxPoint = getBoxBorderPoint(pbxCenterX, pbxCenterY, 48, 48, gwBorderX, gwBorderY);
                 lines.push(
                   <line 
                     key={`pbx-routed-${pbx.id}`} 
                     x1={gwBorderX} 
                     y1={gwBorderY} 
                     x2={pbxPoint.x} 
                     y2={pbxPoint.y} 
                     stroke={routedLineColor} 
                     strokeWidth="2" 
                     strokeDasharray="4 4" 
                   />
                 );
               });
               return lines;
            })}

            {/* Esprit Multicustomer Connectors */}
            {groups.flatMap(g => g.lanClusters).filter(cl => cl.isEsprit).map(cluster => {
              const fwOffset = customOffsets[`fw-${cluster.id}`] || { x: 0, y: 0 };
              const smallCloudOffset = customOffsets[`small-cloud-${cluster.id}`] || { x: 0, y: 0 };
              const mainCloudBottom = getCloudBottomY(cluster, cluster.centerX + fwOffset.x, CPE_Y);
              const fwX = cluster.centerX + fwOffset.x;
              const fwY = (mainCloudBottom - 2) + fwOffset.y;
              const fwWidth = 54;
              const fwHeight = 40;
              const smallCloudWidth = 180;
              const smallCloudHeight = 75;
              const smallCloudX = cluster.centerX + smallCloudOffset.x;
              const smallCloudY = (mainCloudBottom + 38) + smallCloudOffset.y;

              const lines = [];
              if (fwY > mainCloudBottom + 1 || Math.abs(fwOffset.x) > 3) {
                lines.push(
                  <line
                    key={`esprit-cloud-fw-${cluster.id}`}
                    x1={cluster.centerX}
                    y1={mainCloudBottom}
                    x2={fwX}
                    y2={fwY}
                    stroke={lineColor}
                    strokeWidth="2"
                  />
                );
              }
              const fwBottomY = fwY + fwHeight;
              if (smallCloudY > fwBottomY + 1 || Math.abs(smallCloudX - fwX) > 3) {
                lines.push(
                  <line
                    key={`esprit-fw-smallcloud-${cluster.id}`}
                    x1={fwX}
                    y1={fwBottomY}
                    x2={smallCloudX}
                    y2={smallCloudY}
                    stroke={lineColor}
                    strokeWidth="2"
                  />
                );
              }
              return lines;
            })}
          </svg>

          {/* IP Voice Access Network Ellipse */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 h-[120px] border border-blue-500 border-dashed rounded-[100%] flex items-center justify-center z-10"
            style={{ 
              top: CORE_Y, 
              width: `${Math.max(800, TOTAL_WIDTH - 200)}px`,
              backgroundColor: 'rgba(147, 197, 253, 0.35)'
            }}
          >
            <span className="text-4xl text-slate-800 font-light select-none pointer-events-none">{t.ipVoiceAccessNetwork || 'IP Voice Access Network'}</span>
            {/* SBC Cluster Node (AudioCodes Mediant™ 4000B conform geüploade hardware-afbeelding) */}
            {(() => {
              const sbcScale = customSizes['sbc-cluster']?.scale || 1;
              return (
                <div 
                  className="absolute left-10 top-1/2 flex flex-col items-center select-none cursor-grab active:cursor-grabbing z-20 group/sbc"
                  style={{
                    transform: `translate(${customOffsets['sbc-cluster']?.x || 0}px, calc(-50% + ${customOffsets['sbc-cluster']?.y || 0}px))`,
                  }}
                  onMouseDown={e => startRightDrag('sbc-cluster', e)}
                  onContextMenu={e => e.preventDefault()}
                  title="SBC Cluster (AudioCodes Mediant™ 4000B)"
                >
                  <div className="relative">
                    <SbcClusterSvg width={200 * sbcScale} height={40 * sbcScale} />
                    <div 
                      onMouseDown={(e) => startResizeDrag('sbc-cluster', 'router', e, sbcScale, 200, 40)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleResetItemSize('sbc-cluster');
                      }}
                      className="opacity-0 group-hover/sbc:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
                      title="Sleep om SBC Cluster te vergroten of verkleinen (dubbelklik voor 100%)"
                    >
                      ⤡
                    </div>
                    {resizeDragState?.id === 'sbc-cluster' && (
                      <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
                        {Math.round(sbcScale * 100)}%
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-800 bg-transparent px-1 py-0.5 whitespace-nowrap mt-1 select-none">
                    {t.sbcCluster || 'SBC Cluster'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Multicustomer Mediant Extra Tekstblok (Alleen Esprit N2G) */}
          {multicustomerInfo && (() => {
            const allMappedCpes = groups.flatMap(g => g.cpes);
            const targetCpeForCard = allMappedCpes.find(c => c.hostname?.includes('007')) || (allMappedCpes.length > 1 ? allMappedCpes[1] : allMappedCpes[0]);
            const defaultCardLeft = targetCpeForCard ? (targetCpeForCard.cpeX + 50) : (TOTAL_WIDTH - 300);
            // CORE_Y is 100 en ellips is 120 hoog (onderrand op 220px). Met top op 240px staat het blok gegarandeerd ruim onder de wolk en ruim boven Mediant 007 (460px).
            const defaultCardTop = 240;

            return (
              <div 
                className={`absolute z-35 select-none p-3.5 rounded-xl border-2 shadow-lg cursor-grab active:cursor-grabbing transition-all ${
                  darkMode 
                    ? 'bg-slate-900/95 border-blue-500/70 text-slate-100 shadow-blue-950/40' 
                    : 'bg-white/95 border-blue-400 text-slate-800 shadow-blue-500/15'
                }`}
                style={{
                  top: defaultCardTop + (customOffsets['multicustomer-block']?.y || 0),
                  left: defaultCardLeft + (customOffsets['multicustomer-block']?.x || 0),
                  minWidth: '220px'
                }}
                onMouseDown={e => startRightDrag('multicustomer-block', e)}
                onContextMenu={e => e.preventDefault()}
                title="Multicustomer Mediant gegevens (versleepbaar met rechtermuisknop)"
              >
                {/* Header badge */}
                <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-2 border-blue-200/50 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    Multi Customer Mediant
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Esprit
                  </span>
                </div>

                {/* Esprit Multicustomer (N2G) */}
                {(() => {
                  const espritCfg = getEspritConfigByNumber(multicustomerInfo.configNr);
                  return (
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-xs text-blue-700 dark:text-blue-300">
                        Esprit Multicustomer (N2G)
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        Multi Customer Mediant
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 space-y-0.5 pt-0.5">
                        <div>N2G-M4000-ASD-006</div>
                        <div>N2G-M4000-ASD-007</div>
                      </div>
                      <div className="pt-1 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span>config nr. / SRD:</span>
                          <InlineEdit 
                            value={multicustomerInfo.configNr}
                            placeholder="001"
                            onSave={(val) => {
                              const digitsOnly = val.replace(/\D/g, '');
                              const nr = digitsOnly ? parseInt(digitsOnly, 10) : 1;
                              const clamped = Math.max(1, Math.min(125, isNaN(nr) ? 1 : nr));
                              const pad = String(clamped).padStart(3, '0');
                              handleUpdateMulticustomerField('multicustomerConfigNr', pad);
                            }}
                            title="Klik om config nr. / SRD direct in het ontwerp aan te passen (bijv. 001 of 002)"
                            className="text-blue-600 dark:text-blue-400 font-mono font-extrabold bg-blue-50/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Nodes grouped by Location */}
          {groups.map((group, groupIdx) => (
            <React.Fragment key={`group-${groupIdx}`}>
              {/* Core Router (gewone enterprise netwerkrouter, geen wireless) */}
              <div 
                className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/node" 
                style={{ top: ROUTER_Y + group.routerYOffset, left: group.routerX, transform: 'translateX(-50%)' }}
                onMouseDown={e => startRightDrag(`router-${group.locId || groupIdx}`, e)}
                onContextMenu={e => e.preventDefault()}
              >
                <div className="relative">
                  <CoreRouterSvg width={group.routerWidth} height={group.routerHeight} />
                  <div 
                    onMouseDown={(e) => startResizeDrag(`router-${group.locId || groupIdx}`, 'router', e, group.routerScale, 100, 40)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleResetItemSize(`router-${group.locId || groupIdx}`);
                    }}
                    className="opacity-0 group-hover/node:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
                    title="Sleep om router te vergroten of verkleinen (dubbelklik voor 100%)"
                  >
                    ⤡
                  </div>
                  {resizeDragState?.id === `router-${group.locId || groupIdx}` && (
                    <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
                      {Math.round(group.routerScale * 100)}%
                    </div>
                  )}
                </div>
                {/* Locatienaam bij de hoofdrouter per locatie */}
                {group.locName ? (
                  <div className="absolute -bottom-8 flex flex-col items-center z-30">
                    <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm hover:border-blue-400">
                      <InlineEdit 
                        value={group.locName} 
                        placeholder="" 
                        onSave={(val) => handleUpdateLocationName(group.locId, val)}
                        title="Klik om locatienaam direct aan te passen"
                      />
                    </span>
                  </div>
                ) : (
                  <div className="absolute -bottom-7 flex flex-col items-center z-30 opacity-0 group-hover/node:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleUpdateLocationName(group.locId, t.singleLocation || 'Locatie')}
                      className="text-[10px] font-semibold text-blue-600 bg-white/95 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-500 rounded-full px-2.5 py-0.5 shadow-xs cursor-pointer select-none whitespace-nowrap flex items-center gap-1"
                      title="Klik om een locatienaam toe te voegen aan deze locatie"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{t.addLocationName || 'Locatienaam'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Customer LAN Wolken per subnet cluster in deze locatie (grenst direct aan de CPE's) */}
              {group.lanClusters.map(cluster => (
                <React.Fragment key={cluster.id}>
                  {/* Echte Wolk (SVG met wolkbogen) als 1 geheel met IP-veld, tekst en telefoonicoon */}
                  <div 
                    className="absolute z-10 select-none cursor-grab active:cursor-grabbing group/cloud"
                    style={{ 
                      top: CPE_Y + CLOUD_Y_OFFSET + cluster.yOffset, 
                      left: cluster.centerX, 
                      width: `${cluster.width}px`, 
                      height: `${cluster.height}px`, 
                      transform: 'translateX(-50%)' 
                    }}
                    onMouseDown={e => startRightDrag(`cloud-${cluster.id}`, e)}
                    onContextMenu={e => e.preventDefault()}
                    title="Customer LAN (Wolk als 1 geheel verslepen met rechtermuisknop)"
                  >
                    {/* Corner Drag Handle for the Cloud */}
                    <div 
                      onMouseDown={(e) => startResizeDrag(cluster.id, 'cloud', e, 1, cluster.width, cluster.height)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleResetItemSize(cluster.id);
                      }}
                      className="opacity-0 group-hover/cloud:opacity-100 transition-opacity absolute bottom-1 right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[10px] text-white"
                      title="Sleep om de wolk handmatig breder of hoger te maken (dubbelklik voor standaard)"
                    >
                      ⤡
                    </div>
                    {resizeDragState?.id === cluster.id && (
                      <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
                        {Math.round(cluster.width)} × {Math.round(cluster.height)}
                      </div>
                    )}

                    <svg 
                      width={cluster.width} 
                      height={cluster.height} 
                      viewBox={`0 0 ${cluster.width} ${cluster.height}`} 
                      className="absolute inset-0 overflow-visible pointer-events-none"
                    >
                      <defs>
                        <linearGradient id={`cloudGrad-${cluster.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#dbeafe" stopOpacity="1" />
                          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      <path 
                        d={generateCloudPath(cluster.width, cluster.height)} 
                        fill={`url(#cloudGrad-${cluster.id})`}
                        stroke="#2563eb" 
                        strokeWidth="2.5" 
                        style={{ filter: 'drop-shadow(0 6px 14px rgba(37, 99, 235, 0.18))' }}
                      />
                    </svg>

                    {/* Customer LAN tekstlabel en IP-veld gecentreerd in de wolk (1 geheel) - DIRECT BEWERKBAAR */}
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center select-none z-15"
                    >
                      <span className="text-blue-900 text-xs font-bold tracking-tight bg-white/95 px-3 py-0.5 rounded-full border border-blue-200 shadow-xs mb-1 leading-none">
                        {t.customerLan || 'Customer LAN (SIP)'}
                      </span>
                      <span className="text-red-600 font-extrabold text-xs drop-shadow-xs bg-[#dbeafe] px-2.5 h-6 max-h-6 rounded border border-blue-300/70 whitespace-nowrap inline-flex flex-nowrap items-center justify-center leading-none select-none">
                        <InlineEdit 
                          value={cluster.subnetLabel} 
                          placeholder="Subnet (bijv. 192.168.1.0/24)" 
                          onSave={(val) => handleUpdateClusterSubnet(cluster.cpeIds, val)}
                          title="Klik om LAN subnet direct in het ontwerp aan te passen"
                          className="text-red-600 font-extrabold text-xs whitespace-nowrap inline-flex flex-nowrap items-center leading-none"
                          inputClassName="text-red-700 font-bold text-center bg-[#dbeafe] border-blue-400 whitespace-nowrap h-5 leading-none text-xs"
                        />
                      </span>
                    </div>

                    {/* 1 Telefoonicoon altijd EXACT tegen de linkerrand van de wolk (als 1 geheel meebewegend) */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 left-[4px] z-20 flex items-center pointer-events-none"
                      title="Customer LAN Desk Phone"
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" className="drop-shadow-md">
                        {/* Base */}
                        <path 
                          d="M5 11 L7 6 H17 L19 11 V17 A2 2 0 0 1 17 19 H7 A2 2 0 0 1 5 17 Z" 
                          fill="#475569" 
                          stroke="#334155" 
                          strokeWidth="1" 
                        />
                        {/* Screen */}
                        <rect x="8" y="7.5" width="8" height="2.5" rx="0.5" fill="#cbd5e1" />
                        {/* Buttons */}
                        <rect x="8" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                        <rect x="11.25" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                        <rect x="14.5" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                        <rect x="8" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
                        <rect x="11.25" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
                        <rect x="14.5" y="14.5" width="1.5" height="1.5" fill="#94a3b8" />
                        {/* Handset Handle */}
                        <path d="M3 6 Q12 1 21 6" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Handset Earpieces */}
                        <rect x="1" y="4.5" width="5" height="3.5" rx="1" fill="#1e293b" />
                        <rect x="18" y="4.5" width="5" height="3.5" rx="1" fill="#1e293b" />
                      </svg>
                    </div>
                  </div>

                  {/* Esprit Multicustomer Architectuur: Firewall + Nieuwe kleinere Customer LAN wolk */}
                  {cluster.isEsprit && (() => {
                    const fwOffset = customOffsets[`fw-${cluster.id}`] || { x: 0, y: 0 };
                    const smallCloudOffset = customOffsets[`small-cloud-${cluster.id}`] || { x: 0, y: 0 };
                    const smallCloudWidth = 180;
                    const smallCloudHeight = 75;
                    const smallCloudX = cluster.centerX + smallCloudOffset.x;

                    // Plaatsing strak en netjes aansluitend tussen beide Customer LAN wolken:
                    const mainCloudBottom = getCloudBottomY(cluster, cluster.centerX, CPE_Y);

                    // Firewall hoogte is 40. Bovenrand ligt strak aan tegen de onderrand van de bovenste wolk:
                    const fwY = (mainCloudBottom - 2) + fwOffset.y;
                    const fwX = cluster.centerX + fwOffset.x;

                    // Kleine Customer LAN wolk sluit direct aan op de onderzijde van de firewall:
                    const smallCloudY = (mainCloudBottom + 38) + smallCloudOffset.y;

                    const cfg3 = cluster.configNr3 || '001';
                    const espritCfg = getEspritConfigByNumber(cfg3);
                    const cpe0 = group.cpes.find(c => cluster.cpeIds.includes(c.id)) || group.cpes[0];
                    const pbxIp = cpe0?.pbxs?.[0]?.ip || espritCfg.primaryPbxIp || '10.20.2.1';

                    return (
                      <React.Fragment key={`esprit-fw-elements-${cluster.id}`}>
                        {/* Firewall Icoon (zonder titel, zonder connectoren, precies tussen de customer lans) */}
                        <div
                          className="absolute z-20 flex flex-col items-center select-none cursor-grab active:cursor-grabbing group/fw"
                          style={{ top: fwY, left: fwX, transform: 'translateX(-50%)' }}
                          onMouseDown={e => startRightDrag(`fw-${cluster.id}`, e)}
                          title="Firewall (versleepbaar met rechtermuisknop)"
                        >
                          <div className="relative flex items-center justify-center">
                            <FirewallSvg width={54} height={40} />
                            {/* IP adres van de SIP PBX links naast de firewall */}
                            <div 
                              className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded shadow-xs border border-slate-200 text-red-800 font-mono font-bold text-[11px] leading-none text-left"
                              title={`SIP PBX IP: ${pbxIp}`}
                            >
                              <InlineEdit 
                                isIp
                                value={pbxIp}
                                placeholder={espritCfg.primaryPbxIp || "10.20.2.1"}
                                onSave={(val) => {
                                  if (cpe0) {
                                    const pbxId = cpe0.pbxs?.[0]?.id;
                                    if (pbxId) {
                                      handleUpdatePbxField(cpe0.id, pbxId, 'ip', val);
                                    } else {
                                      handleAddPbxWithIp(cpe0.id, val);
                                    }
                                  }
                                }}
                                title="Klik om PBX IP adres direct aan te passen"
                                className="text-red-800 font-mono font-bold text-[11px]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Nieuwe kleinere Customer LAN wolk achter/onder de firewall */}
                        <div
                          className="absolute z-15 select-none cursor-grab active:cursor-grabbing group/smallcloud"
                          style={{ 
                            top: smallCloudY, 
                            left: smallCloudX - smallCloudWidth / 2,
                            width: smallCloudWidth,
                            height: smallCloudHeight 
                          }}
                          onMouseDown={e => startRightDrag(`small-cloud-${cluster.id}`, e)}
                          title="Customer LAN (Wolk als 1 geheel verslepen met rechtermuisknop)"
                        >
                          <svg 
                            width={smallCloudWidth} 
                            height={smallCloudHeight} 
                            viewBox={`0 0 ${smallCloudWidth} ${smallCloudHeight}`}
                            className="absolute inset-0 overflow-visible"
                          >
                            <defs>
                              <linearGradient id={`smallCloudGrad-${cluster.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#dbeafe" stopOpacity="1" />
                                <stop offset="100%" stopColor="#bfdbfe" stopOpacity="1" />
                              </linearGradient>
                            </defs>
                            <path 
                              d={generateCloudPath(smallCloudWidth, smallCloudHeight)} 
                              fill={`url(#smallCloudGrad-${cluster.id})`}
                              stroke="#2563eb" 
                              strokeWidth="2" 
                              style={{ filter: 'drop-shadow(0 4px 10px rgba(37, 99, 235, 0.15))' }}
                            />
                          </svg>

                          {/* Label in de kleine wolk */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center select-none z-15">
                            <span className="text-blue-900 text-[11px] font-bold tracking-tight bg-white/95 px-2.5 py-0.5 rounded-full border border-blue-200 shadow-xs leading-none">
                              Customer LAN
                            </span>
                          </div>

                          {/* Telefoonicoon linkerrand */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 left-[2px] z-20 flex items-center pointer-events-none"
                            title="Customer LAN Desk Phone"
                          >
                            <svg width="26" height="26" viewBox="0 0 24 24" className="drop-shadow-xs">
                              <path d="M5 11 L7 6 H17 L19 11 V17 A2 2 0 0 1 17 19 H7 A2 2 0 0 1 5 17 Z" fill="#475569" stroke="#334155" strokeWidth="1" />
                              <rect x="8" y="7.5" width="8" height="2.5" rx="0.5" fill="#cbd5e1" />
                              <rect x="8" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                              <rect x="11.25" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                              <rect x="14.5" y="12" width="1.5" height="1.5" fill="#94a3b8" />
                              <path d="M3 6 Q12 1 21 6" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })()}
                </React.Fragment>
              ))}
              
              {/* Demarcatielijn per locatie, past zich automatisch aan de positie van de Mediant(s) aan bij verplaatsen */}
              {group.showDemarcationLine && group.cpes.length > 0 && (() => {
                // Groepeer op Y-hoogte zodat bij verplaatsen van een Mediant de demarcatielijn exact op Mediant-hoogte meebeweegt
                const yGroups = new Map<number, typeof group.cpes>();
                group.cpes.forEach(cpe => {
                  const cpeKey = `cpe-${cpe.id}`;
                  const cpeScale = customSizes[cpeKey]?.scale || 1;
                  const cpeHeight = 40 * cpeScale;
                  // Exact in het midden van de Mediant (20px) en exact tussen WAN IP (bovenste rij) en LAN IP (onderste rij)
                  const yVal = CPE_Y + cpe.yOffset + cpeHeight / 2;
                  let matchedY: number | null = null;
                  for (const existingY of yGroups.keys()) {
                    if (Math.abs(existingY - yVal) <= 15) {
                      matchedY = existingY;
                      break;
                    }
                  }
                  const finalY = matchedY ?? yVal;
                  const list = yGroups.get(finalY) || [];
                  list.push(cpe);
                  yGroups.set(finalY, list);
                });

                return Array.from(yGroups.entries()).map(([demY, cpesAtY], idx) => {
                  // Bereken de uiterste linker- en rechtergrenzen inclusief IP-labels en elementen
                  const leftBounds = cpesAtY.map(c => {
                    const cpeKey = `cpe-${c.id}`;
                    const cpeScale = customSizes[cpeKey]?.scale || 1;
                    const halfW = (100 * cpeScale) / 2;
                    const is007 = c.hostname?.includes('007');
                    const hasLeftIpBox = !is007;
                    return c.cpeX - (hasLeftIpBox ? (halfW + 180) : (halfW + 40));
                  });

                  const rightBounds = cpesAtY.map(c => {
                    const cpeKey = `cpe-${c.id}`;
                    const cpeScale = customSizes[cpeKey]?.scale || 1;
                    const halfW = (100 * cpeScale) / 2;
                    const is007 = c.hostname?.includes('007');
                    const isVovCn = c.serviceType === 'VOV+CN' || c.serviceType === 'VOV & CN' || c.serviceType === 'VOV + CN' || Boolean(findServiceDefinition(c.serviceType)?.hasCn);
                    const hasRightIpBox = is007 || isVovCn;
                    let rightPos = c.cpeX + (hasRightIpBox ? (halfW + 180) : (halfW + 40));
                    if (c.hasGw && c.gwLeft) {
                      rightPos = Math.max(rightPos, c.gwLeft + 160);
                    }
                    return rightPos;
                  });

                  const minX = Math.min(...leftBounds);
                  const maxX = Math.max(...rightBounds);
                  const demLeft = minX - 25;
                  const demWidth = (maxX - minX) + 50;

                  return (
                    <div 
                      key={`dem-${group.locId || groupIdx}-${idx}`}
                      className="absolute pointer-events-none z-25 flex items-center" 
                      style={{ 
                        top: demY, 
                        left: demLeft, 
                        width: `${demWidth}px`
                      }}
                    >
                      <div className="w-full border-t-2 border-dashed border-red-500 shadow-xs relative">
                        <span className="absolute right-0 -top-2.5 text-[9px] font-bold text-red-600 uppercase tracking-widest bg-white/95 px-1.5 py-0.5 rounded border border-red-200 shadow-xs select-none">
                          {t.demarcationLineTitle || 'DEMARCATIE'}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* CPEs for this Location */}
              {group.cpes.map((cpe, cpeIndex) => {
                const mediantLabel = cpe.hostname || 'Mediant';
                const cpeKey = `cpe-${cpe.id}`;
                const cpeScale = customSizes[cpeKey]?.scale || 1;
                const cpeWidth = 100 * cpeScale;
                const cpeHeight = 40 * cpeScale;

                return (
                <React.Fragment key={cpe.id}>
                  {/* CPE Mediant Voice Router (geen wireless, 4 routing pijlen + voice telefoon badge) */}
                  <div 
                    className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/cpenode" 
                    style={{ top: CPE_Y + cpe.yOffset, left: cpe.cpeX, transform: 'translateX(-50%)' }}
                    onMouseDown={e => startRightDrag(`cpe-${cpe.id}`, e)}
                    onContextMenu={e => e.preventDefault()}
                  >
                    <div className="relative">
                      <VoiceRouterSvg width={cpeWidth} height={cpeHeight} />
                      <div 
                        onMouseDown={(e) => startResizeDrag(`cpe-${cpe.id}`, 'router', e, cpeScale, 100, 40)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleResetItemSize(`cpe-${cpe.id}`);
                        }}
                        className="opacity-0 group-hover/cpenode:opacity-100 transition-opacity absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 hover:bg-blue-600 border border-white rounded-full shadow cursor-nwse-resize z-40 flex items-center justify-center text-[9px] text-white"
                        title="Sleep om Mediant router te vergroten of verkleinen (dubbelklik voor 100%)"
                      >
                        ⤡
                      </div>
                      {resizeDragState?.id === `cpe-${cpe.id}` && (
                        <div className="absolute -bottom-6 right-0 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-50 whitespace-nowrap">
                          {Math.round(cpeScale * 100)}%
                        </div>
                      )}
                      {/* Naam en Dienst van de CPE (erboven geplaatst - DIRECT BEWERKBAAR) */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 whitespace-nowrap z-30">
                        <span className="text-xs font-bold text-slate-800 bg-white border border-slate-300 px-2.5 py-0.5 rounded-full shadow-sm hover:border-blue-400">
                          <InlineEdit 
                            value={(cpe.hostname || 'Mediant').toUpperCase()} 
                            placeholder="HOSTNAME" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'hostname', val.toUpperCase())}
                            title="Klik om Mediant naam direct aan te passen"
                            className="uppercase"
                            inputClassName="uppercase"
                          />
                        </span>
                        {!(cpe.serviceType === 'Multicustomer' || cpe.serviceType === 'Multicustomer - Esprit' || cpe.serviceType?.startsWith('Multicustomer') || cpe.isMulticustomer || Boolean(cpe.multicustomerClient) || Boolean(multicustomerInfo)) && (
                          <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-sm shadow-sm hover:bg-blue-700">
                            <InlineEdit 
                              value={cpe.serviceType || 'Dienst'} 
                              placeholder="Dienst" 
                              onSave={(val) => handleUpdateCpeField(cpe.id, 'serviceType', val)}
                              title="Klik om type dienst direct aan te passen (VOV, CN, VOV+CN, Multicustomer Esprit)"
                              className="text-white hover:text-white"
                              inputClassName="text-slate-900 font-bold"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                    {/* IP Info labels: Links van Mediant - DIRECT BEWERKBAAR */}
                    {(() => {
                      const service = cpe.serviceType || '';
                      let servicePrefix = '';
                      if (service === 'CN') servicePrefix = 'CN ';
                      else if (service.startsWith('VOV')) servicePrefix = 'VOV ';

                      if (service === 'CN') {
                        return (
                          <div className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+10px)] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
                            <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
                              <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN WAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.cnWanIp || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
                                title="Klik om CN WAN IP direct aan te passen"
                                className="text-blue-700 font-mono font-bold"
                              />
                              <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN LAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.cnLanIp || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'cnLanIp', val)} 
                                title="Klik om CN LAN IP direct aan te passen"
                                className="text-blue-700 font-mono font-bold"
                              />
                            </div>
                          </div>
                        );
                      }

                      const isEsprit = (cpe.serviceType === 'Multicustomer' || cpe.isMulticustomer) && (cpe.multicustomerClient === 'Esprit' || isEspritMulti);
                      const is007 = cpe.hostname?.includes('007') || (isEsprit && cpeIndex === 1);

                      if (is007) {
                        return (
                          <div className="absolute top-1/2 -translate-y-1/2 left-[110px] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
                            <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
                              <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}WAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.wanIp || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'wanIp', val)} 
                                title="Klik om WAN IP direct aan te passen"
                                className="text-red-800 font-mono font-bold"
                              />
                              <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}LAN:</span>
                              <InlineEdit 
                                isIp 
                                value={cpe.lanIpCpe || ''} 
                                placeholder="xxx.xxx.xxx.xxx" 
                                onSave={(val) => handleUpdateCpeField(cpe.id, 'lanIpCpe', val)} 
                                title="Klik om LAN IP direct aan te passen"
                                className="text-red-800 font-mono font-bold"
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+10px)] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
                          <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
                            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}WAN:</span>
                            <InlineEdit 
                              isIp 
                              value={cpe.wanIp || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdateCpeField(cpe.id, 'wanIp', val)} 
                              title="Klik om WAN IP direct aan te passen"
                              className="text-red-800 font-mono font-bold"
                            />
                            <span className="text-red-800 font-bold text-[11px] leading-tight whitespace-nowrap text-left">{servicePrefix}LAN:</span>
                            <InlineEdit 
                              isIp 
                              value={cpe.lanIpCpe || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdateCpeField(cpe.id, 'lanIpCpe', val)} 
                              title="Klik om LAN IP direct aan te passen"
                              className="text-red-800 font-mono font-bold"
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* IP Info labels: Rechts van Mediant (alleen bij combidienst met CN: VOV & CN) - DIRECT BEWERKBAAR */}
                    {isCombiServiceWithCn(cpe.serviceType, cpe.multicustomerVariant) && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-[110px] text-left whitespace-nowrap bg-white/90 p-1.5 rounded border border-slate-200 shadow-xs z-30">
                        <div className="grid grid-cols-[auto_auto] gap-x-1.5 gap-y-0.5 text-left items-center">
                          <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN WAN:</span>
                          <InlineEdit 
                            isIp 
                            value={cpe.cnWanIp || ''} 
                            placeholder="xxx.xxx.xxx.xxx" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'cnWanIp', val)} 
                            title="Klik om CN WAN IP direct aan te passen"
                            className="text-blue-700 font-mono font-bold"
                          />
                          <span className="text-blue-700 font-bold text-[11px] leading-tight whitespace-nowrap text-left">CN LAN:</span>
                          <InlineEdit 
                            isIp 
                            value={cpe.cnLanIp || ''} 
                            placeholder="xxx.xxx.xxx.xxx" 
                            onSave={(val) => handleUpdateCpeField(cpe.id, 'cnLanIp', val)} 
                            title="Klik om CN LAN IP direct aan te passen"
                            className="text-blue-700 font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Default Gateway: Altijd intekenen als een gateway adres is opgegeven of er gerouteerde endpoints zijn */}
                  {cpe.hasGw && (
                    <div 
                      className="absolute flex items-center z-20 select-none cursor-grab active:cursor-grabbing" 
                      style={{ 
                        top: cpe.gwY, 
                        left: cpe.gwLeft 
                      }}
                      onMouseDown={e => startRightDrag(`gw-${cpe.id}`, e)}
                      onContextMenu={e => e.preventDefault()}
                    >
                       <div className="w-[70px] h-[35px] bg-blue-500 rounded-[50%] border-2 border-blue-700 shadow-[0_4px_0_#1d4ed8] flex items-center justify-center relative mr-2 shrink-0">
                         <span className="text-white text-[9px] font-bold tracking-tight">GATEWAY</span>
                       </div>
                       <div className="text-red-800 font-bold text-xs whitespace-nowrap bg-white/90 px-1.5 py-0.5 rounded border border-slate-200 shadow-xs flex items-center">
                         <InlineEdit 
                           isIp 
                           value={cpe.defaultGateway || ''} 
                           placeholder="xxx.xxx.xxx.xxx" 
                           onSave={(val) => handleUpdateCpeField(cpe.id, 'defaultGateway', val)} 
                           title="Klik om Default Gateway IP direct aan te passen"
                           className="text-red-800 font-mono font-bold text-xs"
                         />
                       </div>
                    </div>
                  )}
                  
                  {/* SIP PBX (Lokaal - sluiten naadloos aan op onderzijde van de Customer LAN wolk, niet bij Multicustomer) */}
                  {!isMultiAny && !isEspritMulti && !group.lanClusters.some(cl => cl.isEsprit) && cpe.serviceType !== 'Multicustomer' && !cpe.isMulticustomer && cpe.mappedLocalPbxs.map((pbx: any) => {
                    const defaultTitle = cpe.serviceType ? `SIP PBX ${cpe.serviceType}` : 'SIP PBX';
                    const titleToUse = pbx.name && !pbx.name.startsWith('SIP Endpoint') ? pbx.name : defaultTitle;
                    return (
                      <div 
                        key={pbx.id} 
                        className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/pbx" 
                        style={{ top: pbx.y, left: pbx.x, transform: 'translateX(-50%)' }}
                        onMouseDown={e => startRightDrag(`pbx-local-${pbx.id}`, e)}
                        onContextMenu={e => e.preventDefault()}
                      >
                         <PbxIcon width={48} height={48} isRouted={false} />
                         <div className="text-blue-800 text-[10px] font-bold whitespace-nowrap mt-1 flex items-center">
                           <InlineEdit 
                             value={titleToUse} 
                             placeholder="SIP PBX" 
                             onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                             title="Klik om naam van deze SIP PBX direct aan te passen"
                             className="text-blue-800 font-bold text-[10px]"
                           />
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePbx(cpe.id, pbx.id);
                             }}
                             title="Verwijder deze SIP PBX"
                             className="opacity-0 group-hover/pbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
                           >
                             ×
                           </button>
                         </div>
                          <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded shadow-xs border border-slate-200 flex items-center">
                            <InlineEdit 
                              isIp 
                              value={pbx.ip || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'ip', val)} 
                              title="Klik om PBX IP adres direct in te voeren of aan te passen"
                              className="text-red-800 font-mono font-bold text-[11px]"
                            />
                          </div>
                      </div>
                    );
                  })}
                  {!isMultiAny && !isEspritMulti && !group.lanClusters.some(cl => cl.isEsprit) && cpe.serviceType !== 'Multicustomer' && !cpe.isMulticustomer && cpe.mappedRoutedPbxs.map((pbx: any) => {
                    const defaultRoutedTitle = cpe.serviceType ? `Routed SIP PBX ${cpe.serviceType}` : 'Routed SIP PBX';
                    const routedTitleToUse = pbx.name && !pbx.name.startsWith('SIP Endpoint') && !pbx.name.startsWith('Routed SIP Endpoint') ? pbx.name : defaultRoutedTitle;
                    return (
                      <div 
                        key={`routed-${pbx.id}`} 
                        className="absolute flex flex-col items-center z-20 select-none cursor-grab active:cursor-grabbing group/routedpbx" 
                        style={{ top: pbx.y, left: pbx.x, transform: 'translateX(-50%)' }}
                        onMouseDown={e => startRightDrag(`pbx-routed-${pbx.id}`, e)}
                        onContextMenu={e => e.preventDefault()}
                      >
                         <PbxIcon width={48} height={48} isRouted={true} />
                         <div className="text-amber-700 text-[10px] font-bold whitespace-nowrap mt-1 flex items-center">
                           <InlineEdit 
                             value={routedTitleToUse} 
                             placeholder="Routed SIP PBX" 
                             onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'name', val)} 
                             title="Klik om naam van deze gerouteerde SIP PBX aan te passen"
                             className="text-amber-700 font-bold text-[10px]"
                           />
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeletePbx(cpe.id, pbx.id);
                             }}
                             title="Verwijder deze SIP PBX"
                             className="opacity-0 group-hover/routedpbx:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-600 text-[10px]"
                           >
                             ×
                           </button>
                         </div>
                         <div className="text-red-800 font-bold text-[11px] mt-1 bg-white/90 px-1.5 py-0.5 rounded border border-amber-300 shadow-xs flex items-center">
                            <InlineEdit 
                              isIp 
                              value={pbx.ip || ''} 
                              placeholder="xxx.xxx.xxx.xxx" 
                              onSave={(val) => handleUpdatePbxField(cpe.id, pbx.id, 'ip', val)} 
                              title="Klik om Routed IP adres direct aan te passen"
                              className="text-red-800 font-mono font-bold text-[11px]"
                            />
                         </div>
                      </div>
                    );
                  })}
                </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legenda (zichtbaar in diagram én op de geëxporteerde PDF) */}
        {hasAnyDemarcation && (
          <div className="absolute bottom-4 left-6 z-30 bg-white border border-slate-300 rounded-lg px-4 py-2 shadow-md flex items-center gap-3 select-none">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {t.legend}
            </span>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="w-8 border-t-2 border-dashed border-red-500"></div>
              <span className="text-xs font-bold text-slate-700">
                {t.demarcationLineLabel}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {t.demarcationDomainDesc}
              </span>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
