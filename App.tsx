import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { WebcamController } from './components/WebcamController';
import { AppState } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.FORMED);
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });
  const [debugMsg, setDebugMsg] = useState<string>("Initializing...");

  // Optimized callbacks
  const handleStateChange = useCallback((newState: AppState) => {
    setAppState(prev => {
      if (prev !== newState) {
        setDebugMsg(`Gesture Detected: ${newState}`);
        return newState;
      }
      return prev;
    });
  }, []);

  const handleHandMove = useCallback((x: number, y: number) => {
    // Smooth dampening could be here, but we do it in 3D scene for better framerate
    setHandPosition({ x, y });
  }, []);

  return (
    <div className="w-full h-screen relative bg-black">
      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, toneMappingExposure: 1.5 }}>
        <Experience appState={appState} handPosition={handPosition} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 z-10">
        
        {/* Header */}
        <header className="text-center">
          <h1 
            className="text-4xl md:text-6xl font-luxury tracking-widest uppercase mb-2"
            style={{ color: COLORS.GOLD, textShadow: `0 0 20px ${COLORS.GOLD}` }}
          >
            Grand Holiday
          </h1>
          <div className="h-px w-32 mx-auto bg-yellow-500 shadow-[0_0_10px_yellow]"></div>
          <p className="text-emerald-300 font-serif-elegant mt-2 text-lg italic tracking-wider">
            A Presidential Christmas Experience
          </p>
        </header>

        {/* Instructions / Debug */}
        <div className="text-center space-y-2">
          <div className="inline-block bg-black/60 backdrop-blur-md border border-white/20 p-4 rounded-lg">
             <p className="text-yellow-100 font-luxury text-sm">
               {debugMsg}
             </p>
             <div className="mt-2 text-xs text-gray-400 font-sans">
               <span className="block">🖐️ OPEN HAND: Unleash Chaos</span>
               <span className="block">✊ CLOSED FIST: Form Tree</span>
               <span className="block">👋 MOVE HAND: Rotate Camera</span>
             </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/30 text-xs font-sans">
          Powered by React 19 • Gemini Vision • Three.js
        </footer>
      </div>

      {/* Logic Controller (Invisible) */}
      <WebcamController 
        onStateChange={handleStateChange}
        onHandMove={handleHandMove}
      />
    </div>
  );
};

export default App;