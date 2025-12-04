import { useState, useEffect } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import type { PanInfo } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Store the event globally so it persists
let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;

// Capture the event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
    console.log('PWA: beforeinstallprompt captured globally');
  });
}

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (12 hours)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 12) {
        return;
      }
    }

    // Check if mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if we already have the prompt
    if (deferredPromptGlobal) {
      setCanInstall(true);
    }

    // Also listen for new events
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptGlobal = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      console.log('PWA: beforeinstallprompt captured in component');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after 2 seconds
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 2000);

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('PWA: App was installed!');
      setIsInstalled(true);
      setShowPrompt(false);
      deferredPromptGlobal = null;
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPromptGlobal) {
      console.log('PWA: No install prompt available');
      // Fallback - show manual instructions
      alert('กรุณากดเมนู ⋮ ที่มุมขวาบน แล้วเลือก "Install app" หรือ "Add to Home screen"');
      return;
    }

    setInstalling(true);
    console.log('PWA: Triggering install prompt...');

    try {
      await deferredPromptGlobal.prompt();
      const { outcome } = await deferredPromptGlobal.userChoice;
      console.log('PWA: User choice:', outcome);

      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (err) {
      console.error('PWA: Install error:', err);
    }

    deferredPromptGlobal = null;
    setCanInstall(false);
    setInstalling(false);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    // ปัดลงเกิน 80px หรือความเร็วมากกว่า 500 ให้ปิด
    if (info.offset.y > 80 || info.velocity.y > 500) {
      handleDismiss();
    }
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          drag="y"
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
          className="fixed inset-x-0 bottom-20 z-[100] p-4 md:hidden"
          style={{ touchAction: 'none' }}
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            {/* Drag Handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-4 pb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/pakkuneko-logo.png"
                    alt="PakkuNeko"
                    className="w-14 h-14 rounded-xl shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <Download className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">PakkuNeko Admin</h3>
                  <p className="text-gray-400 text-sm">
                    {canInstall ? 'พร้อมติดตั้งแล้ว!' : 'ติดตั้งเป็นแอป'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-300 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>เปิดเร็ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>เต็มจอ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>ใช้งานง่าย</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-4 pt-2 flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 bg-gray-700 text-gray-300 rounded-xl font-medium active:bg-gray-600"
              >
                ไว้ทีหลัง
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                  canInstall
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                {installing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {installing ? 'กำลังติดตั้ง...' : 'ติดตั้งแอป'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
