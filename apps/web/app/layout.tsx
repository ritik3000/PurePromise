import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Appbar } from "@/components/Appbar";
import { Providers } from "@/components/providers/Providers";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "PurePromise - AI Couple Photos",
  description:
    "Create stunning couple photos with AI. Upload a photo, choose a romantic scene, and get beautiful couple portraits in seconds.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <GoogleAnalytics />
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Appbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
