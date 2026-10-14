import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CustomServiceDefinition, BuilderElement } from '../types';
import { getAllServices, saveCustomService, deleteCustomService } from '../data/servicesStore';
import { 
  X, Plus, Trash2, Shield, Cloud, Server, Network, Check, RefreshCw, 
  Sliders, Move, Phone, Type, Minus, Maximize2, Copy, Split, Link2, Unlink,
  ZoomIn, ZoomOut, RotateCcw, FileText
} from 'lucide-react';
import {
  CoreRouterSvg,
  MediantRouterSvg,
  SbcClusterSvg,
  PbxSvg,
  FirewallSvg,
  PhoneSvg,
  generateCloudPath
} from './service-builder/serviceBuilderSvgs';
import {
  getElementBoundaryPoint,
  findSnapElementAtPoint,
  getConnectorEndpoints
} from './service-builder/serviceBuilderGeometry';
import { ServiceBuilderPropertiesPanel } from './service-builder/ServiceBuilderPropertiesPanel';
import { SavedServicesTab } from './service-builder/SavedServicesTab';
import { generateIntakeScenario } from './service-builder/serviceBuilderScenario';
import { ServiceBuilderScenarioTab } from './service-builder/ServiceBuilderScenarioTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onServicesUpdated?: () => void;
}

