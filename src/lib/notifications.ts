/**
 * Unified notification helper for Amar Salon:
 * - Service Worker + Browser Web Notifications (desktop & mobile push/lock screen)
 * - Audio synthesized chime alert (Web Audio API with auto-resume)
 * - Haptic vibration feedback
 */

let sharedAudioCtx: AudioContext | null = null;

export const unlockAudio = () => {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
  } catch (e) { }
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      return reg;
    } catch (err) {
      console.warn("Service Worker registration failed:", err);
    }
  }
  return null;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    unlockAudio();
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
    if (typeof window === "undefined") {
      return null;
    }

        // Always attempt to play audio and vibrate
        unlockAudio();

        if ("Notification" in window && Notification.permission === "granted") {
          const notifOptions: any = {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200, 100, 250],
            tag: options?.tag || `salon_notif_${Date.now()}`,
            data: { url: options?.url || "/" },
            ...options,
          };

          // Prefer Service Worker registration (works on Android Chrome, desktop PWA)
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
              .then((reg) => {
                reg.showNotification(title, notifOptions);
              })
              .catch(() => {
                try {
                  const notif = new Notification(title, notifOptions);
                  if (options?.url) {
                    notif.onclick = () => {
                      window.focus();
                      window.location.href = options.url!;
                      notif.close();
                    };
                  }
                } catch (e) { }
              });
            return true;
          }

          // Direct Notification fallback (Desktop Safari/Firefox)
          try {
            const notif = new Notification(title, notifOptions);
            if (options?.url) {
              notif.onclick = () => {
                window.focus();
                window.location.href = options.url!;
                notif.close();
              };
            }
            return notif;
        } catch (e) { }
      }
  return null;
    };

    export const playNotificationChime = (tone: "urgent" | "normal" = "normal") => {
      try {
        if (typeof window === "undefined") return;
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
          sharedAudioCtx = new AudioContextClass();
        }
        if (sharedAudioCtx.state === "suspended") {
          sharedAudioCtx.resume();
        }

        const audioCtx = sharedAudioCtx;
        const now = audioCtx.currentTime;

        if (tone === "urgent") {
          // 4-tone attention-grabbing celebration chime (C5 -> E5 -> G5 -> C6)
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
      } catch (e) { }
    };
