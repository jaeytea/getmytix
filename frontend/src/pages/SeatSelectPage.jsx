import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Stack,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
  Divider,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { getSeats, lockSeatsForCheckout } from "../api/client";

import useStore from "../store/useStore";

// How fast the bot steals seats per demand level
const BOT_CONFIG = {
  normal: { intervalMs: 2500, seatsPerTick: 1, lockChance: 0.4 },
  medium: { intervalMs: 1200, seatsPerTick: 2, lockChance: 0.6 },
  high: { intervalMs: 600, seatsPerTick: 3, lockChance: 0.7 },
};

const POLL_INTERVAL_MS = 5000; // real backend poll

const STATUS_STYLES = {
  AVAILABLE: { bg: "#0e2218", border: "#4BFF9C", color: "#4BFF9C" },
  LOCKED: { bg: "#2a1f08", border: "#FFB347", color: "#FFB347" },
  BOOKED: { bg: "#0f0f1a", border: "#2a2a44", color: "#2a2a44" },
  SELECTED: { bg: "#2a2a08", border: "#E8FF47", color: "#E8FF47" },
  FLASH: { bg: "#3a1212", border: "#FF4B6E", color: "#FF4B6E" }, // moment of being taken
};

function SeatButton({ seat, selected, flashing, onClick }) {
  const style = flashing
    ? STATUS_STYLES.FLASH
    : selected
      ? STATUS_STYLES.SELECTED
      : STATUS_STYLES[seat.status];

  const isClickable = seat.status === "AVAILABLE" || selected;

  return (
    <Tooltip title={`${seat.seatLabel}`} placement="top">
      <Box
        onClick={isClickable ? onClick : undefined}
        sx={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `2px solid ${style.border}`,
          bgcolor: style.bg,
          cursor: isClickable ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.12s ease",
          opacity: seat.status === "BOOKED" && !selected ? 0.3 : 1,
          transform: flashing ? "scale(0.88)" : "scale(1)",
          "&:hover": isClickable
            ? {
                border: `2px solid ${style.border}`,
                bgcolor: style.bg,
                transform: "scale(1.15)",
                boxShadow: `0 0 8px ${style.border}66`,
              }
            : {},
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: style.color,
            fontWeight: 700,
            fontSize: "0.58rem",
            userSelect: "none",
          }}
        >
          {seat.seatNumber}
        </Typography>
      </Box>
    </Tooltip>
  );
}

