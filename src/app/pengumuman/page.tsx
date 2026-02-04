"use client";

import { Box, Container, Typography, Grow } from "@mui/material";
import { useState, useEffect } from "react";

function Pengumuman() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger the animation after component mounts
    setShow(true);
  }, []);

  return (
    <Box sx={styles.mainContainer}>
      <Box sx={styles.gradientBackground} />

      {/* Canva Carousel - Full Width */}
      <Grow in={show} timeout={800} style={{ transformOrigin: "center center" }}>
        <Box sx={styles.canvaContainer}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 0,
              paddingTop: "56.25%",
              paddingBottom: 0,
              boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
              overflow: "hidden",
              borderRadius: 0,
              willChange: "transform",
            }}
          >
            <iframe
              loading="lazy"
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                top: 0,
                left: 0,
                border: "none",
                padding: 0,
                margin: 0,
              }}
              src="https://www.canva.com/design/DAG-9nAgcSE/Ri8PyLxmRovXS8iWkST9aQ/view?embed"
              allowFullScreen
              allow="fullscreen"
            />
          </Box>
        </Box>
      </Grow>
    </Box>
  );
}

export default Pengumuman;

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    bgcolor: "white",
    position: "relative",
    overflow: "hidden",
  },
  gradientBackground: {
    display: "none",
  },
  canvaContainer: {
    width: "100%",
    mb: { xs: 4, sm: 6 },
  },
  contentContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    px: { xs: 3, sm: 4 },
    py: { xs: 4, sm: 6 },
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    mb: { xs: 2, sm: 3 },
    lineHeight: 1.2,
  },
  description: {
    fontSize: { xs: "0.95rem", sm: "1.05rem" },
    color: "#4a4a4a",
    maxWidth: "600px",
    lineHeight: 1.6,
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
};
