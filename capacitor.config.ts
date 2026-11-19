import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.amarsalon.app",
  appName: "AmarSalon (আমার সেলুন)",
  webDir: "public",
  server: {
    url: "https://www.amarsalon.xyz",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0F534F",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0F534F",
    },
  },
};

export default config;
