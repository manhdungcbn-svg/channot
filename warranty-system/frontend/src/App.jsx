import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { PageSkeleton } from './components/LoadingSkeleton'
import { NotificationProvider } from './context/NotificationContext'
import { useAuth } from './context/AuthContext'
import {
  ADMIN_ROLES, TECH_ROLES, isCustomer, defaultRouteFor,
} from './utils/permissions'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tickets = lazy(() => import('./pages/Tickets'))
const TicketDetail = lazy(() => import('./pages/TicketDetail'))
const Products = lazy(() => import('./pages/Products'))
const Customers = lazy(() => import('./pages/Customers'))
const AIConsole = lazy(() => import('./pages/AIConsole'))
const Payment = lazy(() => import('./pages/Payment'))
const Wallet = lazy(() => import('./pages/Wallet'))
const CustomerChat = lazy(() => import('./pages/CustomerChat'))
const Settings = lazy(() => import('./pages/Settings'))
const Lookup = lazy(() => import('./pages/Lookup'))
const MyProducts = lazy(() => import('./pages/MyProducts'))
const MyTickets = lazy(() => import('./pages/MyTickets'))
const MyTicketDetail = lazy(() => import('./pages/MyTicketDetail'))

export default function App() {
  const { user } = useAuth()

  return (
    <NotificationProvider user={user}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
        <Route path="/login" element={<Login />} />

        {/* Khách hàng → về trang "Phiếu của tôi" sau khi đăng nhập */}
        <Route path="/" element={
          <ProtectedRoute>
            {isCustomer(user) ? <Navigate to="/my-tickets" replace /> : <Dashboard />}
          </ProtectedRoute>
        } />

        {/* Quản lý phiếu — admin/staff/kỹ thuật.
            Khách hàng dùng /my-tickets nên bị chặn ở đây. */}
        <Route path="/tickets" element={
          <ProtectedRoute roles={TECH_ROLES}>
            <Tickets />
          </ProtectedRoute>
        } />
        <Route path="/tickets/:id" element={
          <ProtectedRoute roles={TECH_ROLES}>
            <TicketDetail />
          </ProtectedRoute>
        } />

        {/* Quản lý sản phẩm toàn hệ thống — chỉ admin/staff */}
        <Route path="/products" element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Products />
          </ProtectedRoute>
        } />

        {/* Danh sách khách hàng — chỉ admin/staff */}
        <Route path="/customers" element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <Customers />
          </ProtectedRoute>
        } />

        {/* AI console — admin/staff/kỹ thuật */}
        <Route path="/ai" element={
          <ProtectedRoute roles={TECH_ROLES}>
            <AIConsole />
          </ProtectedRoute>
        } />

        {/* Tài chính — chỉ admin */}
        <Route path="/payment" element={
          <ProtectedRoute roles={['admin']}>
            <Payment />
          </ProtectedRoute>
        } />

        {/* Ví điện tử — mọi vai trò đã đăng nhập */}
        <Route path="/wallet" element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        } />

        {/* Trợ lý ảo — mọi vai trò đã đăng nhập */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <CustomerChat />
          </ProtectedRoute>
        } />

        {/* Khu vực riêng của khách hàng */}
        <Route path="/my-products" element={
          <ProtectedRoute roles={['customer']}>
            <MyProducts />
          </ProtectedRoute>
        } />
        <Route path="/my-tickets" element={
          <ProtectedRoute roles={['customer']}>
            <MyTickets />
          </ProtectedRoute>
        } />
        <Route path="/my-tickets/:id" element={
          <ProtectedRoute roles={['customer']}>
            <MyTicketDetail />
          </ProtectedRoute>
        } />

        {/* Cài đặt — mọi vai trò đã đăng nhập */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        {/* Tra cứu bảo hành — public (không cần đăng nhập) */}
        <Route path="/lookup" element={<Lookup />} />

        {/* Route lạ → về trang mặc định theo vai trò */}
        <Route path="*" element={<Navigate to={defaultRouteFor(user)} replace />} />
        </Routes>
      </Suspense>
    </NotificationProvider>
  )
}
