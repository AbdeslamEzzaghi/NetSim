export type Language = 'en' | 'fr';

export enum TopologyType {
  BUS = 'BUS',
  RING = 'RING',
  STAR = 'STAR',
  MESH = 'MESH',
}

export type NodeType = 'device' | 'switch' | 'backbone' | 'terminator';

export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: NodeType;
  active: boolean; // True = working, False = breakdown
}

export interface Link {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  active: boolean; // True = cable working, False = cut cable
}

export interface SimulationResult {
  success: boolean;
  path: string[]; // List of Node IDs visited (legacy for simple path)
  log: string;
}

// Used for visual state only
export interface PacketState {
  id: string; // unique id for list keys
  x: number;
  y: number;
}