import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Stack,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import useStore from "../store/useStore";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const setUserName = useStore((s) => s.setUserName);
  const navigate = useNavigate();

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    setUserName(trimmed);
    navigate("/events");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 60% 20%, #29332b 0%, #0F0E47 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: "fixed",
          top: -120,
          right: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(232,255,71,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          top: -10,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,75,110,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ConfirmationNumberIcon
              sx={{ fontSize: 40, color: "primary.main" }}
            />
            <Typography
              variant="h3"
              sx={{ color: "primary.main", letterSpacing: "-0.02em" }}
            >
              GetMyTix
            </Typography>
          </Stack>

          {/* Hero copy */}
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.4rem", md: "3.5rem" },
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              Tickets.
              <br />
              <Box component="span" sx={{ color: "primary.main" }}>
                Fast.
              </Box>
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 360 }}
            >
              Select events, get queued, book fast.
              <br />
              Play now to GetUrTix!
            </Typography>
          </Stack>

          {/* Form */}
          <Box
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              p: 4,
            }}
          >
            <Stack spacing={3}>
              <Typography variant="h5" textAlign="center">
                What's your name?
              </Typography>
              <TextField
                label="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                error={!!error}
                helperText={error}
                fullWidth
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": { borderColor: "primary.main" },
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStart}
                fullWidth
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                Enter Arena →
              </Button>
            </Stack>
          </Box>

          <br />

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            &#169; 2026 GetMyTix. All rights reserved. | For demo purposes only.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
