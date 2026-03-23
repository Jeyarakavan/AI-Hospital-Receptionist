import { createTheme } from '@mui/material/styles';

// Get full default theme (includes all 25 shadow entries required by MUI)
const defaultTheme = createTheme();

// Define a professional and calming color palette for the healthcare setting
const palette = {
  primary: {
    main: '#007A7C', // A deep teal for a trustworthy and professional feel
    light: '#E0F2F2', // A very light teal for backgrounds and highlights
    dark: '#005A5B',
  },
  secondary: {
    main: '#FFB700', // A warm amber for secondary actions and highlights
    contrastText: '#000000',
  },
  error: {
    main: '#D32F2F', // Standard error color
  },
  warning: {
    main: '#FFA000', // Standard warning color
  },
  info: {
    main: '#1976D2', // Standard info color
  },
  success: {
    main: '#388E3C', // Standard success color
  },
  background: {
    default: '#F4F7F6', // An off-white, slightly cool grey for the main background
    paper: '#FFFFFF',   // Pure white for cards and surfaces
  },
  text: {
    primary: '#1A2027',   // A dark, near-black for primary text
    secondary: '#52616B', // A softer grey for secondary text
    disabled: '#A0AEC0',
  },
  grey: {
    50: '#F9FAFB',
    100: '#F4F7F6',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A2027',
    900: '#111827',
  },
};

// Create the theme instance
const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem', // 40px
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem', // 32px
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem', // 28px
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem', // 24px
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem', // 20px
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem', // 18px
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem', // 16px
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem', // 16px
    },
    body2: {
      fontSize: '0.875rem', // 14px
    },
    button: {
      textTransform: 'none', // Buttons with normal casing
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // A softer, modern border radius
  },
  spacing: 8, // Base spacing unit
  shadows: defaultTheme.shadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: palette.primary.dark,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 6px 25px rgba(0, 0, 0, 0.08)',
          }
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${palette.grey[200]}`,
        },
      },
    },
    MuiDrawer: {
        styleOverrides: {
            paper: {
                borderRight: 'none',
            }
        }
    },
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                },
            },
        },
    },
    MuiCssBaseline: {
      styleOverrides: `
        body {
          scrollbar-width: thin;
          scrollbar-color: ${palette.grey[400]} ${palette.grey[100]};
        }
        
        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        *::-webkit-scrollbar-track {
          background: ${palette.grey[100]};
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: ${palette.grey[300]};
          border-radius: 10px;
          border: 2px solid ${palette.grey[100]};
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background-color: ${palette.grey[400]};
        }
      `,
    },
  },
});

export default theme;