import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Vibrant color palette
const vibrantColors = {
  electricBlue: '#0066FF',
  skyBlue: '#00D4FF',
  vibrantPurple: '#C026D3',
  hotPink: '#EC4899',
  boldGreen: '#10B981',
  emerald: '#059669',
  energeticOrange: '#F59E0B',
  amber: '#D97706',
  strikingRed: '#EF4444',
  crimson: '#DC2626',
};

// Gradient definitions
const gradients = {
  primary: `linear-gradient(135deg, ${vibrantColors.electricBlue} 0%, ${vibrantColors.skyBlue} 100%)`,
  secondary: `linear-gradient(135deg, ${vibrantColors.vibrantPurple} 0%, ${vibrantColors.hotPink} 100%)`,
  success: `linear-gradient(135deg, ${vibrantColors.emerald} 0%, ${vibrantColors.boldGreen} 100%)`,
  warning: `linear-gradient(135deg, ${vibrantColors.amber} 0%, ${vibrantColors.energeticOrange} 100%)`,
  error: `linear-gradient(135deg, ${vibrantColors.crimson} 0%, ${vibrantColors.strikingRed} 100%)`,
  rainbow: `linear-gradient(135deg, ${vibrantColors.electricBlue} 0%, ${vibrantColors.vibrantPurple} 50%, ${vibrantColors.hotPink} 100%)`,
};

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette - Vibrant
          primary: {
            main: vibrantColors.electricBlue,
            light: vibrantColors.skyBlue,
            dark: '#0052CC',
          },
          secondary: {
            main: vibrantColors.vibrantPurple,
            light: vibrantColors.hotPink,
            dark: '#A21CAF',
          },
          success: {
            main: vibrantColors.boldGreen,
            light: '#34D399',
            dark: vibrantColors.emerald,
          },
          warning: {
            main: vibrantColors.energeticOrange,
            light: '#FCD34D',
            dark: vibrantColors.amber,
          },
          error: {
            main: vibrantColors.strikingRed,
            light: '#FCA5A5',
            dark: vibrantColors.crimson,
          },
          background: {
            default: '#F8FAFC',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1E293B',
            secondary: '#64748B',
          },
        }
      : {
          // Dark mode palette - Vibrant
          primary: {
            main: vibrantColors.skyBlue,
            light: '#33E0FF',
            dark: vibrantColors.electricBlue,
          },
          secondary: {
            main: vibrantColors.hotPink,
            light: '#F472B6',
            dark: vibrantColors.vibrantPurple,
          },
          success: {
            main: vibrantColors.boldGreen,
            light: '#34D399',
            dark: vibrantColors.emerald,
          },
          warning: {
            main: vibrantColors.energeticOrange,
            light: '#FCD34D',
            dark: vibrantColors.amber,
          },
          error: {
            main: vibrantColors.strikingRed,
            light: '#FCA5A5',
            dark: vibrantColors.crimson,
          },
          background: {
            default: '#0F172A',
            paper: '#1E293B',
          },
          text: {
            primary: '#F1F5F9',
            secondary: '#94A3B8',
          },
        }),
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          },
        },
        containedPrimary: {
          background: gradients.primary,
          '&:hover': {
            background: gradients.primary,
            boxShadow: `0 8px 24px ${vibrantColors.electricBlue}40`,
          },
        },
        containedSecondary: {
          background: gradients.secondary,
          '&:hover': {
            background: gradients.secondary,
            boxShadow: `0 8px 24px ${vibrantColors.vibrantPurple}40`,
          },
        },
        containedSuccess: {
          background: gradients.success,
          '&:hover': {
            background: gradients.success,
            boxShadow: `0 8px 24px ${vibrantColors.boldGreen}40`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        filled: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'rgba(0, 102, 255, 0.08)',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            transition: 'all 0.3s ease',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-thumb': {
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 0 0 8px rgba(0, 102, 255, 0.16)',
            },
          },
          '& .MuiSlider-track': {
            background: gradients.primary,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: vibrantColors.electricBlue,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme(getDesignTokens(mode));
};

// Export gradients for use in components
export { gradients, vibrantColors };
