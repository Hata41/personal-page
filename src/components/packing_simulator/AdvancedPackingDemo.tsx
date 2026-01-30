import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PackingStrategy, WeightingHeuristic } from './types';
import type { PackingState, GeneratorConfig, Item, SAHistoryEntry } from './types';
import { DEFAULT_CONTAINER_DIMS, createContainerSpace, generateGuillotineItems, sortItems, performPackingStep, runSimulatedAnnealing, runHeadlessSimulation } from './services/packingAlgorithm';
import Viewer3D from './components/Viewer3D';
import GraphView from './components/GraphView';
import EMSGraph from './components/EMSGraph';
import Metrics from './components/Metrics';
import StatisticsPanel from './components/StatisticsPanel';
import OptimizationGraph from './components/OptimizationGraph';

const AdvancedPackingDemo: React.FC = () => {
  const [strategy, setStrategy] = useState<PackingStrategy>(PackingStrategy.FFD);
  const [minSupport, setMinSupport] = useState<number>(0.6);
  const [heuristic, setHeuristic] = useState<WeightingHeuristic>(WeightingHeuristic.VOLUME);
  const [genConfig, setGenConfig] = useState<GeneratorConfig>({
    maxItems: 30,
    minSideLen: 400,
    containerWidth: DEFAULT_CONTAINER_DIMS.width,
    containerDepth: DEFAULT_CONTAINER_DIMS.depth,
    containerHeight: DEFAULT_CONTAINER_DIMS.height,
    saIterations: 500,
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredEMSId, setHoveredEMSId] = useState<string | null>(null);
  const [showGenSettings, setShowGenSettings] = useState<boolean>(false);
  const [showGhostEMS, setShowGhostEMS] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [showOptimizationGraph, setShowOptimizationGraph] = useState<boolean>(false);
  const [optimizationHistory, setOptimizationHistory] = useState<SAHistoryEntry[]>([]);

  // Initialize with container space so it's not empty on load
  const [simState, setSimState] = useState<PackingState>(() => {
    const initialEMS = createContainerSpace(DEFAULT_CONTAINER_DIMS);
    return {
      containerDims: DEFAULT_CONTAINER_DIMS,
      emsList: [initialEMS],
      emsHistory: [initialEMS],
      packedItems: [],
      itemsToPack: [],
      unpackedItems: [],
      isSimulationComplete: false,
      stepCount: 0
    };
  });

  const timeoutRef = useRef<number | null>(null);

  const resetSimulation = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const container = { width: genConfig.containerWidth, depth: genConfig.containerDepth, height: genConfig.containerHeight };
    const items = sortItems(generateGuillotineItems(container, genConfig), strategy);
    const initialEMS = createContainerSpace(container);
    setSimState({
      containerDims: container,
      emsList: [initialEMS],
      emsHistory: [initialEMS],
      packedItems: [],
      itemsToPack: items,
      unpackedItems: [],
      isSimulationComplete: false,
      stepCount: 0
    });
    setOptimizationHistory([]);
  }, [strategy, genConfig]);

  // Initial load
  useEffect(() => {
    resetSimulation();
  }, []);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setIsPlaying(false);
    const allItems: Item[] = [...simState.packedItems, ...simState.itemsToPack, ...simState.unpackedItems].map(i => ({
      id: i.id,
      dims: i.dims,
      originalDims: i.originalDims || i.dims,
      selectedRotation: i.selectedRotation || 0,
      volume: i.volume,
      color: i.color
    }));
    try {
      const { items: optimizedItems, history } = await runSimulatedAnnealing(allItems, simState.containerDims, genConfig.saIterations, minSupport);
      setOptimizationHistory(history);
      setShowOptimizationGraph(true);
      const finalState = runHeadlessSimulation(PackingStrategy.FF, optimizedItems, simState.containerDims, minSupport, heuristic);
      setSimState(finalState);
      setStrategy(PackingStrategy.FF);
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const step = useCallback(() => {
    setSimState(prev => {
      if (prev.isSimulationComplete || prev.itemsToPack.length === 0) {
        setIsPlaying(false);
        return { ...prev, isSimulationComplete: true };
      }
      const newState = performPackingStep(prev, strategy, minSupport, heuristic);
      if (newState.isSimulationComplete || newState.itemsToPack.length === 0) {
        setIsPlaying(false);
        return { ...newState, isSimulationComplete: true };
      }
      return newState;
    });
  }, [minSupport, strategy, heuristic]);

  // Auto-play loop
  useEffect(() => {
    if (isPlaying && !simState.isSimulationComplete) {
      timeoutRef.current = window.setTimeout(step, 100);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, step, simState.itemsToPack.length, simState.isSimulationComplete]);

  return (
    <div className="flex flex-col h-[700px] w-full bg-slate-900 text-white font-sans relative rounded-xl overflow-hidden shadow-2xl border border-slate-700">
      {isOptimizing && (
        <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-bold">Running Global Optimization</h2>
          <p className="text-xs text-gray-400 mt-2">Iterating via Simulated Annealing...</p>
        </div>
      )}

      <header className="bg-slate-800 p-3 border-b border-slate-700 shadow-lg z-20 relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-mono text-emerald-400">Simulator Active</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Strategy</label>
              <select value={strategy} onChange={(e) => { setStrategy(e.target.value as PackingStrategy); setIsPlaying(false); }} className="bg-slate-700 border border-slate-600 text-xs rounded p-1 outline-none focus:ring-1 focus:ring-blue-500">
                {Object.values(PackingStrategy).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={() => setShowGenSettings(!showGenSettings)} className="px-3 py-1.5 rounded text-xs border bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">Settings</button>
            <button onClick={resetSimulation} className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs hover:bg-slate-600 transition-colors">Reset</button>
            <button onClick={step} className="px-4 py-1.5 bg-blue-600 rounded text-xs hover:bg-blue-500 shadow-lg disabled:opacity-50 transition-all" disabled={isPlaying || simState.isThinking}>Step</button>
            <button onClick={() => setIsPlaying(!isPlaying)} className={`px-4 py-1.5 rounded text-xs w-20 font-bold transition-all ${isPlaying ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{isPlaying ? 'Pause' : 'Play'}</button>
          </div>
        </div>
        {showGenSettings && (
          <div className="absolute top-full right-4 mt-2 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-2xl grid grid-cols-2 gap-4 w-80 z-50">
            <div className="col-span-2 text-xs font-bold text-blue-300 border-b border-slate-700 pb-1 mt-2">Simulation Parameters</div>
            <div className="flex flex-col"><label className="text-[10px] text-slate-400">Max Items</label>
              <input type="number" value={genConfig.maxItems} onChange={(e) => setGenConfig({ ...genConfig, maxItems: parseInt(e.target.value) || 10 })} className="bg-slate-900 border border-slate-700 rounded p-1 text-xs" />
            </div>
            <div className="flex flex-col"><label className="text-[10px] text-slate-400">SA Iterations</label>
              <input type="number" value={genConfig.saIterations} onChange={(e) => setGenConfig({ ...genConfig, saIterations: parseInt(e.target.value) || 100 })} className="bg-slate-900 border border-slate-700 rounded p-1 text-xs" />
            </div>
            <button onClick={() => setShowGenSettings(false)} className="col-span-2 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs mt-2 transition-colors">Apply & Close</button>
          </div>
        )}
      </header>
      <main className="flex-1 overflow-hidden p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-900/50">
        <div className="lg:col-span-2 flex flex-col min-h-0 gap-4">
          <Metrics containerDims={simState.containerDims} packedItems={simState.packedItems} itemsToPackCount={simState.itemsToPack.length} unpackedCount={simState.unpackedItems.length} emsCount={simState.emsList.length} />
          <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-700 shadow-inner bg-black/20">
            <Viewer3D containerDims={simState.containerDims} items={simState.packedItems} hoveredItemId={hoveredItemId} activeEMS={simState.emsList} showGhostEMS={showGhostEMS} hoveredEMSId={hoveredEMSId} />
          </div>
        </div>
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0 bg-slate-800/50 rounded-lg p-1 border border-slate-700 shadow-md backdrop-blur-sm hover:border-slate-500 transition-colors"><GraphView items={simState.packedItems} setHoveredItem={setHoveredItemId} /></div>
          <div className="flex-1 min-h-0 bg-slate-800/50 rounded-lg border border-slate-700 relative shadow-md backdrop-blur-sm hover:border-slate-500 transition-colors"><EMSGraph emsHistory={simState.emsHistory} activeEMS={simState.emsList} currentStep={simState.stepCount} setHoveredEMS={setHoveredEMSId} /></div>
        </div>
      </main>
      <StatisticsPanel isOpen={showStats} onClose={() => setShowStats(false)} genConfig={genConfig} containerDims={simState.containerDims} minSupport={minSupport} heuristic={heuristic} />
      <OptimizationGraph isOpen={showOptimizationGraph} onClose={() => setShowOptimizationGraph(false)} history={optimizationHistory} />
    </div>
  );
};

export default AdvancedPackingDemo;