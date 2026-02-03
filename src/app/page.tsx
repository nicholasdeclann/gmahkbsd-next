import { Box, Container, Typography, Button, Stack } from "@mui/material";
import { Description, GitHub } from "@mui/icons-material";

function Home() {
  return (
    <Box sx={styles.mainContainer}>
      {/* Glass circle gradient background */}
      <Box sx={styles.gradientBackground} />

      <Container maxWidth="sm" sx={styles.contentContainer}>
        <Box sx={styles.glassCard}>
          <Typography variant="h1" component="h1" sx={styles.title}>
            Welcome
          </Typography>

          <Typography variant="h5" sx={styles.subtitle}>
            A simple, modern homepage built with Next.js and TypeScript
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={styles.buttonStack}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<Description />}
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              sx={styles.containedButton}
            >
              Documentation
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<GitHub />}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              sx={styles.outlinedButton}
            >
              GitHub
            </Button>
          </Stack>
        </Box>
      </Container>

      <Box component="footer" sx={styles.footer}>
        <Typography variant="body2" sx={styles.footerText}>
          Built with Next.js 15, TypeScript & Material-UI
        </Typography>
      </Box>
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
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    px: { xs: 3, sm: 4 },
    py: { xs: 6, sm: 8 },
    position: "relative",
    zIndex: 1,
  },
  glassCard: {
    bgcolor: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(10px)",
    borderRadius: 4,
    border: "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: "0 8px 32px 0 rgba(46, 108, 232, 0.15)",
    p: { xs: 4, sm: 5 },
    width: "100%",
  },
  title: {
    fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
    fontWeight: 700,
    color: "#1a1a1a",
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
  buttonStack: {
    width: { xs: "100%", sm: "auto" },
  },
  containedButton: {
    bgcolor: "#667eea",
    color: "white",
    py: { xs: 1.5, sm: 1.25 },
    fontSize: { xs: "0.9rem", sm: "0.875rem" },
    boxShadow: "0 4px 14px 0 rgba(102, 126, 234, 0.4)",
    "&:hover": {
      bgcolor: "#5568d3",
      boxShadow: "0 6px 20px 0 rgba(102, 126, 234, 0.5)",
    },
  },
  outlinedButton: {
    borderColor: "#667eea",
    color: "#667eea",
    py: { xs: 1.5, sm: 1.25 },
    fontSize: { xs: "0.9rem", sm: "0.875rem" },
    borderWidth: 2,
    "&:hover": {
      borderColor: "#5568d3",
      borderWidth: 2,
      bgcolor: "rgba(102, 126, 234, 0.05)",
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
};
