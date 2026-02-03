import { Box, Container, Typography, CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <Box sx={styles.mainContainer}>
      <Box sx={styles.gradientBackground} />

      <Container maxWidth="md" sx={styles.contentContainer}>
        <Box sx={styles.header}>
          <Typography variant="h1" sx={styles.title}>
            Kertas Acara GMAHK BSD
          </Typography>

          <Box sx={styles.loadingBox}>
            <CircularProgress size={40} sx={styles.spinner} />
            <Typography sx={styles.loadingText}>
              Memuat jadwal...
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

const styles = {
  mainContainer: {
    minHeight: "calc(100vh - 64px)",
    bgcolor: "white",
    position: "relative",
    overflow: "hidden",
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
  contentContainer: {
    py: { xs: 3, md: 5 },
    px: 3,
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    mb: { xs: 3, md: 4 },
  },
  title: {
    fontSize: { xs: "1.5rem", sm: "1.75rem" },
    fontWeight: 700,
    color: "#1a1a1a",
    mb: 3,
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    py: 8,
  },
  spinner: {
    color: "#2e6ce8",
  },
  loadingText: {
    fontSize: "0.95rem",
    color: "#6c757d",
  },
};
