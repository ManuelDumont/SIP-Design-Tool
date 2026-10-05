export function isValidIPv4(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim().split('/')[0].split(':')[0].trim();
  const parts = clean.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

export function ipToLong(ip: string): number {
  const clean = ip.trim().split('/')[0].split(':')[0].trim();
  return clean.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function getCidrFromSubnetString(subnetStr: string): number | null {
  if (!subnetStr) return 24;
  const trimmed = subnetStr.trim();
  const match = trimmed.match(/\/(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const directMatch = trimmed.match(/^\/?(\d+)$/);
  if (directMatch && directMatch[1]) {
    return parseInt(directMatch[1], 10);
  }
  const maskMap: Record<string, number> = {
    '255.255.255.252': 30,
    '255.255.255.248': 29,
    '255.255.255.240': 28,
    '255.255.255.224': 27,
    '255.255.255.192': 26,
    '255.255.255.128': 25,
    '255.255.255.0': 24,
    '255.255.254.0': 23,
    '255.255.252.0': 22,
    '255.255.248.0': 21,
    '255.255.240.0': 20,
    '255.255.0.0': 16,
    '255.0.0.0': 8,
  };
  const cleanMask = trimmed.split(' ')[0].trim();
  if (maskMap[cleanMask] !== undefined) {
    return maskMap[cleanMask];
  }
  return 24;
}

export function isInSameSubnet(ip1: string, ip2: string, cidr: number): boolean {
  if (!isValidIPv4(ip1) || !isValidIPv4(ip2)) return false;
  const safeCidr = Math.max(0, Math.min(32, cidr || 24));
  const mask = safeCidr === 0 ? 0 : (-1 << (32 - safeCidr)) >>> 0;
  return ((ipToLong(ip1) & mask) >>> 0) === ((ipToLong(ip2) & mask) >>> 0);
}

export function getSubnetNetworkAddress(ip: string, cidr: number): string {
  if (!isValidIPv4(ip) || cidr === null || cidr < 0 || cidr > 32) return '';
  const mask = cidr === 0 ? 0 : (-1 << (32 - cidr)) >>> 0;
  const netLong = (ipToLong(ip) & mask) >>> 0;
  return [
    (netLong >>> 24) & 255,
    (netLong >>> 16) & 255,
    (netLong >>> 8) & 255,
    netLong & 255
  ].join('.');
}

export function validateLocation(loc: any): string[] {
  const warnings: string[] = [];

  loc.cpes?.forEach((cpe: any, cpeIndex: number) => {
    const prefix = `[${cpe.hostname || `CPE ${cpeIndex + 1}`}] `;
    
    if (cpe.wanIp && !isValidIPv4(cpe.wanIp)) {
      warnings.push(`${prefix}WAN IP (${cpe.wanIp}) is geen geldig IPv4 adres.`);
    }
    
    if (cpe.lanIpCpe && !isValidIPv4(cpe.lanIpCpe)) {
      warnings.push(`${prefix}LAN IP CPE (${cpe.lanIpCpe}) is geen geldig IPv4 adres.`);
    }

    if (cpe.defaultGateway && !isValidIPv4(cpe.defaultGateway)) {
      warnings.push(`${prefix}Default Gateway (${cpe.defaultGateway}) is geen geldig IPv4 adres.`);
    }

    if (cpe.cnWanIp && !isValidIPv4(cpe.cnWanIp)) {
      warnings.push(`${prefix}CN WAN IP (${cpe.cnWanIp}) is geen geldig IPv4 adres.`);
    }

    if (cpe.cnLanIp && !isValidIPv4(cpe.cnLanIp)) {
      warnings.push(`${prefix}CN LAN IP (${cpe.cnLanIp}) is geen geldig IPv4 adres.`);
    }

    cpe.pbxs?.forEach((pbx: any, pbxIndex: number) => {
      if (pbx.ip && !isValidIPv4(pbx.ip)) {
        warnings.push(`${prefix}SIP PBX ${pbxIndex + 1} IP (${pbx.ip}) is geen geldig IPv4 adres.`);
      }
    });

    // Subnet logic checks
    const effectiveLanIp = (cpe.serviceType === 'CN' && cpe.cnLanIp) ? cpe.cnLanIp : cpe.lanIpCpe;
    const cidr = getCidrFromSubnetString(cpe.lanSubnet);
    if (cidr !== null && effectiveLanIp && isValidIPv4(effectiveLanIp)) {
      if (cpe.defaultGateway && isValidIPv4(cpe.defaultGateway)) {
        if (!isInSameSubnet(effectiveLanIp, cpe.defaultGateway, cidr)) {
           warnings.push(`${prefix}Default Gateway (${cpe.defaultGateway}) bevindt zich niet in hetzelfde subnet als het LAN IP.`);
        }
      }

      cpe.pbxs?.forEach((pbx: any, pbxIndex: number) => {
        if (pbx.ip && isValidIPv4(pbx.ip)) {
          if (!isInSameSubnet(effectiveLanIp, pbx.ip, cidr)) {
             if (!cpe.defaultGateway || !isValidIPv4(cpe.defaultGateway)) {
                warnings.push(`${prefix}SIP PBX ${pbxIndex + 1} (${pbx.ip}) valt buiten het LAN subnet, maar er is geen geldige Default Gateway geconfigureerd om de routering mogelijk te maken.`);
             }
          }
        }
      });
    }
  });

  return warnings;
}

export function getNextMediantHostname(locations: any[]): string {
  let maxNum = 0;
  
  if (Array.isArray(locations)) {
    for (const loc of locations) {
      if (Array.isArray(loc.cpes)) {
        for (const cpe of loc.cpes) {
          if (cpe && typeof cpe.hostname === 'string') {
            const match = cpe.hostname.match(/(\d+)(?!.*\d)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `MEDIANT-${nextNum.toString().padStart(2, '0')}`;
}
