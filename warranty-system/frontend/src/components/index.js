// ============================================
// COMPONENTS INDEX
// Export all shared components
// ============================================

// Layout components
export { default as Layout } from './Layout'
export { default as Sidebar } from './Sidebar'
export { default as Header } from './Header'

// Shared UI components
export { default as StatusBadge } from './StatusBadge'
export { default as EmptyState } from './EmptyState'
export { default as ConfirmDialog } from './ConfirmDialog'
export { default as SearchInput } from './SearchInput'
export { default as FilterChips } from './FilterChips'
export { default as Stepper } from './Stepper'
export { default as PageHeader } from './PageHeader'
export { default as StatCard } from './StatCard'
export { default as ProtectedRoute } from './ProtectedRoute'
export { default as CommandPalette } from './CommandPalette'
export { default as StatusChangeModal } from './StatusChangeModal'

// Create Ticket components (bản 4 bước trong thư mục CreateTicket/)
export { CreateTicketModal } from './CreateTicket'

// Loading components
export { 
  default as Skeleton,
  TableSkeleton, 
  CardSkeleton, 
  StatsSkeleton, 
  PageSkeleton,
  ButtonSkeleton 
} from './LoadingSkeleton'

// Config
export * from '../config/statusConfig'
