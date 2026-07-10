import { create } from 'zustand'

const useStore = create((set) => ({
  userName: '',
  setUserName: (name) => set({ userName: name }),

  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  // demand level object: { id, label, virtualUsers, queueRange, color, ... }
  demandLevel: null,
  setDemandLevel: (level) => set({ demandLevel: level }),

  queueEntry: null,
  setQueueEntry: (entry) => set({ queueEntry: entry }),

  pendingSeats: [],
  setPendingSeats: (seats) => set({ pendingSeats: seats }),

  bookingResult: null,
  setBookingResult: (result) => set({ bookingResult: result }),

  reset: () => set({ userName: '', selectedEvent: null, demandLevel: null, queueEntry: null, pendingSeats: [], bookingResult: null }),
}))

export default useStore
