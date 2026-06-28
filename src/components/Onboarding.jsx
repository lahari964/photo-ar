import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Camera, Image as ImageIcon, Sparkles, ChevronDown, Download } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Subtle background parallax
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div 
      ref={containerRef} 
      className="h-[100dvh] w-full overflow-y-auto bg-[#030305] text-white relative snap-y snap-mandatory" 
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Universal Fixed Background with Parallax */}
      <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: bgY }}
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-30 h-[150vh]"
        ></motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030305]/60 via-[#030305]/90 to-[#030305]"></div>
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <div className="relative z-10 flex flex-col w-full">
        
        {/* ================= SECTION 1 ================= */}
        <div className="min-h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center p-8 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/5 p-4 rounded-full backdrop-blur-xl mb-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10">
              <Sparkles className="w-12 h-12 text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
            </div>
            <h1 className="text-5xl font-extrabold mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
              Photo AR
            </h1>
            <p className="text-lg text-gray-400 mb-12 max-w-sm font-medium leading-relaxed">
              Bring your physical photo albums to life with augmented reality.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 flex flex-col items-center pointer-events-none"
          >
            <p className="text-xs text-gray-500 mb-2 font-bold tracking-[0.2em] uppercase">Scroll</p>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </motion.div>
          </motion.div>
        </div>

        {/* ================= SECTION 2 ================= */}
        <div className="min-h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center p-6 relative">
          <div className="absolute top-[20%] right-[-10%] w-[250px] h-[250px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="z-10 w-full max-w-md bg-[#0a0a0f] border border-white/10 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] pointer-events-auto"
          >
            <h2 className="text-2xl font-bold mb-8 tracking-tight text-white/90">How it works</h2>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 shadow-[inset_0_1px_1px_rgba(59,130,246,0.3)]">
                  <ImageIcon className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white/90">1. Find a Photo</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">Open your physical photo album and find a supported picture.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(168,85,247,0.3)]">
                  <Camera className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white/90">2. Scan it</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">Hold your phone steady over the photo using the camera scanner.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.3)]">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white/90">3. Magic</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-relaxed">The static photo will instantly transform into a playing video.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================= SECTION 3 ================= */}
        <div className="min-h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center p-6 pb-20 relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="z-10 w-full max-w-md bg-[#0a0a0f] border border-white/10 p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col items-center text-center pointer-events-auto"
          >
            <div className="mb-10 relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-[50px] opacity-40 animate-pulse"></div>
              <div className="bg-[#111116] border border-white/10 p-6 rounded-full relative z-10 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                <Camera className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-extrabold mb-4 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">Ready to scan?</h2>
            <p className="text-gray-400 mb-10 text-base font-medium leading-relaxed">
              Camera access is required to<br/>recognize your photos.
            </p>
            
            <div className="w-full space-y-4">
              {isInstallable && (
                <button 
                  onClick={handleInstallClick}
                  className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl text-lg overflow-hidden transition-all hover:bg-white/20 active:scale-95 border border-white/20"
                >
                  <div className="relative flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>Install App to Home Screen</span>
                  </div>
                </button>
              )}

              <button 
                onClick={onComplete}
                className="group relative w-full py-4 bg-white text-black font-bold rounded-2xl text-lg overflow-hidden transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-white to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Start Scanning</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
