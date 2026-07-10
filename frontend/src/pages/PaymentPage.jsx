import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Paper,
  TextField,
  Divider,
  Chip,
  CircularProgress,
  LinearProgress,
  InputAdornment,
  Alert,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { createBooking, extendCheckoutLocks } from "../api/client";
import useStore from "../store/useStore";

// Fake card number formatter
const formatCard = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (val) => {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
};

// Processing steps shown during fake payment
const PROCESSING_STEPS = [
  "Connecting to payment gateway…",
  "Verifying card details…",
  "Reserving your seats…",
  "Confirming booking…",
  "Almost done…",
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const userName = useStore((s) => s.userName);
  const selectedEvent = useStore((s) => s.selectedEvent);
  const queueEntry = useStore((s) => s.queueEntry);
  const pendingSeats = useStore((s) => s.pendingSeats); // seats user selected
  const setBookingResult = useStore((s) => s.setBookingResult);

  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState(userName || "");
  const [errors, setErrors] = useState({});

  // Payment processing state
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [apiError, setApiError] = useState(null);

  // Guards
  useEffect(() => {
    if (!userName) {
      navigate("/");
      return;
    }
    if (!selectedEvent) {
      navigate("/events");
      return;
    }
    if (!pendingSeats || pendingSeats.length === 0) {
      navigate("/seats");
      return;
    }
  }, []);

  const validate = () => {
    const e = {};
    if (card.replace(/\s/g, "").length < 16)
      e.card = "Enter a valid 16-digit card number";
    if (expiry.length < 5) e.expiry = "Enter expiry as MM/YY";
    if (cvv.length < 3) e.cvv = "Enter 3-digit CVV";
    if (!name.trim()) e.name = "Enter cardholder name";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setProcessing(true);
    setApiError(null);

    // Animate through processing steps
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setStep(i);
      setProgress(((i + 1) / PROCESSING_STEPS.length) * 100);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 300));
    }

    // Now hit the real booking API
    try {
      const seatSelections = pendingSeats.map((s) => ({
        seatId: s.id,
        version: s.version,
      }));

      const result = await createBooking({
        eventId: selectedEvent.id,
        userName,
        queueEntryId: queueEntry?.id ?? 1,
        seats: seatSelections,
      });

      setBookingResult(result);
      navigate("/success");
    } catch (err) {
      setProcessing(false);
      setProgress(0);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 409) {
        setApiError(
          "One of your seats was just taken by another user. Please go back and reselect.",
        );
      } else {
        setApiError(detail || "Payment failed. Please try again.");
      }
    }
  };

  const seatLabels = pendingSeats?.map((s) => s.seatLabel).join(", ") ?? "";
  const seatCount = pendingSeats?.length ?? 0;
  const fakePrice = seatCount * 1499; // ₹1499 per seat

  // compute remaining seconds using pendingSeats[0].lockedUntil
  const lockedUntil = pendingSeats?.[0]?.lockedUntil
    ? new Date(pendingSeats[0].lockedUntil)
    : null;
  const [remaining, setRemaining] = useState(
    lockedUntil
      ? Math.max(0, Math.floor((lockedUntil - Date.now()) / 1000))
      : 0,
  );

  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      const sec = Math.max(
        0,
        Math.floor((new Date(pendingSeats[0].lockedUntil) - Date.now()) / 1000),
      );
      setRemaining(sec);
      if (sec <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [pendingSeats]);

  // optional: call extendCheckoutLocks on user activity
  const extend = async () => {
    await extendCheckoutLocks(
      pendingSeats.map((s) => s.id),
      userName,
    );
  };

  // ── Processing overlay ────────────────────────────────────────────────────
  if (processing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="xs">
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              border: "1px solid rgba(232,255,71,0.2)",
            }}
          >
            <Stack spacing={3} alignItems="center">
              <CircularProgress color="primary" size={56} thickness={4} />
              <Stack spacing={0.5}>
                <Typography variant="h6">Processing Payment</Typography>
                <Typography variant="body2" color="text.secondary">
                  {PROCESSING_STEPS[step]}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                color="primary"
                sx={{ width: "100%", height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary">
                Do not close this window
              </Typography>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Nav */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          px: { xs: 2, md: 6 },
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <ConfirmationNumberIcon sx={{ color: "primary.main" }} />
        <Typography
          variant="h6"
          sx={{
            color: "primary.main",
            fontFamily: '"Geist Pixel", sans-serif',
          }}
        >
          GetMyTix
        </Typography>
        <Box sx={{ flex: 1 }} />
        <LockIcon sx={{ fontSize: 16, color: "success.main" }} />
        <Typography variant="caption" color="success.main">
          Secure Checkout
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ py: 5 }}>
        {apiError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setApiError(null)}
          >
            {apiError}
            {apiError.includes("reselect") && (
              <Button
                size="small"
                sx={{ ml: 2 }}
                onClick={() => navigate("/seats")}
              >
                Go Back
              </Button>
            )}
          </Alert>
        )}

        {/* Order summary */}
        <Paper sx={{ p: 3, mb: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ letterSpacing: "0.12em" }}
          >
            Order Summary
          </Typography>
          <Stack spacing={1.5} mt={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {selectedEvent?.name}
              </Typography>
              <Chip
                label={selectedEvent?.venue}
                size="small"
                variant="outlined"
              />
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <EventSeatIcon sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography variant="body2">
                  Seats: <strong>{seatLabels}</strong>
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {seatCount} × ₹1,499
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>
                Total
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={700}
                color="primary.main"
              >
                ₹{fakePrice.toLocaleString("en-IN")}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Payment form */}
        <Paper sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
          <Stack spacing={2.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6">Payment Details</Typography>
              <Stack direction="row" spacing={0.5}>
                {["VISA", "MC", "AMEX"].map((b) => (
                  <Box
                    key={b}
                    sx={{
                      px: 1,
                      py: 0.3,
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 1,
                      fontSize: "0.6rem",
                      color: "text.secondary",
                      fontWeight: 700,
                    }}
                  >
                    {b}
                  </Box>
                ))}
              </Stack>
            </Stack>

            <TextField
              label="Card Number"
              value={card}
              onChange={(e) => setCard(formatCard(e.target.value))}
              error={!!errors.card}
              helperText={errors.card}
              placeholder="1234 5678 9012 3456"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCardIcon
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Expiry"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                error={!!errors.expiry}
                helperText={errors.expiry}
                placeholder="MM/YY"
                fullWidth
              />
              <TextField
                label="CVV"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))
                }
                error={!!errors.cvv}
                helperText={errors.cvv}
                placeholder="123"
                fullWidth
                type="password"
              />
            </Stack>

            <TextField
              label="Cardholder Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="Name on card"
              fullWidth
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handlePay}
              sx={{ py: 1.8, fontSize: "1.05rem" }}
              startIcon={<LockIcon sx={{ color: "#0A0A0F" }} />}
            >
              Pay ₹{fakePrice.toLocaleString("en-IN")}
            </Button>

            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={0.5}
            >
              <LockIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                256-bit SSL encrypted · Your card is never stored
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Demo hint */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: "rgba(232,255,71,0.05)",
            borderRadius: 1.5,
            border: "1px dashed rgba(232,255,71,0.2)",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            textAlign="center"
          >
            💡 Demo mode — any card details work. Payment always succeeds.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
