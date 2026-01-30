import React, { useState } from 'react';
import { PackingStrategy, WeightingHeuristic } from '../types';
import type {
    GeneratorConfig,
    SimulationResult,
    AggregatedStats,
    Dimensions
} from '../types';
import { generateGuillotineItems, runHeadlessSimulation } from '../services/packingAlgorithm';

interface StatisticsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    genConfig: GeneratorConfig;
    containerDims: Dimensions;
    minSupport: number;
    heuristic: WeightingHeuristic;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    isOpen, onClose, genConfig, containerDims, minSupport, heuristic
}) => {
    const [runCount, setRunCount] = useState<number>(10);
    const [results, setResults] = useState<AggregatedStats[] | null>(null);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const runAnalysis = async () => {
        setIsRunning(true);
        setResults(null);
        setProgress(0);

        // Allow UI to update before blocking loop
        await new Promise(r => setTimeout(r, 100));

        const strategies = Object.values(PackingStrategy);
        const rawResults: Map<PackingStrategy, SimulationResult[]> = new Map();

        strategies.forEach(s => rawResults.set(s, []));

        // Chunk execution to prevent browser freeze
        const chunkSize = 1;

        for (let i = 0; i < runCount; i++) {
            // Generate ONE set of items for this run iteration
            // This ensures all strategies are compared against the EXACT SAME scenario
            const items = generateGuillotineItems(containerDims, genConfig);

            for (const strat of strategies) {
                const startTime = performance.now();
                // Pass a deep copy of items to avoid mutation issues between strategy runs
                const itemsCopy = JSON.parse(JSON.stringify(items));

                // Use the currently selected heuristic for the Conflict Graph strategy
                const finalState = runHeadlessSimulation(strat, itemsCopy, containerDims, minSupport, heuristic);
                const endTime = performance.now();

                const totalVolume = finalState.packedItems.reduce((acc, item) => acc + item.volume, 0);
                const containerVolume = containerDims.width * containerDims.depth * containerDims.height;
                const utilization = (totalVolume / containerVolume) * 100;

                const avgSupp = finalState.packedItems.length > 0
                    ? finalState.packedItems.reduce((acc, item) => acc + item.supportRatio, 0) / finalState.packedItems.length
                    : 0;

                rawResults.get(strat)?.push({
                    strategy: strat,
                    utilization: utilization,
                    packedCount: finalState.packedItems.length,
                    totalItems: items.length,
                    avgSupport: avgSupp * 100,
                    timeTakenMs: endTime - startTime
                });
            }

            setProgress(((i + 1) / runCount) * 100);

            // Yield to event loop
            await new Promise(r => setTimeout(r, 0));
        }

        // Aggregate Results
        const aggregated: AggregatedStats[] = strategies.map(s => {
            const runs = rawResults.get(s) || [];
            const count = runs.length;
            const sumUtil = runs.reduce((acc, r) => acc + r.utilization, 0);
            const sumPacked = runs.reduce((acc, r) => acc + r.packedCount, 0);
            const sumSupport = runs.reduce((acc, r) => acc + r.avgSupport, 0);
            const sumTime = runs.reduce((acc, r) => acc + r.timeTakenMs, 0);
            const maxUtil = runs.reduce((acc, r) => Math.max(acc, r.utilization), 0);

            return {
                strategy: s,
                runs: count,
                avgUtilization: sumUtil / count,
                avgPackedCount: sumPacked / count,
                avgSupport: sumSupport / count,
                avgTimeMs: sumTime / count,
                bestUtilization: maxUtil
            };
        });

        // Sort by utilization descending
        aggregated.sort((a, b) => b.avgUtilization - a.avgUtilization);

        setResults(aggregated);
        setIsRunning(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-2xl w-[90vw] max-w-5xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                    <h2 className="text-xl font-bold text-blue-400">Strategy Benchmarking</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex gap-4 items-end">
                    <div className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">Number of Runs</label>
                        <input
                            type="number"
                            min="1" max="500"
                            value={runCount}
                            onChange={(e) => setRunCount(parseInt(e.target.value) || 1)}
                            className="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white w-32 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col flex-1">
                        <label className="text-xs text-slate-400 mb-1">Configuration</label>
                        <div className="text-sm text-slate-300 flex gap-4">
                            <span>Items: {genConfig.maxItems}</span>
                            <span>Support: {(minSupport * 100).toFixed(0)}%</span>
                            <span className="text-indigo-400 font-bold">Personality: {heuristic}</span>
                        </div>
                    </div>

                    <button
                        onClick={runAnalysis}
                        disabled={isRunning}
                        className={`px-6 py-2 rounded font-bold text-white transition-colors ${isRunning ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {isRunning ? 'Running...' : 'Run Analysis'}
                    </button>
                </div>

                {/* Progress Bar */}
                {isRunning && (
                    <div className="w-full bg-slate-900 h-1">
                        <div
                            className="bg-blue-500 h-1 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Results Table */}
                <div className="flex-1 overflow-auto p-4 bg-slate-900">
                    {!results && !isRunning && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            <span className="text-lg">Click "Run Analysis" to benchmark strategies.</span>
                        </div>
                    )}

                    {results && (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-slate-400 border-b border-slate-700">
                                    <th className="p-3">Strategy</th>
                                    <th className="p-3 text-right">Avg. Utilization</th>
                                    <th className="p-3 text-right">Best Utilization</th>
                                    <th className="p-3 text-right">Avg. Packed</th>
                                    <th className="p-3 text-right">Avg. Support</th>
                                    <th className="p-3 text-right">Avg. Time (ms)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, idx) => (
                                    <tr key={r.strategy} className={`border-b border-slate-800 hover:bg-slate-800/50 ${idx === 0 ? 'bg-emerald-900/10' : ''}`}>
                                        <td className="p-3 font-medium text-white">
                                            {r.strategy}
                                            {idx === 0 && <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-[10px] rounded text-white">WINNER</span>}
                                        </td>
                                        <td className="p-3 text-right text-emerald-400 font-bold">{r.avgUtilization.toFixed(2)}%</td>
                                        <td className="p-3 text-right text-emerald-300 opacity-70">{r.bestUtilization.toFixed(2)}%</td>
                                        <td className="p-3 text-right text-white">{r.avgPackedCount.toFixed(1)}</td>
                                        <td className="p-3 text-right text-blue-400">{r.avgSupport.toFixed(1)}%</td>
                                        <td className="p-3 text-right text-slate-400 font-mono text-xs">{r.avgTimeMs.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;