import React, { useState } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ARViewer from './components/ARViewer';

function App() {
  const [appState, setAppState] = useState('onboarding'); // 'onboarding', 'dashboard', 'ar'
  const [activeAlbum, setActiveAlbum] = useState(null);

  const handleStartAR = (album) => {
    setActiveAlbum(album);
    setAppState('ar');
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-black">
      {appState === 'onboarding' && (
        <Onboarding onComplete={() => setAppState('dashboard')} />
      )}
      {appState === 'dashboard' && (
        <Dashboard onSelectAlbum={handleStartAR} onBack={() => setAppState('onboarding')} />
      )}
      {appState === 'ar' && activeAlbum && (
        <ARViewer 
          targetSrc={activeAlbum.targetSrc}
          videoSrc={activeAlbum.videoSrc}
          coverUrl={activeAlbum.coverUrl}
          onBack={() => setAppState('dashboard')} 
        />
      )}
    </div>
  );
}

export default App;
