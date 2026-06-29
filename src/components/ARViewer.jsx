import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, Volume2, VolumeX, Heart, Video, Square, CheckCircle, Loader2, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'aframe';
import '../lib/mindar-image-aframe.prod.js';

const ARViewer = ({ targetSrc, videoSrc, coverUrl, onBack }) => {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showDownloadToast, setShowDownloadToast] = useState(false);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState('Hold your camera steady to unlock the video');
  
  const coachTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const lastVibrationRef = useRef(0);

  const toggleMute = () => {
    const vid = document.querySelector('#vid');
    if (vid) {
      vid.muted = !vid.muted;
      setIsMuted(vid.muted);
    }
  };

  const startRecording = () => {
    setRecordedBlob(null);
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
    // We must scale the recording canvas down to a max of 480 (standard mobile SD) 
    // to guarantee smooth 30fps recording on Android devices without GPU stalling.
    const MAX_WIDTH = 480;
    let scale = 1;
    if (aframeCanvas.width > MAX_WIDTH) {
      scale = MAX_WIDTH / aframeCanvas.width;
    }
    
    compCanvas.width = aframeCanvas.width * scale;
    compCanvas.height = aframeCanvas.height * scale;
    
    // CRITICAL iOS BUG FIX: Safari WebKit aggressively throttles or completely stops rendering 
    // to canvases that are not in the DOM, causing captureStream() to drop 90% of frames (slideshow effect).
    // We must append it to the DOM and give it a > 0 opacity to trick the GPU into rendering it in real-time.
    compCanvas.style.position = 'fixed';
    compCanvas.style.top = '0';
    compCanvas.style.left = '0';
    compCanvas.style.opacity = '0.01'; // Must be > 0 for iOS
    compCanvas.style.pointerEvents = 'none';
    compCanvas.style.zIndex = '-9999';
    document.body.appendChild(compCanvas);

    // alpha: false removes expensive transparency blending on the base layer
    const ctx = compCanvas.getContext('2d', { alpha: false });
    // Disable bilinear filtering to vastly speed up drawImage scaling on mobile GPUs
    ctx.imageSmoothingEnabled = false;

    // Run compositor loop
    let lastTime = 0;
    let cachedDims = null;

    const drawFrame = (time) => {
      animationFrameRef.current = requestAnimationFrame(drawFrame);
      
      // Throttle to exactly ~30fps to prevent overloading the mobile GPU
      if (time - lastTime < 33) return;
      lastTime = time;

      // Cache the expensive matrix division math so it isn't recalculating 30 times a second
      if (!cachedDims && webcam.videoWidth > 0) {
        const hRatio = compCanvas.width / webcam.videoWidth;
        const vRatio = compCanvas.height / webcam.videoHeight;
        const ratio = Math.max(hRatio, vRatio);
        cachedDims = {
          vw: webcam.videoWidth,
          vh: webcam.videoHeight,
          cx: (compCanvas.width - webcam.videoWidth * ratio) / 2,
          cy: (compCanvas.height - webcam.videoHeight * ratio) / 2,
          dw: webcam.videoWidth * ratio,
          dh: webcam.videoHeight * ratio
        };
      }

      ctx.clearRect(0, 0, compCanvas.width, compCanvas.height);
      if (webcam.readyState >= 2 && cachedDims) {
        ctx.drawImage(webcam, 0, 0, cachedDims.vw, cachedDims.vh, cachedDims.cx, cachedDims.cy, cachedDims.dw, cachedDims.dh);
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

    // Lower bitrate to 1.5 Mbps for 480p to reduce hardware encoder stress on Android
    let options = { videoBitsPerSecond: 1500000 };
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      options.mimeType = 'video/mp4'; // Hardware accelerated on iOS Safari
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options.mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options.mimeType = 'video/webm;codecs=vp8';
    } else {
      options.mimeType = 'video/webm';
    }

    mediaRecorderRef.current = new MediaRecorder(finalStream, options);
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (document.body.contains(compCanvas)) {
        document.body.removeChild(compCanvas);
      }
      const mime = mediaRecorderRef.current.mimeType || 'video/webm';
      const blob = new Blob(recordedChunksRef.current, { type: mime });
      recordedChunksRef.current = [];
      setRecordedBlob(blob);
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

  const handleShare = async () => {
    if (!recordedBlob) return;
    setIsSharing(true);
    try {
      const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recordedBlob], `photo-ar-memory-${Date.now()}.${ext}`, { type: recordedBlob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Photo AR Memory',
        });
        setRecordedBlob(null);
      } else {
        setShowDownloadPrompt(true);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error sharing:", err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const confirmDownload = () => {
    if (!recordedBlob) return;
    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([recordedBlob], `photo-ar-memory-${Date.now()}.${ext}`, { type: recordedBlob.type });
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRecordedBlob(null);
      setShowDownloadPrompt(false);
      setShowDownloadToast(true);
      setTimeout(() => setShowDownloadToast(false), 4000);
    }, 100);
  };

  const cancelDownload = () => {
    setShowDownloadPrompt(false);
    setRecordedBlob(null);
  };

  useEffect(() => {
    setIsReady(true);
    
    const setupEvents = () => {
      const target = document.querySelector('#target');
      const vid = document.querySelector('#vid');

      if (target && vid) {
        let isCurrentlyTracking = false;

        vid.addEventListener('waiting', () => setIsVideoBuffering(true));
        vid.addEventListener('playing', () => {
          setIsVideoBuffering(false);
          if (isCurrentlyTracking) {
             const arVideo = document.querySelector('#ar-video');
             if (arVideo && arVideo.getAttribute('material').opacity === 0) {
                 arVideo.emit('fadein');
             }
          }
        });

        target.addEventListener('targetFound', () => {
          isCurrentlyTracking = true;
          setIsTracking(true);
          setCoachingMessage('');
          clearTimeout(coachTimerRef.current);
          
          const now = Date.now();
          if (now - lastVibrationRef.current > 2000) {
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
            lastVibrationRef.current = now;
          }
          
          if (vid.readyState < 3) {
            setIsVideoBuffering(true);
          }
          
          vid.play().catch(e => console.error("Video play failed:", e));
          
          if (vid.readyState >= 3) {
            const arVideo = document.querySelector('#ar-video');
            if (arVideo) arVideo.emit('fadein');
          }
        });
        target.addEventListener('targetLost', () => {
          isCurrentlyTracking = false;
          setIsTracking(false);
          vid.pause();
          
          const arVideo = document.querySelector('#ar-video');
          if (arVideo) {
            arVideo.emit('fadeout');
            setTimeout(() => { 
              if (!isCurrentlyTracking) arVideo.setAttribute('material', 'opacity: 0'); 
            }, 500);
          }
          
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
            {recordedBlob && (
              <button 
                onClick={handleShare}
                disabled={isSharing}
                className="pointer-events-auto backdrop-blur-xl p-3 rounded-full border shadow-lg active:scale-95 transition-all bg-emerald-500/50 border-emerald-500 text-white"
              >
                {isSharing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share className="w-6 h-6" />}
              </button>
            )}
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
        
        {/* Buffering Spinner Overlay */}
        {isTracking && isVideoBuffering && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="bg-black/50 backdrop-blur-md p-4 rounded-full border border-white/10 shadow-2xl">
               <Loader2 className="w-8 h-8 text-white animate-spin" />
             </div>
          </div>
        )}
        
        {!isTracking && (
          <div className="pointer-events-auto bg-white/15 backdrop-blur-xl p-6 rounded-3xl border border-white/20 text-center shadow-lg mb-4 transition-all flex flex-col items-center">
            {coverUrl && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border-2 border-white/30 shadow-[0_10px_20px_rgba(0,0,0,0.3)] bg-black">
                 <img src={coverUrl} alt="Target Photo" className="w-full h-full object-cover" />
              </div>
            )}
            <p className="text-white font-semibold mb-1">Point at this photo</p>
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

      <AnimatePresence>
        {showDownloadPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] max-w-sm w-full text-center"
            >
              <h3 className="text-xl font-bold mb-2">Sharing Unavailable</h3>
              <p className="text-gray-300 text-sm mb-6">
                Your device doesn't support sharing videos directly. Would you like to download the video to your gallery instead?
              </p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={confirmDownload}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-full transition-colors"
                >
                  Download Video
                </button>
                <button 
                  onClick={cancelDownload}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 rounded-full transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
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
