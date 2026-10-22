import { BuilderElement, IntakeQuestion, IntakeScenario } from '../../types';

// Bepaalt of een type element standaard IP-adressen vereist
export function doesElementRequireIp(type: BuilderElement['type']): boolean {
  return ['router', 'mediant', 'firewall', 'pbx', 'sbc'].includes(type);
}

// Genereert automatisch het complete uitvraagscenario op basis van de elementen op het canvas
export function generateIntakeScenario(
  elements: BuilderElement[],
  serviceName: string = 'Nieuwe Dienst'
): IntakeScenario {
  const questions: IntakeQuestion[] = [];

  // VASTE BASISVRAGEN (Sowieso altijd klantnaam, projectnummer, locatie(s))
  // Deze worden altijd als category 'general' bovenaan geplaatst
  questions.push({
    id: 'general-customer-name',
    elementName: 'Algemeen Dossier',
    fieldKey: 'customerName',
    label: 'Klantnaam (Bedrijfsnaam)',
    placeholder: 'Bijv. Bedrijf B.V.',
    type: 'text',
    category: 'general',
    required: true,
    description: 'Officiële naam van de klantorganisatie voor wie de telecomdienst wordt opgeleverd.'
  });

  questions.push({
    id: 'general-project-number',
    elementName: 'Algemeen Dossier',
    fieldKey: 'projectNumber',
    label: 'Projectnummer (exact 8 tekens)',
    placeholder: 'Bijv. PRJ20241 of 12345678',
    type: 'text',
    category: 'general',
    required: true,
    description: 'Het projectnummer dient altijd exact 8 tekens/digits te bevatten conform de telecom-standaard.'
  });

  questions.push({
    id: 'general-locations',
    elementName: 'Algemeen Dossier',
    fieldKey: 'locations',
    label: 'Locatie(s) / Vestigingsnaam',
    placeholder: 'Bijv. Hoofdkantoor Utrecht, Filiaal Amsterdam',
    type: 'text',
    category: 'general',
    required: true,
    description: 'De fysieke klantsite(s) waar de apparatuur en aansluitingen worden geplaatst.'
  });

  // Check of er CN (Corporate Net) elementen zijn
  const hasCn = elements.some(e => 
    (e.label || '').toUpperCase().includes('CN') || 
    (e.customText || '').toUpperCase().includes('CN')
  );

  // ELEMENT-SPECIFIEKE IP-VRAGEN
  elements.forEach((el, index) => {
    const elemLabel = el.label || el.customText || `${el.type.toUpperCase()} #${index + 1}`;

    // Indien de gebruiker dit element expliciet heeft uitgeschakeld voor IP-uitvraag
    if (el.requiresIp === false) {
      return;
    }

    switch (el.type) {
      case 'mediant': {
        questions.push({
          id: `q-${el.id}-wan-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'mediant',
          fieldKey: `${el.id}_wanIp`,
          label: `${elemLabel} - Voice WAN IP`,
          placeholder: '10.183.57.xxx',
          type: 'ip',
          category: 'network',
          required: true,
          description: `Voice WAN IP-adres voor de operator-verbinding naar ${elemLabel}.`
        });

        questions.push({
          id: `q-${el.id}-lan-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'mediant',
          fieldKey: `${el.id}_lanIp`,
          label: `${elemLabel} - Voice LAN IP (CPE)`,
          placeholder: '192.168.1.1',
          type: 'ip',
          category: 'network',
          required: true,
          description: `Lokaal IP-adres van ${elemLabel} op het klantnetwerk.`
        });

        questions.push({
          id: `q-${el.id}-subnet`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'mediant',
          fieldKey: `${el.id}_lanSubnet`,
          label: `${elemLabel} - Subnetmasker`,
          placeholder: '255.255.255.0 (/24)',
          type: 'subnet',
          category: 'network',
          required: true,
          defaultVal: '255.255.255.0 (/24)',
          description: `Subnetmasker van het lokale Voice LAN segment.`
        });

        questions.push({
          id: `q-${el.id}-gateway`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'mediant',
          fieldKey: `${el.id}_defaultGateway`,
          label: `${elemLabel} - Default Gateway`,
          placeholder: '192.168.1.254',
          type: 'gateway',
          category: 'network',
          required: true,
          description: `Standaard gateway voor dataverkeer vanaf ${elemLabel}.`
        });
        break;
      }

      case 'router': {
        questions.push({
          id: `q-${el.id}-wan-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'router',
          fieldKey: `${el.id}_wanIp`,
          label: `${elemLabel} - Toegang / WAN IP`,
          placeholder: '10.x.x.x of Publiek WAN IP',
          type: 'ip',
          category: 'network',
          required: true,
          description: `WAN IP-adres of uplink-adres voor ${elemLabel}.`
        });

        questions.push({
          id: `q-${el.id}-gateway`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'router',
          fieldKey: `${el.id}_gateway`,
          label: `${elemLabel} - Default Gateway`,
          placeholder: '10.x.x.1',
          type: 'gateway',
          category: 'network',
          required: true,
          description: `Next-hop gateway voor ${elemLabel}.`
        });

        questions.push({
          id: `q-${el.id}-lan-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'router',
          fieldKey: `${el.id}_lanIp`,
          label: `${elemLabel} - Interne LAN / Interface IP`,
          placeholder: '192.168.1.254',
          type: 'ip',
          category: 'network',
          required: false,
          description: `Optioneel intern router interface adres.`
        });
        break;
      }

      case 'firewall': {
        // Detecteer topologie achter de firewall:
        // Komt er een LAN-wolk achter waar een PBX achter hangt, of een PBX direct achter de firewall?
        const hasPbxInDesign = elements.some(e => e.type === 'pbx');
        const hasCloudInDesign = elements.some(e => e.type === 'cloud');

        let topologyDesc = 'Firewall als beveiligingsdemarcatie';
        if (hasCloudInDesign && hasPbxInDesign) {
          topologyDesc = 'Firewall met achterliggende LAN-wolk en PBX';
        } else if (hasPbxInDesign) {
          topologyDesc = 'Firewall met PBX direct achter de firewall';
        } else if (hasCloudInDesign) {
          topologyDesc = 'Firewall met achterliggende Customer LAN-wolk';
        }

        // 1. Het terminerende adres vóór de firewall is altijd het PBX-adres (geen voorbeeldadres)
        const linkedPbx = elements.find(e => e.type === 'pbx');
        const defaultTermIp = el.wanIp || (linkedPbx ? (linkedPbx.lanIp || linkedPbx.wanIp) : '') || '';

        questions.push({
          id: `q-${el.id}-firewall-term-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'firewall',
          fieldKey: `${el.id}_terminatingIp`,
          label: `${elemLabel} - PBX-adres (terminerend adres vóór Firewall)`,
          placeholder: defaultTermIp || 'PBX IP-adres (geen voorbeeldadres)',
          type: 'ip',
          category: 'security',
          required: true,
          description: `Bij gebruik van een firewall door de klant is het PBX-adres het adres waar getermineerd wordt vóór de firewall. Er wordt géén voorbeeldadres gebruikt; de interne adressen en de firewall zelf zijn onbekend terrein (klantbeheer).`
        });

        // 2. Achterliggende routering & firewallregels (klantdomein / onbekend terrein)
        questions.push({
          id: `q-${el.id}-behind-fw-note`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'firewall',
          fieldKey: `${el.id}_behindFwHandling`,
          label: `${elemLabel} - Interne topologie (${topologyDesc})`,
          placeholder: 'Klant / IT-partner verzorgt intern LAN, NAT & SIP-doorvoer',
          type: 'text',
          category: 'security',
          required: false,
          description: `Onbekend terrein: klant/IT-beheerder beheert zelf de firewall, eventuele LAN-wolk en PBX. SIP ALG dient uitgeschakeld te zijn en SIP (5060 UDP/TCP) + RTP (10000-20000 UDP) worden doorgelaten.`
        });
        break;
      }

      case 'pbx': {
        const hasFw = elements.some(e => e.type === 'firewall');
        questions.push({
          id: `q-${el.id}-pbx-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'pbx',
          fieldKey: `${el.id}_pbxIp`,
          label: `${elemLabel} - SIP PBX Adres${hasFw ? ' (terminerend adres vóór firewall)' : ''}`,
          placeholder: el.lanIp || el.wanIp || 'PBX IP-adres',
          type: 'ip',
          category: 'endpoint',
          required: true,
          description: hasFw
            ? `Bij gebruik van een firewall door de klant is het PBX-adres altijd het adres waar getermineerd wordt vóór de firewall. Er wordt géén fictief voorbeeldadres gebruikt.`
            : `IP-adres van de lokale telefooncentrale (SIP PBX) die communiceert met de operator.`
        });
        break;
      }

      case 'cloud': {
        // Customer LAN info wordt al gegeven in de Mediant invulvelden (Voice LAN IP, Subnetmasker, Gateway).
        // De Mediant zit aan de LAN-kant, dus het LAN en subnet zijn al volledig opgegeven.
        break;
      }

      case 'sbc': {
        questions.push({
          id: `q-${el.id}-sbc-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'sbc',
          fieldKey: `${el.id}_sbcIp`,
          label: `${elemLabel} - Peering / Signaling IP`,
          placeholder: '10.183.x.x',
          type: 'ip',
          category: 'network',
          required: true,
          description: `SBC Signaling & Media IP-adres.`
        });
        break;
      }

      case 'switch': {
        questions.push({
          id: `q-${el.id}-switch-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'switch',
          fieldKey: `${el.id}_switchIp`,
          label: `${elemLabel} - Management IP-adres`,
          placeholder: el.lanIp || '192.168.1.2',
          type: 'ip',
          category: 'network',
          required: true,
          description: `Vast beheer IP-adres voor configuratie en monitoring van de netwerkswitch.`
        });
        questions.push({
          id: `q-${el.id}-switch-gateway`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'switch',
          fieldKey: `${el.id}_switchGateway`,
          label: `${elemLabel} - Default Gateway`,
          placeholder: '192.168.1.1',
          type: 'gateway',
          category: 'network',
          required: false,
          description: `Standaard gateway voor het beheer-VLAN van de switch.`
        });
        break;
      }

      case 'server': {
        questions.push({
          id: `q-${el.id}-server-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'server',
          fieldKey: `${el.id}_serverIp`,
          label: `${elemLabel} - Vast IP-adres`,
          placeholder: el.lanIp || '192.168.1.100',
          type: 'ip',
          category: 'endpoint',
          required: true,
          description: `Statisch IP-adres van de server in het datanetwerk.`
        });
        questions.push({
          id: `q-${el.id}-server-subnet`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'server',
          fieldKey: `${el.id}_serverSubnet`,
          label: `${elemLabel} - Subnetmasker`,
          placeholder: '255.255.255.0 (/24)',
          type: 'subnet',
          category: 'network',
          required: false,
          description: `Subnetmasker van het netwerksegment waarin de server zich bevindt.`
        });
        break;
      }

      case 'workstation': {
        questions.push({
          id: `q-${el.id}-pc-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'workstation',
          fieldKey: `${el.id}_workstationIp`,
          label: `${elemLabel} - IP Toewijzing`,
          placeholder: 'DHCP Pool (of vast IP)',
          type: 'text',
          category: 'endpoint',
          required: false,
          description: `IP-adrestype voor de werkplek (DHCP vanuit router/firewall of statisch adres).`
        });
        break;
      }

      case 'access-point': {
        questions.push({
          id: `q-${el.id}-ap-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'access-point',
          fieldKey: `${el.id}_apIp`,
          label: `${elemLabel} - Access Point IP`,
          placeholder: el.lanIp || '192.168.1.50',
          type: 'ip',
          category: 'network',
          required: false,
          description: `Beheer IP-adres van het draadloze Access Point.`
        });
        break;
      }

      default:
        break;
    }
  });

  // Als er CN functionaliteit is gedetecteerd, voeg Corporate Net IP's toe
  if (hasCn) {
    questions.push({
      id: 'cn-wan-ip',
      elementName: 'CN',
      fieldKey: 'cnWanIp',
      label: 'CN - WAN IP',
      placeholder: '10.x.x.x',
      type: 'ip',
      category: 'network',
      required: true,
      description: 'Dedicated WAN IP-adres voor het CN.'
    });

    questions.push({
      id: 'cn-lan-ip',
      elementName: 'CN',
      fieldKey: 'cnLanIp',
      label: 'CN - LAN IP',
      placeholder: '192.168.x.x',
      type: 'ip',
      category: 'network',
      required: true,
      description: 'Lokaal IP-adres voor het CN.'
    });
  }

  return {
    alwaysIncludeGeneral: true,
    customerNameRequired: true,
    projectNumberRequired: true,
    locationsRequired: true,
    questions
  };
}

// Exporteert het scenario als handig, professioneel intake-document (tekst / checklist)
export function exportIntakeScenarioToText(
  scenario: IntakeScenario,
  serviceName: string
): string {
  const lines: string[] = [];
  lines.push('========================================================================');
  lines.push(`UITVRAAGSCENARIO & TECHNISCHE INTAKE CHECKLIST: ${serviceName.toUpperCase()}`);
  lines.push('========================================================================');
  lines.push('');
  lines.push('DEEL 1: ALGEMENE PROJECTGEGEVENS (SOWIESO ALTIJD VAN TOEPASSING)');
  lines.push('------------------------------------------------------------------------');
  lines.push('[ ] 1. Klantnaam:             ___________________________________________');
  lines.push('[ ] 2. Projectnummer (8 tek): ___________________________________________ (exact 8 tekens/digits)');
  lines.push('[ ] 3. Locatie(s) / Sites:    ___________________________________________');
  lines.push('');

  const techQuestions = scenario.questions.filter(q => q.category !== 'general');
  lines.push('DEEL 2: TECHNISCHE IP-ADRES UITVRAAG PER ELEMENT');
  lines.push('------------------------------------------------------------------------');

  if (techQuestions.length === 0) {
    lines.push('Geen specifieke netwerkelementen op het canvas die IP-adressen vereisen.');
  } else {
    // Groepeer per element
    const grouped: Record<string, IntakeQuestion[]> = {};
    techQuestions.forEach(q => {
      const groupName = q.elementName || 'Overig';
      if (!grouped[groupName]) grouped[groupName] = [];
      grouped[groupName].push(q);
    });

    Object.entries(grouped).forEach(([elemName, qList]) => {
      lines.push(`[+] Element: ${elemName}`);
      qList.forEach(q => {
        const reqStr = q.required ? '[VERPLICHT]' : '[OPTIONEEL]';
        lines.push(`    - ${q.label} ${reqStr}`);
        lines.push(`      Waarde: _____________________________________ (bijv. ${q.placeholder || '-'})`);
        if (q.description) {
          lines.push(`      Toelichting: ${q.description}`);
        }
      });
      lines.push('');
    });
  }

  lines.push('========================================================================');
  lines.push('Gegenereerd door SIP Design Maker - Templates Uitvraagmodule');
  lines.push('========================================================================');

  return lines.join('\n');
}
