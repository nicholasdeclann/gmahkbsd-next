import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import Navbar from "@/components/Navbar";
import "./globals.css";
import { Box, Typography } from "@mui/material";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GMAHK BSD",
  description: "A simple homepage built with Next.js and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar />
            {children}
            <Box component="footer" sx={styles.footer}>
              <Typography variant="body2" sx={styles.footerText}>
                &copy; {new Date().getFullYear()} GMAHK BSD. All rights
                reserved.
              </Typography>
            </Box>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

const styles = {
  footer: {
    py: { xs: 2.5, sm: 3 },
    px: 2,
    textAlign: "center",
    color: "#666",
    position: "relative",
    zIndex: 1,
  },
  footerText: {
    fontSize: { xs: "0.8rem", sm: "0.85rem" },
  },
};
