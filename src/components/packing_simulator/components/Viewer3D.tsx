import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text, Edges } from '@react-three/drei';
import * as THREE from 'three';
import type { Dimensions, PlacedItem, Space } from '../types';

interface Viewer3DProps {
  containerDims: Dimensions;
  items: PlacedItem[];
  hoveredItemId: string | null;
  activeEMS: Space[];
  showGhostEMS: boolean;
  hoveredEMSId: string | null;
  // Palletization Props
  currentLayerZ?: number;
  currentLayerHeight?: number;
  isPalletizing?: boolean;
}

const ItemMesh: React.FC<{ item: PlacedItem; isHovered: boolean }> = ({ item, isHovered }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const position: [number, number, number] = [
    item.position.x + item.dims.width / 2,
    item.position.z + item.dims.height / 2,
    item.position.y + item.dims.depth / 2
  ];

  const args: [number, number, number] = [item.dims.width, item.dims.height, item.dims.depth];

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={args} />
        <meshStandardMaterial
          color={isHovered ? 'white' : item.color}
          transparent
          opacity={isHovered ? 0.9 : 0.8}
          roughness={0.2}
        />
        <Edges color="black" threshold={15} />
      </mesh>
      {isHovered && (
        <Text
          position={[position[0], position[1] + item.dims.height / 2 + 100, position[2]]}
          fontSize={200}
          color="white"
          anchorX="center"
          anchorY="middle"
          billboard
        >
          {item.id}
        </Text>
      )}
    </group>
  );
};

const GhostEMS: React.FC<{ ems: Space; isHovered: boolean }> = ({ ems, isHovered }) => {
  // Logic: x -> x, z -> y, y -> z
  const width = ems.x2 - ems.x1;
  const depth = ems.y2 - ems.y1;
  const height = ems.z2 - ems.z1;

  const position: [number, number, number] = [
    ems.x1 + width / 2,
    ems.z1 + height / 2,
    ems.y1 + depth / 2
  ];

  return (
    <mesh position={position}>
      <boxGeometry args={[width, height, depth]} />
      <meshBasicMaterial
        color={isHovered ? '#4ade80' : '#fbbf24'}
        wireframe
        transparent
        opacity={isHovered ? 0.8 : 0.15}
      />
      {isHovered && (
        <Text
          position={[0, 0, 0]}
          fontSize={150}
          color="#4ade80"
          anchorX="center"
          anchorY="middle"
          billboard
        >
          {ems.id}
        </Text>
      )}
    </mesh>
  )
}

const LayerPlane: React.FC<{
  z: number;
  height: number;
  containerDims: Dimensions;
}> = ({ z, height, containerDims }) => {
  // Visual Y is Logic Z
  const yPos = z + height;

  // Don't render if it exceeds container (or matches top)
  if (yPos > containerDims.height) return null;
  if (height === 0) return null;

  return (
    <group>
      <mesh position={[containerDims.width / 2, yPos, containerDims.depth / 2]}>
        <boxGeometry args={[containerDims.width, 5, containerDims.depth]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.2} />
      </mesh>
      <Text
        position={[0, yPos + 100, 0]}
        fontSize={150}
        color="#60a5fa"
        anchorX="left"
        anchorY="bottom"
        billboard
      >
        {`Layer Limit (H: ${height})`}
      </Text>
    </group>
  );
}

const Viewer3D: React.FC<Viewer3DProps> = ({
  containerDims,
  items,
  hoveredItemId,
  activeEMS,
  showGhostEMS,
  hoveredEMSId,
  currentLayerZ,
  currentLayerHeight,
  isPalletizing
}) => {
  const center: [number, number, number] = [
    containerDims.width / 2,
    containerDims.height / 2,
    containerDims.depth / 2
  ];

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative">
      <Canvas
        camera={{ position: [containerDims.width * 1.5, containerDims.height * 1.5, containerDims.depth * 1.5], fov: 45, far: 50000 }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[containerDims.width, containerDims.height * 2, 0]} intensity={1} />
        <pointLight position={[0, containerDims.height, containerDims.depth]} intensity={0.5} />

        <OrbitControls target={center} minDistance={100} maxDistance={20000} />

        {/* Container Frame */}
        <group position={center}>
          <Grid
            position={[0, -containerDims.height / 2, 0]}
            args={[containerDims.width, containerDims.depth]}
            cellSize={500}
            cellThickness={1}
            cellColor="#6b7280"
            sectionSize={1000}
            sectionThickness={1.5}
            sectionColor="#9ca3af"
            fadeDistance={20000}
            infiniteGrid={false}
          />
        </group>

        {/* Container Wireframe */}
        <mesh position={center}>
          <boxGeometry args={[containerDims.width, containerDims.height, containerDims.depth]} />
          <meshBasicMaterial color="#4ade80" wireframe transparent opacity={0.3} />
        </mesh>

        {/* Palletization Layer Visualization */}
        {isPalletizing && currentLayerZ !== undefined && currentLayerHeight !== undefined && (
          <LayerPlane
            z={currentLayerZ}
            height={currentLayerHeight}
            containerDims={containerDims}
          />
        )}

        {/* Packed Items */}
        {items.map((item) => (
          <ItemMesh key={item.id} item={item} isHovered={hoveredItemId === item.id} />
        ))}

        {/* Ghost EMS Overlay */}
        {(showGhostEMS || hoveredEMSId) && activeEMS.map((ems) => (
          // Show if toggled ON OR if this specific one is hovered
          (showGhostEMS || hoveredEMSId === ems.id) && (
            <GhostEMS
              key={ems.id}
              ems={ems}
              isHovered={hoveredEMSId === ems.id}
            />
          )
        ))}

        <axesHelper args={[1000]} />
      </Canvas>
    </div>
  );
};

export default Viewer3D;