/**
 * Chặn truy cập khu vực quản trị cho người không đủ quyền.
 *
 * - Chưa đăng nhập → mở modal đăng nhập (không chặn luồng xem cửa hàng).
 * - Đã đăng nhập nhưng vai trò không phải admin/staff → trang "Không có quyền truy cập".
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, Skeleton } from './ui';
import { Shield, User } from './icons';
import { StoreLayout } from '../layouts/StoreLayout';
import { useAuth } from '../context/AuthContext';
import { openLoginModal } from '../utils/loginModal';

/** Các vai trò được vào khu vực quản trị. */
export const ADMIN_ROLES = ['admin', 'staff'];

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Chưa đăng nhập → tự mở modal đăng nhập cho tiện (vẫn có nút bấm tay bên dưới).
  useEffect(() => {
    if (loading) return;
    if (!user) openLoginModal('login');
  }, [loading, user]);

  if (loading) {
    return (
      <StoreLayout title="Đang tải">
        <div className="container-page py-12">
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </StoreLayout>
    );
  }

  if (!user) {
    return (
      <StoreLayout title="Đăng nhập để quản trị">
        <div className="container-page py-12">
          <EmptyState
            icon={<Shield className="h-6 w-6" />}
            title="Vui lòng đăng nhập"
            description="Khu vực quản trị chỉ dành cho quản trị viên và nhân viên quản trị cửa hàng. Hãy đăng nhập để tiếp tục."
            action={
              <Button onClick={() => openLoginModal('login')}>
                <User className="h-4 w-4" />
                Đăng nhập / Đăng ký
              </Button>
            }
          />
        </div>
      </StoreLayout>
    );
  }

  if (!ADMIN_ROLES.includes(user.role)) {
    return (
      <StoreLayout title="Không có quyền truy cập">
        <div className="container-page py-12">
          <EmptyState
            icon={<Shield className="h-6 w-6" />}
            title="Không có quyền truy cập"
            description="Khu vực quản trị chỉ dành cho quản trị viên và nhân viên quản trị cửa hàng. Tài khoản của bạn không thuộc nhóm này."
            action={<Button onClick={() => navigate('/')}>Về trang chủ</Button>}
          />
        </div>
      </StoreLayout>
    );
  }

  return children;
}

export default AdminRoute;
