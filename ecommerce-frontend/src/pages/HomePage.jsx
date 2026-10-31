import { useEffect } from 'react';
import { FlashSaleSection, HeroSection, ProductGrid } from '../components/sections';
import { StoreLayout } from '../layouts/StoreLayout';

/**
 * Trang chủ — lắp ghép các section theo thứ tự đã chốt:
 * HeroSection → FlashSaleSection (cuối tuần) → ProductGrid.
 */
export function HomePage() {
  useEffect(() => {
    document.title = 'ĐiệnTử — Thiết bị gia dụng & điện tử chính hãng';
  }, []);

  return (
    <StoreLayout>
      <HeroSection />
      <FlashSaleSection limit={4} />
      <ProductGrid />
    </StoreLayout>
  );
}

export default HomePage;
