import { PackingStrategy, WeightingHeuristic } from '../types';
import type {
  Space, Item, PlacedItem, Dimensions,
  GeneratorConfig, PlacementCandidate, PackingState,
  SAHistoryEntry
} from '../types';

export const DEFAULT_CONTAINER_DIMS: Dimensions = { width: 5870, depth: 2330, height: 2200 };

let emsIdCounter = 0;
export const resetEMSIdCounter = () => { emsIdCounter = 0; };
const generateEMSId = (step: number) => `ems-s${step}-${++emsIdCounter}`;

export const createContainerSpace = (dims: Dimensions): Space => {
  resetEMSIdCounter();
  return {
    id: generateEMSId(0),
    x1: 0, x2: dims.width,
    y1: 0, y2: dims.depth,
    z1: 0, z2: dims.height,
    volume: dims.width * dims.depth * dims.height,
    parentIds: [],
    stepIndex: 0,
    status: 'ACTIVE'
  };
};

const isIncluded = (inner: Space, outer: Space): boolean => {
  return (inner.x1 >= outer.x1 && inner.x2 <= outer.x2 && inner.y1 >= outer.y1 && inner.y2 <= outer.y2 && inner.z1 >= outer.z1 && inner.z2 <= outer.z2);
};

const intersect = (s1: Space, s2: Space): boolean => {
  return (s1.x1 < s2.x2 && s1.x2 > s2.x1 && s1.y1 < s2.y2 && s1.y2 > s2.y1 && s1.z1 < s2.z2 && s1.z2 > s2.z1);
};

const getIntersectionArea = (r1: any, r2: any): number => {
  const xOverlap = Math.max(0, Math.min(r1.x2, r2.x2) - Math.max(r1.x1, r2.x1));
  const yOverlap = Math.max(0, Math.min(r1.y2, r2.y2) - Math.max(r1.y1, r2.y1));
  return xOverlap * yOverlap;
};

const boxesIntersect = (b1: any, b2: any): boolean => {
  return (b1.x < b2.x + b2.w && b1.x + b1.w > b2.x && b1.y < b2.y + b2.d && b1.y + b1.d > b2.y && b1.z < b2.z + b2.h && b1.z + b1.h > b2.z);
};

export const getRotatedDims = (dims: Dimensions, rotation: number): Dimensions => {
  const { width: w, depth: d, height: h } = dims;
  switch (rotation % 6) {
    case 0: return { width: w, depth: d, height: h };
    case 1: return { width: w, depth: h, height: d };
    case 2: return { width: d, depth: w, height: h };
    case 3: return { width: d, depth: h, height: w };
    case 4: return { width: h, depth: w, height: d };
    case 5: return { width: h, depth: d, height: w };
    default: return dims;
  }
};

export const calculateSupport = (itemDims: Dimensions, pos: { x: number, y: number, z: number }, placedItems: PlacedItem[], minSupportThreshold: number): { valid: boolean, ratio: number, supporters: string[] } => {
  const itemBaseArea = itemDims.width * itemDims.depth;
  if (pos.z === 0) return { valid: true, ratio: 1.0, supporters: ['FLOOR'] };
  const myRect = { x1: pos.x, x2: pos.x + itemDims.width, y1: pos.y, y2: pos.y + itemDims.depth };
  let supportedArea = 0;
  const supporters: string[] = [];
  for (const placed of placedItems) {
    if (Math.abs(placed.position.z + placed.dims.height - pos.z) < 1) {
      const area = getIntersectionArea(myRect, { x1: placed.position.x, x2: placed.position.x + placed.dims.width, y1: placed.position.y, y2: placed.position.y + placed.dims.depth });
      if (area > 0) { supportedArea += area; supporters.push(placed.id); }
    }
  }
  const ratio = supportedArea / itemBaseArea;
  return { valid: ratio >= minSupportThreshold - 0.001, ratio, supporters };
};

