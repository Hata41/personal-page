import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import type { PlacedItem } from '../types';

interface GraphViewProps {
  items: PlacedItem[];
  setHoveredItem: (id: string | null) => void;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  color: string;
  supportRatio: number;
  type?: 'ROOT' | 'ITEM';
  fx?: number | null;
  fy?: number | null;
  depth?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

const GraphView: React.FC<GraphViewProps> = ({ items, setHoveredItem }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute Depths
  const nodeDepths = useMemo(() => {
    const depths = new Map<string, number>();
    depths.set('CONTAINER_BASE', 0);
    depths.set('FLOOR', 0);

    // Items might not be in topological order, so we need a robust way.
    // However, in packing, items are strictly added on top of existing ones or floor.
    // So iterating in order of placement (which is the array order) should work if we process correctly.
    // Actually, items array is order of placement.
    items.forEach(item => {
      let maxParentDepth = -1;
      item.supportedBy.forEach(pId => {
        const pDepth = depths.get(pId === 'FLOOR' ? 'CONTAINER_BASE' : pId);
        if (pDepth !== undefined) {
          maxParentDepth = Math.max(maxParentDepth, pDepth);
        }
      });
      depths.set(item.id, (maxParentDepth === -1 ? 0 : maxParentDepth) + 1);
    });
    return depths;
  }, [items]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (items.length === 0) return;

    // Build Graph Data
    let nodes: Node[] = items.map(i => {
      const depth = nodeDepths.get(i.id) || 1;
      return {
        id: i.id,
        color: i.color,
        supportRatio: i.supportRatio,
        type: 'ITEM',
        depth,
        y: depth * 80 + 40 // Initial Y hint
      };
    });

    const links: Link[] = [];

    // Add Root Node
    const rootNode: Node = {
      id: 'CONTAINER_BASE',
      color: '#ffffff',
      supportRatio: 1,
      type: 'ROOT',
      fx: width / 2, // Fixed X Center
      fy: 40,        // Fixed Y Top
      depth: 0
    };
    nodes.push(rootNode);

    // Build Edges
    items.forEach(item => {
      item.supportedBy.forEach(supporterId => {
        const sourceId = supporterId === 'FLOOR' ? 'CONTAINER_BASE' : supporterId;
        links.push({ source: sourceId, target: item.id });
      });
    });

    // Zoom behavior
    const g = svg.append("g");
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", ({ transform }) => {
        g.attr("transform", transform);
      }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("collide", d3.forceCollide(20))
      // Enforce Top-Down Layers
      .force("y", d3.forceY((d: any) => (d.depth || 0) * 100 + 40).strength(2))
      .force("x", d3.forceX(width / 2).strength(0.1)); // Center horizontally

    // Arrowhead
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18) // Moved back slightly to not overlap node too much
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#9ca3af");

    const link = g.append("g")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => d.type === 'ROOT' ? 12 : 8)
      .attr("fill", d => d.type === 'ROOT' ? '#6b7280' : d.color)
      .attr("cursor", "pointer")
      .on("mouseover", (event, d) => d.type !== 'ROOT' && setHoveredItem(d.id))
      .on("mouseout", () => setHoveredItem(null))
      .call(d3.drag<SVGCircleElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("title").text(d => d.type === 'ROOT' ? 'Container Base' : `${d.id} (${(d.supportRatio * 100).toFixed(0)}% supported)`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [items, nodeDepths, setHoveredItem]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative flex flex-col">
      <div className="flex justify-between items-center p-2 bg-slate-800 border-b border-slate-700 z-10">
        <span className="text-xs text-slate-400 font-mono">Dependency Tree</span>
      </div>
      <div className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default GraphView;
