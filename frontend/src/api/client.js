import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// ─── Events ───────────────────────────────────────────────────────────────

export const getEvents = () => api.get("/events").then((r) => r.data);

export const getEvent = (id) => api.get(`/events/${id}`).then((r) => r.data);

// ─── Seats ────────────────────────────────────────────────────────────────

export const getSeats = (eventId) =>
  api.get(`/events/${eventId}/seats`).then((r) => r.data);

export const lockSeatsForCheckout = (seatIds, userName) =>
  api.post("/checkout/lock-seats", { seatIds, userName }).then((r) => r.data);

export const extendCheckoutLocks = (seatIds, userName) =>
  api
    .patch("/checkout/extend-locks", { seatIds, userName })
    .then((r) => r.data);

// ─── Queue ────────────────────────────────────────────────────────────────

export const joinQueue = (eventId, userName) =>
  api.post("/queue/join", { eventId, userName }).then((r) => r.data);

export const getQueueStatus = (queueEntryId) =>
  api.get(`/queue/${queueEntryId}/status`).then((r) => r.data);

export const admitToSeats = (queueEntryId) =>
  api.post(`/queue/${queueEntryId}/admit`).then((r) => r.data);

// ─── Bookings ─────────────────────────────────────────────────────────────

/**
 * @param {object} payload
 * @param {number} payload.eventId
 * @param {string} payload.userName
 * @param {number} payload.queueEntryId
 * @param {Array<{seatId: number, version: number}>} payload.seats
 */
export const createBooking = (payload) =>
  api.post("/bookings", payload).then((r) => r.data);

export default api;