export const updateEMS = (currentActiveEMS: Space[], itemSpace: Space, currentStepIndex: number): { activeEMS: Space[], historyUpdate: Space[] } => {
  const nextActiveEMS: Space[] = [];
  const historyUpdate: Space[] = [];
  const intactEMS: Space[] = [];
  const intersectedEMS: Space[] = [];
  for (const ems of currentActiveEMS) {
    if (!intersect(ems, itemSpace)) intactEMS.push(ems);
    else intersectedEMS.push(ems);
  }
  for (const ems of intersectedEMS) historyUpdate.push({ ...ems, status: 'CONSUMED' });
  const generatedCandidates: Space[] = [];
  for (const ems of intersectedEMS) {
    const newSpaces: Partial<Space>[] = [];
    if (itemSpace.x2 < ems.x2) newSpaces.push({ ...ems, x1: itemSpace.x2 });
    if (itemSpace.x1 > ems.x1) newSpaces.push({ ...ems, x2: itemSpace.x1 });
    if (itemSpace.y2 < ems.y2) newSpaces.push({ ...ems, y1: itemSpace.y2 });
    if (itemSpace.y1 > ems.y1) newSpaces.push({ ...ems, y2: itemSpace.y1 });
    if (itemSpace.z2 < ems.z2) newSpaces.push({ ...ems, z1: itemSpace.z2 });
    if (itemSpace.z1 > ems.z1) newSpaces.push({ ...ems, z2: itemSpace.z1 });
    for (const ns of newSpaces) {
      generatedCandidates.push({
        id: generateEMSId(currentStepIndex),
        x1: ns.x1!, x2: ns.x2!, y1: ns.y1!, y2: ns.y2!, z1: ns.z1!, z2: ns.z2!,
        volume: (ns.x2! - ns.x1!) * (ns.y2! - ns.y1!) * (ns.z2! - ns.z1!),
        parentIds: [ems.id], stepIndex: currentStepIndex, status: 'ACTIVE'
      });
    }
  }
  for (const candidate of generatedCandidates) {
    let isRedundant = false;
    for (const intact of intactEMS) { if (isIncluded(candidate, intact)) { isRedundant = true; break; } }
    if (!isRedundant) {
      for (const other of generatedCandidates) { if (candidate !== other && isIncluded(candidate, other)) { isRedundant = true; break; } }
    }
    if (isRedundant) historyUpdate.push({ ...candidate, status: 'PRUNED' });
    else { nextActiveEMS.push(candidate); historyUpdate.push(candidate); }
  }
  nextActiveEMS.push(...intactEMS);
  return { activeEMS: nextActiveEMS, historyUpdate: historyUpdate };
};

const applyPlacement = (state: PackingState, item: Item, pos: { x: number, y: number, z: number }, minSupport: number): PackingState => {
  const support = calculateSupport(item.dims, pos, state.packedItems, minSupport);
  const placed: PlacedItem = { ...item, position: pos, supportedBy: support.supporters, supportRatio: support.ratio };
  const step = state.stepCount + 1;

  const itemSpace = {
    id: 'real-placed',
    x1: pos.x, x2: pos.x + item.dims.width,
    y1: pos.y, y2: pos.y + item.dims.depth,
    z1: pos.z, z2: pos.z + item.dims.height,
    volume: item.volume, parentIds: [], stepIndex: step, status: 'CONSUMED' as const
  };

  const res = updateEMS(state.emsList, itemSpace, step);
  const historyMap = new Map(state.emsHistory.map(e => [e.id, e]));
  res.historyUpdate.forEach(u => historyMap.set(u.id, u));

  return {
    ...state,
    packedItems: [...state.packedItems, placed],
    itemsToPack: state.itemsToPack.filter(i => i.id !== item.id),
    emsList: res.activeEMS,
    emsHistory: Array.from(historyMap.values()),
    stepCount: step
  };
};

export const performPackingStep = (prev: PackingState, strategy: PackingStrategy, minSupport: number, heuristic: WeightingHeuristic = WeightingHeuristic.VOLUME): PackingState => {
  if (prev.itemsToPack.length === 0) return { ...prev, isSimulationComplete: true };
  const currentStep = prev.stepCount + 1;

  const currentItem = prev.itemsToPack[0];
  const sortedEMS = [...prev.emsList].sort((a, b) => (Math.abs(a.z1 - b.z1) > 1 ? a.z1 - b.z1 : a.volume - b.volume));
  for (const ems of sortedEMS) {
    if (ems.x2 - ems.x1 >= currentItem.dims.width && ems.y2 - ems.y1 >= currentItem.dims.depth && ems.z2 - ems.z1 >= currentItem.dims.height) {
      const pos = { x: ems.x1, y: ems.y1, z: ems.z1 };
      const support = calculateSupport(currentItem.dims, pos, prev.packedItems, minSupport);
      if (support.valid) return applyPlacement(prev, currentItem, pos, minSupport);
    }
  }
  return { ...prev, itemsToPack: prev.itemsToPack.slice(1), unpackedItems: [...prev.unpackedItems, currentItem] };
};

