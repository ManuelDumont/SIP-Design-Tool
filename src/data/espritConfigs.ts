export interface EspritConfigEntry {
  customerId: string; // e.g. 'SRD001'
  customerNr: number; // 1
  configNr: string;   // '001'
  mediant006: {
    wanIp: string;      // '10.183.57.129'
    lanIp: string;      // '10.20.0.1'
    wanGateway: string; // '10.183.57.254'
  };
  mediant007: {
    wanIp: string;      // '10.183.58.1'
    lanIp: string;      // '10.20.1.1'
    wanGateway: string; // '10.183.58.126'
  };
  sipLanIpGw: string;   // '10.20.2.1'
  primaryPbxIp: string; // '10.20.2.1'
}

export function getEspritConfigByNumber(numInput: number | string): EspritConfigEntry {
  let nr = 1;
  if (typeof numInput === 'number') {
    nr = numInput;
  } else {
    const cleaned = String(numInput).trim().toUpperCase();
    // Ondersteun 'SRD002', '002', '2', etc.
    const match = cleaned.match(/\d+/);
    if (match) {
      nr = parseInt(match[0], 10);
    }
  }

  if (isNaN(nr) || nr <= 0) nr = 1;
  if (nr > 125) nr = Math.min(nr, 125); // standaard 1 tot 125

  const cfgPad = String(nr).padStart(3, '0');
  const customerId = `SRD${cfgPad}`;

  // In de CSV heeft rij 8 een specifiek PBX IP van 10.20.2.7
  const primaryPbxIp = nr === 8 ? '10.20.2.7' : `10.20.2.${nr}`;

  return {
    customerId,
    customerNr: nr,
    configNr: cfgPad,
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

export function getAllEspritConfigs(): EspritConfigEntry[] {
  const configs: EspritConfigEntry[] = [];
  for (let i = 1; i <= 125; i++) {
    configs.push(getEspritConfigByNumber(i));
  }
  return configs;
}
