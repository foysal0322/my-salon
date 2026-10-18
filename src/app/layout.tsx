import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "আমার সেলুন (AmarSaloon) — স্মার্ট সেলুন বুকিং ও লাইভ সিরিয়াল",
  description:
    "বাংলাদেশের সেরা সেলুন ও বিউটি পার্লার খুঁজুন, রিয়েল-টাইম চেয়ারের অবস্থা দেখুন এবং ঘরে বসেই লাইভ সিরিয়াল নিন।",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "আমার সেলুন",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${hindSiliguri.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-[#FAF9F6] text-[#0F172A]"
        style={{
          fontFamily:
            "var(--font-hind-siliguri), var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
