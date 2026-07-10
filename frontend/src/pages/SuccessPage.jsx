import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Paper,
  Chip,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import QueueIcon from "@mui/icons-material/Queue";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { format } from "date-fns";
import useStore from "../store/useStore";

export default function SuccessPage() {
  const navigate = useNavigate();
  const bookingResult = useStore((s) => s.bookingResult);
  const reset = useStore((s) => s.reset);

  useEffect(() => {
    if (!bookingResult) navigate("/");
  }, [bookingResult, navigate]);

  if (!bookingResult) return null;

  const handleBookAgain = () => {
    reset();
    navigate("/");
  };

  const handleTryAgain = async () => {
    await fetch("/api/admin/reset-seats", { method: "POST" });
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 40% 30%, #505081 0%, #272757 60%)",
        px: 2,
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(90, 75, 255, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={1}>
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
          </Stack>

          {/* Success icon */}
          <Stack spacing={1} alignItems="center" textAlign="center">
            <CheckCircleIcon sx={{ fontSize: 72, color: "success.main" }} />
            <Typography variant="h3" sx={{ color: "success.main" }}>
              Booking Confirmed!
            </Typography>
            <Typography color="text.secondary">
              Your tickets are locked in. See you there,{" "}
              <strong style={{ color: "#F0F0F8" }}>
                {bookingResult.userName}
              </strong>
              !
            </Typography>
          </Stack>

          {/* Booking card */}
          <Paper
            sx={{
              width: "100%",
              p: 4,
              border: "1px solid rgba(153, 75, 255, 0.61)",
              background: "linear-gradient(135deg, #28284d 0%, #1d1d49 100%)",
            }}
          >
            <Stack spacing={3}>
              {/* Event info */}
              <Stack spacing={0.5}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: "0.12em" }}
                >
                  Event
                </Typography>
                <Typography variant="h5">{bookingResult.eventName}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {bookingResult.venue}
                </Typography>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

              {/* Stats grid */}
              <Stack direction="row" justifyContent="space-between">
                <Stack spacing={0.5} alignItems="center">
                  <QueueIcon sx={{ color: "primary.main" }} />
                  <Typography variant="h5" sx={{ color: "primary.main" }}>
                    #{bookingResult.queuePosition}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Queue Position
                  </Typography>
                </Stack>
                <Stack spacing={0.5} alignItems="center">
                  <EventSeatIcon sx={{ color: "success.main" }} />
                  <Typography variant="h5" sx={{ color: "success.main" }}>
                    {bookingResult.seatLabels.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seats Booked
                  </Typography>
                </Stack>
                <Stack spacing={0.5} alignItems="center">
                  <AccessTimeIcon sx={{ color: "warning.main" }} />
                  <Typography
                    variant="body2"
                    sx={{ color: "warning.main", fontWeight: 700 }}
                  >
                    {format(new Date(bookingResult.bookedAt), "HH:mm:ss")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Booked At
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

              {/* Seats */}
              <Stack spacing={1}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ letterSpacing: "0.12em" }}
                >
                  Your Seats
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {bookingResult.seatLabels.map((label) => (
                    <Chip
                      key={label}
                      label={label}
                      color="success"
                      icon={<EventSeatIcon />}
                      sx={{ fontWeight: 700 }}
                    />
                  ))}
                </Stack>
              </Stack>

              {/* Booking ID */}
              <Box
                sx={{
                  bgcolor: "rgba(255,255,255,0.03)",
                  borderRadius: 1,
                  p: 1.5,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Booking Reference:{" "}
                  <strong style={{ color: "#F0F0F8", letterSpacing: "0.05em" }}>
                    GMT-{String(bookingResult.bookingId).padStart(6, "0")}
                  </strong>
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* <Button
            variant="outlined"
            color="primary"
            onClick={handleBookAgain}
            size="large"
            sx={{ width: "100%", py: 1.5 }}
          >
            Book More Tickets
          </Button> */}
          <Button
            variant="outlined"
            color="primary"
            onClick={handleTryAgain}
            size="large"
            sx={{ width: "100%", py: 1.5 }}
          >
            TRY AGAIN?{" "}
          </Button>

          {/* footnote */}
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
