/**
 * Unified notification helper for Amar Saloon:
 * - Browser Web Notifications (desktop & mobile push/lock screen)
 * - Audio synthesized chime alert (Web Audio API)
 * - Haptic vibration feedback
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  } catch (e) {
    console.warn("Notification permission request failed:", e);
    return false;
  }
};

export const hasNotificationPermission = (): boolean => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  return Notification.permission === "granted";
};

export const sendBrowserNotification = (
  title: string,
  options?: NotificationOptions & { url?: string }
) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission === "granted") {
    try {
      const notificationOptions: any = {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200, 100, 250],
        tag: options?.tag || `salon_notif_${Date.now()}`,
        ...options,
      };

      const notif = new Notification(title, notificationOptions);

      if (options?.url) {
        notif.onclick = () => {
          try {
            window.focus();
            window.location.href = options.url!;
            notif.close();
          } catch (e) {}
        };
      }
      return notif;
    } catch (e) {
      // In some mobile browsers (Android Chrome), new Notification() throws outside Service Worker
      if (typeof navigator !== "undefined" && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          const swOptions: any = {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200, 100, 250],
            data: { url: options?.url || "/" },
            ...options,
          };
          reg.showNotification(title, swOptions);
        });
      }
    }
  }
  return null;
};

export const playNotificationChime = (tone: "urgent" | "normal" = "normal") => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    if (tone === "urgent") {
      // 3-tone attention-grabbing celebration chime (C5 -> E5 -> G5)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.35, now + index * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.45);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.45);
      });
    } else {
      // Smooth dual-tone notification chime (D5 -> A5)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn("Audio chime failed:", e);
  }
};

export const triggerDeviceHaptic = (pattern: number | number[] = 50) => {
  try {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  } catch (e) {}
};
