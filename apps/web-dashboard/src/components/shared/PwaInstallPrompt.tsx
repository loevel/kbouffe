'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);

      // Trigger once immediately so the browser can show the native install banner.
      void (async () => {
        try {
          await e.prompt();
          await e.userChoice;
          setIsVisible(false);
          setDeferredPrompt(null);
        } catch {
          // Ignore: user interaction may be required on some browsers.
        }
      })();
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 w-[90%] max-w-sm">
      <div className="bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">Installer l&apos;application</h3>
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
