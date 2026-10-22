import { CustomServiceDefinition } from '../types';

export const BUILT_IN_SERVICES: CustomServiceDefinition[] = [
  // --- VOICE DIENSTEN ---
  {
    id: 'builtin-vov',
    name: 'VOV',
    code: 'VOV',
    category: 'voice',
    description: '',
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
    name: 'CN',
    code: 'CN',
    category: 'voice',
    description: '',
    cpeCount: 1,
    hostnamePrefix: 'Router',
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
    name: 'VOV+CN',
    code: 'VOV+CN',
    category: 'voice',
    description: '',
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
    name: 'Multicustomer Esprit',
    code: 'Multicustomer Esprit',
    category: 'voice',
    description: '',
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

export function getVoiceServices(): CustomServiceDefinition[] {
  return getAllServices().filter(s => s.category === 'voice' || s.code === 'CN' || (!s.category && s.code !== 'DIA' && s.code !== 'IP-VPN' && s.code !== 'SD-WAN'));
}

export function getDataServices(): CustomServiceDefinition[] {
  // Er zijn nog geen templates gemaakt voor data diensten; Corporate Net is een voice dienst.
  // Alleen eventuele zelfgemaakte data templates (als die ooit worden aangemaakt) worden getoond.
  return getAllServices().filter(s => s.category === 'data' && s.code !== 'CN' && s.id !== 'builtin-cn' && s.code !== 'DIA' && s.code !== 'IP-VPN' && s.code !== 'SD-WAN');
}

export function findServiceDefinition(codeOrName: string): CustomServiceDefinition | undefined {
  if (!codeOrName) return undefined;
  const all = getAllServices();
  const direct = all.find(s => s.code === codeOrName || s.name === codeOrName || s.id === codeOrName);
  if (direct) return direct;
  // Aliases voor compatibiliteit met eerdere opgeslagen ontwerpen
  if (codeOrName === 'VOV + CN' || codeOrName === 'VOV & CN' || codeOrName === 'VOV+CN' || (codeOrName.includes('VOV') && codeOrName.includes('CN'))) {
    return all.find(s => s.code === 'VOV+CN' || s.code === 'VOV & CN');
  }
  if (codeOrName === 'Multicustomer' || codeOrName === 'Multicustomer - Esprit' || codeOrName === 'Multicustomer Esprit' || codeOrName.startsWith('Multicustomer')) {
    return all.find(s => s.code === 'Multicustomer Esprit' || s.code === 'Multicustomer - Esprit');
  }
  if (codeOrName === 'Corporate Net' || codeOrName === 'Corporate Net (CN)') {
    return all.find(s => s.code === 'CN');
  }
  return undefined;
}
