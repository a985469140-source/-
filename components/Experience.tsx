import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeSystem } from './TreeSystem';
import { AppState } from '../types';

interface ExperienceProps {
  appState: AppState;
  handPosition: { x: number; y: number };
}

export const Experience: React.FC<ExperienceProps> = ({ appState, handPosition }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const isUnleashed = appState === AppState.CHAOS;

  // Camera animation based on hand movement
  useFrame((state, delta) => {
    if (cameraRef.current) {
      // Base position
      const basePath = new THREE.Vector3(0, 4, 20);
      
      // Hand influence (inverted X usually feels more natural for "mirror" control)
      const handX = handPosition.x * 5;
      const handY = handPosition.y * 3;

      // Add gentle idle rotation
      const time = state.clock.elapsedTime;
      const orbitX = Math.sin(time * 0.1) * 2;

      // Lerp camera position
      cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, basePath.x + handX + orbitX, delta * 2);
      cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, basePath.y + handY, delta * 2);
      cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, basePath.z + (isUnleashed ? 5 : 0), delta * 2);

      cameraRef.current.lookAt(0, 4, 0);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 4, 20]} fov={50} />
      
      {/* Lighting for Luxury */}
      <ambientLight intensity={0.5} color="#001a10" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color="#fff5cc" 
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color="#ff0000" distance={20} />
      
      {/* High Quality Reflections */}
      <Environment preset="lobby" />

      {/* The Tree */}
      <TreeSystem isUnleashed={isUnleashed} />

      {/* Ground Reflection */}
      <ContactShadows opacity={0.5} scale={30} blur={2} far={10} resolution={256} color="#000000" />

      {/* Post Processing for "Cinematic Glow" */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};