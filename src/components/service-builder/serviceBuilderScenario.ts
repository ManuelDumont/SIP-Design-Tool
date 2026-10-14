import { BuilderElement, IntakeQuestion, IntakeScenario } from '../../types';

// Bepaalt of een type element standaard IP-adressen vereist
export function doesElementRequireIp(type: BuilderElement['type']): boolean {
  return ['router', 'mediant', 'firewall', 'pbx', 'cloud', 'sbc'].includes(type);
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

  // Check of er CN (Corporate Network) elementen zijn
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
        questions.push({
          id: `q-${el.id}-firewall-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'firewall',
          fieldKey: `${el.id}_firewallIp`,
          label: `${elemLabel} - Firewall / PBX Gateway IP`,
          placeholder: '10.20.2.xxx',
          type: 'ip',
          category: 'security',
          required: true,
          description: `Interface IP-adres op de ${elemLabel} voor de beveiligde PBX/Voice verbinding.`
        });

        questions.push({
          id: `q-${el.id}-dmz-gateway`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'firewall',
          fieldKey: `${el.id}_dmzGateway`,
          label: `${elemLabel} - Management / Gateway IP`,
          placeholder: '10.20.2.254',
          type: 'gateway',
          category: 'security',
          required: false,
          description: `Gateway of beheeradres achter ${elemLabel}.`
        });
        break;
      }

      case 'pbx': {
        questions.push({
          id: `q-${el.id}-pbx-ip`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'pbx',
          fieldKey: `${el.id}_pbxIp`,
          label: `${elemLabel} - SIP PBX Endpoint IP`,
          placeholder: '192.168.1.50',
          type: 'ip',
          category: 'endpoint',
          required: true,
          description: `IP-adres van de lokale telefooncentrale (SIP PBX) die communiceert met de operator.`
        });

        questions.push({
          id: `q-${el.id}-pbx-brand`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'pbx',
          fieldKey: `${el.id}_pbxBrand`,
          label: `${elemLabel} - Merk & Model Telefooncentrale`,
          placeholder: 'Bijv. Mitel, Avaya, 3CX, Cisco CallManager',
          type: 'text',
          category: 'endpoint',
          required: false,
          description: `Merk en softwareversie van de aangesloten centrale.`
        });
        break;
      }

      case 'cloud': {
        questions.push({
          id: `q-${el.id}-subnet`,
          elementId: el.id,
          elementName: elemLabel,
          elementType: 'cloud',
          fieldKey: `${el.id}_cloudSubnet`,
          label: `${elemLabel} - Netwerk Range / CIDR`,
          placeholder: '192.168.1.0/24',
          type: 'subnet',
          category: 'network',
          required: true,
          defaultVal: '192.168.1.0/24',
          description: `Het IP-subnet van de klantomgeving voor ${elemLabel}.`
        });
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

      default:
        break;
    }
  });

  // Als er CN functionaliteit is gedetecteerd, voeg Corporate Network IP's toe
  if (hasCn) {
    questions.push({
      id: 'cn-wan-ip',
      elementName: 'Corporate Network (CN)',
      fieldKey: 'cnWanIp',
      label: 'Corporate Network (CN) - WAN IP',
      placeholder: '10.x.x.x',
      type: 'ip',
      category: 'network',
      required: true,
      description: 'Dedicated WAN IP-adres voor het Corporate Network.'
    });

    questions.push({
      id: 'cn-lan-ip',
      elementName: 'Corporate Network (CN)',
      fieldKey: 'cnLanIp',
      label: 'Corporate Network (CN) - LAN IP',
      placeholder: '192.168.x.x',
      type: 'ip',
      category: 'network',
      required: true,
      description: 'Lokaal IP-adres voor het Corporate Network.'
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
  lines.push('Gegenereerd door SIP Trunk Ontwerper - Bouwstudio Uitvraagmodule');
  lines.push('========================================================================');

  return lines.join('\n');
}
