# SIP Design Maker - Code Architecture & Token-Efficient Modification Guide

Dit document beschrijft de modulaire opbouw van de applicatie zodat AI-modellen en ontwikkelaars **minimale tokens** hoeven in te zetten voor het lezen, begrijpen en aanpassen van code.

---

## 🎯 Snelle Navigatiegids (Direct naar het juiste bestand)

| Functionaliteit / Onderwerp | Doelbestand | Omvang |
| :--- | :--- | :--- |
| **IP & Naam Plaatsing (Overlapvrij)** | `src/components/service-builder/serviceBuilderGeometry.ts` | ~450 regels |
| **Element Badges & Labels Weergave** | `src/components/service-builder/ServiceElementBadges.tsx` | ~125 regels |
| **Inline Editing Veldjes** | `src/components/service-builder/BuilderInlineEdit.tsx` | ~80 regels |
| **Templates Eigenschappen Paneel** | `src/components/service-builder/ServiceBuilderPropertiesPanel.tsx` | ~580 regels |
| **Uitvraagscenario Generator** | `src/components/service-builder/serviceBuilderScenario.ts` | ~360 regels |
| **Uitvraag Tabblad UI & Exporteren** | `src/components/service-builder/ServiceBuilderScenarioTab.tsx` | ~430 regels |
| **Opgeslagen Templates Tab** | `src/components/service-builder/SavedServicesTab.tsx` | ~140 regels |
| **Telecom SVGs (Routers, Mediants, etc.)** | `src/components/service-builder/serviceBuilderSvgs.tsx` | ~270 regels |
| **Ingebouwde & Opgeslagen Diensten Data** | `src/data/servicesStore.ts` | ~250 regels |
| **Hoofd Diagram Canvas** | `src/components/NetworkDiagram.tsx` | Hoofddiagram weergave |
| **Locatie Formulier & Klantgegevens** | `src/components/LocationForm.tsx` | Locatie & klant velden |
| **Vertalingen (NL / EN / FR)** | `src/i18n/translations.ts` | Alle interface teksten |
| **Gedeelde Data Types & Interfaces** | `src/types.ts` | Datamodellen |

---

## ⚡ Regels voor Minimale Token-Uitgaven

1. **Lees alleen het specifieke doelbestand**:
   - Moet er iets aan de positionering van IP-adressen veranderen? Open direct `serviceBuilderGeometry.ts`.
   - Moet de styling of presentatie van labels of IP-badges veranderen? Open direct `ServiceElementBadges.tsx`.
   - Moet er een vertaling of naam aangepast worden? Open direct `translations.ts`.
   - Vermijd het inlezen van het grote `ServiceBuilderModal.tsx` of `NetworkDiagram.tsx` tenzij er een canvas-brede interactie verandert.

2. **Gebruik gerichte range-views**:
   - Gebruik `StartLine` en `EndLine` bij `view_file` om alleen de relevante functie of component in te zien.

3. **Herbruikbare types in `types.ts`**:
   - Alle interfaces zoals `BuilderElement`, `BadgePlacementResult`, `CustomServiceDefinition` staan centraal gedefinieerd.

4. **100% Overlapvrije Plaatsing (`serviceBuilderGeometry.ts`)**:
   - `calculateOptimalBadgesPlacement` test alle combinaties voor:
     - IP-adressen (WAN & LAN): `left` of `right`
     - Elementnamen: `top`, `bottom`, `left` of `right`
   - Berekent overlap-scores tegen alle andere elementen, connectoren en canvasranden en kiest de combinatie met minimale/nul overlap.

5. **Firewall Domeinlogica (Onbekend terrein qua IP)**:
   - Een firewall is intern en qua IP-adressering **onbekend terrein** (klantbeheer / IT-partner).
   - Het **terminerende adres bevindt zich vóór de firewall** (`showWanIp = true`, gelabeld als `Term. IP (vóór FW)`).
   - Interne LAN-adressen zijn klantdomein (`showLanIp = false` bij default).
   - Achter de firewall kan direct een PBX hangen of een LAN-wolk met daarachter PBX (`onAddBehindFirewall` in `ServiceBuilderPropertiesPanel.tsx` en `ServiceBuilderModal.tsx`).
   - In het uitvraagscenario (`serviceBuilderScenario.ts`) wordt het terminerende adres vóór de firewall verplicht uitgevraagd, en wordt de achterliggende routering/NATTraversal vastgelegd als klantbeheer.
