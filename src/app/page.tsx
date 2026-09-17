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
import Instagram from "@mui/icons-material/Instagram";
import LocationOn from "@mui/icons-material/LocationOn";
import { useState, useEffect } from "react";
import { styles } from "./styles";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

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
          <Image
            src={imageAsset(churchConfig.assets.logo)}
            alt={`${churchConfig.name} Logo`}
            width={300}
            height={300}
            priority
            style={{ width: "min(60vw, 300px)", height: "auto" }}
          />
        </Box>
      </Fade>

      {/* Main Content */}
      <Fade in={showContent} timeout={800}>
        <Box sx={{ width: "100%" }}>
          <Box sx={styles.gradientBackground} />

          <Container maxWidth="lg" sx={styles.contentContainer}>
            <Typography variant="h1" component="h1" sx={styles.title}>
              {churchConfig.welcomeHeading}
            </Typography>

            <Typography variant="h5" sx={styles.subtitle}>
              {churchConfig.welcomeSubtitle}
            </Typography>

            {/* Cards Container - Zoom and Instagram side by side on desktop */}
            <Box sx={styles.cardsContainer}>
              {/* Worship Info Card */}
              <Card sx={styles.worshipCard}>
                <CardContent sx={styles.worshipContent}>
                  <Box sx={styles.zoomLogoContainer}>
                    <Image
                      src={imageAsset(churchConfig.assets.zoomLogo)}
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
                    {churchConfig.services.map((service) => (
                      <Box key={service.name} sx={styles.scheduleBox}>
                        <Typography variant="body1" sx={styles.scheduleItem}>
                          <strong>{service.name}</strong>
                        </Typography>
                        <Typography variant="body2" sx={styles.scheduleTime}>
                          {service.time}
                        </Typography>
                      </Box>
                    ))}

                    <Box sx={styles.zoomInfoBox}>
                      <Box sx={styles.zoomInfoText}>
                        <Typography variant="body2" sx={styles.zoomInfo}>
                          Zoom ID: <strong>{churchConfig.zoom.id}</strong>
                        </Typography>
                        <Typography variant="body2" sx={styles.zoomInfo}>
                          Password:{" "}
                          <strong>{churchConfig.zoom.password}</strong>
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="medium"
                        href={churchConfig.zoom.url}
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
                      src={imageAsset(churchConfig.assets.logo)}
                      alt={`${churchConfig.name} Logo`}
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
                      href={churchConfig.instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={styles.followButton}
                    >
                      {churchConfig.instagram.handle}
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
                  src={churchConfig.mapsEmbedUrl}
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
