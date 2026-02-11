import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MobileNav } from "@/components/layout/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GTATweet",
  description: "A private social network",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GTATweet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black text-black dark:text-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="min-h-screen flex w-full pb-20 md:pb-0">
            <Sidebar />
            <main className="flex-1 ml-20 md:ml-64 border-r border-gray-200 dark:border-gray-800 min-h-screen">
              {children}
            </main>
            <RightSidebar />
            <MobileNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
