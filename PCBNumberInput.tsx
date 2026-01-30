
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { dbService } from '../services/dbService';
import { ModuleType } from '../types';

interface PCBNumberInputProps {
  value: string;
  onChange: (val: string, isDuplicateConfirmed: boolean) => void;
  moduleType: ModuleType;
  disabled?: boolean;
}

const PCBNumberInput: React.FC<PCBNumberInputProps> = ({ value, onChange, moduleType, disabled }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);

  const checkDuplicates = (val: string) => {
    if (val && dbService.checkDuplicatePCB(val, moduleType)) {
      setShowDuplicateWarning(true);
    } else {
      setShowDuplicateWarning(false);
      onChange(val, false);
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val, false);
  };

  const stopScanning = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanning = async () => {
    setErrorMsg(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Camera access requires a secure HTTPS environment.');
      setIsScanning(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      setErrorMsg('Camera error: ' + (err.message || 'Access failed.'));
      setIsScanning(true);
    }
  };

  const tick = () => {
    if (isScanning && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            onChange(code.data, false);
            stopScanning();
            checkDuplicates(code.data);
            return;
          }
        }
      }
    }
    if (isScanning && !errorMsg) requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isScanning && !errorMsg) requestRef.current = requestAnimationFrame(tick);
    return () => stopScanning();
  }, [isScanning, errorMsg]);

  return (
    <div className="space-y-3 relative">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">PCB Identification</label>
        {dbService.checkDuplicatePCB(value, moduleType) && value && (
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border-2 border-orange-200 animate-pulse">
            DUPLICATE DETECTED
          </span>
        )}
      </div>
      
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none">
          <i className="fas fa-barcode text-2xl"></i>
        </div>
        <input 
          type="text" 
          value={value}
          onChange={handleManualChange}
          disabled={disabled || (isScanning && !errorMsg)}
          className="w-full pl-16 pr-44 py-8 bg-white border-4 border-slate-200 rounded-[2rem] text-3xl font-black text-slate-900 caret-indigo-600 focus:ring-12 focus:ring-indigo-100 transition-all outline-none shadow-xl focus:border-indigo-600 placeholder:text-slate-200 placeholder:font-bold" 
          placeholder="ENTER OR SCAN..."
        />
        <button 
          type="button"
          onClick={startScanning}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-4 rounded-2xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-lg active:scale-95"
        >
          <i className="fas fa-camera text-xl"></i>
          SCAN CODE
        </button>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          {errorMsg ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-8 border-red-50">
              <i className="fas fa-video-slash text-4xl text-red-600 mb-6 block"></i>
              <h4 className="text-xl font-black text-gray-900 mb-4 uppercase">Camera Restricted</h4>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed font-bold">{errorMsg}</p>
              <button type="button" onClick={stopScanning} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl">BACK TO FORM</button>
            </div>
          ) : (
            <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border-8 border-indigo-600 shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 pointer-events-none border-[12px] border-black/20">
                <div className="w-full h-full border-4 border-white/20 rounded-[2rem] flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-indigo-400/50 rounded-2xl animate-pulse relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_#818cf8] animate-[scan_2s_linear_infinite]"></div>
                  </div>
                </div>
              </div>
              <button type="button" onClick={stopScanning} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-10 py-4 rounded-full font-black shadow-2xl border-4 border-slate-100 uppercase tracking-widest text-sm active:scale-95 transition-all">CLOSE CAMERA</button>
            </div>
          )}
        </div>
      )}

      {showDuplicateWarning && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border-8 border-orange-50 animate-in zoom-in duration-200">
            <i className="fas fa-copy text-4xl text-orange-600 mb-6 block"></i>
            <h4 className="text-2xl font-black text-gray-900 mb-4 uppercase">Duplicate Identification</h4>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-bold uppercase tracking-tight">PCB ID <strong>{value}</strong> already recorded. Commit duplicate?</p>
            <div className="flex flex-col gap-4">
              <button type="button" onClick={() => { setShowDuplicateWarning(false); onChange(value, true); }} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100">CONFIRM & PROCEED</button>
              <button type="button" onClick={() => { setShowDuplicateWarning(false); onChange('', false); }} className="w-full bg-slate-100 text-slate-500 font-black py-5 rounded-2xl">RE-ENTER</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
      `}</style>
    </div>
  );
};

export default PCBNumberInput;
