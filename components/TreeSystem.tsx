import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Instance, Instances } from '@react-three/drei';
import { COLORS, CONFIG } from '../constants';

// --- Utility Math ---
const randomVector = (r: number) => {
  const v = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  );
  return v.normalize().multiplyScalar(r * Math.random());
};

const getTreePosition = (ratio: number, height: number, maxRadius: number) => {
  // y goes from -height/2 to height/2
  const y = (ratio - 0.5) * height;
  // Radius decreases as y increases (cone)
  const r = (1 - ratio) * maxRadius; 
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  return new THREE.Vector3(x, y, z);
};

// --- Sub-Component: Foliage (Points) ---
const Foliage: React.FC<{ isUnleashed: boolean }> = ({ isUnleashed }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, chaosPositions, colors } = useMemo(() => {
    const count = CONFIG.FOLIAGE_COUNT;
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorObj = new THREE.Color(COLORS.EMERALD);
    const goldObj = new THREE.Color(COLORS.GOLD);

    for (let i = 0; i < count; i++) {
      // Tree Shape
      const ratio = Math.random(); // 0 is bottom, 1 is top? actually let's distribute evenly volume-wise
      // Volume distribution adjustment: sqrt(random) pushes more to outside, but linear height is fine for cone
      // Let's just use linear height for simplicity of "layers"
      const hRatio = Math.pow(Math.random(), 0.5); // Bias towards bottom for density
      // Actually standard cone sampling:
      const yNorm = Math.random(); 
      const rNorm = Math.sqrt(Math.random()) * (1 - yNorm); // Uniform point in cone
      
      const y = (yNorm - 0.5) * CONFIG.TREE_HEIGHT;
      const r = (1 - yNorm) * CONFIG.TREE_RADIUS; // Surface
      // Fill inside slightly
      const finalR = r * Math.sqrt(Math.random()); 
      const angle = Math.random() * Math.PI * 2;

      const tx = Math.cos(angle) * finalR;
      const ty = y;
      const tz = Math.sin(angle) * finalR;

      pos[i * 3] = tx;
      pos[i * 3 + 1] = ty;
      pos[i * 3 + 2] = tz;

      // Chaos Shape
      const cVec = randomVector(CONFIG.CHAOS_RADIUS);
      chaos[i * 3] = cVec.x;
      chaos[i * 3 + 1] = cVec.y;
      chaos[i * 3 + 2] = cVec.z;

      // Color mixed
      const isGold = Math.random() > 0.9;
      const c = isGold ? goldObj : colorObj;
      // Vary green slightly
      if (!isGold) c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);
      
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, chaosPositions: chaos, colors: col };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    
    // Lerp factor
    const target = isUnleashed ? 1 : 0;
    // Store current lerp value in userData for persistence across frames
    const current = pointsRef.current.userData.lerp || 0;
    const next = THREE.MathUtils.lerp(current, target, delta * 2);
    pointsRef.current.userData.lerp = next;

    for (let i = 0; i < CONFIG.FOLIAGE_COUNT; i++) {
      const ix = i * 3;
      const tx = positions[ix];
      const ty = positions[ix + 1];
      const tz = positions[ix + 2];

      const cx = chaosPositions[ix];
      const cy = chaosPositions[ix + 1];
      const cz = chaosPositions[ix + 2];

      // Add some noise/swirl during transition
      const noise = Math.sin(state.clock.elapsedTime + ty) * 0.2 * next;

      posAttr.setXYZ(
        i,
        THREE.MathUtils.lerp(tx, cx, next) + noise,
        THREE.MathUtils.lerp(ty, cy, next) + noise,
        THREE.MathUtils.lerp(tz, cz, next) + noise
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        opacity={0.9} 
        sizeAttenuation 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </points>
  );
};

// --- Sub-Component: Ornaments (Instanced) ---
const Ornaments: React.FC<{ isUnleashed: boolean }> = ({ isUnleashed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return new Array(CONFIG.ORNAMENT_COUNT).fill(0).map(() => {
      // Tree Pos: Surface of cone
      const yNorm = Math.random();
      const y = (yNorm - 0.5) * CONFIG.TREE_HEIGHT;
      const r = (1 - yNorm) * CONFIG.TREE_RADIUS; 
      const angle = Math.random() * Math.PI * 2;
      
      const treePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      const chaosPos = randomVector(CONFIG.CHAOS_RADIUS);
      const scale = 0.2 + Math.random() * 0.3;
      const color = Math.random() > 0.5 ? COLORS.RED_VELVET : COLORS.GOLD;
      
      return { treePos, chaosPos, scale, color, speed: 0.5 + Math.random() };
    });
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      data.forEach((d, i) => {
        meshRef.current!.setColorAt(i, new THREE.Color(d.color));
      });
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Global Lerp target
    const target = isUnleashed ? 1 : 0;
    // Use a ref-stored value for smooth damping
    const lerpRef = meshRef.current.userData;
    lerpRef.val = THREE.MathUtils.lerp(lerpRef.val || 0, target, delta * 1.5);
    
    data.forEach((d, i) => {
      // Individual slightly randomized interpolation based on speed
      // We use the global smoothed val but add a slight offset phase
      const t = lerpRef.val;
      
      const pos = new THREE.Vector3().lerpVectors(d.treePos, d.chaosPos, t);
      
      // Floating effect when in Chaos
      if (t > 0.1) {
        pos.y += Math.sin(state.clock.elapsedTime * d.speed + i) * 0.1 * t;
        pos.x += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.1 * t;
      }

      dummy.position.copy(pos);
      dummy.scale.setScalar(d.scale);
      dummy.rotation.set(t * Math.PI, t * Math.PI, t * Math.PI); // Rotate while flying
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.ORNAMENT_COUNT]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        roughness={0.1} 
        metalness={0.9} 
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
};

// --- Sub-Component: Polaroids (Instanced) ---
const Polaroids: React.FC<{ isUnleashed: boolean }> = ({ isUnleashed }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    return new Array(CONFIG.PHOTO_COUNT).fill(0).map(() => {
      // Spiral placement on tree
      const i = Math.random();
      const y = (i - 0.5) * CONFIG.TREE_HEIGHT;
      const r = (1 - i) * CONFIG.TREE_RADIUS + 0.5; // Slightly outside
      const angle = i * Math.PI * 10; // Spiral
      
      const treePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      // Look away from center
      const treeRot = new THREE.Euler(0, -angle, 0);

      const chaosPos = randomVector(CONFIG.CHAOS_RADIUS * 0.8);
      const chaosRot = new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0);

      return { treePos, treeRot, chaosPos, chaosRot };
    });
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const target = isUnleashed ? 1 : 0;
    const lerpRef = meshRef.current.userData;
    lerpRef.val = THREE.MathUtils.lerp(lerpRef.val || 0, target, delta * 1.2); // Slower than particles
    const t = lerpRef.val;

    const qA = new THREE.Quaternion();
    const qB = new THREE.Quaternion();
    const qRes = new THREE.Quaternion();

    data.forEach((d, i) => {
      const pos = new THREE.Vector3().lerpVectors(d.treePos, d.chaosPos, t);
      
      qA.setFromEuler(d.treeRot);
      qB.setFromEuler(d.chaosRot);
      qRes.slerpQuaternions(qA, qB, t);

      dummy.position.copy(pos);
      dummy.rotation.setFromQuaternion(qRes);
      dummy.scale.setScalar(0.8); // Size of photo
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFIG.PHOTO_COUNT]}>
      <boxGeometry args={[1, 1.2, 0.05]} /> 
      {/* 
         Simplified Polaroid: White box. 
         Ideally, we'd use multiple materials/groups for the image, 
         but for a single draw call instanced mesh, we stick to one material 
         or a texture atlas. For "Trump Luxury", let's make them Gold Frames.
      */}
      <meshStandardMaterial color="#ffffee" roughness={0.8} metalness={0.1} />
    </instancedMesh>
  );
}

// --- Main System Export ---
export const TreeSystem: React.FC<{ isUnleashed: boolean }> = (props) => {
  return (
    <group position={[0, 2, 0]}>
      <Foliage {...props} />
      <Ornaments {...props} />
      <Polaroids {...props} />
    </group>
  );
};