import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { NotificationProvider } from './context/NotificationContext'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Products from './pages/Products'
import Customers from './pages/Customers'
import AIConsole from './pages/AIConsole'
import Payment from './pages/Payment'
import Wallet from './pages/Wallet'
import CustomerChat from './pages/CustomerChat'
import Settings from './pages/Settings'
import Lookup from './pages/Lookup'
import MyProducts from './pages/MyProducts'
import MyTickets from './pages/MyTickets'
import MyTicketDetail from './pages/MyTicketDetail'

export default function App() {
  const { user } = useAuth()
  return (
    <NotificationProvider user={user}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute roles={['admin', 'staff']}><Customers /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute roles={['admin', 'staff', 'technician']}><AIConsole /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute roles={['admin']}><Payment /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><CustomerChat /></ProtectedRoute>} />
        <Route path="/my-products" element={<ProtectedRoute><MyProducts /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/my-tickets/:id" element={<ProtectedRoute><MyTicketDetail /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/lookup" element={<Lookup />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </NotificationProvider>
  )
}
