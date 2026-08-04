import { useState, useEffect, useCallback } from 'react';
import { PWAConfig } from '../types';

export interface UsePWAReturn {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  showInstallPromptModal: boolean;
  needUpdate: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  promptInstall: () => Promise<boolean>;
  dismissInstall: (preference: 'later' | 'never') => void;
  updateApp: () => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  notificationPermission: NotificationPermission;
}

export function usePWA(pwaConfig?: PWAConfig): UsePWAReturn {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallPromptModal, setShowInstallPromptModal] = useState<boolean>(false);
  const [needUpdate, setNeedUpdate] = useState<boolean>(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Check if app is running in standalone mode (already installed)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    try {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  // Online / Offline status listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker Registration and Update Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        setSwRegistration(reg);

        // Listen for new service worker updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New update available!');
                setNeedUpdate(true);
              }
            });
          }
        });

        // Check if there is already a waiting service worker
        if (reg.waiting && navigator.serviceWorker.controller) {
          setNeedUpdate(true);
        }
      } catch (err) {
        console.warn('[PWA] ServiceWorker registration warning:', err);
      }
    };

    registerSW();

    // Reload page when new service worker takes control
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      const pref = localStorage.getItem('pwa_install_preference');
      const isPromptEnabled = pwaConfig?.installPrompt?.enabled !== false;

      if (pref !== 'never' && pref !== 'installed' && isPromptEnabled) {
        const delayMs = (pwaConfig?.installPrompt?.delaySeconds || 3) * 1000;
        const timer = setTimeout(() => {
          setShowInstallPromptModal(true);
        }, delayMs);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPromptModal(false);
      localStorage.setItem('pwa_install_preference', 'installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pwaConfig?.installPrompt?.enabled, pwaConfig?.installPrompt?.delaySeconds]);

  // Prompt user to install
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('[PWA] No deferred install prompt available.');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        localStorage.setItem('pwa_install_preference', 'installed');
        setIsInstalled(true);
        setShowInstallPromptModal(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('[PWA] User dismissed the install prompt');
        dismissInstall('later');
        return false;
      }
    } catch (err) {
      console.error('[PWA] Error triggering install prompt:', err);
      return false;
    }
  }, [deferredPrompt]);

  // Dismiss install modal according to user preference
  const dismissInstall = useCallback((preference: 'later' | 'never') => {
    setShowInstallPromptModal(false);
    if (preference === 'never') {
      localStorage.setItem('pwa_install_preference', 'never');
    } else {
      localStorage.setItem('pwa_install_preference', 'later');
    }
  }, []);

  // Trigger app update by activating waiting service worker
  const updateApp = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [swRegistration]);

  // Request Push Notification permission
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    const perm = await Notification.requestPermission();
    setNotificationPermission(perm);
    return perm;
  }, []);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    showInstallPromptModal,
    needUpdate,
    swRegistration,
    promptInstall,
    dismissInstall,
    updateApp,
    requestNotificationPermission,
    notificationPermission
  };
}
