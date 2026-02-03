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
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function Navbar() {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isKertasAcaraPage = pathname === "/kertas-acara";
  const isPengumumanPage = pathname === "/pengumuman";

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="sticky" elevation={0} sx={styles.appBar}>
      <Toolbar>
        <Box sx={styles.logoContainer} component={Link} href="/">
          <Box
            component="img"
            src="/gmahkbsd-next/assets/images/logo.png"
            alt="GMAHK BSD Logo"
            sx={styles.logoImage}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={styles.logo}>
              GMAHK BSD
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
            href="/pengumuman"
            sx={{
              ...styles.button,
              ...(pathname === "/pengumuman" && styles.activeButton),
            }}
          >
            Pengumuman
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
              href="/pengumuman"
              onClick={handleMenuClose}
              sx={{
                ...styles.menuItem,
                ...(pathname === "/pengumuman" && styles.activeMenuItem),
              }}
            >
              Pengumuman
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
  logoImage: {
    width: 40,
    height: 40,
    objectFit: "contain",
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
