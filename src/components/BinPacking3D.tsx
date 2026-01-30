import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, PerspectiveCamera, useHelper } from '@react-three/drei';
import * as THREE from 'three';

export type Item = {
  id: string;
  w: number;
  h: number;
  d: number;
  color?: string;
};

export type PlacedItem = Item & {
  x: number;
  y: number;
  z: number;
};

interface BinPacking3DProps {
  binSize: [number, number, number];
  items: Item[];
}

const COLORS = ['#ff6b6b', '#4834d4', '#6ab04c', '#f0932b', '#eb4d4b', '#7ed6df', '#e056fd', '#686de0'];

/**
 * A simple heuristic packing algorithm:
 * Fills along X until full, then increments Y (new row),
 * then increments Z when Y is full (new layer).
 */
const simplePack = (binWidth: number, binHeight: number, binDepth: number, items: Item[]) => {
  const placed: PlacedItem[] = [];
  const skipped: Item[] = [];

  let curX = 0;
  let curY = 0;
  let curZ = 0;
  let maxHInRow = 0;
  let maxDInLayer = 0;

  for (const item of items) {
    // 1. Fit in current row (X)
    if (curX + item.w > binWidth) {
      // Move to next row (Y)
      curX = 0;
      curY += maxHInRow;
      maxHInRow = 0;
    }

    // 2. Fit in current layer (Y)
    if (curY + item.h > binHeight) {
      // Move to next layer (Z)
      curX = 0;
      curY = 0;
      curZ += maxDInLayer;
      maxDInLayer = 0;
      maxHInRow = 0;
    }

    // 3. Check if fits in bin (Z)
    if (curZ + item.d > binDepth || curY + item.h > binHeight || curX + item.w > binWidth) {
      skipped.push(item);
      continue;
    }

    placed.push({
      ...item,
      // Three.js Box geometry is centered at the position,
      // so we add half the dimension to the origin-based coordinates.
      x: curX + item.w / 2,
      y: curY + item.h / 2,
      z: curZ + item.d / 2,
    });

    curX += item.w;
    maxHInRow = Math.max(maxHInRow, item.h);
    maxDInLayer = Math.max(maxDInLayer, item.d);
  }

  return { placed, skipped };
};

const BinPackingComponent: React.FC<BinPacking3DProps> = ({ binSize, items }) => {
  const [binW, binH, binD] = binSize;
  const { placed, skipped } = useMemo(() => simplePack(binW, binH, binD, items), [binW, binH, binD, items]);

  return (
    <div style={{ width: '100%', height: '500px', background: '#1a1a1a', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[binW * 1.5, binH * 2, binD * 2]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />
        
        {/* Container Bin - Thin wireframe */}
        <Box args={[binW, binH, binD]} position={[binW / 2, binH / 2, binD / 2]}>
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.2} />
        </Box>

        {/* Packed Items */}
        {placed.map((item, idx) => (
          <Box key={item.id} args={[item.w, item.h, item.d]} position={[item.x, item.y, item.z]}>
            <meshStandardMaterial color={item.color || COLORS[idx % COLORS.length]} />
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(item.w, item.h, item.d)]} />
              <lineBasicMaterial color="black" />
            </lineSegments>
          </Box>
        ))}

        <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[10, 0, 10]} />
        <axesHelper args={[5]} />
      </Canvas>

      {/* Stats Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
        pointerEvents: 'none',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div><strong>Bin:</strong> {binW}x{binH}x{binD}</div>
        <div><strong>Placed:</strong> {placed.length} items</div>
        {skipped.length > 0 && (
          <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
            ⚠️ {skipped.length} items did not fit!
          </div>
        )}
      </div>
    </div>
  );
};

export default BinPackingComponent;
