import { useRef, useEffect, useState, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '@/stores/editorStore';
import { useThemeStore } from '@/stores/themeStore';
import { PlayerModel } from '@/renderer/three/PlayerModel';
import { useToolHandler } from '@/hooks/useToolHandler';
import type { Point } from '@/lib/core/types';

import type { BodyPartVisibility } from '@/stores/editorStore';

// Direction indicator labels around the model
function DirectionIndicators() {
  const distance = 25;
  const height = 0.5;
  const fontSize = 3;

  const directions = [
    { label: 'FRONT', position: [0, height, distance] as [number, number, number], rotation: [-Math.PI / 2, 0, 0] as [number, number, number], color: '#4ade80' },
    { label: 'BACK', position: [0, height, -distance] as [number, number, number], rotation: [-Math.PI / 2, 0, Math.PI] as [number, number, number], color: '#f87171' },
    { label: 'LEFT', position: [distance, height, 0] as [number, number, number], rotation: [-Math.PI / 2, 0, -Math.PI / 2] as [number, number, number], color: '#60a5fa' },
    { label: 'RIGHT', position: [-distance, height, 0] as [number, number, number], rotation: [-Math.PI / 2, 0, Math.PI / 2] as [number, number, number], color: '#fbbf24' },
  ];

  return (
    <group>
      {directions.map(({ label, position, rotation, color }) => (
        <group key={label} position={position}>
          {/* Text label */}
          <Text
            rotation={rotation}
            fontSize={fontSize}
            color={color}
            anchorX="center"
            anchorY="middle"
            font={undefined}
          >
            {label}
          </Text>
          {/* Small arrow pointing to center */}
          <mesh rotation={[-Math.PI / 2, 0, Math.atan2(-position[0], -position[2])]}>
            <coneGeometry args={[1.2, 3, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Center cross on ground */}
      <group position={[0, 0.1, 0]}>
        {/* X axis line */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 10, 8]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.4} />
        </mesh>
        {/* Z axis line */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 10, 8]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

interface SceneProps {
  onPaint: (point: Point) => void;
  onPaintStart: () => void;
  onPaintEnd: () => void;
  enableRotate: boolean;
  isPainting: boolean;
  bodyPartVisibility: BodyPartVisibility;
  paintTarget: 'base' | 'overlay';
  floorColor: string;
}

function Scene({ onPaint, onPaintStart, onPaintEnd, enableRotate, isPainting, bodyPartVisibility, paintTarget, floorColor }: SceneProps) {
  const { compositeImageData, document: skinDocument, syncManager } = useEditorStore();
  const [skinTexture, setSkinTexture] = useState<THREE.CanvasTexture | null>(null);

  // Update texture when composite changes
  useEffect(() => {
    if (!compositeImageData) {
      setSkinTexture(null);
      return;
    }

    const canvas = window.document.createElement('canvas');
    canvas.width = compositeImageData.width;
    canvas.height = compositeImageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(compositeImageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    setSkinTexture(texture);

    return () => {
      texture.dispose();
    };
  }, [compositeImageData]);

  // Subscribe to sync events
  useEffect(() => {
    return syncManager.subscribe({
      id: 'viewer3d',
      onSync: () => {
        // Texture update is handled by the compositeImageData effect
      },
    });
  }, [syncManager]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={45} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={30}
        maxDistance={150}
        target={[0, 16, 0]}
        enableRotate={enableRotate}
      />

      {/* Lighting - Ring of spotlights around model */}
      <ambientLight intensity={1.2} />

      {/* 6 spotlights in a ring around the model */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radius = 35;
        const height = 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <spotLight
            key={i}
            position={[x, height, z]}
            target-position={[0, 16, 0]}
            intensity={3}
            angle={Math.PI / 4}
            penumbra={0.3}
            distance={150}
            color="#ffffff"
          />
        );
      })}

      {/* Top light for head illumination */}
      <pointLight position={[0, 50, 0]} intensity={2} distance={100} />

      {/* Fill lights from front and back */}
      <directionalLight position={[0, 20, 50]} intensity={1.5} />
      <directionalLight position={[0, 20, -50]} intensity={1} />

      {/* Ground plane (optional visual reference) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={floorColor} transparent opacity={0.8} />
      </mesh>

      {/* Direction indicators */}
      <DirectionIndicators />

      {/* Player model */}
      {skinTexture && (
        <PlayerModel
          skinTexture={skinTexture}
          model={skinDocument?.model ?? 'classic'}
          onPaint={enableRotate ? undefined : onPaint}
          onPaintStart={enableRotate ? undefined : onPaintStart}
          onPaintEnd={enableRotate ? undefined : onPaintEnd}
          isPainting={isPainting}
          showBrushPreview={!enableRotate}
          bodyPartVisibility={bodyPartVisibility}
          paintTarget={paintTarget}
        />
      )}
    </>
  );
}

// Tools that work in 3D view
const SUPPORTED_3D_TOOLS = ['pencil', 'eraser', 'eyedropper', 'fill', 'line', 'noise', 'color-replacement'];

export function Viewer3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const isPaintingRef = useRef(false); // Synchronous tracking for drag painting
  const lastPointRef = useRef<Point | null>(null);

  const {
    hoveredPart,
    activeTool,
    bodyPartVisibility,
    paintTarget,
  } = useEditorStore();

  const { getCurrentColors } = useThemeStore();
  const colors = getCurrentColors();

  // Use the unified tool handler
  const {
    handleStart,
    handleMove,
    handleEnd,
  } = useToolHandler({ viewType: '3d' });

  // Keyboard events for space+drag rotation
  useEffect(() => {
    const isInputElement = (target: EventTarget | null): boolean => {
      return target instanceof HTMLInputElement ||
             target instanceof HTMLTextAreaElement ||
             (target instanceof HTMLElement && target.isContentEditable);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture space when typing in inputs
      if (isInputElement(e.target)) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't capture space when typing in inputs
      if (isInputElement(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start painting stroke
  const handlePaintStart = useCallback(() => {
    if (!SUPPORTED_3D_TOOLS.includes(activeTool)) return;
    isPaintingRef.current = true; // Synchronous update for immediate drag detection
    setIsPainting(true);
    lastPointRef.current = null;
  }, [activeTool]);

  // End painting stroke
  const handlePaintEnd = useCallback(() => {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    setIsPainting(false);

    if (lastPointRef.current) {
      handleEnd(lastPointRef.current.x, lastPointRef.current.y);
    }
    lastPointRef.current = null;
  }, [handleEnd]);

  // Global pointer up listener to catch mouse release anywhere (even outside canvas)
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (isPaintingRef.current) {
        handlePaintEnd();
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [handlePaintEnd]);

  // Handle 3D painting (single point from raycasting)
  const handlePaint = useCallback(
    (point: Point) => {
      if (!SUPPORTED_3D_TOOLS.includes(activeTool)) return;

      // First point - start the tool
      if (!lastPointRef.current) {
        handleStart(point.x, point.y, false);
        lastPointRef.current = point;
        return;
      }

      // Subsequent points - move the tool
      handleMove(point.x, point.y, false);
      lastPointRef.current = point;
    },
    [activeTool, handleStart, handleMove]
  );

  // Cursor based on tool and space state
  const getCursorClass = () => {
    if (isSpacePressed) return 'cursor-grab';
    if (SUPPORTED_3D_TOOLS.includes(activeTool)) {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  // Check if current tool works in 3D
  const toolSupported = SUPPORTED_3D_TOOLS.includes(activeTool);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${getCursorClass()}`}
      style={{ backgroundColor: colors.viewer3dBackground }}
    >
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene
            onPaint={handlePaint}
            onPaintStart={handlePaintStart}
            onPaintEnd={handlePaintEnd}
            enableRotate={isSpacePressed}
            isPainting={isPainting}
            bodyPartVisibility={bodyPartVisibility}
            paintTarget={paintTarget}
            floorColor={colors.viewer3dFloor}
          />
        </Suspense>
      </Canvas>

      {/* Status bar */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex gap-3">
        <span>Click & drag to paint</span>
        <span className="text-white/50">Space+Drag to rotate</span>
      </div>

      {hoveredPart && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {hoveredPart}
        </div>
      )}

      {/* Mode indicator */}
      {isSpacePressed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500/80 text-white px-3 py-1 rounded text-xs font-medium">
          Rotation Mode
        </div>
      )}

      {/* Tool not supported indicator */}
      {!toolSupported && !isSpacePressed && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-500/80 text-black px-3 py-1 rounded text-xs font-medium">
          Tool "{activeTool}" - Use 2D view
        </div>
      )}
    </div>
  );
}
