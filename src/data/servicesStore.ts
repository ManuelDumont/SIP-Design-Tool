import { CustomServiceDefinition } from '../types';

export const BUILT_IN_SERVICES: CustomServiceDefinition[] = [
  {
    id: 'builtin-vov',
    name: 'Voice over Virtual IP',
    code: 'VOV',
    description: 'Standaard SIP Voice dienst over dedicated Voice WAN & LAN met lokale PBX.',
    cpeCount: 1,
    hostnamePrefix: 'Mediant',
    hasWan: true,
    hasVoiceLan: true,
    hasCn: false,
    defaultSubnet: '255.255.255.0 (/24)',
    hasCustomerLanCloud: true,
    hasSecondLanCloud: false,
    hasPhoneIcon: true,
    hasFirewall: false,
    firewallHasConnectors: false,
    firewallIpRole: 'none',
    allowDemarcationLine: true,
    hasLocalPbx: true,
    hasRoutedPbx: true,
    hasDefaultGateway: true,
    hasConfigNr: false,
    isBuiltIn: true
  },
  {
    id: 'builtin-cn',
    name: 'Corporate Network Only',
    code: 'CN',
    description: 'Dataverbinding over Corporate Network (CN WAN & CN LAN) zonder voice.',
    cpeCount: 1,
    hostnamePrefix: 'Mediant',
    hasWan: false,
    hasVoiceLan: false,
    hasCn: true,
    defaultSubnet: '255.255.255.0 (/24)',
    hasCustomerLanCloud: true,
    hasSecondLanCloud: false,
    hasPhoneIcon: false,
    hasFirewall: false,
    firewallHasConnectors: false,
    firewallIpRole: 'none',
    allowDemarcationLine: true,
    hasLocalPbx: false,
    hasRoutedPbx: false,
    hasDefaultGateway: false,
    hasConfigNr: false,
    isBuiltIn: true
  },
  {
    id: 'builtin-vov-cn',
    name: 'Voice + Corporate Network',
    code: 'VOV + CN',
    description: 'Gecombineerde Voice en Corporate Network interfaces met ruime positionering.',
    cpeCount: 1,
    hostnamePrefix: 'Mediant',
    hasWan: true,
    hasVoiceLan: true,
    hasCn: true,
    defaultSubnet: '255.255.255.0 (/24)',
    hasCustomerLanCloud: true,
    hasSecondLanCloud: false,
    hasPhoneIcon: true,
    hasFirewall: false,
    firewallHasConnectors: false,
    firewallIpRole: 'none',
    allowDemarcationLine: true,
    hasLocalPbx: true,
    hasRoutedPbx: true,
    hasDefaultGateway: true,
    hasConfigNr: false,
    isBuiltIn: true
  },
  {
    id: 'builtin-multicustomer',
    name: 'Esprit Multicustomer (N2G)',
    code: 'Multicustomer',
    description: 'Redundante Mediant 006 & 007, 2 Customer LAN wolken, Firewall met PBX IP zonder connectoren en Config Nr. / SRD mapping.',
    cpeCount: 2,
    hostnamePrefix: 'Mediant 006',
    hasWan: true,
    hasVoiceLan: true,
    hasCn: false,
    defaultSubnet: '255.255.252.0 (/22)',
    hasCustomerLanCloud: true,
    hasSecondLanCloud: true,
    hasPhoneIcon: true,
    hasFirewall: true,
    firewallHasConnectors: false,
    firewallIpRole: 'pbx',
    allowDemarcationLine: false,
    hasLocalPbx: false,
    hasRoutedPbx: false,
    hasDefaultGateway: false,
    hasConfigNr: true,
    isBuiltIn: true
  }
];

const STORAGE_KEY = 'sip_custom_services';

export function loadCustomServices(): CustomServiceDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Fout bij laden van aangepaste diensten:', err);
    return [];
  }
}

export function saveCustomService(service: CustomServiceDefinition): CustomServiceDefinition[] {
  const current = loadCustomServices();
  const existingIndex = current.findIndex(s => s.id === service.id || s.code === service.code);
  let updated: CustomServiceDefinition[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = service;
  } else {
    updated = [...current, service];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Fout bij opslaan van aangepaste dienst:', err);
  }
  return updated;
}

export function deleteCustomService(id: string): CustomServiceDefinition[] {
  const current = loadCustomServices();
  const updated = current.filter(s => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Fout bij verwijderen van aangepaste dienst:', err);
  }
  return updated;
}

export function getAllServices(): CustomServiceDefinition[] {
  const custom = loadCustomServices();
  return [...BUILT_IN_SERVICES, ...custom];
}

export function findServiceDefinition(codeOrName: string): CustomServiceDefinition | undefined {
  if (!codeOrName) return undefined;
  const all = getAllServices();
  return all.find(s => s.code === codeOrName || s.name === codeOrName || s.id === codeOrName);
}
