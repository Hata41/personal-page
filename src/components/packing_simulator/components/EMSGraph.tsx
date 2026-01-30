import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { Space } from '../types';

interface EMSGraphProps {
  emsHistory: Space[];
  activeEMS: Space[]; // To cross reference logic if needed, though history has status
  currentStep: number;
  setHoveredEMS: (id: string | null) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  stepIndex: number;
  status: 'ACTIVE' | 'CONSUMED' | 'PRUNED';
  volume: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

const EMSGraph: React.FC<EMSGraphProps> = ({ emsHistory, currentStep, setHoveredEMS }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const activeCount = emsHistory.filter(e => e.status === 'ACTIVE').length;
    const prunedCount = emsHistory.filter(e => e.status === 'PRUNED').length;
    const totalGenerated = emsHistory.length;
    const pruningEfficiency = totalGenerated > 1 ? (prunedCount / (totalGenerated - 1)) * 100 : 0; // -1 for root

    // Average Branching (approximate)
    const consumed = emsHistory.filter(e => e.status === 'CONSUMED');
    const consumedIds = new Set(consumed.map(c => c.id));
    const childrenCount = emsHistory.filter(e => e.parentIds.some(pid => consumedIds.has(pid))).length;
    const branchingFactor = consumed.length > 0 ? childrenCount / consumed.length : 0;

    return { activeCount, prunedCount, pruningEfficiency, branchingFactor };
  }, [emsHistory]);

  useEffect(() => {
    if (!svgRef.current || emsHistory.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // 1. Data Prep
    const nodes: Node[] = emsHistory.map(s => ({
      id: s.id,
      stepIndex: s.stepIndex,
      status: s.status,
      volume: s.volume,
      // Fix Y based on time/step (Top to Bottom)
      fy: (s.stepIndex * 80) + 40,
      x: width / 2 // Initial X hint
    }));

    const links: Link[] = [];
    emsHistory.forEach(child => {
      child.parentIds.forEach(pid => {
        if (nodes.find(n => n.id === pid)) {
          links.push({ source: pid, target: child.id });
        }
      });
    });

    // 2. Setup D3
    const g = svg.append("g");

    // Zoom/Pan
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", ({ transform }) => {
        g.attr("transform", transform);
      }));

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(30).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-40))
      // Center X but allow spread
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("collide", d3.forceCollide(8));

    // 3. Render
    // Links
    const link = g.append("g")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#6b7280")
      .attr("stroke-width", 1);

    // Nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.status === 'ACTIVE' ? 5 : 3)
      .attr("fill", d => {
        if (d.status === 'ACTIVE') return '#4ade80'; // Green
        if (d.status === 'CONSUMED') return '#4b5563'; // Gray
        return '#ef4444'; // Red (Pruned)
      })
      .attr("opacity", d => d.status === 'PRUNED' ? 0.3 : 1)
      .attr("stroke", d => d.status === 'ACTIVE' ? '#22c55e' : 'none')
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("mouseover", (e, d) => setHoveredEMS(d.id))
      .on("mouseout", () => setHoveredEMS(null));

    node.append("title").text(d => `ID: ${d.id}\nStep: ${d.stepIndex}\nVol: ${d.volume.toLocaleString()}\nStatus: ${d.status}`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x!)
        .attr("cy", (d: any) => d.y!);
    });

    // Auto-scroll to bottom (latest generation)
    if (nodes.length > 0) {
      const lastNodeY = (currentStep * 80) + 40;
      const ty = (height / 2) - lastNodeY;
      const initialTransform = d3.zoomIdentity.translate(0, Math.min(0, ty)).scale(1);
      svg.call(d3.zoom<SVGSVGElement, unknown>().transform, initialTransform);
    }

    return () => { simulation.stop(); };
  }, [emsHistory.length, currentStep]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden">
      <div className="bg-slate-800 p-2 flex justify-between items-center text-[10px] text-gray-300 border-b border-slate-700 z-10">
        <span className="font-bold text-gray-100">EMS Genealogy</span>
        <div className="flex gap-3">
          <span>Active: <span className="text-green-400">{metrics.activeCount}</span></span>
          <span>Pruned: <span className="text-red-400">{metrics.prunedCount} ({metrics.pruningEfficiency.toFixed(1)}%)</span></span>
          <span>Branching: <span className="text-blue-400">{metrics.branchingFactor.toFixed(1)}x</span></span>
        </div>
      </div>

      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400"></div><span className="text-[10px] text-gray-400">Active</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-600"></div><span className="text-[10px] text-gray-400">Consumed</span></div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500 opacity-50"></div><span className="text-[10px] text-gray-400">Pruned</span></div>
      </div>

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default EMSGraph;
