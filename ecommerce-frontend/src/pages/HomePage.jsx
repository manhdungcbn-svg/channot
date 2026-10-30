import { useEffect } from 'react';
import { HeroSection, ProductGrid } from '../components/sections';
import { StoreLayout } from '../layouts/StoreLayout';

/**
 * Trang chủ — lắp ghép các section theo thứ tự đã chốt:
 * HeroSection → ProductGrid (khung TopBar/Header/Footer do StoreLayout lo).
 */
export function HomePage() {
  useEffect(() => {
    document.title = 'ĐiệnTử — Thiết bị gia dụng & điện tử chính hãng';
  }, []);

  return (
    <StoreLayout>
      <HeroSection />
      <ProductGrid />
    </StoreLayout>
  );
}

export default HomePage;
