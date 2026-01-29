import { Language, TopologyType } from './types';

export const TRANSLATIONS = {
  en: {
    title: "Network Topology Simulator",
    subtitle: "Visualize data flow and simulate failures",
    selectTopology: "Select Topology",
    topology: {
      [TopologyType.BUS]: "Bus Topology",
      [TopologyType.RING]: "Ring Topology",
      [TopologyType.STAR]: "Star Topology",
      [TopologyType.MESH]: "Mesh Topology",
    },
    controls: "Controls",
    sender: "Sender",
    receiver: "Receiver",
    sendData: "Send Data",
    reset: "Reset Network",
    breakMode: "Breakdown Mode",
    breakModeDesc: "Click PCs or cables to toggle failures",
    simulationResults: "Simulation Results",
    status: "Status",
    success: "Success",
    failure: "Failure",
    pathTaken: "Path Taken",
    instructions: "Instructions",
    instructionSteps: [
      "Select a topology type.",
      "Choose a Sender and a Receiver PC.",
      "Toggle 'Breakdown Mode' to click on PCs or cables to break them.",
      "Click 'Send Data' to visualize the packet flow.",
    ],
    logs: {
      start: "Starting transmission...",
      nodeBroken: "PC broken at",
      linkBroken: "Link broken between",
      arrived: "Packet arrived successfully!",
      dropped: "Packet dropped. No path found.",
      loop: "Packet detected loop or TTL expired.",
    },
    legend: {
      device: "Device (PC)",
      backbone: "Backbone/Joint",
      terminator: "Terminator",
      broken: "Broken"
    }
  },
  fr: {
    title: "Simulateur de Topologie Réseau",
    subtitle: "Visualisez le flux de données et simulez des pannes",
    selectTopology: "Choisir la Topologie",
    topology: {
      [TopologyType.BUS]: "Topologie en Bus",
      [TopologyType.RING]: "Topologie en Anneau",
      [TopologyType.STAR]: "Topologie en Étoile",
      [TopologyType.MESH]: "Topologie Maillée",
    },
    controls: "Contrôles",
    sender: "Émetteur",
    receiver: "Récepteur",
    sendData: "Envoyer Données",
    reset: "Réinitialiser",
    breakMode: "Mode Panne",
    breakModeDesc: "Cliquez sur des PC ou câbles pour créer des pannes",
    simulationResults: "Résultats de Simulation",
    status: "Statut",
    success: "Succès",
    failure: "Échec",
    pathTaken: "Chemin emprunté",
    instructions: "Instructions",
    instructionSteps: [
      "Sélectionnez un type de topologie.",
      "Choisissez un Émetteur et un Récepteur.",
      "Activez le 'Mode Panne' pour cliquer sur des PC ou câbles et les casser.",
      "Cliquez sur 'Envoyer Données' pour visualiser le flux.",
    ],
    logs: {
      start: "Début de la transmission...",
      nodeBroken: "PC en panne à",
      linkBroken: "Lien coupé entre",
      arrived: "Paquet arrivé avec succès !",
      dropped: "Paquet perdu. Aucun chemin trouvé.",
      loop: "Boucle détectée ou TTL expiré.",
    },
    legend: {
      device: "Appareil (PC)",
      backbone: "Dorsale/Joint",
      terminator: "Terminaison",
      broken: "En panne"
    }
  }
};