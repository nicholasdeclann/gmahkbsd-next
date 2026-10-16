import LanguageProvider from "@/components/LanguageProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import SiteProvider from "@/components/SiteProvider";
import "./globals.css";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: churchConfig.name,
  description: churchConfig.description,
  icons: {
    icon: { url: imageAsset(churchConfig.assets.logo), type: "image/png" },
    apple: imageAsset(churchConfig.assets.logo),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} ${inter.variable}`}>
        <AppRouterCacheProvider>
          <LanguageProvider><SiteProvider>{children}</SiteProvider></LanguageProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
