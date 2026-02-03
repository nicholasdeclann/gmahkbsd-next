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

          {/* Google Photos Carousel - Full Width */}
          <Box sx={styles.carouselContainer}>
            <div
              className="pa-gallery-player-widget"
              style={{ width: "100%", height: "480px", display: "none" }}
              data-link="https://photos.app.goo.gl/6X97TkgRbkRQNCXC7"
              data-title="Website Carousel · Wednesday, Dec 31, 2025 📸"
              data-description="Shared album · Tap to view!"
            >
              <object data="https://lh3.googleusercontent.com/pw/AP1GczNLsmCfxg0mM6uxB_OD3vVr5y5yOVMNZP4K0rQqwPdVdod7Zz3zN9_OBurupDufFbIZNo2mwIa52SpfyT3oB3GzVVkd7Aomuh9ywmhkcVY6UxheCVg=w1920-h1080"></object>
              <object data="https://lh3.googleusercontent.com/pw/AP1GczNVuIfytQZYbiegGjJndew4x92hP0LL0hL6HbFklYP4Oh9Vqr-gG5Ea_d5MDYTi7jUga5lxLsn3eTvdtP5RyiHYYF0e5fsrvYMGVIYcNt44RL0haeQ=w1920-h1080"></object>
              <object data="https://lh3.googleusercontent.com/pw/AP1GczMgJae4BD62OB0pPthk3JQssP8z_yelA2An8m0NpoDcKZg6ziYpzqjCkNQ7MGV1e9Mcl59ehM3w98sgUcg5fKsrCKK1qF1w4ExQo99Al7NGRBJ1KIQ=w1920-h1080"></object>
              <object data="https://lh3.googleusercontent.com/pw/AP1GczP-kyv2Fl6HclIQKsS9K8lqzWHn-GXceE0VpeBJQBhxX_S6utC4Th7UQ9y-2G3IY7dYIKUDBtu64nteGDNrNtLcHeyU4Q-nQomZ-U9JxXLkPqIqSeo=w1920-h1080"></object>
              <object data="https://lh3.googleusercontent.com/pw/AP1GczNCPwK_njVUjeRzyVJ18p82wT03GHY34KwvHTbw_Qq577fWstJpoDYviPyEnaSGYtHj5jX0_2QWxfPHNxU_VBxu-p1FdikHqsHImq2oBy6Cx-Mclq4=w1920-h1080"></object>
              <object data="https://lh3.googleusercontent.com/pw/AP1GczOzerc2aoIn22qq6_d4TWC7QGyI1dby1CPPYfR-cy8EG3N34ix9yN70W8ILKVlecvaf-8YWUGU3JIG4LfLcCIbtP33HrEXSP_XbFP2yWkd21mnpvlI=w1920-h1080"></object>
            </div>
          </Box>

          <Container maxWidth="sm" sx={styles.contentContainer}>
            <Typography variant="h1" component="h1" sx={styles.title}>
              Selamat Datang di GMAHK BSD
            </Typography>

            <Typography variant="h5" sx={styles.subtitle}>
              Bergabunglah dengan kami dalam perjalanan iman, komunitas, dan
              pelayanan.
            </Typography>

            {/* Worship Info Card */}
            <Card sx={styles.worshipCard}>
              <CardContent sx={styles.worshipContent}>
                <Box sx={styles.zoomLogoContainer}>
                  <Image
                    src="/gmahkbsd-next/assets/images/zoom-logo.png"
                    alt="Zoom Logo"
                    width={120}
                    height={120}
                    style={{ objectFit: "contain" }}
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

            {/* Instagram Feed Section */}
            <Typography variant="h4" sx={styles.instagramTitle}>
              Ikuti perjalanan kami!
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

            <Box sx={styles.instagramEmbed}>
              {/* LightWidget WIDGET */}
              <script src="https://cdn.lightwidget.com/widgets/lightwidget.js"></script>
              <iframe
                src="//lightwidget.com/widgets/bdb25f1b70a452e795ccc5a4c4993594.html"
                className="lightwidget-widget"
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              ></iframe>
            </Box>

            {/* Google Maps Section */}
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
                  width="600"
                  height="450"
                  style={{ border: 0, borderRadius: "12px" }}
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

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    bgcolor: "white",
    position: "relative",
    overflow: "hidden",
  },
  splashScreen: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "white",
    zIndex: 9999,
  },
  splashLogo: {
    width: { xs: "200px", sm: "250px", md: "300px" },
    height: "auto",
  },
  gradientBackground: {
    position: "absolute",
    top: { xs: "-20%", sm: "-30%" },
    left: "50%",
    transform: "translateX(-50%)",
    width: { xs: "150%", sm: "120%", md: "100%" },
    height: { xs: "60%", sm: "70%", md: "80%" },
    background:
      "radial-gradient(circle, rgba(46, 108, 232, 0.3) 0%, rgba(46, 108, 232, 0.2) 40%, transparent 70%)",
    borderRadius: "50%",
    filter: "blur(60px)",
    zIndex: 0,
  },
  carouselContainer: {
    width: "100%",
    mb: { xs: 6, sm: 8 },
    position: "relative",
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
    fontWeight: 700,
    color: "#2e6ce8",
    mb: { xs: 2, sm: 3 },
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.15rem" },
    color: "#4a4a4a",
    mb: { xs: 4, sm: 5 },
    px: { xs: 1, sm: 2 },
    lineHeight: 1.6,
  },
  worshipCard: {
    bgcolor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: 3,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
    width: { xs: "auto", sm: "100%" },
    maxWidth: "800px",
    mb: { xs: 6, sm: 8 },
  },
  worshipContent: {
    p: { xs: 3, sm: 4 },
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: { xs: 3, sm: 4 },
    alignItems: "center",
  },
  zoomLogoContainer: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  worshipTextContent: {
    flex: 1,
    textAlign: { xs: "left", sm: "left" },
  },
  zoomIcon: {
    fontSize: { xs: "3rem", sm: "3.5rem" },
    color: "#2e6ce8",
    mb: 2,
    display: "block",
  },
  worshipTitle: {
    fontSize: { xs: "1rem", sm: "1.1rem" },
    fontWeight: 600,
    color: "#1a1a1a",
    mb: 3,
  },
  scheduleBox: {
    mb: 2,
  },
  scheduleItem: {
    fontSize: { xs: "0.9rem", sm: "1rem" },
    color: "#1a1a1a",
    mb: 0.5,
  },
  scheduleTime: {
    fontSize: { xs: "0.85rem", sm: "0.95rem" },
    color: "#4a4a4a",
  },
  zoomInfoBox: {
    mt: 3,
    pt: 2,
    borderTop: "1px solid rgba(46, 108, 232, 0.2)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  zoomInfoText: {
    display: "flex",
    flexDirection: "column",
    gap: 0.5,
  },
  zoomInfo: {
    fontSize: { xs: "0.85rem", sm: "0.9rem" },
    color: "#2e6ce8",
    mb: 0.5,
  },
  zoomButton: {
    background: "linear-gradient(45deg, #2e6ce8, #5a8df5, #2e6ce8)",
    backgroundSize: "200% 200%",
    animation: "gradient 3s ease infinite",
    color: "white",
    py: 1,
    px: 3,
    fontSize: { xs: "0.8rem", sm: "0.85rem" },
    boxShadow: "0 4px 14px 0 rgba(46, 108, 232, 0.4)",
    textTransform: "none",
    whiteSpace: "nowrap",
    "@keyframes gradient": {
      "0%": {
        backgroundPosition: "0% 50%",
      },
      "50%": {
        backgroundPosition: "100% 50%",
      },
      "100%": {
        backgroundPosition: "0% 50%",
      },
    },
    "&:hover": {
      background: "linear-gradient(45deg, #2558c0, #4a7de6, #2558c0)",
      backgroundSize: "200% 200%",
      boxShadow: "0 6px 20px 0 rgba(46, 108, 232, 0.5)",
    },
  },
  cardsGrid: {
    width: "100%",
    mb: { xs: 6, sm: 8 },
  },
  glassCard: {
    bgcolor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: 2,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
    height: "100%",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 6px 20px 0 rgba(46, 108, 232, 0.2)",
      transform: "translateY(-4px)",
    },
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    py: 3,
  },
  cardIcon: {
    fontSize: { xs: "2rem", sm: "2.5rem" },
    color: "#2e6ce8",
    mb: 1,
  },
  cardTitle: {
    fontSize: { xs: "0.9rem", sm: "1rem" },
    fontWeight: 600,
    color: "#1a1a1a",
    mb: 0.5,
  },
  cardText: {
    fontSize: { xs: "0.75rem", sm: "0.85rem" },
    color: "#4a4a4a",
  },
  cardButton: {
    fontSize: { xs: "0.9rem", sm: "1rem" },
    fontWeight: 600,
    color: "#2e6ce8",
    textTransform: "none",
    "&:hover": {
      bgcolor: "rgba(46, 108, 232, 0.1)",
    },
  },
  followButton: {
    background: "linear-gradient(45deg, #2e6ce8, #5a8df5, #2e6ce8)",
    backgroundSize: "200% 200%",
    animation: "gradient 3s ease infinite",
    color: "white",
    py: { xs: 1.5, sm: 1.25 },
    px: { xs: 3, sm: 4 },
    fontSize: { xs: "0.9rem", sm: "0.875rem" },
    boxShadow: "0 4px 14px 0 rgba(46, 108, 232, 0.4)",
    mb: { xs: 3, sm: 4 },
    textTransform: "none",
    "@keyframes gradient": {
      "0%": {
        backgroundPosition: "0% 50%",
      },
      "50%": {
        backgroundPosition: "100% 50%",
      },
      "100%": {
        backgroundPosition: "0% 50%",
      },
    },
    "&:hover": {
      background: "linear-gradient(45deg, #2558c0, #4a7de6, #2558c0)",
      backgroundSize: "200% 200%",
      boxShadow: "0 6px 20px 0 rgba(46, 108, 232, 0.5)",
    },
  },
  buttonStack: {
    justifyContent: "center",
    flexWrap: "wrap",
  },
  containedButton: {
    bgcolor: "#2e6ce8",
    color: "white",
    py: { xs: 1.5, sm: 1.25 },
    fontSize: { xs: "0.9rem", sm: "0.875rem" },
    boxShadow: "0 4px 14px 0 rgba(46, 108, 232, 0.4)",
    "&:hover": {
      bgcolor: "#2558c0",
      boxShadow: "0 6px 20px 0 rgba(46, 108, 232, 0.5)",
    },
  },
  outlinedButton: {
    borderColor: "#2e6ce8",
    color: "#2e6ce8",
    py: { xs: 1.5, sm: 1.25 },
    fontSize: { xs: "0.9rem", sm: "0.875rem" },
    borderWidth: 2,
    "&:hover": {
      borderColor: "#2558c0",
      borderWidth: 2,
      bgcolor: "rgba(46, 108, 232, 0.05)",
    },
  },
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
  instagramTitle: {
    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    mb: { xs: 2, sm: 3 },
  },
  instagramSubtitle: {
    fontSize: { xs: "0.9rem", sm: "1rem" },
    color: "#2e6ce8",
    fontWeight: 600,
    mb: 3,
  },
  instagramEmbed: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    borderRadius: 3,
    overflow: "hidden",
    mb: { xs: 6, sm: 8 },
  },
  mapSection: {
    width: "100%",
    mb: { xs: 6, sm: 8 },
  },
  mapTitleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    mb: 3,
  },
  mapIcon: {
    fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
    color: "#2e6ce8",
  },
  mapTitle: {
    fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    textAlign: "center",
  },
  mapContainer: {
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    borderRadius: 3,
    overflow: "hidden",
    boxShadow: "0 4px 16px 0 rgba(46, 108, 232, 0.1)",
  },
};
