"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Language, translations } from "@/lib/translations";
import {
  requestNotificationPermission,
  sendBrowserNotification,
  playNotificationChime,
  triggerDeviceHaptic,
  hasNotificationPermission,
} from "@/lib/notifications";

export interface UserSession {
  id: string;
  phone: string;
  name: string | null;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
  languagePref: string;
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  url?: string;
  type: "OWNER_NEW_BOOKING" | "USER_TURN_READY" | "INFO";
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (typeof translations)["bn"];
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
  activeSalonId: string | null;
  setActiveSalonId: (id: string | null) => void;
  favorites: string[];
  toggleFavorite: (salonId: string) => Promise<boolean>;
  isPwaInstalled: boolean;
  canInstallPwa: boolean;
  promptPwaInstall: () => Promise<void>;
  dismissInstallBanner: () => void;
  showInstallBanner: boolean;
  playChime: () => void;
  triggerHaptic: (ms?: number) => void;
  // Live Queue Notification System
  activeBookingId: string | null;
  setActiveBookingId: (id: string | null) => void;
  notificationToast: NotificationToast | null;
  dismissNotificationToast: () => void;
  showNotificationToast: (toast: Omit<NotificationToast, "id">) => void;
  notificationsEnabled: boolean;
  requestNotifications: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("bn");
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeSalonId, setActiveSalonId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  // Notification state
  const [activeBookingId, setActiveBookingIdState] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<NotificationToast | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const prevOwnerWaitingCount = useRef<number | null>(null);

  // Initialize from localStorage and check PWA mode & notifications
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("amarsaloon_lang") as Language;
      if (savedLang && (savedLang === "bn" || savedLang === "en")) {
        setLangState(savedLang);
      }

      const savedUser = localStorage.getItem("amarsaloon_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      const savedSalon = localStorage.getItem("amarsaloon_active_salon");
      if (savedSalon) {
        setActiveSalonId(savedSalon);
      }

      const savedActiveBooking =
        localStorage.getItem("amarsaloon_active_booking_id") ||
        localStorage.getItem("amarsaloon_last_booking_id");
      if (savedActiveBooking) {
        setActiveBookingIdState(savedActiveBooking);
      }

      const bannerDismissed = localStorage.getItem("amarsaloon_banner_dismissed");
      if (bannerDismissed === "true") {
        setShowInstallBanner(false);
      }

      // Check notification permission
      setNotificationsEnabled(hasNotificationPermission());

      // Check standalone mode
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsPwaInstalled(true);
        setShowInstallBanner(false);
      }

