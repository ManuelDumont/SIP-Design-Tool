export interface EspritConfigEntry {
  customerId: string; // e.g. 'SRD001'
  customerNr: number; // 1
  configNr: string;   // '001'
  hostname006?: string; // 'Mediant 006' or 'UFC-M2600-ASD-006'
  hostname007?: string; // 'Mediant 007' or 'UFC-M2600-ASD-002'
  mediant006: {
    wanIp: string;      // '10.183.78.1' for IP Voice Group, '10.183.57.129' for Esprit
    lanIp: string;      // '10.69.68.1' for IP Voice Group, '10.20.0.1' for Esprit
    wanGateway: string; // '10.183.78.126' for IP Voice Group, '10.183.57.254' for Esprit
  };
  mediant007: {
    wanIp: string;      // '10.183.77.129' for IP Voice Group, '10.183.58.1' for Esprit
    lanIp: string;      // '10.69.70.1' for IP Voice Group, '10.20.1.1' for Esprit
    wanGateway: string; // '10.183.77.254' for IP Voice Group, '10.183.58.126' for Esprit
  };
  sipLanIpGw: string;   // '10.69.69.1' for IP Voice Group, '10.20.2.1' for Esprit, '10.231.251.254' for Kinwel
  primaryPbxIp: string; // '10.69.69.1' for IP Voice Group, '10.20.2.1' for Esprit, '10.231.250.126' for Kinwel
  vlanNr?: string;      // e.g. '3901', '1001/3902'
}

function getKinwelVlanNr(nr: number): string {
  const specialMap: Record<number, string> = {
    2: '1001/3902',
    9: '1002/3909',
    10: '1003/3910',
    11: '1011/3911',
    12: '1012/3912'
  };
  if (specialMap[nr]) return specialMap[nr];
  return String(3900 + nr);
}

export function getMulticustomerConfigByNumber(numInput: number | string, clientOrService?: string): EspritConfigEntry {
  let nr = 1;
  if (typeof numInput === 'number') {
    nr = numInput;
  } else {
    const cleaned = String(numInput).trim().toUpperCase();
    const match = cleaned.match(/\d+/);
    if (match) {
      nr = parseInt(match[0], 10);
    }
  }

  if (isNaN(nr) || nr <= 0) nr = 1;
  if (nr > 125) nr = Math.min(nr, 125);

  const cfgPad = String(nr).padStart(3, '0');
  const customerId = `SRD${cfgPad}`;

  const isKinwel = clientOrService && (
    clientOrService.includes('Kinwel') || 
    clientOrService === 'Kinwel'
  );

  if (isKinwel) {
    return {
      customerId,
      customerNr: nr,
      configNr: cfgPad,
      hostname006: 'DS4-M2600-ASD-002',
      hostname007: 'DS4-M2600-ASD-005',
      mediant006: {
        wanIp: `10.183.68.${128 + nr}`,
        lanIp: `10.231.250.${nr}`,
        wanGateway: '10.183.68.254'
      },
      mediant007: {
        wanIp: `10.183.69.${nr}`,
        lanIp: `10.231.251.${nr}`,
        wanGateway: '10.183.69.126'
      },
      sipLanIpGw: '10.231.251.254',
      primaryPbxIp: `10.231.250.${125 + nr}`,
      vlanNr: getKinwelVlanNr(nr)
    };
  }

  const isIpVoiceGroup = clientOrService && (
    clientOrService.includes('IP Voice Group') || 
    clientOrService.includes('IP Services Group') || 
    clientOrService === 'IP Voice Group'
  );

  if (isIpVoiceGroup) {
    return {
      customerId,
      customerNr: nr,
      configNr: cfgPad,
      hostname006: 'UFC-M2600-ASD-006',
      hostname007: 'UFC-M2600-ASD-002',
      mediant006: {
        wanIp: `10.183.78.${nr}`,
        lanIp: `10.69.68.${nr}`,
        wanGateway: '10.183.78.126'
      },
      mediant007: {
        wanIp: `10.183.77.${128 + nr}`,
        lanIp: `10.69.70.${nr}`,
        wanGateway: '10.183.77.254'
      },
      sipLanIpGw: `10.69.69.${nr}`,
      primaryPbxIp: `10.69.69.${nr}`
    };
  }

  // Standaard Esprit Multicustomer
  const primaryPbxIp = nr === 8 ? '10.20.2.7' : `10.20.2.${nr}`;

  return {
    customerId,
    customerNr: nr,
    configNr: cfgPad,
    hostname006: 'N2G-M4000-ASD-006',
    hostname007: 'N2G-M4000-ASD-007',
    mediant006: {
      wanIp: `10.183.57.${128 + nr}`,
      lanIp: `10.20.0.${nr}`,
      wanGateway: '10.183.57.254'
    },
    mediant007: {
      wanIp: `10.183.58.${nr}`,
      lanIp: `10.20.1.${nr}`,
      wanGateway: '10.183.58.126'
    },
    sipLanIpGw: '10.20.2.1',
    primaryPbxIp
  };
}

export function getEspritConfigByNumber(numInput: number | string, clientOrService?: string): EspritConfigEntry {
  return getMulticustomerConfigByNumber(numInput, clientOrService);
}

export function getAllEspritConfigs(clientOrService?: string): EspritConfigEntry[] {
  const configs: EspritConfigEntry[] = [];
  for (let i = 1; i <= 125; i++) {
    configs.push(getMulticustomerConfigByNumber(i, clientOrService));
  }
  return configs;
}
