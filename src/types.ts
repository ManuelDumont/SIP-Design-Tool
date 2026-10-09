export interface PBX {
  id: string;
  ip: string;
  name?: string;
  brand?: string;
}

export type ServiceType = 
  | 'VOV' 
  | 'CN' 
  | 'VOV + CN' 
  | 'Multicustomer' 
  | 'Multicustomer VOV' 
  | 'Multicustomer VOV + CN' 
  | (string & {});

export interface BuilderElement {
  id: string;
  type: 'router' | 'mediant' | 'cloud' | 'pbx' | 'firewall' | 'phone' | 'connector' | 'text' | 'sbc';
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
  orientation?: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg';
  textAlign?: 'left' | 'center' | 'right';
  badgeStyle?: 'transparent' | 'card' | 'badge-blue' | 'badge-gray' | 'badge-yellow' | 'badge-red' | 'badge-green';
}

export interface CustomServiceDefinition {
  id: string;
  name: string;
  code: string;
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
  multicustomerVariant?: 'VOV' | 'VOV + CN';
  multicustomerConfigNr?: string;
  multicustomerTrunkId?: string;
  multicustomerCpeCount?: 1 | 2;
}

export interface LocationConfig {
  id: string;
  customerName: string;
  locationName: string;
  showDemarcationLine?: boolean;
  cpes: CPEConfig[];
  isMulticustomer?: boolean;
  multicustomerClient?: MulticustomerClient;
  multicustomerVariant?: 'VOV' | 'VOV + CN';
  multicustomerConfigNr?: string;
  multicustomerTrunkId?: string;
  multicustomerCpeCount?: 1 | 2;
}
