import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import type { SkinModel, Point, BodyPartName } from '@/lib/core/types';
import { SKIN_UV_MAP, BODY_PART_DIMENSIONS, BODY_PART_POSITIONS, OVERLAY_SCALE, type BodyPartUV } from '@/lib/core/constants';
import type { BodyPartVisibility } from '@/stores/editorStore';

interface HoverInfo {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  texCoord: Point;
  faceIndex: number;
  isOverlay: boolean;
  /** Body part center position in world coordinates - needed for overlay snap calculation */
  bodyPartCenter: THREE.Vector3;
}

interface PlayerModelProps {
  skinTexture: THREE.CanvasTexture | null;
  model: SkinModel;
  onPaint?: (point: Point) => void;
  onPaintStart?: () => void;
  onPaintEnd?: () => void;
  brushSize?: number;
  showBrushPreview?: boolean;
  isPainting?: boolean;
  bodyPartVisibility?: BodyPartVisibility;
  /** Current paint target - determines which meshes respond to paint events */
  paintTarget?: 'base' | 'overlay';
}

interface BodyPartProps {
  name: string;
  position: [number, number, number];
  dimensions: [number, number, number];
  uvMap: BodyPartUV;
  texture: THREE.CanvasTexture | null;
  isOverlay?: boolean;
  onPaint?: (point: Point) => void;
  onPaintStart?: () => void;
  onHover?: (info: HoverInfo | null) => void;
  isPainting?: boolean;
  /** Current paint target - if set, overlay parts only respond when paintTarget='overlay' */
  paintTarget?: 'base' | 'overlay';
}

// Create UVs for a BoxGeometry with correct vertex order
function createBoxUVs(uvMap: BodyPartUV): Float32Array {
  const uvs: number[] = [];

  // Three.js BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  // Minecraft skin mapping (player facing +Z toward camera):
  // +X = player's right side, -X = player's left side
  // +Z = player's front (face), -Z = player's back
  const faceOrder: (keyof BodyPartUV)[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];

  // Some faces need horizontal mirroring to display correctly
  const mirrorHorizontal = new Set(['front', 'back']);
  const mirrorForSides = new Set(['left', 'right']);

  for (const faceName of faceOrder) {
    const [x1, y1, x2, y2] = uvMap[faceName];

    // Normalize to 0-1 UV space (64x64 texture)
    let u1 = x1 / 64;
    let u2 = x2 / 64;
    const v1 = 1 - y1 / 64; // Top of region (WebGL Y is flipped)
    const v2 = 1 - y2 / 64; // Bottom of region

    // Mirror horizontally for front/back faces so texture appears correct
    if (mirrorHorizontal.has(faceName)) {
      [u1, u2] = [u2, u1];
    }

    // Side faces also need mirroring for correct orientation
    if (mirrorForSides.has(faceName)) {
      [u1, u2] = [u2, u1];
    }

    // BoxGeometry vertex order per face
    if (faceName === 'top') {
      // Top face: rotate UV 180 degrees
      uvs.push(u2, v2); // 0
      uvs.push(u1, v2); // 1
      uvs.push(u2, v1); // 2
      uvs.push(u1, v1); // 3
    } else if (faceName === 'bottom') {
      // Bottom face
      uvs.push(u2, v1); // 0
      uvs.push(u1, v1); // 1
      uvs.push(u2, v2); // 2
      uvs.push(u1, v2); // 3
    } else {
      // Side faces (front, back, left, right)
      uvs.push(u1, v1); // 0 - top-left
      uvs.push(u2, v1); // 1 - top-right
      uvs.push(u1, v2); // 2 - bottom-left
      uvs.push(u2, v2); // 3 - bottom-right
    }
  }

  return new Float32Array(uvs);
}

