import { Routes, Route } from 'react-router'
import { LandingPage } from './pages/Landing'
import { PlanPage } from './pages/Plan'

export default function CampingApp() {
  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path=":planId" element={<PlanPage />} />
    </Routes>
  )
}
