// src/pages/RoadmapPage.jsx
// Public roadmap at /roadmap — ref-measured SVG path connecting real card positions.
// Tailwind v4 only. No SCSS, no CSS modules, no inline style objects.

import { useState, useCallback, useEffect, useRef } from 'react';
import { Heart, Check } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import roadmapFeatures from '../data/roadmapFeatures';
import { apiGet, apiPost } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────

const getSide = (globalIndex) => (globalIndex % 2 === 0 ? 'left' : 'right');

// Build a smooth cubic-bezier path through {x, y} points.
// Each segment creates a gentle S-curve by placing control points
// at ~40% of the vertical distance, keeping horizontal departure/arrival.
function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dy = curr.y - prev.y;
    const cp1x = prev.x;
    const cp1y = prev.y + dy * 0.4;
    const cp2x = curr.x;
    const cp2y = curr.y - dy * 0.4;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }
  return d;
}

// ─── ZigzagPath: single SVG sized to container ───────────────

function ZigzagPath({ pathData }) {
  if (!pathData.fullPath) return null;
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      <defs>
        <linearGradient id="rmap-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#F97316" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.2" />
        </linearGradient>
        <filter id="rmap-glow" x="-20%" y="-5%" width="140%" height="110%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main dashed path: shipped → building → upcoming */}
      <path
        d={pathData.fullPath}
        stroke="url(#rmap-grad)"
        strokeWidth="3"
        strokeDasharray="12,10"
        fill="none"
      />

      {/* Building Now glow overlay */}
      {pathData.buildingPath && (
        <path
          d={pathData.buildingPath}
          stroke="#F97316"
          strokeWidth="5"
          strokeDasharray="14,7"
          fill="none"
          filter="url(#rmap-glow)"
          opacity="0.65"
        />
      )}
    </svg>
  );
}

// ─── Mobile vertical dashed line ──────────────────────────────

function MobilePath() {
  return (
    <div
      className="md:hidden absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none"
      aria-hidden
      style={{
        width: '2px',
        backgroundImage:
          'repeating-linear-gradient(to bottom, #F97316 0px, #F97316 8px, transparent 8px, transparent 18px)',
        opacity: 0.22,
      }}
    />
  );
}

// ─── Zone header ──────────────────────────────────────────────

function ZoneHeader({ emoji, title }) {
  return (
    <div className="text-center py-10 md:py-14 relative z-10">
      <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] inline-flex items-center gap-2.5">
        <span>{emoji}</span> {title}
      </h2>
    </div>
  );
}

// ─── Shipped card ─────────────────────────────────────────────

