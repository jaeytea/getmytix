import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Stack,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Button,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { joinQueue } from "../api/client";
import useStore from "../store/useStore";

// How many positions to drop per tick, per demand level
const DRAIN_RATE = { normal: 8, medium: 18, high: 35 };
const TICK_MS = 400; // tick every 400ms — feels fast and chaotic

export default function QueuePage() {
  const navigate = useNavigate();
  const userName = useStore((s) => s.userName);
  const selectedEvent = useStore((s) => s.selectedEvent);
  const demandLevel = useStore((s) => s.demandLevel);
  const setQueueEntry = useStore((s) => s.setQueueEntry);

  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null); // ticking down
  const [admitted, setAdmitted] = useState(false);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(true);

  const tickRef = useRef(null);

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
    if (!demandLevel) {
      navigate("/events");
      return;
    }
  }, [userName, selectedEvent, demandLevel, navigate]);

  // Join queue on mount
  useEffect(() => {
    if (!selectedEvent || !userName || !demandLevel) return;
    (async () => {
      try {
        const entry = await joinQueue(selectedEvent.id, userName);
        // Override position with demand-level theatrics
        const [min, max] = demandLevel.queueRange;
        const displayPos = Math.floor(Math.random() * (max - min + 1)) + min;
        entry._displayPosition = displayPos;
        setQueueEntry(entry);
        setStartPos(displayPos);
        setCurrentPos(displayPos);
      } catch {
        setError("Failed to join queue. Refresh or try again later :(");
        console.error("Failed to join queue : ", error);
      } finally {
        setJoining(false);
      }
    })();
  }, []);

  //countdown logic
  useEffect(() => {
    if (currentPos === null || admitted) return;
    const rate = DRAIN_RATE[demandLevel?.id] ?? 10;

    tickRef.current = setInterval(() => {
      setCurrentPos((prev) => {
        if (prev === null) return prev;
        // Add jitter so it feels organic — sometimes jumps more, sometimes less
        const jitter = Math.floor(Math.random() * rate * 0.6);
        const drop = rate + jitter;
        const next = prev - drop;
        if (next <= 0) {
          clearInterval(tickRef.current);
          setAdmitted(true);
          return 0;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(tickRef.current);
  }, [currentPos !== null, demandLevel, admitted]);

  // Admitted screen
  if (admitted) {
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
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: 5,
              textAlign: "center",
              border: "1px solid rgba(75,255,156,0.4)",
              background: "linear-gradient(135deg, #12121A 0%, #0e1e14 100%)",
            }}
          >
            <Typography sx={{ fontSize: "3rem", mb: 1 }}>🎉</Typography>
            <Typography variant="h4" sx={{ color: "success.main", mb: 1 }}>
              You're In!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You beat{" "}
              <strong style={{ color: "#F0F0F8" }}>
                {demandLevel?.virtualUsers}
              </strong>{" "}
              users.
              <br />
              Now grab your seats before they're gone!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={() => navigate("/seats")}
              sx={{ py: 1.5, fontSize: "1.1rem" }}
            >
              Choose Seats — Fast! →
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  const progress =
    startPos && currentPos !== null
      ? Math.min(100, ((startPos - currentPos) / startPos) * 100)
      : 0;

  const demandColor = demandLevel?.color ?? "#E8FF47";

  // Format with commas
  const fmt = (n) => n?.toLocaleString() ?? "…";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
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
      </Box>

      <Container maxWidth="sm" sx={{ py: 8 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {joining && (
          <Stack alignItems="center" spacing={2}>
            <Typography variant="h5" color="text.secondary">
              Joining queue…
            </Typography>
          </Stack>
        )}

        {!joining && currentPos !== null && (
          <Stack spacing={4} alignItems="center">
            <Stack spacing={0.5} alignItems="center" textAlign="center">
              <Chip
                label={demandLevel?.label}
                size="small"
                sx={{
                  bgcolor: `${demandColor}22`,
                  color: demandColor,
                  fontWeight: 700,
                  mb: 1,
                }}
              />
              <Typography variant="h3">You're in the queue</Typography>
              <Typography color="text.secondary">
                Competing against{" "}
                <strong style={{ color: demandColor }}>
                  {demandLevel?.virtualUsers} users
                </strong>
              </Typography>
            </Stack>

            {/* Big position number */}
            <Paper
              sx={{
                width: "100%",
                p: 4,
                border: `1px solid ${demandColor}33`,
                textAlign: "center",
              }}
            >
              <Stack spacing={3}>
                <Stack spacing={0}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    Your Queue Position
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "clamp(1rem, 7vw, 3rem)",
                      fontFamily: '"Geist Pixel", sans-serif',
                      fontWeight: 800,
                      color: "#efefef",
                      lineHeight: 1,
                      // flash animation as it changes
                      transition: "color 0.1s",
                    }}
                  >
                    {fmt(currentPos)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Started at{" "}
                    <strong style={{ color: "#F0F0F8" }}>
                      #{fmt(startPos)}
                    </strong>
                  </Typography>
                </Stack>

                {/* Progress bar */}
                <Stack spacing={1}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: "rgba(255,255,255,0.06)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: demandColor,
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Queue progressing...
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: demandColor, fontWeight: 700 }}
                    >
                      {Math.round(progress)}% closer to getting your tix
                    </Typography>
                  </Stack>
                </Stack>

                <LiveTicker demandLevel={demandLevel} />
              </Stack>
            </Paper>
          </Stack>
        )}
      </Container>
    </Box>
  );
}

//live ticker component, commented for now.
// Simulated live activity messages
const MESSAGES = [
  "Please dont refresh or leave the page.",
  "Getting closer...",
  "Keep your details handy for fast checkout!",
  "99% booking rate for this event",
  "Almost there...",
];

function LiveTicker({ demandLevel }) {
  const [msg, setMsg] = useState(MESSAGES[0]);
  const intervalMs =
    demandLevel?.id === "high"
      ? 1500
      : demandLevel?.id === "medium"
        ? 2000
        : 2500;

  useEffect(() => {
    const t = setInterval(() => {
      setMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return (
    <Box
      sx={{ bgcolor: "rgba(255,255,255,0.03)", borderRadius: 1, px: 2, py: 1 }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontStyle: "italic" }}
      >
        {msg}
      </Typography>
    </Box>
  );
}
