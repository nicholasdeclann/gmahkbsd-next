"use client";

import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Fade,
} from "@mui/material";
import Image from "next/image";
import { Instagram, LocationOn } from "@mui/icons-material";
import Script from "next/script";
import { useState, useEffect } from "react";
import { styles } from "./styles";

function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if splash has been shown in this session
    const hasShownSplash = sessionStorage.getItem("hasShownSplash");

    if (!hasShownSplash) {
      // First time in this session, show splash
      setShowSplash(true);
      sessionStorage.setItem("hasShownSplash", "true");

      // Show logo for 1.5 seconds
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
        // Start showing content after logo fades out
        setTimeout(() => {
          setShowContent(true);
        }, 400); // Wait for fade out to complete
      }, 1500);

      return () => clearTimeout(splashTimer);
    } else {
      // Already shown in this session, skip splash
      setShowContent(true);
    }
  }, []);

  return (
    <Box sx={styles.mainContainer}>
      {/* Splash Screen */}
      <Fade in={showSplash} timeout={400}>
        <Box sx={styles.splashScreen}>
          <Box
            component="img"
            src="/gmahkbsd-next/assets/images/logo.png"
            alt="GMAHK BSD Logo"
            sx={styles.splashLogo}
          />
        </Box>
      </Fade>

      {/* Main Content */}
      <Fade in={showContent} timeout={800}>
        <Box sx={{ width: "100%" }}>
          <Box sx={styles.gradientBackground} />

          {/* PublicAlbum Script */}
          <Script
            src="https://cdn.jsdelivr.net/npm/publicalbum@latest/embed-ui.min.js"
            strategy="afterInteractive"
          />

          <Container maxWidth="lg" sx={styles.contentContainer}>
            <Typography variant="h1" component="h1" sx={styles.title}>
              Selamat Datang di GMAHK BSD
            </Typography>

            <Typography variant="h5" sx={styles.subtitle}>
              Bergabunglah dengan kami dalam perjalanan iman, komunitas, dan
              pelayanan.
            </Typography>

            {/* Cards Container - Zoom and Instagram side by side on desktop */}
            <Box sx={styles.cardsContainer}>
              {/* Worship Info Card */}
              <Card sx={styles.worshipCard}>
                <CardContent sx={styles.worshipContent}>
                  <Box sx={styles.zoomLogoContainer}>
                    <Image
                      src="/gmahkbsd-next/assets/images/zoom-logo.png"
                      alt="Zoom Logo"
                      width={120}
                      height={120}
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </Box>
                  <Box sx={styles.worshipTextContent}>
                    <Box sx={styles.scheduleBox}>
                      <Typography variant="body1" sx={styles.scheduleItem}>
                        <strong>Rabu Malam & Vesper (Online)</strong>
                      </Typography>
                      <Typography variant="body2" sx={styles.scheduleTime}>
                        07.00 WIB
                      </Typography>
                    </Box>

                    <Box sx={styles.scheduleBox}>
                      <Typography variant="body1" sx={styles.scheduleItem}>
                        <strong>Kebaktian Sabat (Hybrid)</strong>
                      </Typography>
                      <Typography variant="body2" sx={styles.scheduleTime}>
                        09.00 WIB
                      </Typography>
                    </Box>

                    <Box sx={styles.zoomInfoBox}>
                      <Box sx={styles.zoomInfoText}>
                        <Typography variant="body2" sx={styles.zoomInfo}>
                          Zoom ID: <strong>987 654 1988</strong>
                        </Typography>
                        <Typography variant="body2" sx={styles.zoomInfo}>
                          Password: <strong>1988</strong>
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="medium"
                        href="https://us02web.zoom.us/j/9876541988?pwd=L21vRW5sV3RpZmI3d2lHOVNUWGJldz09"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={styles.zoomButton}
                      >
                        Zoom Meeting
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Instagram Profile Card */}
              <Card sx={styles.instagramCard}>
                <CardContent sx={styles.instagramCardContent}>
                  <Box sx={styles.instagramProfilePicture}>
                    <Image
                      src="/gmahkbsd-next/assets/images/logo.png"
                      alt="GMAHK BSD Logo"
                      width={100}
                      height={100}
                      style={{
                        objectFit: "contain",
                        borderRadius: "50%",
                      }}
                    />
                  </Box>
                  <Box sx={styles.instagramTextContent}>
                    <Typography variant="h4" sx={styles.instagramTitle}>
                      Ikuti perjalanan kami!
                    </Typography>
                    <Typography variant="body2" sx={styles.instagramSubtext}>
                      Dapatkan update terbaru tentang kebaktian, acara, dan
                      kegiatan komunitas kami
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Instagram />}
                      href="https://www.instagram.com/gmahkbsd/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={styles.followButton}
                    >
                      @gmahkbsd
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Container>

          {/* Google Maps Section - Outside Container for full width */}
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={styles.mapSection}>
              <Box sx={styles.mapTitleContainer}>
                <LocationOn sx={styles.mapIcon} />
                <Typography variant="h4" sx={styles.mapTitle}>
                  Temukan Kami
                </Typography>
              </Box>
              <Box sx={styles.mapContainer}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d540.1432901599097!2d106.68286777096924!3d-6.303682256829734!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69e52cb2eef9f1%3A0xec9eb7343cb6b8cd!2sGMAHK%20Bumi%20Serpong%20Damai!5e0!3m2!1sen!2sid!4v1770132548503!5m2!1sen!2sid"
                  style={{
                    border: 0,
                    borderRadius: "12px",
                    width: "100%",
                    height: "450px",
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </Box>
            </Box>
          </Container>
        </Box>
      </Fade>
    </Box>
  );
}

export default Home;
