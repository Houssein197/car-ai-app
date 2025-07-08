import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a237e', // deep blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#ffd700', // gold
      contrastText: '#1a237e',
    },
    background: {
      default: '#f4f6fb',
      paper: '#fff',
    },
    success: {
      main: '#22c55e',
    },
    error: {
      main: '#e53935',
    },
  },
  typography: {
    fontFamily: [
      'Poppins',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 800, letterSpacing: '-1px' },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 18,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px 0 rgba(26,35,126,0.08)',
          transition: 'all 0.2s',
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #ffd700 0%, #fffde4 100%)',
          color: '#1a237e',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 8px 32px 0 rgba(26,35,126,0.10)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #1a237e 0%, #3949ab 100%)',
          boxShadow: '0 4px 24px 0 rgba(26,35,126,0.10)',
        },
      },
    },
  },
});

export default theme; 