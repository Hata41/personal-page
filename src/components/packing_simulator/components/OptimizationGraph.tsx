import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { SAHistoryEntry } from '../types';

interface OptimizationGraphProps {
  isOpen: boolean;
  onClose: () => void;
  history: SAHistoryEntry[];
}

const OptimizationGraph: React.FC<OptimizationGraphProps> = ({ isOpen, onClose, history }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen || !svgRef.current || history.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(history, d => d.iteration) || 0])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(history, d => d.utilization) || 0,
        d3.max(history, d => d.utilization) || 100
      ])
      .range([height, 0]);

    // Gradient for the line
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0).attr("y1", height)
      .attr("x2", 0).attr("y2", 0);

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6"); // blue
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#22c55e"); // green

    // Line Generator
    const line = d3.line<SAHistoryEntry>()
      .x(d => x(d.iteration))
      .y(d => y(d.utilization))
      .curve(d3.curveMonotoneX);

    // Axes
    const xAxis = d3.axisBottom(x).ticks(5).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).ticks(5);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .attr("color", "#9ca3af");

    g.append("g")
      .call(yAxis)
      .attr("color", "#9ca3af");

    // Grid Lines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
      .attr("stroke-opacity", 0.1)
      .attr("stroke-dasharray", "2,2")
      .attr("color", "#6b7280");

    // The Line
    g.append("path")
      .datum(history)
      .attr("fill", "none")
      .attr("stroke", "url(#line-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Highlight Acceptance points (only show significant jumps)
    const significantPoints = history.filter((d, i) => {
      if (i === 0) return true;
      return d.accepted && (Math.abs(d.utilization - history[i - 1].utilization) > 0.5);
    });

    g.selectAll(".dot")
      .data(significantPoints)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.iteration))
      .attr("cy", d => y(d.utilization))
      .attr("r", 3)
      .attr("fill", "#fbbf24")
      .attr("stroke", "none")
      .attr("opacity", 0.8);

    // Labels
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 25)
      .style("text-anchor", "middle")
      .style("fill", "#6b7280")
      .style("font-size", "10px")
      .text("Iterations");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 12)
      .attr("x", 0 - (height / 2))
      .style("text-anchor", "middle")
      .style("fill", "#6b7280")
      .style("font-size", "10px")
      .text("Utilization (%)");

  }, [isOpen, history]);

  if (!isOpen) return null;

  const startUtil = history.length > 0 ? history[0].utilization : 0;
  const endUtil = history.length > 0 ? history[history.length - 1].utilization : 0;
  const improvement = endUtil - startUtil;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-2xl w-[80vw] max-w-2xl h-[60vh] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-purple-400">Optimization Curve</h2>
            <span className="text-xs text-slate-400">Simulated Annealing Progress</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-xs">
              <span className="text-slate-500">Improvement: </span>
              <span className={improvement >= 0 ? "text-green-400 font-bold" : "text-red-400"}>
                {improvement > 0 ? "+" : ""}{improvement.toFixed(2)}%
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 relative">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default OptimizationGraph;