export interface PBX {
  id: string;
  ip: string;
  name?: string;
  brand?: string;
}

export type ServiceType = 
  | 'VOV' 
  | 'CN' 
  | 'VOV+CN'
  | 'VOV & CN'
  | 'VOV + CN' 
  | 'Multicustomer Esprit'
  | 'Multicustomer - Esprit'
  | 'Multicustomer' 
  | 'Multicustomer VOV' 
  | 'Multicustomer VOV & CN' 
  | 'Multicustomer VOV + CN' 
  | (string & {});

export interface BuilderElement {
  id: string;
  type: 'router' | 'mediant' | 'cloud' | 'pbx' | 'firewall' | 'phone' | 'connector' | 'text' | 'sbc' | 'switch' | 'server' | 'workstation' | 'access-point';
  x: number;
  y: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  sourceElementId?: string;
  sourceAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  targetElementId?: string;
  targetAnchor?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  strokeWidth?: number;
  width?: number;
  height?: number;
  scale?: number;
  label?: string;
  sublabel?: string;
  customText?: string;
  color?: string;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  connectorShape?: 'straight' | 'orthogonal' | 'curved';
  orientation?: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg';
  textAlign?: 'left' | 'center' | 'right';
  badgeStyle?: 'transparent' | 'card' | 'badge-blue' | 'badge-gray' | 'badge-yellow' | 'badge-red' | 'badge-green';
  // WAN / LAN IP-adressen en flexibele plaatsing op het canvas
  wanIp?: string;
  lanIp?: string;
  showWanIp?: boolean;
  showLanIp?: boolean;
  ipPlacement?: 'auto' | 'left' | 'right';
  namePlacement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  // IP-uitvraag configuratie voor dit element
  requiresIp?: boolean;
  ipFieldsConfig?: {
    wanIp?: boolean;
    lanIp?: boolean;
    gateway?: boolean;
    subnet?: boolean;
    pbxIp?: boolean;
    firewallIp?: boolean;
    cnWanIp?: boolean;
    cnLanIp?: boolean;
  };
}

export interface IntakeQuestion {
  id: string;
  elementId?: string;
  elementName: string;
  elementType?: string;
  fieldKey: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'ip' | 'subnet' | 'gateway' | 'number';
  category: 'general' | 'network' | 'endpoint' | 'security';
  required: boolean;
  description?: string;
  defaultVal?: string;
}

export interface IntakeScenario {
  alwaysIncludeGeneral: boolean; // Klantnaam, Projectnummer, Locatie(s)
  customerNameRequired: boolean;
  projectNumberRequired: boolean;
  locationsRequired: boolean;
  questions: IntakeQuestion[];
}

export interface CustomServiceDefinition {
  id: string;
  name: string;
  code: string;
  category?: 'voice' | 'data' | 'both';
  description?: string;
  cpeCount: number;
  hostnamePrefix?: string;
  hasWan: boolean;
  hasVoiceLan: boolean;
  hasCn: boolean;
  defaultSubnet?: string;
  hasCustomerLanCloud: boolean;
  hasSecondLanCloud: boolean;
  hasPhoneIcon: boolean;
  hasFirewall: boolean;
  firewallHasConnectors: boolean;
  firewallIpRole: 'pbx' | 'gateway' | 'none';
  allowDemarcationLine: boolean;
  hasLocalPbx: boolean;
  hasRoutedPbx: boolean;
  hasDefaultGateway: boolean;
  hasConfigNr?: boolean;
  isBuiltIn?: boolean;
  layoutOffsets?: Record<string, { x: number; y: number }>;
  builderElements?: BuilderElement[];
  intakeScenario?: IntakeScenario;
}

export type MulticustomerClient = 'Esprit' | 'IP Voice Group Services BV' | 'PCC Omnia' | 'TSG' | '';

export interface CPEConfig {
  id: string;
  hostname: string;
  serviceType: ServiceType;
  wanIp: string;
  lanIpCpe: string;
  lanSubnet: string;
  defaultGateway: string;
  cnWanIp?: string;
  cnLanIp?: string;
  pbxs: PBX[];
  isMulticustomer?: boolean;
  multicustomerClient?: MulticustomerClient;
  multicustomerVariant?: 'VOV' | 'VOV & CN' | 'VOV + CN';
  multicustomerConfigNr?: string;
  multicustomerTrunkId?: string;
  multicustomerCpeCount?: 1 | 2;
  customIpValues?: Record<string, string>;
}

export interface LocationConfig {
  id: string;
  customerName: string;
  locationName: string;
  showDemarcationLine?: boolean;
  cpes: CPEConfig[];
  isMulticustomer?: boolean;
  multicustomerClient?: MulticustomerClient;
  multicustomerVariant?: 'VOV' | 'VOV & CN' | 'VOV + CN';
  multicustomerConfigNr?: string;
  multicustomerTrunkId?: string;
  multicustomerCpeCount?: 1 | 2;
}
