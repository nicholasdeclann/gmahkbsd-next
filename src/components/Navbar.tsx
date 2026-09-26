"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { churchConfig } from "@/config/church";
import { imageAsset } from "@/lib/asset";

const PASTOR_PHONE = "+62895337627700";
const WHATSAPP_URL = `https://wa.me/${PASTOR_PHONE}`;

function Navbar() {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isKertasAcaraPage = pathname === "/kertas-acara";
  const isPengumumanPage = pathname === "/pengumuman";
  const isUlangTahunPage = pathname === "/ulang-tahun";

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const connectDrive = async () => {
    try {
      const res = await fetch("/api/drive/auth/login");
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
      }
    } catch {
      console.error("Failed to initiate Drive auth");
    }
  };

  return (
    <AppBar position="sticky" elevation={0} sx={styles.appBar}>
      <Toolbar>
        <Box sx={styles.logoContainer} component={Link} href="/">
          <Image
            src={imageAsset(churchConfig.assets.logo)}
            alt={`${churchConfig.name} Logo`}
            width={40}
            height={40}
            priority
            style={{ objectFit: "contain" }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={styles.logo}>
              {churchConfig.shortName}
            </Typography>
            {isKertasAcaraPage && (
              <Typography variant="h6" sx={styles.subtitle}>
                Kertas Acara
              </Typography>
            )}
            {isPengumumanPage && (
              <Typography variant="h6" sx={styles.subtitle}>
                Pengumuman
              </Typography>
            )}
            {isUlangTahunPage && (
              <Typography variant="h6" sx={styles.subtitle}>
                Ulang Tahun
              </Typography>
            )}
          </Box>
        </Box>

        {/* Desktop Menu */}
        <Box sx={styles.desktopMenu}>
          <Button
            component={Link}
            href="/"
            sx={{
              ...styles.button,
              ...(pathname === "/" && styles.activeButton),
            }}
          >
            Home
          </Button>
          <Button
            component={Link}
            href="/kertas-acara"
            sx={{
              ...styles.button,
              ...(pathname === "/kertas-acara" && styles.activeButton),
            }}
          >
            Kertas Acara
          </Button>
          <Button
            component={Link}
            href="/ulang-tahun"
            sx={{
              ...styles.button,
              ...(pathname === "/ulang-tahun" && styles.activeButton),
            }}
          >
            Ulang Tahun
          </Button>
          <Button
            component={Link}
            href="/pengumuman"
            sx={{
              ...styles.button,
              ...(pathname === "/pengumuman" && styles.activeButton),
            }}
          >
            Pengumuman
          </Button>
          {/* Pastor Contact */}
          <Button
            component="a"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<WhatsAppIcon />}
            sx={{
              ...styles.button,
              background: "rgba(37, 211, 102, 0.08)",
              color: "#25D366",
              "&:hover": {
                bgcolor: "rgba(37, 211, 102, 0.15)",
                color: "#20bd60",
              },
            }}
          >
            Pastor
          </Button>
          {/* Connect Google Drive */}
          <Button
            onClick={connectDrive}
            sx={{
              ...styles.button,
              color: "#2e6ce8",
              fontWeight: 600,
              "&:hover": {
                bgcolor: "rgba(46, 108, 232, 0.1)",
                color: "#2558c0",
              },
            }}
          >
            Connect Drive
          </Button>
        </Box>

        {/* Mobile Hamburger Menu */}
        <Box sx={styles.mobileMenu}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuOpen}
            sx={styles.hamburger}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={styles.menuDropdown}
          >
            <MenuItem
              component={Link}
              href="/"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                ...(pathname === "/" && styles.activeMenuItem),
              }}
            >
              Home
            </MenuItem>
            <MenuItem
              component={Link}
              href="/kertas-acara"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                ...(pathname === "/kertas-acara" && styles.activeMenuItem),
              }}
            >
              Kertas Acara
            </MenuItem>
            <MenuItem
              component={Link}
              href="/ulang-tahun"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                ...(pathname === "/ulang-tahun" && styles.activeMenuItem),
              }}
            >
              Ulang Tahun
            </MenuItem>
            <MenuItem
              component={Link}
              href="/pengumuman"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                ...(pathname === "/pengumuman" && styles.activeMenuItem),
              }}
            >
              Pengumuman
            </MenuItem>
            {/* Pastor Contact */}
            <MenuItem
              component="a"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                color: "#25D366",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "rgba(37, 211, 102, 0.08)",
                  color: "#20bd60",
                },
              }}
            >
              <WhatsAppIcon sx={{ fontSize: "0.875rem", mr: 1 }} />
              Pastor
            </MenuItem>
            {/* Connect Google Drive */}
            <MenuItem
              onClick={() => { handleMenuClose(); connectDrive(); }}
              sx={{
                ...styles.menuItem,
                color: "#2e6ce8",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "rgba(46, 108, 232, 0.08)",
                  color: "#2558c0",
                },
              }}
            >
              Connect Drive
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;

const styles = {
  appBar: {
    background:
      "linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 40%, rgba(255, 255, 255, 0.8) 100%)",
    backdropFilter: "blur(10px)",
  },
  logoContainer: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    textDecoration: "none",
  },
  logo: {
    color: "#2e6ce8",
    fontWeight: 600,
    fontSize: { xs: "1rem", sm: "1.15rem" },
  },
  subtitle: {
    color: "#666",
    fontWeight: 400,
    fontSize: { xs: "0.85rem", sm: "0.95rem" },
  },
  desktopMenu: {
    display: { xs: "none", md: "flex" },
    gap: 1,
  },
  mobileMenu: {
    display: { xs: "flex", md: "none" },
  },
  button: {
    color: "#666",
    fontWeight: 400,
    fontSize: "0.875rem",
    textTransform: "none",
    "&:hover": {
      bgcolor: "rgba(102, 126, 234, 0.05)",
      color: "#2e6ce8",
    },
  },
  activeButton: {
    color: "#2e6ce8",
    fontWeight: 600,
    bgcolor: "rgba(46, 108, 232, 0.1)",
  },
  hamburger: {
    color: "#2e6ce8",
  },
  menuDropdown: {
    "& .MuiPaper-root": {
      bgcolor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
    },
  },
  menuItem: {
    fontSize: "0.875rem",
    color: "#666",
    "&:hover": {
      bgcolor: "rgba(102, 126, 234, 0.05)",
      color: "#2e6ce8",
    },
  },
  activeMenuItem: {
    color: "#2e6ce8",
    fontWeight: 600,
    bgcolor: "rgba(46, 108, 232, 0.1)",
  },
};
