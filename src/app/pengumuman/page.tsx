import { Box } from "@mui/material";
import { churchConfig } from "@/config/church";

export default function Pengumuman() {
  return (
    <Box sx={styles.mainContainer}>
      {/* Canva Carousel - Full Width */}
      <Box sx={styles.canvaContainer}>
        <Box sx={styles.aspectBox}>
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
            src={churchConfig.pengumumanEmbedUrl}
            allowFullScreen
            allow="fullscreen"
          />
        </Box>
      </Box>
    </Box>
  );
}

const styles = {
  mainContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    bgcolor: "white",
    position: "relative",
    overflow: "hidden",
    animation: "pengumumanFadeIn 0.8s ease",
    "@keyframes pengumumanFadeIn": {
      from: { opacity: 0, transform: "scale(0.98)" },
      to: { opacity: 1, transform: "scale(1)" },
    },
  },
  canvaContainer: {
    width: "100%",
    mb: { xs: 4, sm: 6 },
  },
  aspectBox: {
    position: "relative",
    width: "100%",
    height: 0,
    paddingTop: "56.25%",
    boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)",
    overflow: "hidden",
  },
};