export const generateGuillotineItems = (container: Dimensions, config: GeneratorConfig): Item[] => {
  const pendingItems: Dimensions[] = [{ width: container.width, depth: container.depth, height: container.height }];
  let attempts = 0; const maxAttempts = config.maxItems * 10;
  while (pendingItems.length < config.maxItems && attempts < maxAttempts) {
    attempts++; const index = Math.floor(Math.random() * pendingItems.length); const itm = pendingItems[index];
    const axes: ('width' | 'depth' | 'height')[] = [];
    if (itm.width >= 2 * config.minSideLen) axes.push('width');
    if (itm.depth >= 2 * config.minSideLen) axes.push('depth');
    if (itm.height >= 2 * config.minSideLen) axes.push('height');
    if (axes.length === 0) continue;
    const ax = axes[Math.floor(Math.random() * axes.length)];
    const split = Math.floor(config.minSideLen + Math.random() * (itm[ax] - 2 * config.minSideLen));
    const itm1 = { ...itm, [ax]: split }; const itm2 = { ...itm, [ax]: itm[ax] - split };
    pendingItems.splice(index, 1); pendingItems.push(itm1, itm2);
  }
  return pendingItems.map((dims, i) => ({ id: `item-${i + 1}`, dims, originalDims: dims, selectedRotation: 0, volume: dims.width * dims.depth * dims.height, color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` }));
};

export const sortItems = (items: Item[], strategy: PackingStrategy): Item[] => {
  if (strategy === PackingStrategy.FFD) return [...items].sort((a, b) => b.volume - a.volume);
  if (strategy === PackingStrategy.FFH) return [...items].sort((a, b) => b.dims.height - a.dims.height);
  return items;
};

export const runHeadlessSimulation = (strategy: PackingStrategy, items: Item[], containerDims: Dimensions, minSupport: number, heuristic: WeightingHeuristic = WeightingHeuristic.VOLUME): PackingState => {
  let state: PackingState = {
    containerDims, emsList: [createContainerSpace(containerDims)], emsHistory: [],
    packedItems: [], itemsToPack: strategy === PackingStrategy.CONFLICT_GRAPH ? items : [...items].sort((a, b) => strategy === PackingStrategy.FFD ? b.volume - a.volume : strategy === PackingStrategy.FFH ? b.dims.height - a.dims.height : 0),
    unpackedItems: [], isSimulationComplete: false, stepCount: 0
  };
  state.emsHistory = [state.emsList[0]];
  while (!state.isSimulationComplete && state.itemsToPack.length > 0) {
    state = performPackingStep(state, strategy, minSupport, heuristic);
  }
  return state;
};

export const runSimulatedAnnealing = async (items: Item[], containerDims: Dimensions, iterations: number, minSupport: number): Promise<{ items: Item[], history: SAHistoryEntry[] }> => {
  let curSol = JSON.parse(JSON.stringify(items));
  const fastPack = (sol: Item[]) => runHeadlessSimulation(PackingStrategy.FF, sol, containerDims, minSupport).packedItems.reduce((acc, i) => acc + i.volume, 0);
  let curE = 1 - fastPack(curSol) / (containerDims.width * containerDims.depth * containerDims.height);
  let bestSol = [...curSol]; let bestE = curE; let temp = 1.0; const history: SAHistoryEntry[] = [];
  for (let i = 0; i < iterations; i++) {
    if (i % 25 === 0) await new Promise(r => setTimeout(r, 0));
    const next = JSON.parse(JSON.stringify(curSol));
    if (Math.random() < 0.5) { const i1 = Math.floor(Math.random() * next.length); const i2 = Math.floor(Math.random() * next.length);[next[i1], next[i2]] = [next[i2], next[i1]]; }
    else { const idx = Math.floor(Math.random() * next.length); next[idx].selectedRotation = Math.floor(Math.random() * 6); next[idx].dims = getRotatedDims(next[idx].originalDims, next[idx].selectedRotation); }
    const nextE = 1 - fastPack(next) / (containerDims.width * containerDims.depth * containerDims.height);
    if (nextE < curE || Math.exp((curE - nextE) / temp) > Math.random()) { curSol = next; curE = nextE; if (curE < bestE) { bestE = curE; bestSol = [...curSol]; } }
    temp *= 0.99; history.push({ iteration: i, utilization: (1 - curE) * 100, temperature: temp, accepted: true });
  }
  return { items: bestSol, history };
};