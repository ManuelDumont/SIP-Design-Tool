export interface PBX {
  id: string;
  ip: string;
  name?: string;
  brand?: string;
}

export type ServiceType = 'VOV' | 'CN' | 'VOV + CN' | '';

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
}

export interface LocationConfig {
  id: string;
  customerName: string;
  locationName: string;
  showDemarcationLine?: boolean;
  cpes: CPEConfig[];
}
