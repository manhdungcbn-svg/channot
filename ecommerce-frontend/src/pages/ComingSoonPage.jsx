import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Compare,
  CreditCard,
  Gift,
  Headset,
  Leaf,
  Shield,
  Star,
  Truck,
  Wallet,
} from '../components/icons';
import { Badge, Container, SectionHeader } from '../components/ui';
import { Footer, SiteHeader, TopBar, ChatWidget } from '../components/sections';
import {
  FEATURE_PRIORITY_LABELS,
  FEATURE_STATUS_LABELS,
  featureProposals,
} from '../data/featureProposals';

/** Map tên icon trong data → component icon tương ứng. */
const ICONS = {
  compare: Compare,
  calendar: Calendar,
  truck: Truck,
  gift: Gift,
  creditcard: CreditCard,
  star: Star,
  leaf: Leaf,
  wallet: Wallet,
  headset: Headset,
  shield: Shield,
};

/** Badge tone theo trạng thái tính năng. */
const STATUS_TONES = {
  planning: 'neutral',
  in_progress: 'warning',
  coming_soon: 'info',
};

/** Sắp xếp: ưu tiên cao trước, rồi đang phát triển, rồi kế hoạch. */
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const STATUS_ORDER = { in_progress: 0, planning: 1, coming_soon: 2 };

export function ComingSoonPage() {
  const [searchParams] = useSearchParams();
  const activeSlug = searchParams.get('feature');

  const features = useMemo(
    () =>
      [...featureProposals].sort((a, b) => {
        const statusDiff = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        if (statusDiff !== 0) return statusDiff;
        return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      }),
    [],
  );

  const activeFeature = useMemo(
    () => featureProposals.find((item) => item.slug === activeSlug) ?? null,
    [activeSlug],
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface-page">
      <a href="#main" className="skip-link">
        Bỏ qua tới nội dung chính
      </a>

      <TopBar />
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-line-200 bg-gradient-hero">
          <Container className="py-14 lg:py-20">
            <SectionHeader
              headingLevel="h1"
              eyebrow="Tính năng đang được cập nhật"
              title="Roadmap tính năng mới"
              description="Đây là các tính năng đang được xây dựng và sẽ ra mắt trong các phiên bản tiếp theo. Chúng tôi thường xuyên cập nhật tiến độ tại đây."
            />
          </Container>
        </section>

        {/* Tính năng đang chọn (nếu có) */}
        {activeFeature ? (
          <section className="border-b border-line-200 bg-surface-card">
            <Container className="py-10">
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 lg:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONES[activeFeature.status] ?? 'neutral'}>
                    {FEATURE_STATUS_LABELS[activeFeature.status] ?? 'Đang cập nhật'}
                  </Badge>
                  <Badge tone="brand">
                    {FEATURE_PRIORITY_LABELS[activeFeature.priority] ?? 'Ưu tiên trung bình'}
                  </Badge>
                  <span className="text-xs text-ink-500">ETA: {activeFeature.eta}</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
                  {activeFeature.name}
                </h2>
                <p className="mt-2 max-w-container-prose text-sm text-ink-700 text-pretty">
                  {activeFeature.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link to="/" className="btn btn-secondary">
                    Quay lại cửa hàng
                  </Link>
                  <a href="#roadmap" className="btn btn-ghost">
                    Xem toàn bộ roadmap
                  </a>
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {/* Grid tính năng */}
        <section id="roadmap" className="scroll-mt-24">
          <Container className="py-14 lg:py-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = ICONS[feature.icon] ?? Shield;
                return (
                  <article
                    key={feature.slug}
                    className="flex flex-col rounded-2xl border border-line-200 bg-surface-card p-6 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-5 w-5" />
                    </span>

                    <h3 className="mt-4 text-lg font-semibold text-ink-900">{feature.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-ink-500 text-pretty">
                      {feature.description}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">Tính năng đang được cập nhật</Badge>
                      <Badge tone={STATUS_TONES[feature.status] ?? 'neutral'}>
                        {FEATURE_STATUS_LABELS[feature.status] ?? 'Đang cập nhật'}
                      </Badge>
                      <Badge tone="neutral">ETA: {feature.eta}</Badge>
                    </div>

                    <Link
                      to={`/coming-soon?feature=${feature.slug}`}
                      className="mt-5 inline-flex items-center text-sm font-semibold text-brand-600 transition-colors duration-150 hover:text-brand-700"
                    >
                      Xem chi tiết →
                    </Link>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

export default ComingSoonPage;
