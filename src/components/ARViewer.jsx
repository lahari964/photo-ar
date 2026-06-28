import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Volume2, VolumeX, Heart, Video, Square, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'aframe';
import '../lib/mindar-image-aframe.prod.js';

const ARViewer = ({ targetSrc, videoSrc, onBack }) => {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showDownloadToast, setShowDownloadToast] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState('Hold your camera steady to unlock the video');
  
  const coachTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animationFrameRef = useRef(null);

  const toggleMute = () => {
    const vid = document.querySelector('#vid');
    if (vid) {
      vid.muted = !vid.muted;
      setIsMuted(vid.muted);
    }
  };

  const startRecording = () => {
    const videos = document.querySelectorAll('video');
    const webcam = Array.from(videos).find(v => v.id !== 'vid');
    const aframeCanvas = document.querySelector('.a-canvas');

    if (!webcam || !aframeCanvas) {
      console.error("Could not find video or canvas for recording");
      return;
    }

    const compCanvas = document.createElement('canvas');
    
    // EXTREMELY IMPORTANT FIX: Mobile screens have retina displays, meaning the canvas can be 3000x4000 pixels.
    // Trying to software-composite and real-time encode a 4K canvas in Javascript on a phone will cause severe stuttering.
    // We must scale the recording canvas down to a max of 720p to guarantee a buttery smooth 30fps recording.
    const MAX_WIDTH = 720;
    let scale = 1;
    if (aframeCanvas.width > MAX_WIDTH) {
      scale = MAX_WIDTH / aframeCanvas.width;
    }
    
    compCanvas.width = aframeCanvas.width * scale;
    compCanvas.height = aframeCanvas.height * scale;
    const ctx = compCanvas.getContext('2d');

    // Run compositor loop
    const drawFrame = () => {
      animationFrameRef.current = requestAnimationFrame(drawFrame);

      const hRatio = compCanvas.width / webcam.videoWidth;
      const vRatio = compCanvas.height / webcam.videoHeight;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (compCanvas.width - webcam.videoWidth * ratio) / 2;
      const centerShift_y = (compCanvas.height - webcam.videoHeight * ratio) / 2;

      ctx.clearRect(0, 0, compCanvas.width, compCanvas.height);
      if (webcam.readyState >= 2) {
        ctx.drawImage(webcam, 0, 0, webcam.videoWidth, webcam.videoHeight, centerShift_x, centerShift_y, webcam.videoWidth * ratio, webcam.videoHeight * ratio);
      }
      
      ctx.drawImage(aframeCanvas, 0, 0, compCanvas.width, compCanvas.height);
    };
    
    // START THE LOOP (CRITICAL)
    animationFrameRef.current = requestAnimationFrame(drawFrame);

    const canvasStream = compCanvas.captureStream(30);
    let finalStream = canvasStream;
    
    // Attempt to grab the audio track from the playing AR video
    const arVideoEl = document.querySelector('#vid');
    if (arVideoEl && (arVideoEl.captureStream || arVideoEl.mozCaptureStream)) {
      try {
        const videoStream = arVideoEl.captureStream ? arVideoEl.captureStream() : arVideoEl.mozCaptureStream();
        const audioTracks = videoStream.getAudioTracks();
        if (audioTracks.length > 0) {
          // Combine the newly stitched canvas video with the original video's audio
          finalStream = new MediaStream([canvasStream.getVideoTracks()[0], audioTracks[0]]);
        }
      } catch (err) {
        console.warn("Could not capture audio stream from video", err);
      }
    }

    // Standard bitrate for 720p is around 2.5 Mbps to maintain performance without stuttering
    mediaRecorderRef.current = new MediaRecorder(finalStream, { mimeType: 'video/webm', videoBitsPerSecond: 2500000 });
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      cancelAnimationFrame(animationFrameRef.current);
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      recordedChunksRef.current = [];
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `photo-ar-memory-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Show success toast
        setShowDownloadToast(true);
        setTimeout(() => setShowDownloadToast(false), 4000);
      }, 100);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    setIsReady(true);
    
    const setupEvents = () => {
      const target = document.querySelector('#target');
      const vid = document.querySelector('#vid');

      if (target && vid) {
        target.addEventListener('targetFound', () => {
          setIsTracking(true);
          setCoachingMessage('');
          clearTimeout(coachTimerRef.current);
          
          vid.play().catch(e => console.error("Video play failed:", e));
          
          const arVideo = document.querySelector('#ar-video');
          if (arVideo) arVideo.emit('fadein');
        });
        target.addEventListener('targetLost', () => {
          setIsTracking(false);
          vid.pause();
          
          const arVideo = document.querySelector('#ar-video');
          if (arVideo) arVideo.emit('fadeout');
          
          clearTimeout(coachTimerRef.current);
          setCoachingMessage('Hold your camera steady to unlock the video');
          coachTimerRef.current = setTimeout(() => {
            setCoachingMessage('Taking a while? Try moving to a brighter area.');
          }, 3500);
        });
      }
      
      coachTimerRef.current = setTimeout(() => {
        setCoachingMessage('Taking a while? Try moving to a brighter area.');
      }, 3500);
    };
    
    setTimeout(setupEvents, 1000);
    
    return () => {
      clearTimeout(coachTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (isRecording && mediaRecorderRef.current) mediaRecorderRef.current.stop();
    };
  }, []);

  if (!isReady) return null;

  return (
    <div className="absolute inset-0 z-0 w-full h-full bg-black">
      {!isTracking && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          <div className="w-full h-full scanner-laser opacity-50"></div>
        </div>
      )}
      
      <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6 safe-area-inset">
        <div className="flex justify-between items-center mt-4">
          <button 
            onClick={onBack}
            className="pointer-events-auto bg-white/15 backdrop-blur-xl p-3 rounded-full border border-white/20 text-white shadow-lg active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {isRecording && (
            <div className="bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-full border border-red-400 text-white text-sm font-bold tracking-wide shadow-lg flex items-center space-x-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>REC</span>
            </div>
          )}
          
          {!isRecording && (
            <div className={`transition-opacity duration-500 ${isTracking ? 'opacity-0' : 'opacity-100'} bg-white/15 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 text-white text-sm font-medium tracking-wide shadow-lg`}>
              Scanning...
            </div>
          )}
          
          <div className="flex gap-2">
            <button 
              onClick={toggleRecording}
              className={`pointer-events-auto backdrop-blur-xl p-3 rounded-full border shadow-lg active:scale-95 transition-all ${isRecording ? 'bg-red-500/50 border-red-500 text-white' : 'bg-white/15 border-white/20 text-white'}`}
            >
              {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Video className="w-6 h-6" />}
            </button>
            <button 
              onClick={toggleMute}
              className="pointer-events-auto bg-white/15 backdrop-blur-xl p-3 rounded-full border border-white/20 text-white shadow-lg active:scale-95 transition-transform"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {!isTracking && (
          <div className="pointer-events-auto bg-white/15 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center shadow-lg mb-4 transition-all">
            <p className="text-white font-semibold mb-1">Point at a photo</p>
            <p className="text-gray-300 text-sm">{coachingMessage}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDownloadToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-0 right-0 mx-auto w-max z-50 pointer-events-none"
          >
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white px-6 py-4 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-2 rounded-full border border-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-semibold tracking-wide">Saved to internal storage</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <a-scene
        mindar-image={`imageTargetSrc: ${targetSrc}; autoStart: true; uiScanning: no; filterMinCF: 0.0001; filterBeta: 0.001;`}
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <video 
            id="vid" 
            src={videoSrc} 
            preload="auto" 
            muted={isMuted}
            loop 
            crossOrigin="anonymous" 
            playsInline 
            webkit-playsinline="true"
          ></video>
        </a-assets>
        
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        
        <a-entity id="target" mindar-image-target="targetIndex: 0">
          <a-video 
            id="ar-video"
            src="#vid" 
            position="0 0 0.02" 
            height="1.05" 
            width="1.4" 
            rotation="0 0 0"
            material="transparent: true; opacity: 0"
            animation__fadein="property: material.opacity; from: 0; to: 1; dur: 800; startEvents: fadein; easing: easeOutQuad"
            animation__scalein="property: scale; from: 0.8 0.8 0.8; to: 1 1 1; dur: 800; startEvents: fadein; easing: easeOutElastic"
            animation__fadeout="property: material.opacity; from: 1; to: 0; dur: 500; startEvents: fadeout; easing: easeOutQuad"
          ></a-video>
        </a-entity>
      </a-scene>
    </div>
  );
};

export default ARViewer;
