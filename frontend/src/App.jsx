import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage    from './pages/LandingPage'
import EventsPage     from './pages/EventsPage'
import PaymentPage    from './pages/PaymentPage'
import QueuePage      from './pages/QueuePage'
import SeatSelectPage from './pages/SeatSelectPage'
import SuccessPage    from './pages/SuccessPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<LandingPage />} />
      <Route path="/events"     element={<EventsPage />} />
      <Route path="/paydoor"    element={<PaymentPage />} />
      <Route path="/queue"      element={<QueuePage />} />
      <Route path="/seats"      element={<SeatSelectPage />} />
      <Route path="/success"    element={<SuccessPage />} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  )
}
