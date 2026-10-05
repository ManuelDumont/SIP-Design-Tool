export type Language = 'nl' | 'en' | 'fr';

export interface Translations {
  appName: string;
  appSubtitle: string;
  customer: string;
  customerName: string;
  projectNumber: string;
  projectNumberTitle: string;
  projectNumberDesc: string;
  projectNumberPlaceholder: string;
  charsRemaining: (count: number) => string;
  exactCharsHelp: string;
  confirm: string;
  skip: string;
  edit: string;
  cancel: string;
  save: string;
  openDesign: string;
  resetDesign: string;
  exportPng: string;
  resetPositions: string;
  locations: string;
  addLocation: string;
  locationName: string;
  locationPlaceholder: string;
  demarcationToggle: string;
  demarcationDesc: string;
  cpeTitle: string;
  addCpe: string;
  deleteLocation: string;
  deleteCpe: string;
  hostname: string;
  serviceType: string;
  ipAddresses: string;
  wanIp: string;
  lanIp: string;
  cnWanIp: string;
  cnLanIp: string;
  subnetMask: string;
  defaultGateway: string;
  endpoints: string;
  addEndpoint: string;
  routedEndpoints: string;
  addRoutedEndpoint: string;
  noCpesYet: string;
  noCpesDesc: string;
  ipVoiceCore: string;
  sbcCluster: string;
  customerLan: string;
  demarcationLegend: string;
  demarcationLineTitle: string;
  userGuide: string;
  userGuideTitle: string;
  guideIntro: string;
  guideRightClickTitle: string;
  guideRightClickDesc: string;
  guideInlineEditTitle: string;
  guideInlineEditDesc: string;
  guideResizeTitle: string;
  guideResizeDesc: string;
  guideSubnetRoutingTitle: string;
  guideSubnetRoutingDesc: string;
  guidePanZoomTitle: string;
  guidePanZoomDesc: string;
  guideProjectTitle: string;
  guideProjectDesc: string;
  guideB2buaTitle: string;
  guideB2buaDesc: string;
  guideDragDropTitle: string;
  guideDragDropDesc: string;
  guideExportTitle: string;
  guideExportDesc: string;
  dropJsonToLoad: string;
  dropJsonSubtext: string;
  invalidJsonError: string;
  designLoadedSuccess: string;
  close: string;
  legend: string;
  demarcationLineLabel: string;
  demarcationDomainDesc: string;
  cloudTooltip: string;
  phoneTooltip: string;
  sbcTooltip: string;
  resetPositionsTooltip: string;
  exportPngTooltip: string;
  routedEndpointTitle: string;
  endpointTitle: string;
  gatewayLabel: string;
  step1Title: string;
  step1Subtitle: string;
  customerPlaceholder: string;
  step2Title: string;
  step3Title: string;
  noLocationsYet: string;
  addLocationToStart: string;
  themeLight: string;
  themeDark: string;
  lightModeTooltip: string;
  darkModeTooltip: string;
  openDesignTooltip: string;
  resetDesignTooltip: string;
  editCustomerProject: string;
  nextProjectNumber: string;
  saveDesign: string;
  saveDesignTooltip: string;
  fileMenu: string;
}

