"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations } from "@/lib/translations";

export interface UserSession {
  id: string;
  phone: string;
  name: string | null;
  role: "CUSTOMER" | "OWNER" | "ADMIN";
  languagePref: string;
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

  // Initialize from localStorage and check PWA mode
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

      const bannerDismissed = localStorage.getItem("amarsaloon_banner_dismissed");
      if (bannerDismissed === "true") {
        setShowInstallBanner(false);
      }

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
      // Load guest local favorites
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
      // If iOS Safari or unsupported, show info modal or hint
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
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  };

  const triggerHaptic = (ms = 40) => {
    try {
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(ms);
      }
    } catch (e) {}
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
