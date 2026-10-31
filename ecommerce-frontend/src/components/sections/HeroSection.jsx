import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from '../icons';
import { Button, IconButton, Skeleton } from '../ui';
import { HeroQuickChips } from './HeroQuickChips';
import { useCarousel } from '../../hooks/useCarousel';
import { getHeroSlides, getQuickChips } from '../../api/hero';
import { cn } from '../../utils/cn';

/**
 * Hero Section — component chính của trang chủ.
 *
 * Layout: desktop chia đôi (chữ trái – ảnh phải), mobile dồn dọc.
 * Carousel 4 slide có autoplay 5–6s, pause on hover/focus, dừng khi tab ẩn
 * và khi người dùng bật "giảm chuyển động".
 *
 * @param {object} props
 * @param {number} [props.autoplayInterval=5500] - chu kỳ autoplay (ms)
 * @param {string} [props.className]
 */
export function HeroSection({ autoplayInterval = 5500, className }) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [chips, setChips] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = useCallback(async (signal) => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const [slideData, chipData] = await Promise.all([
        getHeroSlides({ signal }),
        getQuickChips({ signal }),
      ]);
      setSlides(slideData ?? []);
      setChips(chipData ?? []);
      setStatus('ready');
    } catch (error) {
      if (error?.type === 'abort') return;
      setSlides([]);
      setChips([]);
      setErrorMessage(error?.message || 'Không tải được nội dung. Vui lòng thử lại.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData, reloadKey]);

  const total = slides.length;
  const {
    index,
    isPlaying,
    next,
    prev,
    goTo,
    setPaused,
    handlers,
  } = useCarousel({ length: total, interval: autoplayInterval });

  const current = slides[index];

  const titleParts = useMemo(() => {
    if (!current) return null;
    const word = current.highlightWord;
    if (!word || !current.title?.includes(word)) {
      return { before: current.title, highlight: '', after: '' };
    }
    const idx = current.title.indexOf(word);
    return {
      before: current.title.slice(0, idx),
      highlight: word,
      after: current.title.slice(idx + word.length),
    };
  }, [current]);

  const retry = () => setReloadKey((key) => key + 1);

  const goCta = (href) => {
    if (!href) return;
    navigate(href);
  };

  if (status === 'loading') {
    return (
      <section
        aria-busy="true"
        aria-label="Đang tải nội dung nổi bật"
        className={`relative overflow-hidden bg-gradient-hero ${className ?? ''}`}
      >
        <div className="absolute inset-0 pointer-events-none bg-hero-glow" aria-hidden="true" />
        <div className="container-page relative grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12 py-10 sm:py-14 lg:py-20">
          <div className="lg:col-span-7 order-1">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="mt-4 h-10 w-full max-w-xl" />
            <Skeleton className="mt-3 h-10 w-4/5 max-w-lg" />
            <Skeleton className="mt-4 h-5 w-full max-w-container-prose" />
            <Skeleton className="mt-2 h-5 w-3/4 max-w-md" />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Skeleton className="h-[52px] w-36 rounded-lg" />
              <Skeleton className="h-[52px] w-36 rounded-lg" />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </div>
          <div className="lg:col-span-5 order-2">
            <Skeleton className="aspect-square w-full max-w-[420px] mx-auto rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section
        aria-label="Nội dung nổi bật"
        className={`relative overflow-hidden bg-gradient-hero ${className ?? ''}`}
      >
        <div className="absolute inset-0 pointer-events-none bg-hero-glow" aria-hidden="true" />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div
            role="alert"
            className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-line-200 bg-surface-card px-6 py-12 text-center shadow-card"
          >
            <h2 className="text-xl font-bold text-ink-900">Không tải được nội dung nổi bật</h2>
            <p className="text-sm text-ink-500 text-pretty">{errorMessage}</p>
            <Button variant="gradient" onClick={retry}>
              Thử lại
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!total) {
    return (
      <section
        aria-label="Nội dung nổi bật"
        className={`relative overflow-hidden bg-gradient-hero ${className ?? ''}`}
      >
        <div className="absolute inset-0 pointer-events-none bg-hero-glow" aria-hidden="true" />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-line-200 bg-surface-card px-6 py-12 text-center">
            <h2 className="text-xl font-bold text-ink-900">Chưa có nội dung nổi bật</h2>
            <p className="text-sm text-ink-500 text-pretty">
              Vui lòng quay lại sau. Nếu vấn đề vẫn tiếp diễn, hãy liên hệ hotline để được hỗ trợ.
            </p>
            <Button variant="secondary" onClick={retry}>
              Tải lại
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Nội dung nổi bật và chương trình khuyến mãi"
      className={`relative overflow-hidden bg-gradient-hero ${className ?? ''}`}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onFocusCapture={handlers.onFocusCapture}
      onBlurCapture={handlers.onBlurCapture}
      onTouchStart={handlers.onTouchStart}
      onTouchEnd={handlers.onTouchEnd}
      onKeyDown={handlers.onKeyDown}
    >
      <div className="absolute inset-0 pointer-events-none bg-hero-glow" aria-hidden="true" />

      <div className="container-page relative grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12 py-10 sm:py-14 lg:py-20">
        {/* Cột chữ */}
        <div className="lg:col-span-7 order-1 min-w-0">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5">
            {current.eyebrow}
          </p>

          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-ink-900 tracking-tight text-balance">
            {titleParts?.before}
            {titleParts?.highlight ? (
              <span className="text-brand-600">{titleParts.highlight}</span>
            ) : null}
            {titleParts?.after}
          </h1>

          <p className="mt-4 text-sm sm:text-base lg:text-lg text-ink-500 max-w-container-prose text-pretty">
            {current.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="gradient"
              size="lg"
              className="min-h-[52px] px-6 rounded-lg text-base font-semibold shadow-sm hover:shadow-md transition-all duration-150"
              onClick={() => goCta(current.primaryCta?.href)}
            >
              {current.primaryCta?.label ?? 'Mua ngay'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="min-h-[52px] px-6 rounded-lg text-base font-semibold border border-line-200 bg-white text-ink-700 hover:bg-surface-hover shadow-sm hover:shadow-md transition-all duration-150"
              onClick={() => goCta(current.secondaryCta?.href)}
            >
              {current.secondaryCta?.label ?? 'Xem tất cả'}
            </Button>
          </div>

          <HeroQuickChips chips={chips} />
        </div>

        {/* Cột ảnh */}
        <div className="lg:col-span-5 order-2 min-w-0">
          <div className="relative group aspect-square max-w-[420px] mx-auto">
            {slides.map((slide, slideIndex) => (
              <div
                key={slideIndex}
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${slideIndex + 1} trên ${total}`}
                aria-hidden={slideIndex !== index}
                className={cn(
                  'absolute inset-0 transition-opacity duration-500 ease-out-soft',
                  slideIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
                )}
              >
                <img
                  src={slide.image}
                  alt={slide.alt ?? ''}
                  loading={slideIndex === 0 ? 'eager' : 'lazy'}
                  fetchpriority={slideIndex === 0 ? 'high' : 'auto'}
                  decoding="async"
                  onError={(event) => {
                    // Fallback SVG nội bộ khi ảnh backend không tải được.
                    if (slide.fallbackImage && event.currentTarget.src !== slide.fallbackImage) {
                      event.currentTarget.src = slide.fallbackImage;
                    }
                  }}
                  className="w-full h-full object-contain p-3 transition-transform duration-300 ease-out-soft group-hover:scale-[1.04]"
                />
              </div>
            ))}

            {/* Badge nổi trên ảnh */}
            {current.badge ? (
              <div className="absolute -bottom-2 -left-2 sm:left-0 bg-white rounded-lg shadow-lg border border-line-200 px-3 py-2 z-20">
                <p className="text-2xs uppercase tracking-wide text-ink-300">{current.badge.label}</p>
                <p className="text-sm font-bold text-price-600 tabular-nums">{current.badge.value}</p>
              </div>
            ) : null}

          </div>
        </div>
      </div>

      {/* Nút mũi tên (chỉ hiển thị trên desktop) */}
      <div className="hidden lg:flex absolute inset-y-0 left-0 right-0 items-center justify-between pointer-events-none z-20">
        <IconButton ariaLabel="Slide trước" onClick={prev} className="pointer-events-auto ml-2">
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <IconButton ariaLabel="Slide sau" onClick={next} className="pointer-events-auto mr-2">
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>

      {/* Dots + play/pause */}
      <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-0 flex items-center gap-1.5 z-30">
        <IconButton
          ariaLabel={isPlaying ? 'Tạm dừng tự động chuyển slide' : 'Tiếp tục tự động chuyển slide'}
          size="sm"
          onClick={() => setPaused(isPlaying)}
          className="mr-1 hidden sm:inline-flex"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </IconButton>

        {slides.map((slide, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            onClick={() => goTo(slideIndex)}
            aria-label={`Đi tới slide ${slideIndex + 1}`}
            aria-current={slideIndex === index ? 'true' : undefined}
            className={cn(
              'h-2 rounded-full transition-all duration-200',
              slideIndex === index ? 'w-6 bg-brand-600' : 'w-2 bg-line-300 hover:bg-line-400',
            )}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroSection;
