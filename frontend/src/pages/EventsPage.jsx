import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CircularProgress,
  LinearProgress,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import PeopleIcon from "@mui/icons-material/People";
import BoltIcon from "@mui/icons-material/Bolt";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import SpeedIcon from "@mui/icons-material/Speed";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { format } from "date-fns";
import { getEvents } from "../api/client";
import useStore from "../store/useStore";

const DEMAND_LEVELS = [
  {
    id: "normal",
    label: "Normal Demand",
    icon: <SpeedIcon />,
    color: "#4BFF9C",
    virtualUsers: "1,200",
    queueRange: [1, 500],
    description: "Steady crowd. A few hundred people competing.",
    borderColor: "rgba(75,255,156,0.3)",
  },
  {
    id: "medium",
    label: "Medium Demand",
    icon: <BoltIcon />,
    color: "#FFB347",
    virtualUsers: "4,500",
    queueRange: [500, 2000],
    description: "High interest. Thousands in line — act fast.",
    borderColor: "rgba(255,179,71,0.3)",
  },
  {
    id: "high",
    label: "High Demand",
    icon: <WhatshotIcon />,
    color: "#FF4B6E",
    virtualUsers: "8,000",
    queueRange: [2000, 5000],
    description: "Sold-out energy. 8k virtual users fighting for seats.",
    borderColor: "rgba(255,75,110,0.3)",
  },
];

function DemandDialog({ open, event, onConfirm, onClose }) {
  const [selected, setSelected] = useState("medium");
  const level = DEMAND_LEVELS.find((d) => d.id === selected);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.08)",
        },
      }}
    >
      <DialogTitle sx={{ fontFamily: '"Geist Pixel", sans-serif', pb: 1 }}>
        🎟️ Choose Demand Level
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontFamily: '"DM Sans", sans-serif', fontWeight: 400 }}
        >
          {event?.name} — How competitive do you want it?
        </Typography>
      </DialogTitle>

      <DialogContent>
        <RadioGroup
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <Stack spacing={1.5}>
            {DEMAND_LEVELS.map((d) => (
              <Paper
                key={d.id}
                onClick={() => setSelected(d.id)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  border: `2px solid ${selected === d.id ? d.color : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 2,
                  transition: "all 0.15s",
                  bgcolor: selected === d.id ? `${d.color}11` : "transparent",
                  "&:hover": { borderColor: d.color, bgcolor: `${d.color}0A` },
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <FormControlLabel
                      value={d.id}
                      control={
                        <Radio
                          sx={{
                            color: d.color,
                            "&.Mui-checked": { color: d.color },
                          }}
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                    <Box sx={{ color: d.color }}>{d.icon}</Box>
                    <Stack spacing={0.3}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        sx={{ color: d.color }}
                      >
                        {d.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.description}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack
                    alignItems="flex-end"
                    spacing={0.3}
                    sx={{ flexShrink: 0, ml: 2 }}
                  >
                    <Chip
                      label={`${d.virtualUsers} users`}
                      size="small"
                      sx={{
                        bgcolor: `${d.color}22`,
                        color: d.color,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Queue ~{d.queueRange[0]}–
                      {d.queueRange[1].toLocaleString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </RadioGroup>

        <Box
          sx={{
            mt: 2.5,
            p: 1.5,
            bgcolor: "rgba(255,255,255,0.03)",
            borderRadius: 1.5,
            textAlign: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            🔴 LIVE &nbsp;·&nbsp;{" "}
            <strong style={{ color: level.color }}>
              {level.virtualUsers} virtual users
            </strong>{" "}
            are competing right now
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(selected)}
          variant="contained"
          color="primary"
          sx={{ px: 4 }}
        >
          Join Queue →
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogEvent, setDialogEvent] = useState(null);

  const userName = useStore((s) => s.userName);
  const setSelectedEvent = useStore((s) => s.setSelectedEvent);
  const setDemandLevel = useStore((s) => s.setDemandLevel);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userName) navigate("/");
  }, [userName, navigate]);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(() => setError("Could not load events – is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmDemand = (demandId) => {
    const level = DEMAND_LEVELS.find((d) => d.id === demandId);
    setSelectedEvent(dialogEvent);
    setDemandLevel(level);
    setDialogEvent(null);
    navigate("/queue");
  };

  const availabilityColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return "success";
    if (ratio > 0.15) return "warning";
    return "error";
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
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
        <Typography variant="body2" color="text.secondary">
          Hey, <strong style={{ color: "#F0F0F8" }}>{userName}</strong> ! :D
        </Typography>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack spacing={1} mb={4}>
          <Typography variant="h3">Live Events</Typography>
          <Typography color="text.secondary">
            Select an event to join the queue. Seats are selling fast — act
            quickly!
          </Typography>
        </Stack>

        {loading && (
          <Box textAlign="center" py={8}>
            <CircularProgress color="primary" />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {events.map((event) => {
            const availability = availabilityColor(
              event.availableSeats,
              event.totalSeats,
            );
            const pct = (event.availableSeats / event.totalSeats) * 100;
            return (
              <Grid item xs={12} sm={6} key={event.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "rgba(232,255,71,0.3)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={
                      event.imageUrl ||
                      `https://picsum.photos/seed/${event.id}/800/400`
                    }
                    alt={event.name}
                    sx={{ objectFit: "cover" }}
                  />
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h5" gutterBottom>
                      {event.name}
                    </Typography>
                    <Stack spacing={1} mb={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlaceIcon
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {event.venue}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EventIcon
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(event.eventDate), "PPP · p")}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {event.description}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          <PeopleIcon
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Availability
                          </Typography>
                        </Stack>
                        <Chip
                          label={`${event.availableSeats} / ${event.totalSeats} seats`}
                          size="small"
                          color={availability}
                          variant="outlined"
                        />
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={availability}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setDialogEvent(event)}
                      disabled={event.availableSeats === 0}
                    >
                      {event.availableSeats === 0 ? "Sold Out" : "Book Tix"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <DemandDialog
        open={!!dialogEvent}
        event={dialogEvent}
        onConfirm={handleConfirmDemand}
        onClose={() => setDialogEvent(null)}
      />
    </Box>
  );
}