function ShippedCard({ item, side, cardRef }) {
  return (
    <div
      ref={cardRef}
      className={`flex justify-center ${
        side === 'left' ? 'md:justify-start md:pl-[8%]' : 'md:justify-end md:pr-[8%]'
      }`}
    >
      <div className="relative w-full max-w-[360px] md:w-[320px]">
        <div className="absolute -top-2.5 -right-2.5 z-20">
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0" aria-hidden>{item.emoji}</span>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)] opacity-60">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Shipped {item.shippedDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Building Now card ────────────────────────────────────────

function BuildingCard({ item, side, cardRef }) {
  return (
    <div
      ref={cardRef}
      className={`flex justify-center ${
        side === 'left' ? 'md:justify-start md:pl-[8%]' : 'md:justify-end md:pr-[8%]'
      }`}
    >
      <div className="relative w-full max-w-[360px] md:w-[320px]">
        <div className="absolute -top-1.5 -right-1.5 z-20">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-50" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-brand-500" />
          </span>
        </div>
        <div className="bg-[var(--surface)] border-2 border-brand-500 rounded-2xl p-5 shadow-sm shadow-brand-500/10 transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden>{item.emoji}</span>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feature card (Up Next / Exploring) ───────────────────────

function FeatureCard({
  item,
  side,
  hearted,
  heartCount,
  onHeart,
  isLoggedIn,
  onLoginRequired,
  faded = false,
  cardRef,
}) {
  const [animating, setAnimating] = useState(false);

  const handleHeart = () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setAnimating(true);
    onHeart(item.id);
    setTimeout(() => setAnimating(false), 300);
  };

  const count = heartCount;

  return (
    <div
      ref={cardRef}
      className={`flex justify-center ${
        side === 'left' ? 'md:justify-start md:pl-[8%]' : 'md:justify-end md:pr-[8%]'
      }`}
    >
      <div
        className={`w-full max-w-[360px] md:w-[320px] transition-opacity ${
          faded ? 'opacity-70 hover:opacity-100' : ''
        }`}
      >
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 transition-shadow hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0" aria-hidden>{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleHeart}
              className="flex items-center gap-1.5 group cursor-pointer"
              aria-label={hearted ? 'Remove heart' : 'Heart this feature'}
            >
              <Heart
                className={`w-[18px] h-[18px] transition-all duration-200 ${
                  hearted
                    ? 'fill-brand-500 text-brand-500'
                    : 'text-[var(--text-muted)] group-hover:text-brand-400'
                } ${animating ? 'scale-125' : 'scale-100'}`}
              />
              <span
                className={`text-sm font-medium transition-colors ${
                  hearted ? 'text-brand-500' : 'text-[var(--text-muted)]'
                }`}
              >
                {count}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Login toast ──────────────────────────────────────────────

function LoginToast({ show }) {
  if (!show) return null;
  return (
    <div className="fixed top-20 right-6 z-50 bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-[fadeSlideIn_0.2s_ease-out]">
      Sign in to vote on features
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function RoadmapPage() {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  const [heartCounts, setHeartCounts] = useState({});
  const [userHearts, setUserHearts] = useState(() => new Set());
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [pathData, setPathData] = useState({ fullPath: '', buildingPath: '' });

  // Fetch counts + user hearts on mount
  useEffect(() => {
    async function fetchHearts() {
      try {
        const data = await apiGet('/roadmap/hearts');
        setHeartCounts(data.counts || {});
        setUserHearts(new Set(data.user_hearts || []));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch roadmap hearts:', err);
        // Fallback to localStorage for user hearts only
        try {
          const local = JSON.parse(localStorage.getItem('rahify-roadmap-hearts') || '{}');
          const ids = Object.keys(local).filter((k) => local[k]);
          setUserHearts(new Set(ids));
        } catch {
          // ignore
        }
      }
    }
    fetchHearts();
  }, []);

  // Toggle — optimistic UI then API
  const toggleHeart = useCallback(async (featureId) => {
    const wasHearted = userHearts.has(featureId);

    // Optimistic userHearts
    setUserHearts((prev) => {
      const next = new Set(prev);
      if (wasHearted) next.delete(featureId);
      else next.add(featureId);
      return next;
    });

    // Optimistic counts
    setHeartCounts((prev) => ({
      ...prev,
      [featureId]: Math.max(0, (prev[featureId] || 0) + (wasHearted ? -1 : 1)),
    }));

    // LocalStorage fallback
    try {
      const local = JSON.parse(localStorage.getItem('rahify-roadmap-hearts') || '{}');
      local[featureId] = !wasHearted;
      localStorage.setItem('rahify-roadmap-hearts', JSON.stringify(local));
    } catch {
      // ignore
    }

    // API call
    try {
      const data = await apiPost(`/roadmap/hearts/${featureId}`);
      setHeartCounts((prev) => ({ ...prev, [featureId]: data.count }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle heart:', err);
    }
  }, [userHearts]);

  const handleLoginRequired = useCallback(() => {
    setShowLoginToast(true);
    setTimeout(() => setShowLoginToast(false), 2500);
  }, []);

  // ─── Data ───────────────────────────────────────────────────
  const shipped = roadmapFeatures.shipped;
  const building = roadmapFeatures.building;
  const upcoming = roadmapFeatures.upcoming;
  const exploring = roadmapFeatures.exploring;

  // Only shipped + building + upcoming get connected by the path
  const connectedCount = shipped.length + building.length + upcoming.length;

  // ─── Refs ───────────────────────────────────────────────────
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  if (cardRefs.current.length !== connectedCount) {
    cardRefs.current = Array(connectedCount).fill(null);
  }

  // ─── Measure card positions → generate SVG path ─────────────
  const computePath = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop || 0;
    const points = [];

    cardRefs.current.forEach((ref, i) => {
      if (!ref) return;
      // Find the inner card div (with rounded-2xl)
      const cardEl = ref.querySelector('div > div[class*="rounded-2xl"]') || ref.firstElementChild || ref;
      const r = cardEl.getBoundingClientRect();
      const side = getSide(i);

      // Anchor at the edge of the card facing the center, vertically centered
      const x = side === 'left'
        ? (r.right - cRect.left) + 14   // 14px gap from card edge
        : (r.left - cRect.left) - 14;
      const y = (r.top - cRect.top) + scrollTop + r.height / 2;

      points.push({ x, y });
    });

    if (points.length < 2) return;

    const fullPath = buildSmoothPath(points);

    // Building glow: from last shipped card through building cards
    const bStart = Math.max(0, shipped.length - 1);
    const bEnd = Math.min(points.length - 1, shipped.length + building.length);
    const bPoints = points.slice(bStart, bEnd + 1);
    const buildingPath = bPoints.length >= 2 ? buildSmoothPath(bPoints) : '';

    setPathData({ fullPath, buildingPath });
  }, [shipped.length, building.length]);

  // Compute on mount, resize, and after layout settles
  useEffect(() => {
    const timers = [
      setTimeout(computePath, 50),
      setTimeout(computePath, 300),  // re-measure after fonts/images load
    ];

    const ro = new ResizeObserver(computePath);
    if (containerRef.current) ro.observe(containerRef.current);

    window.addEventListener('resize', computePath);
    return () => {
      timers.forEach(clearTimeout);
      ro.disconnect();
      window.removeEventListener('resize', computePath);
    };
  }, [computePath]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ─── Global index counter for zigzag ────────────────────────
  let gi = 0;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <LoginToast show={showLoginToast} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/[0.06] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-16 text-center">
          <h1 className="text-4xl md:text-[3.5rem] font-extrabold text-[var(--text-primary)] leading-tight">
            Where we&apos;re headed
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] mt-4">
            Our roadmap — built with your input.
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-3">
            Heart the features you&apos;re most excited about.
          </p>
        </div>
      </section>

      {/* Roadmap */}
      <section ref={containerRef} className="relative max-w-5xl mx-auto px-6 pb-20">
        <MobilePath />
        <ZigzagPath pathData={pathData} />

        <div className="relative z-10">

          {/* ── SHIPPED ── */}
          <ZoneHeader emoji="🚀" title="Shipped" />
          <div className="space-y-6 md:space-y-28 lg:space-y-36">
            {shipped.map((item) => {
              const idx = gi++;
              return (
                <ShippedCard
                  key={item.id}
                  item={item}
                  side={getSide(idx)}
                  cardRef={(el) => { cardRefs.current[idx] = el; }}
                />
              );
            })}
          </div>

          {/* ── BUILDING NOW ── */}
          <ZoneHeader emoji="🔨" title="Building Now" />
          <div className="space-y-6 md:space-y-28 lg:space-y-36">
            {building.map((item) => {
              const idx = gi++;
              return (
                <BuildingCard
                  key={item.id}
                  item={item}
                  side={getSide(idx)}
                  cardRef={(el) => { cardRefs.current[idx] = el; }}
                />
              );
            })}
          </div>

          {/* ── UP NEXT ── */}
          <ZoneHeader emoji="💡" title="Up Next" />
          <div className="space-y-6 md:space-y-28 lg:space-y-36">
            {upcoming.map((item) => {
              const idx = gi++;
              return (
                <FeatureCard
                  key={item.id}
                  item={item}
                  side={getSide(idx)}
                  hearted={userHearts.has(item.id)}
                  heartCount={heartCounts[item.id] || 0}
                  onHeart={toggleHeart}
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={handleLoginRequired}
                  cardRef={(el) => { cardRefs.current[idx] = el; }}
                />
              );
            })}
          </div>

          {/* ── EXPLORING (no path, floating cards) ── */}
          <ZoneHeader emoji="🔮" title="Exploring" />
          <div className="space-y-8 md:space-y-20">
            {exploring.map((item) => {
              const idx = gi++;
              return (
                <FeatureCard
                  key={item.id}
                  item={item}
                  side={getSide(idx)}
                  hearted={userHearts.has(item.id)}
                  heartCount={heartCounts[item.id] || 0}
                  onHeart={toggleHeart}
                  isLoggedIn={isLoggedIn}
                  onLoginRequired={handleLoginRequired}
                  faded
                />
              );
            })}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
            Priorities may shift based on your feedback. No dates, no promises — just direction.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-8 text-sm text-[var(--text-muted)]">
            <a href="https://rahify.com" className="hover:text-brand-500 transition-colors">
              © 2026 Rahify
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}