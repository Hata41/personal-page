export type Vector3 = [number, number, number]; // x, y, z

export interface Dimensions {
  width: number; // x axis
  depth: number; // y axis (logic), z axis (visual)
  height: number; // z axis (logic), y axis (visual)
}

export type EMSStatus = 'ACTIVE' | 'CONSUMED' | 'PRUNED';

export interface Space {
  id: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  z1: number;
  z2: number;
  volume: number;
  // Genealogy
  parentIds: string[];
  stepIndex: number;
  status: EMSStatus;
}

export interface Item {
  id: string;
  dims: Dimensions;
  originalDims: Dimensions;
  selectedRotation: number;
  volume: number;
  color: string;
}

export interface PlacedItem extends Item {
  position: { x: number; y: number; z: number };
  supportedBy: string[];
  supportRatio: number;
}

export enum PackingStrategy {
  FF = 'First Fit (Standard)',
  FFD = 'First Fit Decreasing',
  FFH = 'First Fit Height',
  CONFLICT_GRAPH = 'Conflict Graph (Parallel)',
}

export enum WeightingHeuristic {
  VOLUME = 'Max Volume',
  CORNER = 'Corner Hugging',
  STABILITY = 'Layered Stability',
  FUTURE_SPACE = 'Anti-Fragmentation'
}

export interface PlacementCandidate {
  itemId: string;
  item: Item;
  emsId: string;
  position: { x: number, y: number, z: number };
  volume: number;
  weight: number;
}

export interface PackingState {
  containerDims: Dimensions;
  emsList: Space[];
  emsHistory: Space[];
  packedItems: PlacedItem[];
  itemsToPack: Item[];
  unpackedItems: Item[];
  isSimulationComplete: boolean;
  stepCount: number;
  isThinking?: boolean;
  thinkingProgress?: number;
}

export interface GeneratorConfig {
  maxItems: number;
  minSideLen: number;
  containerWidth: number;
  containerDepth: number;
  containerHeight: number;
  saIterations: number;
}

export interface SAHistoryEntry {
    iteration: number;
    utilization: number;
    temperature: number;
    accepted: boolean;
}

// Added missing interface for benchmarking results
export interface SimulationResult {
    strategy: PackingStrategy;
    utilization: number;
    packedCount: number;
    totalItems: number;
    avgSupport: number;
    timeTakenMs: number;
}

// Added missing interface for aggregated strategy statistics
export interface AggregatedStats {
    strategy: PackingStrategy;
    runs: number;
    avgUtilization: number;
    avgPackedCount: number;
    avgSupport: number;
    avgTimeMs: number;
    bestUtilization: number;
}