function BodyPart({ name, position, dimensions, uvMap, texture, isOverlay = false, onPaint, onPaintStart, onHover, isPainting = false, paintTarget }: BodyPartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastPaintedPixelRef = useRef<string | null>(null);
  const isLocalPaintingRef = useRef(false); // Local sync tracking for drag painting

  const geometry = useMemo(() => {
    const [width, height, depth] = dimensions;
    const scale = isOverlay ? OVERLAY_SCALE : 1;
    const geo = new THREE.BoxGeometry(width * scale, height * scale, depth * scale);

    // Apply UV mapping
    const uvs = createBoxUVs(uvMap);
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    return geo;
  }, [dimensions, uvMap, isOverlay]);

  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      map: texture,
      transparent: isOverlay,
      // Don't use alphaTest for overlay - it prevents raycasting on transparent pixels
      // We need to be able to paint on empty overlay areas
      alphaTest: 0,
      side: isOverlay ? THREE.DoubleSide : THREE.FrontSide,
    });
  }, [texture, isOverlay]);

  // Update texture when it changes
  useEffect(() => {
    if (material && texture) {
      material.map = texture;
      material.needsUpdate = true;
    }
  }, [material, texture]);

  // Get texture coordinates from event
  const getTexCoords = useCallback((event: ThreeEvent<PointerEvent>): Point | null => {
    const uv = event.uv;
    if (!uv) return null;

    const faceIndex = event.faceIndex;
    if (faceIndex === undefined) return null;

    const faceNames: (keyof BodyPartUV)[] = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    const actualFaceIndex = Math.floor(faceIndex / 2);
    const faceName = faceNames[actualFaceIndex];
    if (!faceName) return null;

    const texX = Math.floor(uv.x * 64);
    const texY = Math.floor((1 - uv.y) * 64);

    const [x1, y1, x2, y2] = uvMap[faceName];
    if (texX < x1 || texX >= x2 || texY < y1 || texY >= y2) return null;

    return { x: texX, y: texY };
  }, [uvMap]);

  // Handle click for 3D painting
  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!onPaint) return;

      // Check if this mesh type matches the paint target
      // Base meshes only paint when paintTarget='base', overlay meshes only when paintTarget='overlay'
      if (paintTarget) {
        const expectedTarget = isOverlay ? 'overlay' : 'base';
        if (paintTarget !== expectedTarget) return;
      }

      event.stopPropagation();

      // Enable local drag painting immediately (sync, no React state delay)
      isLocalPaintingRef.current = true;

      // Signal paint start to parent
      if (onPaintStart) onPaintStart();

      const texCoord = getTexCoords(event);
      if (!texCoord) return;

      lastPaintedPixelRef.current = `${texCoord.x},${texCoord.y}`;
      onPaint(texCoord);
    },
    [onPaint, onPaintStart, isOverlay, getTexCoords, paintTarget]
  );

  // Handle hover and drag painting
  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Check if this mesh type matches the paint target
      if (paintTarget) {
        const expectedTarget = isOverlay ? 'overlay' : 'base';
        if (paintTarget !== expectedTarget) return;
      }

      event.stopPropagation();

      const texCoord = getTexCoords(event);

      // Update hover info
      if (onHover) {
        if (!texCoord) {
          onHover(null);
        } else {
          onHover({
            point: event.point.clone(),
            normal: event.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0),
            texCoord,
            faceIndex: event.faceIndex ?? 0,
            isOverlay,
            bodyPartCenter: new THREE.Vector3(position[0], position[1], position[2]),
          });
        }
      }

      // Drag painting - use local ref OR prop (ref is sync, prop handles cross-part drag)
      const isCurrentlyPainting = isLocalPaintingRef.current || isPainting;
      if (isCurrentlyPainting && onPaint && texCoord) {
        const pixelKey = `${texCoord.x},${texCoord.y}`;
        // Only paint if we moved to a new pixel
        if (pixelKey !== lastPaintedPixelRef.current) {
          lastPaintedPixelRef.current = pixelKey;
          onPaint(texCoord);
        }
      }
    },
    [onHover, onPaint, isOverlay, getTexCoords, isPainting, paintTarget, position]
  );

  const handlePointerUp = useCallback(() => {
    isLocalPaintingRef.current = false;
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (onHover) onHover(null);
    lastPaintedPixelRef.current = null;
    // Don't reset isLocalPaintingRef here - might be dragging to another part
  }, [onHover]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      userData={{ bodyPart: name }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}

// Pixel highlight component - shows a square with border around hovered pixel
function PixelHighlight({ point, normal, texCoord, isOverlay, bodyPartCenter }: {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  texCoord: Point;
  isOverlay: boolean;
  bodyPartCenter: THREE.Vector3;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Create geometry for pixel highlight (1 unit = 1 pixel in skin space)
  const fillGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const borderGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 0.5;
    const border = 0.06;

    // Outer square
    shape.moveTo(-size, -size);
    shape.lineTo(size, -size);
    shape.lineTo(size, size);
    shape.lineTo(-size, size);
    shape.lineTo(-size, -size);

    // Inner square (hole)
    const hole = new THREE.Path();
    const inner = size - border;
    hole.moveTo(-inner, -inner);
    hole.lineTo(-inner, inner);
    hole.lineTo(inner, inner);
    hole.lineTo(inner, -inner);
    hole.lineTo(-inner, -inner);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }, []);

  // Different colors for base vs overlay
  const highlightColor = isOverlay ? 0xff6b00 : 0x00ffff; // Orange for overlay, cyan for base

  const fillMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
    [highlightColor]
  );

  const borderMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      depthTest: false,
    }),
    [highlightColor]
  );

  // Calculate snapped position based on normal direction
  const snappedPosition = useMemo(() => {
    const pos = point.clone();
    const absNormal = new THREE.Vector3(
      Math.abs(normal.x),
      Math.abs(normal.y),
      Math.abs(normal.z)
    );

    /**
     * Snap calculation for both base and overlay meshes:
     *
     * For BASE meshes: vertices are at integer world coordinates, so simple floor+0.5 works.
     *
     * For OVERLAY meshes: vertices are scaled by OVERLAY_SCALE from the body part center.
     * To find the correct pixel:
     * 1. Convert world coord to local (relative to body part center)
     * 2. Unscale by dividing by OVERLAY_SCALE
     * 3. Snap to pixel grid
     * 4. Convert back to world coord
     */
    const snapToGrid = (worldVal: number, centerVal: number) => {
      if (isOverlay) {
        // Convert to local, unscale, snap, convert back
        const local = worldVal - centerVal;
        const unscaled = local / OVERLAY_SCALE;
        const snapped = Math.floor(unscaled) + 0.5;
        return snapped + centerVal; // Return in world coords (base scale)
      } else {
        // Base mesh: simple snap
        return Math.floor(worldVal) + 0.5;
      }
    };

    // Snap to pixel grid based on which axis the face is aligned to
    if (absNormal.x > 0.9) {
      // X-aligned face (left/right)
      pos.y = snapToGrid(pos.y, bodyPartCenter.y);
      pos.z = snapToGrid(pos.z, bodyPartCenter.z);
    } else if (absNormal.y > 0.9) {
      // Y-aligned face (top/bottom)
      pos.x = snapToGrid(pos.x, bodyPartCenter.x);
      pos.z = snapToGrid(pos.z, bodyPartCenter.z);
    } else if (absNormal.z > 0.9) {
      // Z-aligned face (front/back)
      pos.x = snapToGrid(pos.x, bodyPartCenter.x);
      pos.y = snapToGrid(pos.y, bodyPartCenter.y);
    }

    // Offset slightly above surface
    pos.addScaledVector(normal, isOverlay ? 0.15 : 0.02);
    return pos;
  }, [point, normal, isOverlay, bodyPartCenter]);

  // Calculate rotation to align with face
  const rotation = useMemo(() => {
    const rot = new THREE.Euler();
    const absNormal = new THREE.Vector3(
      Math.abs(normal.x),
      Math.abs(normal.y),
      Math.abs(normal.z)
    );

    if (absNormal.x > 0.9) {
      // X-aligned face
      rot.y = normal.x > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else if (absNormal.y > 0.9) {
      // Y-aligned face
      rot.x = normal.y > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else if (absNormal.z > 0.9) {
      // Z-aligned face
      rot.y = normal.z > 0 ? 0 : Math.PI;
    }

    return rot;
  }, [normal]);

  return (
    <group position={snappedPosition} rotation={rotation} renderOrder={999}>
      {/* Fill */}
      <mesh geometry={fillGeometry} material={fillMaterial} />
      {/* Border */}
      <mesh geometry={borderGeometry} material={borderMaterial} />
    </group>
  );
}

const defaultVisibility: BodyPartVisibility = {
  head: true,
  body: true,
  rightArm: true,
  leftArm: true,
  rightLeg: true,
  leftLeg: true,
};

export function PlayerModel({
  skinTexture,
  model,
  onPaint,
  onPaintStart,
  onPaintEnd,
  brushSize = 1,
  showBrushPreview = true,
  isPainting = false,
  bodyPartVisibility = defaultVisibility,
  paintTarget = 'base',
}: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // Configure texture for pixel-perfect rendering
  useEffect(() => {
    if (skinTexture) {
      skinTexture.magFilter = THREE.NearestFilter;
      skinTexture.minFilter = THREE.NearestFilter;
      skinTexture.colorSpace = THREE.SRGBColorSpace;
      skinTexture.needsUpdate = true;
    }
  }, [skinTexture]);

  const handleHover = useCallback((info: HoverInfo | null) => {
    setHoverInfo(info);
  }, []);

  // Handle pointer down on group to start painting
  const handlePointerDown = useCallback(() => {
    if (onPaintStart) onPaintStart();
  }, [onPaintStart]);

  // Handle pointer up to end painting
  const handlePointerUp = useCallback(() => {
    if (onPaintEnd) onPaintEnd();
  }, [onPaintEnd]);

  const armWidth = model === 'slim' ? 3 : 4;

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* HEAD */}
      {bodyPartVisibility.head && (
        <>
          <BodyPart
            name="head"
            position={BODY_PART_POSITIONS.head}
            dimensions={BODY_PART_DIMENSIONS.head.classic}
            uvMap={SKIN_UV_MAP.head.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="head_overlay"
            position={BODY_PART_POSITIONS.head}
            dimensions={BODY_PART_DIMENSIONS.head.classic}
            uvMap={SKIN_UV_MAP.head.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* BODY */}
      {bodyPartVisibility.body && (
        <>
          <BodyPart
            name="body"
            position={BODY_PART_POSITIONS.body}
            dimensions={BODY_PART_DIMENSIONS.body.classic}
            uvMap={SKIN_UV_MAP.body.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="body_overlay"
            position={BODY_PART_POSITIONS.body}
            dimensions={BODY_PART_DIMENSIONS.body.classic}
            uvMap={SKIN_UV_MAP.body.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* RIGHT ARM */}
      {bodyPartVisibility.rightArm && (
        <>
          <BodyPart
            name="rightArm"
            position={[-6 + (4 - armWidth) / 2, 18, 0]}
            dimensions={[armWidth, 12, 4]}
            uvMap={SKIN_UV_MAP.rightArm.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="rightArm_overlay"
            position={[-6 + (4 - armWidth) / 2, 18, 0]}
            dimensions={[armWidth, 12, 4]}
            uvMap={SKIN_UV_MAP.rightArm.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* LEFT ARM */}
      {bodyPartVisibility.leftArm && (
        <>
          <BodyPart
            name="leftArm"
            position={[6 - (4 - armWidth) / 2, 18, 0]}
            dimensions={[armWidth, 12, 4]}
            uvMap={SKIN_UV_MAP.leftArm.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="leftArm_overlay"
            position={[6 - (4 - armWidth) / 2, 18, 0]}
            dimensions={[armWidth, 12, 4]}
            uvMap={SKIN_UV_MAP.leftArm.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* RIGHT LEG */}
      {bodyPartVisibility.rightLeg && (
        <>
          <BodyPart
            name="rightLeg"
            position={BODY_PART_POSITIONS.rightLeg}
            dimensions={BODY_PART_DIMENSIONS.rightLeg.classic}
            uvMap={SKIN_UV_MAP.rightLeg.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="rightLeg_overlay"
            position={BODY_PART_POSITIONS.rightLeg}
            dimensions={BODY_PART_DIMENSIONS.rightLeg.classic}
            uvMap={SKIN_UV_MAP.rightLeg.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* LEFT LEG */}
      {bodyPartVisibility.leftLeg && (
        <>
          <BodyPart
            name="leftLeg"
            position={BODY_PART_POSITIONS.leftLeg}
            dimensions={BODY_PART_DIMENSIONS.leftLeg.classic}
            uvMap={SKIN_UV_MAP.leftLeg.base}
            texture={skinTexture}
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
          <BodyPart
            name="leftLeg_overlay"
            position={BODY_PART_POSITIONS.leftLeg}
            dimensions={BODY_PART_DIMENSIONS.leftLeg.classic}
            uvMap={SKIN_UV_MAP.leftLeg.overlay}
            texture={skinTexture}
            isOverlay
            onPaint={onPaint}
            onPaintStart={onPaintStart}
            onHover={handleHover}
            isPainting={isPainting}
            paintTarget={paintTarget}
          />
        </>
      )}

      {/* Pixel highlight indicator */}
      {showBrushPreview && hoverInfo && onPaint && (
        <PixelHighlight
          point={hoverInfo.point}
          normal={hoverInfo.normal}
          texCoord={hoverInfo.texCoord}
          isOverlay={hoverInfo.isOverlay}
          bodyPartCenter={hoverInfo.bodyPartCenter}
        />
      )}
    </group>
  );
}
