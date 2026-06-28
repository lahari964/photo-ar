import React, { useState } from 'react';
import { Camera, Plus, Image as ImageIcon, ChevronRight, ChevronLeft, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const albums = [
  {
    id: 'manali-jan-2025',
    title: 'Manali Jan 2025',
    photosCount: 1,
    coverUrl: '/lahari-paragliding.jpeg',
    targetSrc: '/lahari-paragliding.mind',
    videoSrc: '/lahari-paragliding.mp4',
    isLocked: false,
  },
  {
    id: 'paris-trip',
    title: 'Paris Trip 2023',
    photosCount: 1,
    coverUrl: 'https://images.unsplash.com/photo-1502602881462-f2243e498c0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    targetSrc: '/target.mind',
    videoSrc: '/mock-video.mp4',
    isLocked: false,
  },
  {
    id: 'wedding',
    title: 'Wedding Album',
    photosCount: 24,
    coverUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    targetSrc: '/target.mind',
    videoSrc: '/mock-video.mp4',
    isLocked: true,
  }
];

const Dashboard = ({ onSelectAlbum, onBack }) => {
  const [showToast, setShowToast] = useState(false);

  const handleUploadClick = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#030305] text-white relative">
      {/* Background Gradient & Noise */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <div className="relative z-10 p-6 pt-12 safe-area-inset min-h-full flex flex-col">
        
        <header className="mb-8 flex flex-col gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-white/70 -ml-1" />
          </button>

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">My Gallery</h1>
              <p className="text-gray-400 text-sm font-medium">Select an album to start scanning</p>
            </div>
            <button 
              onClick={handleUploadClick}
              className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 pb-20">
          {albums.map((album, idx) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => !album.isLocked && onSelectAlbum(album)}
              className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 flex items-center space-x-4 transition-transform ${album.isLocked ? 'opacity-50 grayscale' : 'active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_10px_30px_rgba(0,0,0,0.5)] hover:bg-white/10'}`}
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 relative border border-white/10">
                <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                {album.isLocked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Lock className="w-6 h-6 text-white/80" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-white/90 truncate">{album.title}</h3>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <ImageIcon className="w-4 h-4 mr-1.5 opacity-70" />
                  <span>{album.photosCount} AR {album.photosCount === 1 ? 'Photo' : 'Photos'}</span>
                </div>
              </div>

              {!album.isLocked && (
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>

      {/* Coming Soon Toast */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: showToast ? 1 : 0, y: showToast ? 0 : 50 }}
        className="fixed bottom-10 left-0 right-0 mx-auto w-max z-50 pointer-events-none"
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl font-medium tracking-wide">
          Uploading custom targets coming soon!
        </div>
      </motion.div>

    </div>
  );
};

export default Dashboard;