export const translations: Record<Language, Translations> = {
  nl: {
    appName: 'SIP Design Maker',
    appSubtitle: 'Professionele architectuur & demarcatie ontwerptool',
    customer: 'Klant',
    customerName: 'Klantnaam',
    projectNumber: 'Projectnummer',
    projectNumberTitle: 'Projectnummer',
    projectNumberDesc: 'Het projectnummer is altijd exact 8 tekens/digits (letters en cijfers mogelijk).',
    projectNumberPlaceholder: 'Bijv. PRJ20241 of 12345678',
    charsRemaining: (count: number) => `Nog ${count} tekens (projectnummer is altijd 8 tekens)`,
    exactCharsHelp: 'Lengte projectnummer is altijd 8 tekens/digits',
    confirm: 'Bevestigen',
    skip: 'Overslaan',
    edit: 'Bewerken',
    cancel: 'Annuleren',
    save: 'Opslaan',
    openDesign: 'Ontwerp openen (.json)',
    resetDesign: 'Nieuw leeg ontwerp',
    exportPng: 'Exporteer naar PNG',
    resetPositions: 'Posities herstellen',
    locations: 'Locaties',
    addLocation: 'Locatie toevoegen',
    locationName: 'Locatienaam',
    locationPlaceholder: 'Bijv. Hoofdkantoor, Vestiging Utrecht',
    demarcationToggle: 'Demarcatielijn intekenen',
    demarcationDesc: 'Toon scheidingslijn (Operator domein / Klant domein)',
    cpeTitle: 'CPE',
    addCpe: 'Mediant toevoegen',
    deleteLocation: 'Locatie verwijderen',
    deleteCpe: 'Mediant verwijderen',
    hostname: 'Hostnaam / ID',
    serviceType: 'Diensttype',
    ipAddresses: 'IP Adressen',
    wanIp: 'WAN IP (Operator domein)',
    lanIp: 'LAN IP (Klant domein)',
    cnWanIp: 'CN WAN IP',
    cnLanIp: 'CN LAN IP',
    subnetMask: 'LAN Subnetmasker',
    defaultGateway: 'Default Gateway (optioneel)',
    endpoints: 'Lokale SIP Endpoints',
    addEndpoint: 'Endpoint toevoegen',
    routedEndpoints: 'Gerouteerde SIP Endpoints',
    addRoutedEndpoint: 'Gerouteerd endpoint toevoegen',
    noCpesYet: "Nog geen CPE's geconfigureerd",
    noCpesDesc: 'Voeg via het linkerpaneel een locatie en Mediant (CPE) toe om het netwerkdiagram op te bouwen.',
    ipVoiceCore: 'IP Voice core',
    sbcCluster: 'SBC Cluster',
    customerLan: 'Customer LAN (SIP)',
    demarcationLegend: 'Demarcatielijn (scheiding Operator domein / Klant domein)',
    demarcationLineTitle: 'DEMARCATIE',
    userGuide: 'Gebruiksaanwijzing',
    userGuideTitle: 'Gebruiksaanwijzing SIP Design Maker',
    guideIntro: 'Deze applicatie genereert automatisch professionele telecom-architectuurdiagrammen voor SIP trunking en Mediant B2BUA SBC oplossingen.',
    guideRightClickTitle: '🖱️ Objecten verplaatsen (Rechtermuisknop)',
    guideRightClickDesc: 'Klik met de RECHTER muisknop op een object (Mediant router, Gateway, SIP Endpoints of locatietekst) en sleep deze naar elke gewenste positie op het canvas. Alle verbindingslijnen blijven automatisch naadloos aangesloten! Gebruik de knop "Posities herstellen" om alles weer op de standaard layout te zetten.',
    guideInlineEditTitle: '✏️ Direct bewerken in het ontwerp (Tekst & IP-adressen)',
    guideInlineEditDesc: 'Klik direct op een tekst of IP-adres in de tekening om deze aan te passen: Klantnaam & Projectnummer in de rode topbalk, Locatienaam bij de Core Router, Mediant Hostnaam & Diensttype, alle WAN/LAN IP-adressen en het LAN-subnet in de wolk. Druk op Enter of klik ernaast om op te slaan.',
    guideResizeTitle: '📐 Handmatig vergroten/verkleinen (Routers & Wolken)',
    guideResizeDesc: 'Beweeg over een router (SBC, Core Router of Mediant) of over de Customer LAN-wolk. In de rechteronderhoek verschijnt een blauw schaal-handvatje (⤡). Sleep dit handvatje om het element direct handmatig groter of kleiner te schalen. Dubbelklik op het schaal-handvatje om direct terug te keren naar de standaardgrootte (100%).',
    guideSubnetRoutingTitle: '🌐 Slimme Endpoint Routering',
    guideSubnetRoutingDesc: 'Endpoints met een IP-adres binnen het LAN-subnet worden direct aan de klantwolk gekoppeld. Endpoints met een IP buiten het LAN-subnet worden automatisch achter de Default Gateway geplaatst met een gestreepte verbindingslijn.',
    guidePanZoomTitle: '🔍 Navigatie & Zoom (Linkermuisknop)',
    guidePanZoomDesc: 'Sleep met de linkermuisknop over de canvas-achtergrond om het diagram te pannen. Gebruik het scrollwiel van de muis om vloeiend in en uit te zoomen.',
    guideProjectTitle: '📋 Projectnummer & Klant',
    guideProjectDesc: 'Het projectnummer bestaat altijd uit exact 8 tekens (zowel letters als cijfers zijn toegestaan, letters worden automatisch als hoofdletters geformatteerd).',
    guideB2buaTitle: '⚡ B2BUA Demarcatie & Wolkkoppeling',
    guideB2buaDesc: 'De Mediant router fungeert als B2BUA: de bovenzijde bevindt zich in het operatornetwerk, terwijl de onderzijde direct in de Customer LAN wolk zit. De rode demarcatielijn scheidt het operator-domein van het klant-domein.',
    guideDragDropTitle: '📂 JSON Slepen & Neerzetten (Drag & Drop)',
    guideDragDropDesc: 'Sleep een eerder opgeslagen .json-bestand direct vanaf uw computer naar het ontwerpscherm om het ontwerp onmiddellijk in te laden en verder te bewerken.',
    guideExportTitle: '💾 Exporteren, Opslaan & Openen',
    guideExportDesc: 'Klik op "Exporteer naar PNG" om een haarscherpe afbeelding van het diagram te downloaden. U kunt ontwerpen ook opslaan als .json en later openen door het bestand direct naar het scherm te slepen of via het Bestand-menu.',
    dropJsonToLoad: 'Laat het .json bestand los om te openen',
    dropJsonSubtext: 'Het netwerkontwerp wordt direct ingeladen in het scherm',
    invalidJsonError: 'Het bestand kon niet worden geopend. Zorg ervoor dat het een geldig SIP-design .json bestand is.',
    designLoadedSuccess: 'Ontwerp succesvol geladen!',
    close: 'Sluiten',
    legend: 'Legenda:',
    demarcationLineLabel: 'Demarcatielijn',
    demarcationDomainDesc: '(scheiding Operator domein / Klant domein)',
    cloudTooltip: 'Customer LAN (Wolk als 1 geheel verslepen met rechtermuisknop)',
    phoneTooltip: 'Customer LAN Vaste Telefoon',
    sbcTooltip: 'SBC Cluster (AudioCodes Mediant™ 4000B)',
    resetPositionsTooltip: 'Zet alle verplaatste objecten terug op hun standaardpositie',
    exportPngTooltip: 'Download diagram als hoge resolutie PNG afbeelding',
    routedEndpointTitle: 'Gerouteerd SIP Endpoint',
    endpointTitle: 'SIP Endpoint',
    gatewayLabel: 'GATEWAY',
    step1Title: 'Klantgegevens',
    step1Subtitle: 'Klantnaam of projecttitel (optioneel)',
    customerPlaceholder: 'Bijv. Janssen BV',
    step2Title: 'Projectnummer',
    step3Title: 'Klant & Project',
    noLocationsYet: 'Nog geen locaties toegevoegd',
    addLocationToStart: 'Voeg een locatie toe om te starten met het netwerkontwerp.',
    themeLight: 'Licht',
    themeDark: 'Donker',
    lightModeTooltip: 'Schakel over naar licht thema',
    darkModeTooltip: 'Schakel over naar donker thema',
    openDesignTooltip: 'Open een eerder opgeslagen ontwerp (.json) om verder te bewerken',
    resetDesignTooltip: 'Begin met een nieuw leeg ontwerp',
    editCustomerProject: 'Klant- en projectgegevens bewerken',
    nextProjectNumber: 'Volgende: Projectnummer',
    saveDesign: 'Ontwerp opslaan (.json)',
    saveDesignTooltip: 'Sla het huidige ontwerp op als .json bestand op uw computer',
    fileMenu: 'Bestand',
  },
  en: {
    appName: 'SIP Design Maker',
    appSubtitle: 'Professional architecture & demarcation design tool',
    customer: 'Customer',
    customerName: 'Customer Name',
    projectNumber: 'Project Number',
    projectNumberTitle: 'Project Number',
    projectNumberDesc: 'The project number is always exactly 8 characters/digits (letters and numbers allowed).',
    projectNumberPlaceholder: 'E.g. PRJ20241 or 12345678',
    charsRemaining: (count: number) => `${count} characters remaining (project number is always 8 characters)`,
    exactCharsHelp: 'Project number length is always 8 characters/digits',
    confirm: 'Confirm',
    skip: 'Skip',
    edit: 'Edit',
    cancel: 'Cancel',
    save: 'Save',
    openDesign: 'Open design (.json)',
    resetDesign: 'New blank design',
    exportPng: 'Export to PNG',
    resetPositions: 'Reset positions',
    locations: 'Locations',
    addLocation: 'Add location',
    locationName: 'Location name',
    locationPlaceholder: 'E.g. Headquarters, Utrecht Branch',
    demarcationToggle: 'Draw demarcation line',
    demarcationDesc: 'Show demarcation line (Operator domain / Customer domain)',
    cpeTitle: 'CPE',
    addCpe: 'Add Mediant',
    deleteLocation: 'Delete location',
    deleteCpe: 'Delete Mediant',
    hostname: 'Hostname / ID',
    serviceType: 'Service Type',
    ipAddresses: 'IP Addresses',
    wanIp: 'WAN IP (Operator domain)',
    lanIp: 'LAN IP (Customer domain)',
    cnWanIp: 'CN WAN IP',
    cnLanIp: 'CN LAN IP',
    subnetMask: 'LAN Subnet Mask',
    defaultGateway: 'Default Gateway (optional)',
    endpoints: 'Local SIP Endpoints',
    addEndpoint: 'Add endpoint',
    routedEndpoints: 'Routed SIP Endpoints',
    addRoutedEndpoint: 'Add routed endpoint',
    noCpesYet: 'No CPEs configured yet',
    noCpesDesc: 'Add a location and Mediant (CPE) in the left panel to build the network diagram.',
    ipVoiceCore: 'IP Voice core',
    sbcCluster: 'SBC Cluster',
    customerLan: 'Customer LAN (SIP)',
    demarcationLegend: 'Demarcation line (separation of Operator domain / Customer domain)',
    demarcationLineTitle: 'DEMARCATION',
    userGuide: 'User Guide',
    userGuideTitle: 'SIP Design Maker User Guide',
    guideIntro: 'This application automatically generates professional telecom architecture diagrams for SIP trunking and Mediant B2BUA SBC solutions.',
    guideRightClickTitle: '🖱️ Move Objects (Right Mouse Button)',
    guideRightClickDesc: 'Click and drag with the RIGHT mouse button on any object (Mediant router, Gateway, SIP Endpoints, or location headers) to move it freely across the canvas. All connecting lines adapt dynamically with zero gaps! Click "Reset positions" anytime to return to the automatic default layout.',
    guideInlineEditTitle: '✏️ Direct In-Design Editing (Text & IP Addresses)',
    guideInlineEditDesc: 'Click directly on any label or IP address in the diagram to edit it instantly: Customer Name & Project Number in the red top bar, Location Name at the Core Router, Mediant Hostname & Service, WAN/LAN IPs, and LAN subnet inside the cloud. Press Enter or click outside to save.',
    guideResizeTitle: '📐 Manual Resizing (Routers & Clouds)',
    guideResizeDesc: 'Hover over any router (SBC, Core Router, or Mediant) or the Customer LAN cloud. A blue resize handle (⤡) appears in the bottom-right corner. Drag this handle to enlarge or shrink the element. Double-click the corner handle to return to the default 100% size.',
    guideSubnetRoutingTitle: '🌐 Smart Endpoint Routing',
    guideSubnetRoutingDesc: 'Endpoints with an IP address inside the LAN subnet attach directly to the cloud. Endpoints with an IP address outside the subnet automatically relocate behind the Default Gateway with a dashed connection line.',
    guidePanZoomTitle: '🔍 Canvas Navigation & Zoom (Left Mouse Button)',
    guidePanZoomDesc: 'Click and drag with the left mouse button on the background canvas to pan. Use the mouse scroll wheel to zoom in and out smoothly.',
    guideProjectTitle: '📋 Project Number & Customer',
    guideProjectDesc: 'The project number always consists of exactly 8 characters (both letters and numbers allowed; letters are automatically formatted in uppercase).',
    guideB2buaTitle: '⚡ B2BUA Demarcation & Cloud Boundary',
    guideB2buaDesc: 'The Mediant acts as a B2BUA: its top is in the operator network, while its bottom sits directly on the Customer LAN cloud. The red demarcation line separates the operator and customer domains.',
    guideDragDropTitle: '📂 Drag & Drop JSON Designs',
    guideDragDropDesc: 'Drag and drop any saved .json design file directly from your computer onto the canvas to instantly open and continue editing it.',
    guideExportTitle: '💾 Export, Save & Open',
    guideExportDesc: 'Click "Export to PNG" to download a high-resolution image of your diagram. Designs can also be saved as .json files and reopened anytime by dragging them onto the canvas or using the File menu.',
    dropJsonToLoad: 'Drop your .json design file here to open',
    dropJsonSubtext: 'The network diagram will be loaded immediately',
    invalidJsonError: 'Could not open the file. Please ensure it is a valid SIP design .json file.',
    designLoadedSuccess: 'Design loaded successfully!',
    close: 'Close',
    legend: 'Legend:',
    demarcationLineLabel: 'Demarcation line',
    demarcationDomainDesc: '(separation of Operator domain / Customer domain)',
    cloudTooltip: 'Customer LAN (Drag cloud as single unit with right mouse button)',
    phoneTooltip: 'Customer LAN Desk Phone',
    sbcTooltip: 'SBC Cluster (AudioCodes Mediant™ 4000B)',
    resetPositionsTooltip: 'Reset all moved objects to their default positions',
    exportPngTooltip: 'Download diagram as high-resolution PNG image',
    routedEndpointTitle: 'Routed SIP Endpoint',
    endpointTitle: 'SIP Endpoint',
    gatewayLabel: 'GATEWAY',
    step1Title: 'Customer Details',
    step1Subtitle: 'Customer name or project title (optional)',
    customerPlaceholder: 'E.g. Acme Corp Ltd',
    step2Title: 'Project Number',
    step3Title: 'Customer & Project',
    noLocationsYet: 'No locations added yet',
    addLocationToStart: 'Add a location to begin building the network diagram.',
    themeLight: 'Light',
    themeDark: 'Dark',
    lightModeTooltip: 'Switch to light theme',
    darkModeTooltip: 'Switch to dark theme',
    openDesignTooltip: 'Open a previously saved design (.json) to continue editing',
    resetDesignTooltip: 'Start with a new blank design',
    editCustomerProject: 'Edit customer and project details',
    nextProjectNumber: 'Next: Project Number',
    saveDesign: 'Save design (.json)',
    saveDesignTooltip: 'Save current design as a .json file to your computer',
    fileMenu: 'File',
  },
  fr: {
    appName: 'SIP Design Maker',
    appSubtitle: 'Outil de conception d’architecture & démarcation réseau',
    customer: 'Client',
    customerName: 'Nom du client',
    projectNumber: 'Numéro de projet',
    projectNumberTitle: 'Numéro de projet',
    projectNumberDesc: 'Le numéro de projet comporte toujours exactement 8 caractères/chiffres (lettres et chiffres autorisés).',
    projectNumberPlaceholder: 'Ex. PRJ20241 ou 12345678',
    charsRemaining: (count: number) => `Encore ${count} caractères (le numéro comporte toujours 8 caractères)`,
    exactCharsHelp: 'La longueur du numéro de projet est toujours de 8 caractères/chiffres',
    confirm: 'Confirmer',
    skip: 'Passer',
    edit: 'Modifier',
    cancel: 'Annuler',
    save: 'Enregistrer',
    openDesign: 'Ouvrir projet (.json)',
    resetDesign: 'Nouveau projet vierge',
    exportPng: 'Exporter en PNG',
    resetPositions: 'Réinitialiser positions',
    locations: 'Sites / Emplacements',
    addLocation: 'Ajouter un site',
    locationName: 'Nom du site',
    locationPlaceholder: 'Ex. Siège social, Agence de Paris',
    demarcationToggle: 'Tracer la ligne de démarcation',
    demarcationDesc: 'Afficher la démarcation (Domaine opérateur / Domaine client)',
    cpeTitle: 'CPE',
    addCpe: 'Ajouter un Mediant',
    deleteLocation: 'Supprimer le site',
    deleteCpe: 'Supprimer le Mediant',
    hostname: 'Nom d’hôte / ID',
    serviceType: 'Type de service',
    ipAddresses: 'Adresses IP',
    wanIp: 'IP WAN (Domaine opérateur)',
    lanIp: 'IP LAN (Domaine client)',
    cnWanIp: 'IP WAN CN',
    cnLanIp: 'IP LAN CN',
    subnetMask: 'Masque de sous-réseau LAN',
    defaultGateway: 'Passerelle par défaut (optionnel)',
    endpoints: 'SIP Endpoints locaux',
    addEndpoint: 'Ajouter un endpoint',
    routedEndpoints: 'SIP Endpoints routés',
    addRoutedEndpoint: 'Ajouter un endpoint routé',
    noCpesYet: 'Aucun CPE configuré pour le moment',
    noCpesDesc: 'Ajoutez un site et un Mediant (CPE) dans le panneau de gauche pour construire le diagramme.',
    ipVoiceCore: 'IP Voice core',
    sbcCluster: 'Cluster SBC',
    customerLan: 'Customer LAN (SIP)',
    demarcationLegend: 'Ligne de démarcation (séparation domaine opérateur / domaine client)',
    demarcationLineTitle: 'DÉMARCATION',
    userGuide: 'Mode d’emploi',
    userGuideTitle: 'Mode d’emploi SIP Design Maker',
    guideIntro: 'Cette application génère automatiquement des diagrammes d’architecture télécom professionnels pour les solutions SIP Trunking et Mediant B2BUA SBC.',
    guideRightClickTitle: '🖱️ Déplacer les objets (Clic droit)',
    guideRightClickDesc: 'Cliquez avec le bouton DROIT de la souris sur n’importe quel objet (routeur Mediant, passerelle, SIP Endpoints ou en-têtes de site) et glissez-le où vous le souhaitez. Toutes les lignes de connexion restent parfaitement connectées sans espace ! Cliquez sur "Réinitialiser positions" pour restaurer la disposition par défaut.',
    guideInlineEditTitle: '✏️ Modification directe sur le plan (Texte & IP)',
    guideInlineEditDesc: 'Cliquez directement sur un texte ou une adresse IP dans le schéma pour le modifier : Nom du client et Numéro de projet dans le bandeau supérieur rouge, Nom du site, Nom d’hôte et Service du Mediant, adresses IP WAN/LAN, et sous-réseau LAN dans le nuage. Appuyez sur Entrée ou cliquez à l’extérieur pour enregistrer.',
    guideResizeTitle: '📐 Redimensionnement manuel (Routeurs & Nuages)',
    guideResizeDesc: 'Survolez un routeur (SBC, Core Router ou Mediant) ou le nuage Customer LAN. Une poignée bleue (⤡) apparaît dans le coin inférieur droit. Faites-la glisser pour ajuster la taille. Double-cliquez sur la poignée pour rétablir la taille par défaut (100%).',
    guideSubnetRoutingTitle: '🌐 Routage intelligent des endpoints',
    guideSubnetRoutingDesc: 'Les endpoints situés dans le sous-réseau LAN sont rattachés directement au nuage. Les endpoints en dehors du sous-réseau sont automatiquement positionnés derrière la passerelle par défaut avec une ligne en pointillés.',
    guidePanZoomTitle: '🔍 Navigation & Zoom (Clic gauche)',
    guidePanZoomDesc: 'Glissez avec le clic gauche sur l’arrière-plan pour déplacer la vue (pan). Utilisez la molette de la souris pour zoomer et dézoomer avec fluidité.',
    guideProjectTitle: '📋 Numéro de projet & Client',
    guideProjectDesc: 'Le numéro de projet est toujours composé de 8 caractères (chiffres et lettres acceptés, les lettres sont automatiquement passées en majuscules).',
    guideB2buaTitle: '⚡ Démarcation B2BUA & Nuage Client',
    guideB2buaDesc: 'Le Mediant fonctionne comme B2BUA : le haut est dans le réseau opérateur, tandis que le bas repose directement sur le nuage Customer LAN. La ligne rouge de démarcation sépare les deux domaines.',
    guideDragDropTitle: '📂 Glisser-déposer des fichiers JSON',
    guideDragDropDesc: 'Glissez et déposez simplement un fichier .json enregistré directement depuis votre ordinateur sur l’écran de conception pour charger instantanément le projet.',
    guideExportTitle: '💾 Exportation, Sauvegarde & Ouverture',
    guideExportDesc: 'Cliquez sur "Exporter en PNG" pour télécharger le diagramme en haute définition. Vous pouvez également sauvegarder vos projets au format .json et les rouvrir par simple glisser-déposer sur le plan ou via le menu Fichier.',
    dropJsonToLoad: 'Déposez le fichier .json pour ouvrir le projet',
    dropJsonSubtext: 'Le diagramme réseau sera immédiatement chargé à l’écran',
    invalidJsonError: 'Impossible d’ouvrir le fichier. Veuillez vérifier qu’il s’agit d’un fichier .json de conception SIP valide.',
    designLoadedSuccess: 'Projet chargé avec succès !',
    close: 'Fermer',
    legend: 'Légende :',
    demarcationLineLabel: 'Ligne de démarcation',
    demarcationDomainDesc: '(séparation domaine opérateur / domaine client)',
    cloudTooltip: 'Customer LAN (Glisser le nuage comme une unité avec le clic droit)',
    phoneTooltip: 'Poste téléphonique Customer LAN',
    sbcTooltip: 'Cluster SBC (AudioCodes Mediant™ 4000B)',
    resetPositionsTooltip: 'Rétablir tous les objets déplacés à leur position par défaut',
    exportPngTooltip: 'Télécharger le diagramme en image PNG haute résolution',
    routedEndpointTitle: 'SIP Endpoint routé',
    endpointTitle: 'SIP Endpoint',
    gatewayLabel: 'PASSERELLE',
    step1Title: 'Coordonnées du client',
    step1Subtitle: 'Nom du client ou titre du projet (optionnel)',
    customerPlaceholder: 'Ex. Entreprise Dupont SA',
    step2Title: 'Numéro de projet',
    step3Title: 'Client & Projet',
    noLocationsYet: 'Aucun site ajouté pour le moment',
    addLocationToStart: 'Ajoutez un site pour commencer à concevoir le diagramme réseau.',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    lightModeTooltip: 'Basculer vers le thème clair',
    darkModeTooltip: 'Basculer vers le thème sombre',
    openDesignTooltip: 'Ouvrir un projet précédemment enregistré (.json) pour continuer',
    resetDesignTooltip: 'Commencer un nouveau projet vierge',
    editCustomerProject: 'Modifier les coordonnées client et projet',
    nextProjectNumber: 'Suivant : Numéro de projet',
    saveDesign: 'Enregistrer le projet (.json)',
    saveDesignTooltip: 'Enregistrer le projet actuel sous forme de fichier .json sur votre ordinateur',
    fileMenu: 'Fichier',
  },
};
