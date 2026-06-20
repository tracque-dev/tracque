import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Brands from './pages/Brands'
import Keywords from './pages/Keywords'
import AIResults from './pages/AIResults'
import SEOResults from './pages/SEOResults'
import Reputation from './pages/Reputation'
import Saiv from './pages/Saiv'
import RateMonitor from './pages/RateMonitor'
import Compliance from './pages/Compliance'
import PromptDiscovery from './pages/PromptDiscovery'
import Recommendations from './pages/Recommendations'
import SiteAudit from './pages/SiteAudit'
import Attribution from './pages/Attribution'
import Report from './pages/Report'
import SharedReport from './pages/SharedReport'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Onboarding from './pages/Onboarding'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/r/:token" element={<SharedReport />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/app/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/app" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="brands" element={<Brands />} />
        <Route path="keywords" element={<Keywords />} />
        <Route path="ai" element={<AIResults />} />
        <Route path="seo" element={<SEOResults />} />
        <Route path="reputation" element={<Reputation />} />
        <Route path="saiv" element={<Saiv />} />
        <Route path="rate-monitor" element={<RateMonitor />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="prompts" element={<PromptDiscovery />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="site-audit" element={<SiteAudit />} />
        <Route path="attribution" element={<Attribution />} />
        <Route path="report" element={<Report />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
