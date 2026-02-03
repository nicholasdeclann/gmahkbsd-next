'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e6ce8',
    },
    secondary: {
      main: '#764ba2',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter, Inter, sans-serif)',
  },
});

export default theme;
