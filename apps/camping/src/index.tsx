import { Routes, Route } from 'react-router'
import { TripList } from './pages/TripList'
import { TripDetail } from './pages/TripDetail'
import { NewTrip } from './pages/NewTrip'

export default function CampingApp() {
  return (
    <Routes>
      <Route index element={<TripList />} />
      <Route path="new" element={<NewTrip />} />
      <Route path=":tripId/*" element={<TripDetail />} />
    </Routes>
  )
}
