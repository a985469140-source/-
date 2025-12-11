import React, { useEffect, useRef, useState } from 'react';
import { analyzeGesture } from '../services/geminiService';
import { AppState, GestureResponse } from '../types';
import { CONFIG } from '../constants';

interface WebcamControllerProps {
  onStateChange: (state: AppState) => void;
  onHandMove: (x: number, y: number) => void;
}

export const WebcamController: React.FC<WebcamControllerProps> = ({ onStateChange, onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPermission) return;

    const interval = setInterval(async () => {
      if (isProcessing || !videoRef.current || !canvasRef.current) return;

      setIsProcessing(true);

      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64 = canvas.toDataURL('image/jpeg', 0.6); // Low quality for speed
          const result = await analyzeGesture(base64);

          if (result) {
            onStateChange(result.state);
            // Invert X because webcam is usually mirrored for user
            onHandMove(-result.handX, result.handY); 
          }
        }
      } catch (e) {
        console.error("Detection loop error", e);
      } finally {
        setIsProcessing(false);
      }

    }, CONFIG.GEMINI_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasPermission, isProcessing, onStateChange, onHandMove]);

  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-0 pointer-events-none">
      <video ref={videoRef} autoPlay playsInline muted className="w-32 h-24" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};