      // Capture install prompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsPwaInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    } catch (e) {
      console.warn("Storage access restricted:", e);
    }
  }, []);

  // Set active booking ID with persistence
  const setActiveBookingId = (id: string | null) => {
    setActiveBookingIdState(id);
    try {
      if (id) {
        localStorage.setItem("amarsaloon_active_booking_id", id);
        localStorage.setItem("amarsaloon_last_booking_id", id);
      } else {
        localStorage.removeItem("amarsaloon_active_booking_id");
      }
    } catch (e) {}
  };

  // Dismiss in-app toast
  const dismissNotificationToast = () => {
    setNotificationToast(null);
  };

  // Show manual in-app toast with chime & browser push
  const showNotificationToast = (toast: Omit<NotificationToast, "id">) => {
    const id = `toast_${Date.now()}`;
    playNotificationChime(toast.type === "USER_TURN_READY" ? "urgent" : "normal");
    triggerDeviceHaptic(toast.type === "USER_TURN_READY" ? [200, 100, 200, 100, 300] : [150, 80, 150]);
    sendBrowserNotification(toast.title, {
      body: toast.message,
      url: toast.url,
    });
    setNotificationToast({ ...toast, id });
  };

  // Request system notification permission
  const requestNotifications = async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  };

  // Auto-dismiss notification toast after 10 seconds
  useEffect(() => {
    if (!notificationToast) return;
    const timer = setTimeout(() => {
      setNotificationToast(null);
    }, 10000);
    return () => clearTimeout(timer);
  }, [notificationToast]);

  // Real-time background poller: Customer Serial Available / Turn Notification
  useEffect(() => {
    if (!activeBookingId) return;

    let isMounted = true;
    const checkCustomerTurn = async () => {
      try {
        const res = await fetch(`/api/v1/bookings?id=${activeBookingId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.booking) return;

        const isCurrentTurn = Boolean(data.queueMetrics?.isCurrentTurn);
        const status = data.booking.status;

        // If completed or cancelled, clear active tracker
        if (["COMPLETED", "CANCELLED", "NO_SHOW", "SKIPPED"].includes(status)) {
          setActiveBookingId(null);
          return;
        }

        // When user's serial is available / current turn
        if (isCurrentTurn) {
          const alertedKey = `amarsaloon_alerted_${activeBookingId}`;
          const alreadyAlerted = localStorage.getItem(alertedKey) === "true";

          if (!alreadyAlerted) {
            try {
              localStorage.setItem(alertedKey, "true");
            } catch (e) {}

            playNotificationChime("urgent");
            triggerDeviceHaptic([200, 100, 200, 100, 300]);

            const title =
              lang === "bn"
                ? `🎉 আপনার সিরিয়াল এসেছে! #${data.booking.tokenNumber}`
                : `🎉 Your Turn Has Arrived! #${data.booking.tokenNumber}`;
            const message =
              lang === "bn"
                ? `${data.saloon?.nameBn || "সেলুন"} এ আপনার চেয়ার প্রস্তুত। এখনই প্রবেশ করুন!`
                : `Your chair is ready at ${data.saloon?.nameEn || "the salon"}. Please enter now!`;

            sendBrowserNotification(title, {
              body: message,
              url: `/bookings?active=${activeBookingId}`,
            });

            setNotificationToast({
              id: `user_turn_${Date.now()}`,
              title,
              message,
              url: `/bookings?active=${activeBookingId}`,
              type: "USER_TURN_READY",
            });
          }
        }
      } catch (e) {}
    };

    checkCustomerTurn();
    const interval = setInterval(checkCustomerTurn, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeBookingId, lang]);

  // Real-time background poller: Salon Owner Live Serial Notification
  useEffect(() => {
    if (user?.role !== "OWNER" || !activeSalonId) {
      prevOwnerWaitingCount.current = null;
      return;
    }

    let isMounted = true;
    const checkOwnerLiveQueue = async () => {
      try {
        const res = await fetch(`/api/v1/bookings?saloonId=${activeSalonId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.bookings) return;

        const waiting = data.waiting || [];

        // Check if a new live serial booking was placed
        if (
          prevOwnerWaitingCount.current !== null &&
          waiting.length > prevOwnerWaitingCount.current
        ) {
          const latest = waiting[waiting.length - 1];
          playNotificationChime("normal");
          triggerDeviceHaptic([150, 80, 150]);

          const title =
            lang === "bn"
              ? "🔔 নতুন কাস্টমার সিরিয়াল নিয়েছেন!"
              : "🔔 New Live Queue Booking!";
          const message =
            lang === "bn"
              ? `টোকেন #${String(latest.tokenNumber).padStart(3, "0")} (${latest.guestName}) সিরিয়ালে যুক্ত হয়েছেন।`
              : `Token #${String(latest.tokenNumber).padStart(3, "0")} (${latest.guestName}) joined the queue.`;

          sendBrowserNotification(title, {
            body: message,
            url: "/owner/dashboard",
          });

          setNotificationToast({
            id: `owner_alert_${Date.now()}`,
            title,
            message,
            url: "/owner/dashboard",
            type: "OWNER_NEW_BOOKING",
          });
        }

        prevOwnerWaitingCount.current = waiting.length;
      } catch (e) {}
    };

    checkOwnerLiveQueue();
    const interval = setInterval(checkOwnerLiveQueue, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, activeSalonId, lang]);

  // Fetch user favorites when user logs in
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/v1/favorites?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorites) {
            setFavorites(data.favorites);
          }
        })
        .catch(() => {});
    } else {
      try {
        const guestFavs = localStorage.getItem("amarsaloon_guest_favs");
        if (guestFavs) {
          setFavorites(JSON.parse(guestFavs));
        }
      } catch (e) {}
    }
  }, [user]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("amarsaloon_lang", newLang);
    } catch (e) {}
  };

  const handleSetUser = (newUser: UserSession | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem("amarsaloon_user", JSON.stringify(newUser));
      } else {
        localStorage.removeItem("amarsaloon_user");
      }
    } catch (e) {}
  };

  const handleSetActiveSalon = (id: string | null) => {
    setActiveSalonId(id);
    prevOwnerWaitingCount.current = null;
    try {
      if (id) {
        localStorage.setItem("amarsaloon_active_salon", id);
      } else {
        localStorage.removeItem("amarsaloon_active_salon");
      }
    } catch (e) {}
  };

  const logout = () => {
    handleSetUser(null);
    handleSetActiveSalon(null);
  };

  const toggleFavorite = async (salonId: string): Promise<boolean> => {
    const isFav = favorites.includes(salonId);
    const updated = isFav
      ? favorites.filter((id) => id !== salonId)
      : [...favorites, salonId];
    setFavorites(updated);

    if (user?.id) {
      try {
        await fetch("/api/v1/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, saloonId: salonId, action: isFav ? "remove" : "add" }),
        });
      } catch (e) {}
    } else {
      try {
        localStorage.setItem("amarsaloon_guest_favs", JSON.stringify(updated));
      } catch (e) {}
    }
    return !isFav;
  };

  const promptPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsPwaInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        lang === "bn"
          ? "আইফোনে ইনস্টল করতে সাফারি ব্রাউজারের নিচে 'Share' বাটনে ক্লিক করে 'Add to Home Screen' বেছে নিন।"
          : "To install on iOS, tap the Share icon in Safari and select 'Add to Home Screen'."
      );
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem("amarsaloon_banner_dismissed", "true");
    } catch (e) {}
  };

  const playChime = () => {
    playNotificationChime("normal");
  };

  const triggerHaptic = (ms = 40) => {
    triggerDeviceHaptic(ms);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        user,
        setUser: handleSetUser,
        logout,
        activeSalonId,
        setActiveSalonId: handleSetActiveSalon,
        favorites,
        toggleFavorite,
        isPwaInstalled,
        canInstallPwa: !!deferredPrompt,
        promptPwaInstall,
        dismissInstallBanner,
        showInstallBanner: showInstallBanner && !isPwaInstalled,
        playChime,
        triggerHaptic,
        activeBookingId,
        setActiveBookingId,
        notificationToast,
        dismissNotificationToast,
        showNotificationToast,
        notificationsEnabled,
        requestNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
