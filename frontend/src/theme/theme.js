import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#8686AC" }, // electric lime
    secondary: { main: "#272757" }, // hot pink
    background: {
      default: "#0F0E47",
      paper: "#272757",
    },
    success: { main: "#4BFF9C" },
    warning: { main: "#FFB347" },
    error: { main: "#FF4B6E" },
    text: {
      primary: "#bebede",
      secondary: "#fff",
    },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Geist Pixel", sans-serif', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: '"Geist Pixel", sans-serif',
          fontWeight: 700,
          letterSpacing: "0.02em",
        },
        containedPrimary: {
          color: "#fff",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      },
    },
  },
});

export default theme;