export function ServiceBuilderModal({ isOpen, onClose, darkMode = false, onServicesUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<'studio' | 'scenario' | 'saved'>('studio');
  const [servicesList, setServicesList] = useState<CustomServiceDefinition[]>(() => getAllServices());

  // Invoer voor nieuwe dienst opslaan
  const [serviceName, setServiceName] = useState<string>('');
  const [serviceCode, setServiceCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Dynamische elementenlijst op het canvas: begint schoon, enkel IP Voice Access Network staat standaard vast
  const [elements, setElements] = useState<BuilderElement[]>([]);

  // Automatisch opgebouwd uitvraagscenario op basis van de elementen op het canvas (sowieso altijd klantnaam, projectnummer, locatie(s))
  const currentScenario = useMemo(() => {
    return generateIntakeScenario(elements, serviceName);
  }, [elements, serviceName]);

  // Geselecteerde elementen op het canvas (ondersteunt Shift-selectie voor meerdere elementen tegelijk)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const setSelectedId = (id: string | null) => {
    if (!id) setSelectedIds([]);
    else setSelectedIds([id]);
  };

  // Dragging & Resizing State (ondersteunt individueel en meervoudig verslepen + meebewegende connectoren)
  const [dragState, setDragState] = useState<{
    activeId: string | null;
    dragMode: 'move' | 'resize' | 'endpoint1' | 'endpoint2';
    startX: number;
    startY: number;
    hasMoved: boolean;
    idsToMove: string[];
    initialPositions: Record<string, {
      x: number;
      y: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width?: number;
      height?: number;
      scale?: number;
    }>;
    initialElemX: number;
    initialElemY: number;
    initialX1: number;
    initialY1: number;
    initialX2: number;
    initialY2: number;
    initialWidth: number;
    initialHeight: number;
    initialScale: number;
  }>({
    activeId: null,
    dragMode: 'move',
    startX: 0,
    startY: 0,
    hasMoved: false,
    idsToMove: [],
    initialPositions: {},
    initialElemX: 0,
    initialElemY: 0,
    initialX1: 0,
    initialY1: 0,
    initialX2: 0,
    initialY2: 0,
    initialWidth: 100,
    initialHeight: 40,
    initialScale: 1
  });

  // Huidig snap doelwit tijdens het slepen (visuele indicator)
  const [activeSnapTargetId, setActiveSnapTargetId] = useState<string | null>(null);

  // In- en uitzoomen van het canvas
  const [zoom, setZoom] = useState<number>(1);
  const handleZoomIn = () => setZoom(z => Math.min(2.5, parseFloat((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoom(1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const innerCanvasRef = useRef<HTMLDivElement>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Muiswiel scroll-zoom ondersteuning op het canvas: gekoppeld via callback-ref met { passive: false } zodat muiswiel direct werkt
  const canvasCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (canvasRef.current && (canvasRef.current as any)._cleanupWheel) {
      (canvasRef.current as any)._cleanupWheel();
    }
    canvasRef.current = node;
    if (node) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        setZoom(prev => Math.min(2.5, Math.max(0.4, parseFloat((prev * factor).toFixed(2)))));
      };
      node.addEventListener('wheel', handleWheel, { passive: false });
      (node as any)._cleanupWheel = () => node.removeEventListener('wheel', handleWheel);
    }
  }, []);

  useEffect(() => {
    if (feedbackMsg) {
      const t = setTimeout(() => setFeedbackMsg(null), 3500);
      return () => clearTimeout(t);
    }
  }, [feedbackMsg]);

  // Element verwijderen
  const handleDeleteElement = (id: string) => {
    const el = elements.find(item => item.id === id);
    setElements(prev => prev.filter(item => item.id !== id).map(item => {
      if (item.type === 'connector') {
        return {
          ...item,
          sourceElementId: item.sourceElementId === id ? undefined : item.sourceElementId,
          targetElementId: item.targetElementId === id ? undefined : item.targetElementId,
        };
      }
      return item;
    }));
    setSelectedIds(prev => prev.filter(item => item !== id));
    if (el) {
      setFeedbackMsg({ text: `Element "${el.label || el.customText || el.type}" verwijderd (DEL).` });
    }
  };

  // Meerdere geselecteerde elementen tegelijk verwijderen
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setElements(prev => prev.filter(item => !selectedIds.includes(item.id)).map(item => {
      if (item.type === 'connector') {
        return {
          ...item,
          sourceElementId: selectedIds.includes(item.sourceElementId || '') ? undefined : item.sourceElementId,
          targetElementId: selectedIds.includes(item.targetElementId || '') ? undefined : item.targetElementId,
        };
      }
      return item;
    }));
    setSelectedIds([]);
    setFeedbackMsg({ text: `${count} element(en) verwijderd (DEL).` });
  };

  // DEL / Backspace toets listener om geselecteerde elementen direct weg te halen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Niet onderscheppen wanneer de gebruiker actief in een invoerveld of tekstvak typt
      const target = e.target as HTMLElement | null;
      if (
        target && (
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable || 
          (target as HTMLInputElement).type === 'text'
        )
      ) {
        return;
      }

      const isDeleteKey = 
        e.key === 'Delete' || 
        e.key === 'Del' || 
        e.code === 'Delete' || 
        e.key === 'Backspace' || 
        e.code === 'Backspace' || 
        e.keyCode === 46 || 
        e.keyCode === 8;

      if (isDeleteKey && selectedIds.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIds, elements]);

  const refreshList = () => {
    setServicesList(getAllServices());
    if (onServicesUpdated) onServicesUpdated();
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  // Element toevoegen aan het canvas vanuit de gereedschapskist
  const handleAddElement = (type: BuilderElement['type']) => {
    const newId = `elem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const centerX = 380;
    const centerY = 230 + (elements.length * 20) % 150;

    let newElem: BuilderElement;

    switch (type) {
      case 'router':
        newElem = {
          id: newId,
          type: 'router',
          x: centerX,
          y: centerY,
          scale: 1,
          label: ''
        };
        break;
      case 'mediant': {
        const count = elements.filter(e => e.type === 'mediant').length + 1;
        newElem = {
          id: newId,
          type: 'mediant',
          x: centerX,
          y: centerY,
          scale: 1,
          label: `Mediant ${String(count).padStart(3, '0')}`
        };
        break;
      }
      case 'cloud':
        newElem = {
          id: newId,
          type: 'cloud',
          x: centerX,
          y: centerY + 40,
          width: 360,
          height: 90,
          scale: 1,
          label: 'Customer LAN'
        };
        break;
      case 'pbx': {
        const pbxCount = elements.filter(e => e.type === 'pbx').length + 1;
        newElem = {
          id: newId,
          type: 'pbx',
          x: centerX,
          y: centerY + 30,
          scale: 1,
          label: `SIP PBX ${pbxCount}`
        };
        break;
      }
      case 'firewall':
        newElem = {
          id: newId,
          type: 'firewall',
          x: centerX,
          y: centerY + 20,
          scale: 1,
          label: 'Firewall'
        };
        break;
      case 'phone':
        newElem = {
          id: newId,
          type: 'phone',
          x: centerX - 60,
          y: centerY,
          scale: 1,
          label: ''
        };
        break;
      case 'connector': {
        // Connector wordt aan de zijkant klaargezet; gebruiker sleept begin- en eindpunt zelf naar de gewenste elementen
        const sideX = 70;
        const sideY1 = 200 + (elements.filter(e => e.type === 'connector').length * 24) % 140;
        const sideY2 = sideY1 + 100;
        newElem = {
          id: newId,
          type: 'connector',
          x: sideX,
          y: Math.round((sideY1 + sideY2) / 2),
          x1: sideX,
          y1: sideY1,
          x2: sideX,
          y2: sideY2,
          sourceElementId: undefined,
          targetElementId: undefined,
          lineStyle: 'solid',
          color: '#2563eb',
          strokeWidth: 2.5,
          scale: 1
        };
        break;
      }
      case 'text':
        newElem = {
          id: newId,
          type: 'text',
          x: centerX,
          y: centerY,
          width: undefined,
          height: undefined,
          scale: 1,
          customText: 'Tekst',
          fontSize: 'sm',
          textAlign: 'center',
          badgeStyle: 'badge-blue'
        };
        break;
      default:
        return;
    }

    setElements(prev => [...prev, newElem]);
    setSelectedId(newId);
    setFeedbackMsg({ text: `Element "${newElem.label || newElem.customText || type}" toegevoegd. Druk op DEL om te wissen.` });
  };

  // Element dupliceren
  const handleDuplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newId = `elem-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const copy: BuilderElement = {
      ...el,
      id: newId,
      x: el.x + 25,
      y: el.y + 25,
      x1: el.x1 !== undefined ? el.x1 + 25 : undefined,
      y1: el.y1 !== undefined ? el.y1 + 25 : undefined,
      x2: el.x2 !== undefined ? el.x2 + 25 : undefined,
      y2: el.y2 !== undefined ? el.y2 + 25 : undefined,
      label: el.label ? `${el.label} (Kopie)` : undefined
    };
    setElements(prev => [...prev, copy]);
    setSelectedId(newId);
  };

  // Aanpassen eigenschappen van een specifiek element
  const updateElement = (id: string, updates: Partial<BuilderElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  // Verstellen in grootte (scale)
  const adjustElementScale = (id: string, delta: number) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const current = el.scale || 1;
    const next = Math.max(0.4, Math.min(2.8, parseFloat((current + delta).toFixed(2))));
    updateElement(id, { scale: next });
  };

  // Start met slepen van een element (met Shift-selectie ondersteuning & meebewegende connectoren)
  const handleMouseDownElement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
      active.blur();
    }

    let activeSelected = selectedIds;
    if (e.shiftKey) {
      if (selectedIds.includes(id)) {
        activeSelected = selectedIds.filter(x => x !== id);
      } else {
        activeSelected = [...selectedIds, id];
      }
      setSelectedIds(activeSelected);
    } else {
      if (!selectedIds.includes(id)) {
        activeSelected = [id];
        setSelectedIds([id]);
      }
    }

    const el = elements.find(item => item.id === id);
    if (!el) return;

    // Bepaal welke elementen tegelijk versleept worden
    const idsToMove = activeSelected.includes(id) ? activeSelected : [id];
    const cWidth = innerCanvasRef.current?.clientWidth || canvasRef.current?.clientWidth || 960;

    // Auto-detecteer en koppel connectoren waarvan het begin- of eindpunt contact maakt met dit element
    const updatedElements = elements.map(item => {
      if (item.type !== 'connector') return item;
      const { p1, p2 } = getConnectorEndpoints(item, elements, cWidth);
      let newSrc = item.sourceElementId;
      let newTgt = item.targetElementId;
      if (!newSrc) {
        const snap = findSnapElementAtPoint(p1.x, p1.y, elements, cWidth);
        if (snap) newSrc = snap;
      }
      if (!newTgt) {
        const snap = findSnapElementAtPoint(p2.x, p2.y, elements, cWidth);
        if (snap) newTgt = snap;
      }
      if (newSrc !== item.sourceElementId || newTgt !== item.targetElementId) {
        return { ...item, sourceElementId: newSrc, targetElementId: newTgt };
      }
      return item;
    });

    if (JSON.stringify(updatedElements) !== JSON.stringify(elements)) {
      setElements(updatedElements);
    }

    // Verzamel uiterst nauwkeurige startposities voor alle elementen en connectoren
    const initialPositions: Record<string, {
      x: number;
      y: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width?: number;
      height?: number;
      scale?: number;
    }> = {};

    updatedElements.forEach(item => {
      if (item.type === 'connector') {
        const { p1, p2 } = getConnectorEndpoints(item, updatedElements, cWidth);
        initialPositions[item.id] = {
          x: item.x,
          y: item.y,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          width: item.width,
          height: item.height,
          scale: item.scale
        };
      } else {
        initialPositions[item.id] = {
          x: item.x,
          y: item.y,
          x1: item.x - 60,
          y1: item.y,
          x2: item.x + 60,
          y2: item.y,
          width: item.width,
          height: item.height,
          scale: item.scale
        };
      }
    });

    const targetInit = initialPositions[el.id];

    setDragState({
      activeId: id,
      dragMode: 'move',
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      idsToMove,
      initialPositions,
      initialElemX: el.x,
      initialElemY: el.y,
      initialX1: targetInit ? targetInit.x1 : (el.x - 60),
      initialY1: targetInit ? targetInit.y1 : el.y,
      initialX2: targetInit ? targetInit.x2 : (el.x + 60),
      initialY2: targetInit ? targetInit.y2 : el.y,
      initialWidth: el.width || 100,
      initialHeight: el.height || 40,
      initialScale: el.scale || 1
    });
  };

  // Start met slepen van een specifiek connector-eindpunt (eindpunt 1 of 2)
  const handleMouseDownConnectorEnd = (id: string, endpoint: 1 | 2, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedIds([id]);
    setSelectedId(id);
    const el = elements.find(item => item.id === id);
    if (!el) return;

    const cWidth = innerCanvasRef.current?.clientWidth || canvasRef.current?.clientWidth || 960;
    const { p1, p2 } = getConnectorEndpoints(el, elements, cWidth);

    setDragState({
      activeId: id,
      dragMode: endpoint === 1 ? 'endpoint1' : 'endpoint2',
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      idsToMove: [id],
      initialPositions: {
        [id]: {
          x: el.x,
          y: el.y,
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y
        }
      },
      initialElemX: el.x,
      initialElemY: el.y,
      initialX1: p1.x,
      initialY1: p1.y,
      initialX2: p2.x,
      initialY2: p2.y,
      initialWidth: el.width || 100,
      initialHeight: el.height || 40,
      initialScale: el.scale || 1
    });
  };

  // Start met formaataanpassing via de hoekgreep
  const handleMouseDownResize = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(id);
    const el = elements.find(item => item.id === id);
    if (!el) return;

    setDragState({
      activeId: id,
      dragMode: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
      idsToMove: [id],
      initialPositions: {
        [id]: {
          x: el.x,
          y: el.y,
          x1: el.x - 60,
          y1: el.y,
          x2: el.x + 60,
          y2: el.y,
          width: el.width,
          height: el.height,
          scale: el.scale
        }
      },
      initialElemX: el.x,
      initialElemY: el.y,
      initialX1: el.x1 ?? (el.x - 60),
      initialY1: el.y1 ?? el.y,
      initialX2: el.x2 ?? (el.x + 60),
      initialY2: el.y2 ?? el.y,
      initialWidth: el.width || 100,
      initialHeight: el.height || 40,
      initialScale: el.scale || 1
    });
  };

  // Muisbeweging over het canvas: ondersteunt slepen en ALTIJD magnetisch aansluiten aan het doelelement
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragState.activeId) return;
    const innerEl = innerCanvasRef.current || canvasRef.current;
    if (!innerEl) return;
    const innerRect = innerEl.getBoundingClientRect();

    const canvasWidth = innerEl.clientWidth || 960;
    const currentCanvasX = Math.round((e.clientX - innerRect.left) / zoom);
    const currentCanvasY = Math.round((e.clientY - innerRect.top) / zoom);

    const dx = Math.round((e.clientX - dragState.startX) / zoom);
    const dy = Math.round((e.clientY - dragState.startY) / zoom);

    const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
    if (!dragState.hasMoved && dist > 3) {
      setDragState(prev => ({ ...prev, hasMoved: true }));
    }

    const el = elements.find(item => item.id === dragState.activeId);
    if (!el) return;

    if (dragState.dragMode === 'endpoint1') {
      // Eindpunt 1 individueel slepen met magnetische aansluiting op de buitenrand
      const snapTarget = findSnapElementAtPoint(currentCanvasX, currentCanvasY, elements, canvasWidth);
      setActiveSnapTargetId(snapTarget);

      const x2 = el.x2 ?? dragState.initialX2;
      const y2 = el.y2 ?? dragState.initialY2;

      let nextX1 = currentCanvasX;
      let nextY1 = currentCanvasY;

      if (snapTarget) {
        const bp = getElementBoundaryPoint(snapTarget, elements, { x: x2, y: y2 }, canvasWidth);
        nextX1 = bp.x;
        nextY1 = bp.y;
      }

      updateElement(dragState.activeId, {
        x1: nextX1,
        y1: nextY1,
        sourceElementId: snapTarget || undefined,
        x: Math.round((nextX1 + x2) / 2),
        y: Math.round((nextY1 + y2) / 2)
      });
    } else if (dragState.dragMode === 'endpoint2') {
      // Eindpunt 2 individueel slepen met magnetische aansluiting op de buitenrand
      const snapTarget = findSnapElementAtPoint(currentCanvasX, currentCanvasY, elements, canvasWidth);
      setActiveSnapTargetId(snapTarget);

      const x1 = el.x1 ?? dragState.initialX1;
      const y1 = el.y1 ?? dragState.initialY1;

      let nextX2 = currentCanvasX;
      let nextY2 = currentCanvasY;

      if (snapTarget) {
        const bp = getElementBoundaryPoint(snapTarget, elements, { x: x1, y: y1 }, canvasWidth);
        nextX2 = bp.x;
        nextY2 = bp.y;
      }

      updateElement(dragState.activeId, {
        x2: nextX2,
        y2: nextY2,
        targetElementId: snapTarget || undefined,
        x: Math.round((x1 + nextX2) / 2),
        y: Math.round((y1 + nextY2) / 2)
      });
    } else if (dragState.dragMode === 'resize') {
      if (el.type === 'cloud' || el.type === 'text') {
        const nextW = Math.max(50, Math.min(800, dragState.initialWidth + dx));
        const nextH = Math.max(20, Math.min(400, dragState.initialHeight + dy));
        updateElement(dragState.activeId, { width: nextW, height: nextH });
      } else {
        const scaleDelta = (dx + dy) / 160;
        const nextScale = Math.max(0.4, Math.min(2.8, parseFloat((dragState.initialScale + scaleDelta).toFixed(2))));
        updateElement(dragState.activeId, { scale: nextScale });
      }
    } else {
      // Element(en) verplaatsen - inclusief aangesloten connectoren die meebewegen!
      const idsToMove = dragState.idsToMove && dragState.idsToMove.length > 0 
        ? dragState.idsToMove 
        : (dragState.activeId ? [dragState.activeId] : []);

      setElements(prev => prev.map(item => {
        const init = dragState.initialPositions[item.id];
        if (!init) return item;

        // 1. Is dit element direct geselecteerd om verplaatst te worden?
        if (idsToMove.includes(item.id)) {
          if (item.type === 'connector') {
            const curX1 = init.x1 + dx;
            const curY1 = init.y1 + dy;
            const curX2 = init.x2 + dx;
            const curY2 = init.y2 + dy;
            const sourceMoves = Boolean(item.sourceElementId && idsToMove.includes(item.sourceElementId));
            const targetMoves = Boolean(item.targetElementId && idsToMove.includes(item.targetElementId));
            return {
              ...item,
              x: init.x + dx,
              y: init.y + dy,
              x1: curX1,
              y1: curY1,
              x2: curX2,
              y2: curY2,
              sourceElementId: sourceMoves ? item.sourceElementId : undefined,
              targetElementId: targetMoves ? item.targetElementId : undefined
            };
          }
          return {
            ...item,
            x: init.x + dx,
            y: init.y + dy
          };
        }

        // 2. Is dit een connector die aangesloten is op één of meer van de verplaatste elementen?
        if (item.type === 'connector') {
          const sourceMoves = Boolean(item.sourceElementId && idsToMove.includes(item.sourceElementId));
          const targetMoves = Boolean(item.targetElementId && idsToMove.includes(item.targetElementId));

          if (sourceMoves || targetMoves) {
            const curX1 = init.x1 + (sourceMoves ? dx : 0);
            const curY1 = init.y1 + (sourceMoves ? dy : 0);
            const curX2 = init.x2 + (targetMoves ? dx : 0);
            const curY2 = init.y2 + (targetMoves ? dy : 0);

            return {
              ...item,
              x1: curX1,
              y1: curY1,
              x2: curX2,
              y2: curY2,
              x: Math.round((curX1 + curX2) / 2),
              y: Math.round((curY1 + curY2) / 2)
            };
          }
        }

        return item;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragState.activeId) {
      if (activeSnapTargetId) {
        setFeedbackMsg({ text: 'Connector succesvol aangesloten aan gekozen element.' });
      }

      // Bij afronden van slepen: controleer of connectoren die verplaatst zijn op een element aansluiten
      const cWidth = innerCanvasRef.current?.clientWidth || canvasRef.current?.clientWidth || 960;
      setElements(prev => prev.map(item => {
        if (item.type !== 'connector') return item;
        const { p1, p2 } = getConnectorEndpoints(item, prev, cWidth);
        let newSrc = item.sourceElementId;
        let newTgt = item.targetElementId;
        if (!newSrc) {
          const snap = findSnapElementAtPoint(p1.x, p1.y, prev, cWidth);
          if (snap) newSrc = snap;
        }
        if (!newTgt) {
          const snap = findSnapElementAtPoint(p2.x, p2.y, prev, cWidth);
          if (snap) newTgt = snap;
        }
        if (newSrc !== item.sourceElementId || newTgt !== item.targetElementId) {
          return { ...item, sourceElementId: newSrc, targetElementId: newTgt };
        }
        return item;
      }));

      setDragState(prev => ({ ...prev, activeId: null, dragMode: 'move', hasMoved: false }));
      setActiveSnapTargetId(null);
    }
  };

  // Canvas herstellen naar basisopzet: enkel het IP Voice Access Network
  const handleResetCanvas = () => {
    setElements([]);
    setSelectedId(null);
    setFeedbackMsg({ text: 'Canvas leeggemaakt. Alleen het standaard IP Voice Access Network staat klaar.' });
  };

  // Opslaan onder gekozen naam
  const handleSaveNewService = () => {
    if (!serviceName.trim()) {
      setFeedbackMsg({ text: 'Vul a.u.b. een naam in voor de nieuwe dienst.', isError: true });
      return;
    }
    const finalCode = (serviceCode.trim() || serviceName.trim().slice(0, 6)).toUpperCase().replace(/[^A-Z0-9-]/g, '');

    const mediantCount = elements.filter(e => e.type === 'mediant').length;
    const routerCount = elements.filter(e => e.type === 'router').length;
    const totalCpe = Math.max(1, mediantCount + routerCount);

    const hasFirewallElem = elements.some(e => e.type === 'firewall');
    const hasCloudElem = elements.some(e => e.type === 'cloud');
    const hasPbxElem = elements.some(e => e.type === 'pbx');
    const hasPhoneElem = elements.some(e => e.type === 'phone');

    const newDef: CustomServiceDefinition = {
      id: `custom-${Date.now()}`,
      name: serviceName.trim(),
      code: finalCode,
      description: description.trim() || `Dienst met ${totalCpe}x CPE/Mediant(en).`,
      cpeCount: totalCpe,
      hostnamePrefix: 'Mediant',
      hasWan: true,
      hasVoiceLan: true,
      hasCn: elements.some(e => (e.label || '').toUpperCase().includes('CN')),
      hasCustomerLanCloud: hasCloudElem,
      hasSecondLanCloud: elements.filter(e => e.type === 'cloud').length > 1,
      hasPhoneIcon: hasPhoneElem,
      hasFirewall: hasFirewallElem,
      firewallHasConnectors: false,
      firewallIpRole: hasFirewallElem ? 'pbx' : 'none',
      allowDemarcationLine: false,
      hasLocalPbx: hasPbxElem,
      hasRoutedPbx: false,
      hasDefaultGateway: true,
      isBuiltIn: false,
      builderElements: elements,
      intakeScenario: currentScenario
    };

    saveCustomService(newDef);
    refreshList();
    setFeedbackMsg({ text: `Dienst "${newDef.name}" (${newDef.code}) succesvol opgeslagen! Direct beschikbaar.` });

    setServiceName('');
    setServiceCode('');
    setDescription('');
  };

  const handleDeleteSaved = (id: string) => {
    deleteCustomService(id);
    refreshList();
    setFeedbackMsg({ text: 'Dienst verwijderd.' });
  };

  const getTargetName = (targetId?: string) => {
    if (!targetId) return 'Vrij op canvas';
    if (targetId === 'ip-voice-cloud') return 'IP Voice Access Network (Wolk)';
    if (targetId === 'core-router-fixed') return 'Core Router (Bovenaan)';
    if (targetId === 'sbc-cluster-fixed') return 'SBC Cluster (Bovenaan)';
    const el = elements.find(e => e.id === targetId);
    if (!el) return targetId;
    return el.label || el.customText || el.type.toUpperCase();
  };

  if (!isOpen) return null;

  const canvasWidth = innerCanvasRef.current?.clientWidth || canvasRef.current?.clientWidth || 960;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`relative w-full max-w-7xl max-h-[96vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Top Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'border-slate-800 bg-slate-850' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Diensten Bouwer &amp; Architectuur Studio
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Volledig Verstelbaar
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                IP Voice Access Network met SBC Cluster &amp; router staat vast zoals in elk design. Sleep connectoren direct naar elementen om aan te sluiten.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-xl border text-xs font-semibold ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'studio' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🛠️ Bouwstudio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('scenario')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'scenario' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bekijk hoe het uitvraagscenario met IP-adressen, klantnaam, projectnummer en locaties automatisch wordt opgebouwd"
              >
                <span>📋 Uitvraagscenario</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'scenario'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                }`}>
                  {currentScenario.questions.filter(q => q.category !== 'general').length} IP
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'saved' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Opgeslagen Diensten ({servicesList.filter(s => !s.isBuiltIn).length})
              </button>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                darkMode ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
              }`}
              title="Sluiten"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificatiebalk */}
        {feedbackMsg && (
          <div className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b ${
            feedbackMsg.isError 
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-[10px] underline ml-2 cursor-pointer">Sluiten</button>
          </div>
        )}

        {/* Hoofdinhoud */}
        {activeTab === 'studio' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* LINKER ZIJBALK: Gereedschapskist met alle gewenste elementen */}
            <div className={`w-full md:w-[290px] shrink-0 border-r flex flex-col overflow-y-auto p-3.5 space-y-4 ${
              darkMode ? 'bg-slate-850/70 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              
              {/* Elementen Palet */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  1. Elementen Toevoegen
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* 1. Router */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('router')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                      <Network className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Router</span>
                    <span className="text-[9px] text-slate-400 leading-none">Core / IP</span>
                  </button>

                  {/* 2. Mediant */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('mediant')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                      <Server className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Mediant</span>
                    <span className="text-[9px] text-slate-400 leading-none">AudioCodes CPE</span>
                  </button>

                  {/* 3. Customer LAN Wolk */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('cloud')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">LAN Wolk</span>
                    <span className="text-[9px] text-slate-400 leading-none">Customer LAN</span>
                  </button>

                  {/* 4. SIP PBX */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('pbx')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">SIP PBX</span>
                    <span className="text-[9px] text-slate-400 leading-none">Telefooncentrale</span>
                  </button>

                  {/* 5. Firewall */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('firewall')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Firewall</span>
                    <span className="text-[9px] text-slate-400 leading-none">Beveiliging</span>
                  </button>

                  {/* 6. Telefoonhoorn */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('phone')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Telefoonhoorn</span>
                    <span className="text-[9px] text-slate-400 leading-none">IP Endpoint</span>
                  </button>

                  {/* 7. Connectoren */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('connector')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                      <Split className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Connector</span>
                    <span className="text-[9px] text-slate-400 leading-none">Aan zijkant</span>
                  </button>

                  {/* 8. Tekstveldjes */}
                  <button
                    type="button"
                    onClick={() => handleAddElement('text')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group hover:scale-[1.02] ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center">
                      <Type className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">Tekstveld</span>
                    <span className="text-[9px] text-slate-400 leading-none">Direct typen</span>
                  </button>
                </div>
              </div>

              {/* Uitvraagscenario snelle status banner */}
              <div 
                onClick={() => setActiveTab('scenario')}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                  darkMode ? 'bg-blue-950/20 border-blue-800/40 hover:bg-blue-950/40' : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/70 shadow-2xs'
                }`}
                title="Klik om het automatisch gegenereerde uitvraagscenario te bekijken"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                      <span>Uitvraagscenario</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-200/70 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono font-bold">
                        {currentScenario.questions.filter(q => q.category !== 'general').length} IP
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Klantnaam, Projectnr. &amp; Locaties
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  Bekijk &rarr;
                </span>
              </div>

              {/* Geselecteerd Element Eigenschappen & Formaat Verstellen */}
              <ServiceBuilderPropertiesPanel
                selectedIds={selectedIds}
                selectedElement={selectedElement || null}
                elements={elements}
                darkMode={darkMode}
                handleDeleteSelected={handleDeleteSelected}
                handleDuplicateElement={handleDuplicateElement}
                handleDeleteElement={handleDeleteElement}
                updateElement={updateElement}
                adjustElementScale={adjustElementScale}
                getTargetName={getTargetName}
                onOpenScenarioTab={() => setActiveTab('scenario')}
              />

            </div>

            {/* RECHTERKANVAS & STUDIOGEDEELTE */}
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Studio Canvas Bovenbalk */}
              <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span>Canvas</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({elements.length} elementen geplaatst{selectedIds.length > 1 ? ` • ${selectedIds.length} geselecteerd (Shift)` : ''})
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom Knoppen: In- en Uitzoomen & 100% Reset */}
                  <div className={`flex items-center rounded-lg border p-0.5 shadow-2xs ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.4}
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Uitzoomen (Zoom -)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer transition-colors"
                      title="Klik om zoom te herstellen naar 100%"
                    >
                      {Math.round(zoom * 100)}%
                    </button>

                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoom >= 2.5}
                      className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Inzoomen (Zoom +)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      title="Herstel zoom (100%)"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetCanvas}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                      darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Herstel naar basisopzet"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Canvas Leegmaken</span>
                  </button>
                </div>
              </div>

              {/* HET CANVAS: IP Voice Access Network altijd exact zoals in alle bestaande designs */}
              <div 
                ref={canvasCallbackRef}
                tabIndex={0}
                className="flex-1 relative overflow-auto select-none cursor-default outline-none bg-radial from-slate-200/40 to-slate-200/10 dark:from-slate-900/60 dark:to-slate-950"
                style={{
                  backgroundImage: darkMode 
                    ? 'radial-gradient(#334155 1px, transparent 1px)' 
                    : 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onClick={() => {
                  if (!dragState.hasMoved) {
                    setSelectedIds([]);
                  }
                }}
              >
                <div
                  ref={innerCanvasRef}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    width: '100%',
                    minWidth: '960px',
                    minHeight: '620px',
                    position: 'relative',
                    height: '100%'
                  }}
                >

                {/* 1. STANDAARD IP VOICE ACCESS NETWORK ELLIPSE (Altijd aanwezig conform elk bestaand netwerkdesign) */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 top-4 w-[92%] max-w-[960px] h-[120px] border border-blue-500 border-dashed rounded-[100%] flex items-center justify-center z-10 shadow-xs pointer-events-none transition-all ${
                    activeSnapTargetId === 'ip-voice-cloud' ? 'ring-4 ring-emerald-400/80 bg-blue-200/60' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'rgba(147, 197, 253, 0.35)'
                  }}
                >
                  {/* Grote gecentreerde titel exact conform designs */}
                  <span className="text-2xl sm:text-4xl text-slate-800 dark:text-slate-700 font-light select-none pointer-events-none tracking-tight">
                    IP Voice Access Network
                  </span>

                  {/* STANDAARD SBC CLUSTER IN DE IP VOICE ACCESS NETWORK (Exact links geplaatst zoals in de designs) */}
                  <div 
                    className={`absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 flex flex-col items-center select-none z-20 pointer-events-auto rounded-lg transition-all ${
                      activeSnapTargetId === 'sbc-cluster-fixed' ? 'ring-4 ring-emerald-400 p-1 bg-white/50' : ''
                    }`}
                    title="SBC Cluster (AudioCodes Mediant™ 4000B) - Standaard in IP Voice Access Network"
                  >
                    <div className="relative drop-shadow-md">
                      <SbcClusterSvg width={200} height={40} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 bg-transparent px-1 py-0.5 whitespace-nowrap mt-1 select-none">
                      SBC Cluster
                    </span>
                  </div>
                </div>

                {/* 2. STANDAARD ROUTER: EXACT IN HET MIDDEN TEGEN DE ONDERSTE RAND VAN HET IP VOICE ACCESS NETWORK (Conform design, ZONDER Core Router titel) */}
                <div 
                  className={`absolute left-1/2 -translate-x-1/2 top-[126px] flex flex-col items-center select-none z-20 pointer-events-auto rounded-lg transition-all ${
                    activeSnapTargetId === 'core-router-fixed' ? 'ring-4 ring-emerald-400 p-1 bg-white/50' : ''
                  }`}
                >
                  <div className="relative drop-shadow-md">
                    <CoreRouterSvg width={100} height={40} />
                  </div>
                </div>

                {/* CONNECTOREN TEKENEN ALS VRIJE SVG LIJNEN MET MAGNETISCHE TERMINATIE AAN ELEMENTEN */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
                  {elements.filter(el => el.type === 'connector').map(el => {
                    const isSelected = selectedIds.includes(el.id);
                    const { p1, p2 } = getConnectorEndpoints(el, elements, canvasWidth);
                    const rawX1 = p1.x;
                    const rawY1 = p1.y;
                    const rawX2 = p2.x;
                    const rawY2 = p2.y;

                    const strokeDash = el.lineStyle === 'dashed' ? '6,6' : el.lineStyle === 'dotted' ? '2,4' : undefined;
                    const strokeW = el.strokeWidth || 2.5;
                    const strokeCol = el.color || '#2563eb';

                    return (
                      <g key={`svg-line-${el.id}`}>
                        {/* Onzichtbare bredere klik- en sleeplijn om de connector in zijn geheel te verplaatsen */}
                        <line
                          x1={rawX1}
                          y1={rawY1}
                          x2={rawX2}
                          y2={rawY2}
                          stroke="transparent"
                          strokeWidth={24}
                          className="pointer-events-auto cursor-move"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedIds([el.id]);
                            setSelectedId(el.id);
                            handleMouseDownElement(el.id, e);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds([el.id]);
                            setSelectedId(el.id);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                        >
                          <title>Sleep om de hele connector te verplaatsen, of klik om te selecteren en verwijderen</title>
                        </line>
                        {/* De effectieve connectorlijn die ALTIJD strak op de buitenrand aansluit */}
                        <line
                          x1={rawX1}
                          y1={rawY1}
                          x2={rawX2}
                          y2={rawY2}
                          stroke={strokeCol}
                          strokeWidth={strokeW}
                          strokeDasharray={strokeDash}
                          strokeLinecap="round"
                          className={`pointer-events-none ${isSelected ? 'drop-shadow-md' : ''}`}
                        />
                        {/* Subtiel contactpuntje aan begin en eind in SVG: ALLEEN zichtbaar als connector geselecteerd is of versleept wordt! */}
                        {(isSelected || dragState.activeId === el.id) && (
                          <>
                            <circle
                              cx={rawX1}
                              cy={rawY1}
                              r={Math.max(2.4, strokeW * 0.9)}
                              fill={strokeCol}
                            />
                            <circle
                              cx={rawX2}
                              cy={rawY2}
                              r={Math.max(2.4, strokeW * 0.9)}
                              fill={strokeCol}
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* VRIJE ELEMENTEN OP HET CANVAS (Verstelbaar in grootte & positie) */}
                {elements.map(el => {
                  const isSelected = selectedIds.includes(el.id);
                  const scale = el.scale || 1;
                  const isSnapTarget = activeSnapTargetId === el.id;

                  // Connectoren hebben hun eigen SVG renderer met 2 afzonderlijk sleepbare contactpuntjes
                  if (el.type === 'connector') {
                    const { p1, p2 } = getConnectorEndpoints(el, elements, canvasWidth);
                    const strokeW = el.strokeWidth || 2.5;
                    const strokeCol = el.color || '#2563eb';
                    const dotSize = Math.max(5, strokeW * 1.8);

                    return (
                      <React.Fragment key={el.id}>
                        {/* Middelpunt actiebalk met grote, direct klikbare vuilnisemmer */}
                        {isSelected && (
                          <div
                            style={{
                              left: Math.round((p1.x + p2.x) / 2),
                              top: Math.round((p1.y + p2.y) / 2),
                              transform: 'translate(-50%, -50%)',
                              zIndex: 50
                            }}
                            className="absolute pointer-events-auto p-1.5 bg-white dark:bg-slate-900 rounded-lg border-2 border-red-500 shadow-xl flex items-center gap-2 select-none ring-4 ring-red-500/15"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex items-center gap-1.5 pl-1">
                              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Connector
                              </span>
                            </div>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteElement(el.id);
                              }}
                              className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                              title="Connector direct verwijderen (of druk op toets DEL)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Verwijderen</span>
                            </button>
                          </div>
                        )}

                        {/* EINDPUNTEN 1 & 2: Altijd grijpbaar om aan te sluiten/verleggen, extra prominent wanneer geselecteerd */}
                        <>
                          {/* EINDPUNT 1: BEGINPUNT CONNECTOR */}
                          <div
                            style={{
                              left: p1.x,
                              top: p1.y,
                              zIndex: 60
                            }}
                            className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center cursor-crosshair pointer-events-auto group/handle"
                            onMouseDown={(e) => handleMouseDownConnectorEnd(el.id, 1, e)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds([el.id]);
                              setSelectedId(el.id);
                            }}
                            title={`Beginpunt connector ${el.sourceElementId ? `(Aangesloten op: ${getTargetName(el.sourceElementId)})` : '(Sleep naar de rand van een element)'}`}
                          >
                            <div 
                              style={{
                                width: isSelected ? Math.max(14, strokeW * 2.2) : Math.max(8, strokeW * 1.4),
                                height: isSelected ? Math.max(14, strokeW * 2.2) : Math.max(8, strokeW * 1.4),
                                backgroundColor: isSelected ? '#ffffff' : strokeCol,
                                borderColor: strokeCol
                              }}
                              className={`rounded-full shadow-md transition-transform group-hover/handle:scale-135 ${
                                isSelected 
                                  ? 'border-[3px] ring-2 ring-blue-500/60' 
                                  : 'ring-1 ring-white/80 dark:ring-slate-900 opacity-80 group-hover/handle:opacity-100'
                              }`}
                            />
                          </div>

                          {/* EINDPUNT 2: EINDPUNT CONNECTOR */}
                          <div
                            style={{
                              left: p2.x,
                              top: p2.y,
                              zIndex: 60
                            }}
                            className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center cursor-crosshair pointer-events-auto group/handle"
                            onMouseDown={(e) => handleMouseDownConnectorEnd(el.id, 2, e)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds([el.id]);
                              setSelectedId(el.id);
                            }}
                            title={`Eindpunt connector ${el.targetElementId ? `(Aangesloten op: ${getTargetName(el.targetElementId)})` : '(Sleep naar de rand van een element)'}`}
                          >
                            <div 
                              style={{
                                width: isSelected ? Math.max(14, strokeW * 2.2) : Math.max(8, strokeW * 1.4),
                                height: isSelected ? Math.max(14, strokeW * 2.2) : Math.max(8, strokeW * 1.4),
                                backgroundColor: isSelected ? '#ffffff' : strokeCol,
                                borderColor: strokeCol
                              }}
                              className={`rounded-full shadow-md transition-transform group-hover/handle:scale-135 ${
                                isSelected 
                                  ? 'border-[3px] ring-2 ring-blue-500/60' 
                                  : 'ring-1 ring-white/80 dark:ring-slate-900 opacity-80 group-hover/handle:opacity-100'
                              }`}
                            />
                          </div>
                        </>
                      </React.Fragment>
                    );
                  }

                  // Overige elementen (Router, Mediant, Cloud, PBX, Firewall, Phone, Text)
                  return (
                    <div
                      key={el.id}
                      style={{
                        top: el.y,
                        left: el.x,
                        transform: 'translate(-50%, -50%)',
                        zIndex: isSelected ? 35 : 20
                      }}
                      className={`absolute cursor-grab active:cursor-grabbing group transition-shadow select-none rounded-lg ${
                        isSnapTarget 
                          ? 'ring-4 ring-emerald-400 ring-offset-2 bg-emerald-50/30' 
                          : isSelected 
                          ? 'ring-2 ring-blue-500 ring-offset-2' 
                          : 'hover:ring-1 hover:ring-blue-400/60'
                      }`}
                      onMouseDown={(e) => handleMouseDownElement(el.id, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dragState.hasMoved) return;
                        if (e.shiftKey) {
                          // Al verwerkt in onMouseDown
                        } else {
                          setSelectedId(el.id);
                        }
                      }}
                    >
                      {/* BINNENWERK VAN ELEMENT OP BASIS VAN TYPE */}

                      {/* A. ROUTER */}
                      {el.type === 'router' && (
                        <div className="flex flex-col items-center p-1" style={{ transform: `scale(${scale})` }}>
                          <CoreRouterSvg width={96} height={38} />
                          {el.label && el.label !== 'Core Router' && (
                            <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded bg-blue-900 text-white shadow-xs font-mono">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* B. MEDIANT */}
                      {el.type === 'mediant' && (
                        <div className="flex flex-col items-center p-1" style={{ transform: `scale(${scale})` }}>
                          <MediantRouterSvg width={96} height={38} />
                          {el.label && (
                            <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded bg-slate-900 text-white shadow-xs font-mono">
                              {el.label}
                            </span>
                          )}
                          <div className="flex gap-1 mt-0.5 text-[8px] font-mono">
                            <span className="bg-blue-100 text-blue-800 px-1 rounded">WAN</span>
                            <span className="bg-emerald-100 text-emerald-800 px-1 rounded">LAN</span>
                          </div>
                        </div>
                      )}

                      {/* C. CUSTOMER LAN WOLK */}
                      {el.type === 'cloud' && (() => {
                        const cw = el.width || 360;
                        const ch = el.height || 90;
                        return (
                          <div className="relative p-1">
                            <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} className="overflow-visible drop-shadow-md">
                              <path d={generateCloudPath(cw, ch)} fill="#bfdbfe" stroke="#2563eb" strokeWidth="2" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-[11px] font-bold text-blue-900 px-2 py-0.5 rounded bg-white/85 shadow-2xs">
                                {el.label || 'Customer LAN'}
                              </span>
                              <span className="text-[9px] text-blue-700/80 font-semibold mt-0.5">
                                (Subnet per klant)
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* D. SIP PBX */}
                      {el.type === 'pbx' && (
                        <div className="flex flex-col items-center p-1" style={{ transform: `scale(${scale})` }}>
                          <PbxSvg width={50} height={50} />
                          {el.label && (
                            <span className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded bg-amber-900 text-white shadow-xs font-mono">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* E. FIREWALL */}
                      {el.type === 'firewall' && (
                        <div className="flex flex-col items-center p-1" style={{ transform: `scale(${scale})` }}>
                          <FirewallSvg width={54} height={40} />
                          {el.label && (
                            <span className="text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded bg-red-800 text-white shadow-2xs">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* F. TELEFOONHOORN - Alleen icoon, geen 'IP Phone' titel */}
                      {el.type === 'phone' && (
                        <div className="flex flex-col items-center p-1" style={{ transform: `scale(${scale})` }}>
                          <PhoneSvg width={38} height={38} />
                          {el.label && el.label !== 'IP Phone' && (
                            <span className="text-[9px] font-bold mt-1 px-1.5 py-0.2 rounded bg-slate-800 text-white shadow-2xs">
                              {el.label}
                            </span>
                          )}
                        </div>
                      )}

                      {/* G. TEKSTVELD OP MAAT: PAST ZICH DYNAMISCH AAN DE INGEVULDE TEKST AAN */}
                      {el.type === 'text' && (() => {
                        const styleClass = 
                          el.badgeStyle === 'card' 
                            ? 'bg-white text-slate-800 border border-slate-300 shadow-sm'
                            : el.badgeStyle === 'transparent'
                            ? 'bg-transparent text-slate-800 dark:text-slate-200'
                            : el.badgeStyle === 'badge-gray'
                            ? 'bg-slate-200 text-slate-800 border border-slate-300'
                            : el.badgeStyle === 'badge-yellow'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                            : el.badgeStyle === 'badge-red'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : el.badgeStyle === 'badge-green'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs';

                        const fontClass = 
                          el.fontSize === 'xs' ? 'text-[10px]' :
                          el.fontSize === 'lg' ? 'text-sm font-bold' :
                          el.fontSize === 'base' ? 'text-xs font-semibold' : 'text-[11px] font-medium';

                        const alignClass = 
                          el.textAlign === 'left' ? 'text-left' :
                          el.textAlign === 'right' ? 'text-right' : 'text-center';

                        const textVal = el.customText ?? '';

                        return (
                          <div 
                            style={{ 
                              transform: `scale(${scale})`,
                              width: el.width ? `${el.width}px` : undefined,
                              minWidth: '48px',
                              maxWidth: '480px'
                            }}
                            className={`px-3 py-1.5 rounded-lg inline-flex items-center justify-center transition-all ${styleClass} ${fontClass}`}
                          >
                            <div className="grid w-full relative">
                              {/* Onzichtbare meet-span die de container exact laat meeschalen met de inhoud */}
                              <span 
                                className={`invisible col-start-1 row-start-1 whitespace-pre-wrap break-words leading-tight select-none pointer-events-none ${alignClass}`}
                                aria-hidden="true"
                              >
                                {(textVal || 'Typ tekst...') + '\u00A0'}
                              </span>

                              {isSelected ? (
                                <textarea
                                  value={textVal}
                                  onChange={(e) => updateElement(el.id, { customText: e.target.value })}
                                  placeholder="Typ tekst..."
                                  rows={1}
                                  className={`col-start-1 row-start-1 w-full h-full overflow-hidden bg-transparent border-0 outline-none resize-none p-0 focus:ring-0 leading-tight ${alignClass}`}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className={`col-start-1 row-start-1 select-none pointer-events-none whitespace-pre-wrap break-words leading-tight ${alignClass}`}>
                                  {textVal || 'Tekstveld'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* HOEKGREEP OM FORMAAT AAN TE PASSEN */}
                      {isSelected && (
                        <div
                          onMouseDown={(e) => handleMouseDownResize(el.id, e)}
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-nwse-resize shadow-md z-40 transition-transform hover:scale-120"
                          title="Sleep om het formaat van dit element aan te passen"
                        >
                          <Maximize2 className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                </div>
              </div>

              {/* Onderbalk: Naam, code en opslaan */}
              <div className={`p-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                  <div className="w-full sm:w-64">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Dienstnaam
                    </label>
                    <input
                      type="text"
                      placeholder="Bijv. Hosted PBX Duplex"
                      value={serviceName}
                      onChange={e => setServiceName(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg border focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Korte Code / Badge
                    </label>
                    <input
                      type="text"
                      placeholder="Bijv. HPBX"
                      maxLength={12}
                      value={serviceCode}
                      onChange={e => setServiceCode(e.target.value.toUpperCase())}
                      className={`w-full px-3 py-1.5 text-xs font-mono uppercase font-bold rounded-lg border focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="hidden lg:block flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      Korte Beschrijving
                    </label>
                    <input
                      type="text"
                      placeholder="Toelichting over topologie..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      darkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Sluiten
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveNewService}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Bevestigen &amp; Nieuwe Dienst Opslaan</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'scenario' ? (
          <ServiceBuilderScenarioTab
            darkMode={darkMode}
            serviceName={serviceName}
            elements={elements}
            scenario={currentScenario}
            onNavigateToStudio={() => setActiveTab('studio')}
          />
        ) : (
          <SavedServicesTab
            darkMode={darkMode}
            servicesList={servicesList}
            setActiveTab={setActiveTab}
            handleDeleteSaved={handleDeleteSaved}
          />
        )}

      </div>
    </div>
  );
}
