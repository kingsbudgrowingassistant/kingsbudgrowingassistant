import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const geistSans = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const metadata: Metadata = {
  title: "Kings Bud Grow Assistant",
  description:
    "Cloud-based multi-user grow assistant with tents, lights, electricity, harvests, revenue, break-even, and director distribution tracking.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kings Bud",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Kings Bud Grow Assistant",
    description:
      "Cloud-based multi-user grow assistant with secure authentication and multi-device synchronisation.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
