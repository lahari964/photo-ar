import React, { useEffect, useState } from 'react';
import 'aframe';
import 'mind-ar/dist/mindar-image-aframe.prod.js';

const ARViewer = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mount the AR components after initial render to avoid SSR/React strict mode issues
    setIsReady(true);
    
    // Set up the event listeners once the scene is ready
    const setupEvents = () => {
      const target = document.querySelector('#target');
      const vid = document.querySelector('#vid');

      if (target && vid) {
        target.addEventListener('targetFound', () => {
          console.log('Target found!');
          vid.play().catch(e => console.error("Video play failed:", e));
        });
        target.addEventListener('targetLost', () => {
          console.log('Target lost!');
          vid.pause();
        });
      }
    };
    
    // Give A-Frame a moment to initialize the DOM elements
    setTimeout(setupEvents, 1000);
  }, []);

  if (!isReady) return null;

  return (
    <div className="absolute inset-0 z-0 w-full h-full bg-black">
      <a-scene
        mindar-image="imageTargetSrc: /target.mind; autoStart: true; uiScanning: no;"
        color-space="sRGB"
        renderer="colorManagement: true, physicallyCorrectLights"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <video 
            id="vid" 
            src="/mock-video.mp4" 
            preload="auto" 
            loop 
            crossOrigin="anonymous" 
            playsInline 
            webkit-playsinline="true"
          ></video>
        </a-assets>
        
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        
        <a-entity id="target" mindar-image-target="targetIndex: 0">
          {/* The position and scale can be tweaked to fit the specific photo */}
          <a-video 
            src="#vid" 
            position="0 0 0" 
            height="1" 
            width="1.33" 
            rotation="0 0 0"
          ></a-video>
        </a-entity>
      </a-scene>
    </div>
  );
};

export default ARViewer;
