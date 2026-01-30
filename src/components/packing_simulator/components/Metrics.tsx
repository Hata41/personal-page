import React from 'react';
import type { PlacedItem, Dimensions, Space } from '../types';

interface MetricsProps {
  containerDims: Dimensions;
  packedItems: PlacedItem[];
  itemsToPackCount: number;
  unpackedCount: number;
  emsCount: number;
}

const Metrics: React.FC<MetricsProps> = ({
  containerDims,
  packedItems,
  itemsToPackCount,
  unpackedCount,
  emsCount
}) => {
  const containerVolume = containerDims.width * containerDims.depth * containerDims.height;
  const packedVolume = packedItems.reduce((acc, item) => acc + item.volume, 0);
  const utilization = (packedVolume / containerVolume) * 100;

  const avgSupport = packedItems.length > 0
    ? (packedItems.reduce((acc, item) => acc + item.supportRatio, 0) / packedItems.length) * 100
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div className="bg-slate-800 p-3 rounded border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider">Utilization</div>
        <div className="text-xl font-bold text-green-400">{utilization.toFixed(2)}%</div>
      </div>
      <div className="bg-slate-800 p-3 rounded border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider">Items Packed</div>
        <div className="text-xl font-bold text-white">
          {packedItems.length} <span className="text-sm text-slate-500">/ {packedItems.length + itemsToPackCount + unpackedCount}</span>
        </div>
      </div>
      <div className="bg-slate-800 p-3 rounded border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider">Avg. Support</div>
        <div className="text-xl font-bold text-blue-400">{avgSupport.toFixed(1)}%</div>
      </div>
      <div className="bg-slate-800 p-3 rounded border border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider">Active EMS</div>
        <div className="text-xl font-bold text-purple-400">{emsCount}</div>
      </div>
    </div>
  );
};

export default Metrics;
