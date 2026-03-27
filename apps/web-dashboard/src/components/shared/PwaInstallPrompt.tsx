'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-[90%] max-w-sm">
      <div className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Installer l'application</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Rapide, fluide et hors-ligne.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            type="button" 
            onClick={() => setIsVisible(false)} 
            className="h-8 px-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            Plus tard
          </button>
          <button 
            type="button" 
            onClick={handleInstallClick} 
            className="h-8 px-3 text-xs font-medium flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}