export default function SeatSelectPage() {
  const navigate = useNavigate();
  const userName = useStore((s) => s.userName);
  const selectedEvent = useStore((s) => s.selectedEvent);
  const queueEntry = useStore((s) => s.queueEntry);
  const demandLevel = useStore((s) => s.demandLevel);
  const setPendingSeats = useStore((s) => s.setPendingSeats);
  const setBookingResult = useStore((s) => s.setBookingResult);

  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(new Map()); // seatId → seatDTO
  const [flashing, setFlashing] = useState(new Set()); // seatIds currently flashing red
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [conflictMsg, setConflict] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const seatsRef = useRef([]); // keep a mutable ref for the bot to read
  const pollRef = useRef(null);
  const botRef = useRef(null);

  useEffect(() => {
    if (!userName) {
      navigate("/");
      return;
    }
    if (!selectedEvent) {
      navigate("/events");
      return;
    }
  }, []);

  // ── Fetch seats from backend ──────────────────────────────────────────────
  const fetchSeats = useCallback(async () => {
    if (!selectedEvent) return;
    try {
      const data = await getSeats(selectedEvent.id);
      seatsRef.current = data;
      setSeats(data);
      setLastRefresh(new Date());
      setSelected((prev) => {
        const next = new Map(prev);
        for (const [id] of prev) {
          const fresh = data.find((d) => d.id === id);
          if (!fresh || fresh.status !== "AVAILABLE") next.delete(id);
        }
        return next;
      });
    } catch {
      setError("Could not load seats.");
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  useEffect(() => {
    fetchSeats();
    pollRef.current = setInterval(fetchSeats, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchSeats]);

  // ── Frontend bot: aggressively steals seats locally ──────────────────────
  // This runs PURELY on the frontend to create the visual chaos.
  // The real backend also has its BotScheduler, but at 4s intervals.
  // Here we simulate at much higher frequency so the seat map looks alive.
  useEffect(() => {
    const cfg = BOT_CONFIG[demandLevel?.id ?? "normal"];

    botRef.current = setInterval(() => {
      setSeats((prev) => {
        const available = prev.filter((s) => s.status === "AVAILABLE");
        if (available.length === 0) return prev;

        // pick random victims
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const victims = shuffled.slice(0, cfg.seatsPerTick);
        const victimIds = new Set(victims.map((s) => s.id));

        // flash them red first
        setFlashing((f) => {
          const next = new Set(f);
          victimIds.forEach((id) => next.add(id));
          return next;
        });

        // after 300ms remove flash and set final status
        setTimeout(() => {
          setFlashing((f) => {
            const next = new Set(f);
            victimIds.forEach((id) => next.delete(id));
            return next;
          });

          setSeats((curr) =>
            curr.map((s) => {
              if (!victimIds.has(s.id)) return s;
              // random: some go LOCKED, others straight to BOOKED
              const newStatus =
                Math.random() < cfg.lockChance ? "LOCKED" : "BOOKED";
              return { ...s, status: newStatus };
            }),
          );

          // LOCKED seats revert to AVAILABLE after a short window (or get booked)
          setTimeout(
            () => {
              setSeats((curr) =>
                curr.map((s) => {
                  if (!victimIds.has(s.id) || s.status !== "LOCKED") return s;
                  return {
                    ...s,
                    status: Math.random() < 0.5 ? "BOOKED" : "AVAILABLE",
                  };
                }),
              );
            },
            1500 + Math.random() * 2000,
          );
        }, 300);

        return prev; // actual state update happens in the setTimeout above
      });
    }, cfg.intervalMs);

    return () => clearInterval(botRef.current);
  }, [demandLevel]);

  // ── Seat selection ────────────────────────────────────────────────────────
  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else if (next.size < 4) next.set(seat.id, seat);
      return next;
    });
  };

  //Booking func
  const handleBook = async () => {
    const selectedSeats = Array.from(selected.values());
    try {
      const res = await lockSeatsForCheckout(
        selectedSeats.map((s) => s.id),
        userName,
      );
      if (res.failedIds.length > 0) {
        // show conflict, refresh map
        fetchSeats();
        setSelected(new Map());
        setConflict("Some seats could not be reserved");
        return;
      }
      // Save returned seat DTOs (including lockedUntil) if you want
      setPendingSeats(
        selectedSeats.map((s, i) => ({
          ...s,
          lockedUntil: res.seats.find((x) => x.id === s.id)?.lockedUntil,
        })),
      );
      navigate("/paydoor");
    } catch (e) {
      console.error(e);
      setError("Could not reserve seats for checkout");
    }
  };

  // Group by row
  const rows = seats.reduce((acc, s) => {
    if (!acc[s.rowLabel]) acc[s.rowLabel] = [];
    acc[s.rowLabel].push(s);
    return acc;
  }, {});

  const stats = {
    available: seats.filter((s) => s.status === "AVAILABLE").length,
    locked: seats.filter((s) => s.status === "LOCKED").length,
    booked: seats.filter((s) => s.status === "BOOKED").length,
  };

  const demandColor = demandLevel?.color ?? "#E8FF47";

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
          justifyContent: "space-between",
        }}
      >
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
        <Stack direction="row" spacing={1} alignItems="center">
          {lastRefresh && (
            <Typography variant="caption" color="text.secondary">
              Synced {lastRefresh.toLocaleTimeString()}
            </Typography>
          )}
          <Chip
            label={demandLevel?.label ?? ""}
            size="small"
            sx={{
              bgcolor: `${demandColor}22`,
              color: demandColor,
              fontWeight: 700,
            }}
          />
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchSeats}
            color="inherit"
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={1} mb={3}>
          <Chip
            label={selectedEvent?.name}
            color="primary"
            variant="outlined"
            sx={{ width: "fit-content" }}
          />
          <Typography variant="h4">Pick Your Seats</Typography>
          <Typography color="text.secondary" variant="body2">
            {selectedEvent?.venue} · Seats update live · Max 4 per booking ·{" "}
            <strong style={{ color: demandColor }}>Move fast!</strong>
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          {[
            { label: "Available", count: stats.available, color: "#4BFF9C" },
            { label: "Being Viewed", count: stats.locked, color: "#FFB347" },
            { label: "Booked", count: stats.booked, color: "#FF4B6E" },
          ].map(({ label, count, color }) => (
            <Paper
              key={label}
              sx={{ px: 2, py: 1, border: `1px solid ${color}22` }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: color,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color }}>
                  {count}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {loading ? (
          <Box textAlign="center" py={8}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            {/* Stage */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  mx: "auto",
                  width: "55%",
                  maxWidth: 300,
                  height: 5,
                  bgcolor: "rgba(232,255,71,0.15)",
                  borderRadius: "4px 4px 0 0",
                  border: "1px solid rgba(232,255,71,0.25)",
                  borderBottom: "none",
                  mb: 0.5,
                }}
              />
              <Typography
                variant="caption"
                color="primary"
                sx={{
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                }}
              >
                Stage
              </Typography>
            </Box>

            {/* Grid */}
            <Stack spacing={1.5}>
              {Object.entries(rows).map(([rowLabel, rowSeats]) => (
                <Stack
                  key={rowLabel}
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      width: 18,
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  >
                    {rowLabel}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="nowrap">
                    {rowSeats.map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        selected={selected.has(seat.id)}
                        flashing={flashing.has(seat.id)}
                        onClick={() => toggleSeat(seat)}
                      />
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Booking panel */}
        {selected.size > 0 && (
          <Paper sx={{ p: 3, border: `1px solid ${demandColor}33`, mb: 2 }}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  <EventSeatIcon
                    sx={{
                      mr: 1,
                      verticalAlign: "middle",
                      color: "primary.main",
                    }}
                  />
                  Selected Seats
                </Typography>
                <Chip
                  label={`${selected.size} seat${selected.size > 1 ? "s" : ""}`}
                  color="primary"
                />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {Array.from(selected.values()).map((s) => (
                  <Chip
                    key={s.id}
                    label={s.seatLabel}
                    onDelete={() => toggleSeat(s)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
              <Divider />
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  Queue: <strong>#{queueEntry?.queuePosition ?? "—"}</strong>
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleBook}
                  disabled={booking}
                  sx={{ minWidth: 180 }}
                >
                  {booking ? (
                    <>
                      <CircularProgress
                        size={16}
                        sx={{ mr: 1, color: "#0A0A0F" }}
                      />
                      Booking…
                    </>
                  ) : (
                    "⚡ Confirm & Checkout"
                  )}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Legend */}
        <Stack direction="row" spacing={3} flexWrap="wrap">
          {[
            { label: "Available", color: "#4BFF9C", bg: "#0e2218" },
            { label: "Being Viewed", color: "#FFB347", bg: "#2a1f08" },
            { label: "Taken", color: "#2a2a44", bg: "#0f0f1a" },
            { label: "Your Pick", color: "#E8FF47", bg: "#2a2a08" },
          ].map(({ label, color, bg }) => (
            <Stack
              key={label}
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: "3px",
                  bgcolor: bg,
                  border: `2px solid ${color}`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>

      <Snackbar
        open={!!conflictMsg}
        autoHideDuration={5000}
        onClose={() => setConflict(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          onClose={() => setConflict(null)}
          sx={{ width: "100%" }}
        >
          ⚠️ <strong>Optimistic Lock Conflict:</strong> {conflictMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
