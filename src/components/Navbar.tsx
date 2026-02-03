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
import { useState } from "react";

function Navbar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
            src="/assets/images/logo.png"
            alt="GMAHK BSD Logo"
            sx={styles.logoImage}
          />
          <Typography variant="h6" sx={styles.logo}>
            GMAHK BSD
          </Typography>
        </Box>

        {/* Desktop Menu */}
        <Box sx={styles.desktopMenu}>
          <Button component={Link} href="/" sx={styles.button}>
            Home
          </Button>
          <Button component={Link} href="/kertas-acara" sx={styles.button}>
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
              sx={styles.menuItem}
            >
              Home
            </MenuItem>
            <MenuItem
              component={Link}
              href="/kertas-acara"
              onClick={handleMenuClose}
              sx={styles.menuItem}
            >
              Kertas Acara
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
    bgcolor: "rgba(255, 255, 255, 0.8)",
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
    color: "#667eea",
    fontWeight: 600,
    fontSize: { xs: "1rem", sm: "1.15rem" },
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
      color: "#667eea",
    },
  },
  hamburger: {
    color: "#667eea",
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
      color: "#667eea",
    },
  },
};
