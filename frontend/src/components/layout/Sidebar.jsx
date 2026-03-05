import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useUIStore from '../../stores/uiStore';
import { fetchPlans } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (Number.isNaN(seconds) || seconds < 0) return '';
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

function StatusBadge({ status }) {
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Going ✈️
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Planning
    </span>
  );
}

function TripRow({ plan, onClick }) {
  const pending = plan.pending_suggestions ?? plan.suggestion_count ?? 0;
  const origin = plan.origin_city || '';
  const dest = plan.destination_city || '';
  const label =
    origin && dest ? `${origin} → ${dest}` : plan.title || origin || dest || 'Trip';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors cursor-pointer flex items-start gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {label}
          </p>
          {pending > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-brand-500 flex-shrink-0">
              🔔
              <span className="font-semibold">{pending}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[11px] text-[var(--text-muted)]">
            {timeAgo(plan.created_at || plan.start_date)}
          </span>
          <StatusBadge status={plan.status} />
        </div>
      </div>
    </button>
  );
}

function ExpandedSidebarContent({ plans, onNavigate, onCollapse }) {
  const location = useLocation();
  const navigate = useNavigate();

  // IMPORTANT: keep selectors stable (no new object each render),
  // otherwise Zustand/React can warn about getSnapshot and trigger rerender loops.
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const { isDark, toggle } = useTheme();

  const { recentChats, savedTrips } = useMemo(() => {
    const all = Array.isArray(plans) ? plans : [];
    const planning = all
      .filter((p) => p.status !== 'saved')
      .sort(
        (a, b) =>
          new Date(b.created_at || b.start_date || 0) -
          new Date(a.created_at || a.start_date || 0),
      )
      .slice(0, 10);
    const saved = all
      .filter((p) => p.status === 'saved')
      .sort(
        (a, b) =>
          new Date(b.created_at || b.start_date || 0) -
          new Date(a.created_at || a.start_date || 0),
      )
      .slice(0, 10);
    return { recentChats: planning, savedTrips: saved };
  }, [plans]);

  const tripsRemaining =
    profile?.trips_remaining ?? profile?.tripsRemaining ?? null;

  const handleNewTrip = () => {
    navigate('/new');
    onNavigate?.();
  };

  const handleGoSettings = () => {
    navigate('/settings');
    onNavigate?.();
  };

  const handleGoTrip = (plan) => {
    const path = plan.status === 'saved' ? `/trip/${plan.id}` : `/plan/${plan.id}`;
    if (location.pathname !== path) {
      navigate(path);
    }
    onNavigate?.();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={handleNewTrip}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-brand hover:from-brand-600 hover:to-brand-700 active:scale-[0.97] transition-all cursor-pointer"
        >
          <span>✨</span>
          <span>New Trip</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-5">
        <section>
          <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Recent Chats
          </h2>
          {recentChats.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-1">
              Start a trip to see it here.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recentChats.map((plan) => (
                <TripRow
                  key={plan.id}
                  plan={plan}
                  onClick={() => handleGoTrip(plan)}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Saved Trips
          </h2>
          {savedTrips.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-1">
              Save a trip to pin it here.
            </p>
          ) : (
            <div className="space-y-1.5">
              {savedTrips.map((plan) => (
                <TripRow
                  key={plan.id}
                  plan={plan}
                  onClick={() => handleGoTrip(plan)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="border-t border-[var(--border)] px-3 py-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <button
            type="button"
            onClick={handleGoSettings}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={toggle}
            className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-sm hover:bg-[var(--surface-hover)] cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="px-0 py-1 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
          <span>
            💳 {tripsRemaining ?? 0} trips left
          </span>
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] text-[var(--text-secondary)] hover:text-red-500 cursor-pointer"
            >
              Log out
            </button>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCollapse}
            className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
          >
            ◀
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useUIStore((s) => s.setSidebarExpanded);

  const [plans, setPlans] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        if (!cancelled && !data?.error) {
          setPlans(data.plans || []);
        }
      } catch {
        // ignore for now
      }
    };
    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const isCollapsed = !sidebarExpanded;

  const handleNav = (to) => {
    if (!to) return;
    if (location.pathname !== to) {
      navigate(to);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-white dark:bg-[var(--surface)]">
        {isCollapsed ? (
          <div className="flex flex-col items-center py-4 w-[var(--sidebar-collapsed)]">
            {/* Collapsed rail icons */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleNav('/')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Home"
              >
                🏠
              </button>
              <button
                type="button"
                onClick={() => handleNav('/new')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="New Trip"
              >
                ➕
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Recent Chats"
              >
                💬
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="My Plans"
              >
                📋
              </button>
            </div>
            {/* Dev shortcut + expand button */}
            <div className="mt-4 flex flex-col items-center gap-3">
              <a
                href="/plan/mock"
                className="text-[10px] text-[var(--text-muted)] hover:text-brand-500"
              >
                [Mock Trip]
              </a>
              <button
                type="button"
                onClick={() => setSidebarExpanded(true)}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                title="Expand"
              >
                ▶
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[var(--sidebar-expanded)] h-full">
            <ExpandedSidebarContent
              plans={plans}
              onNavigate={() => {}}
              onCollapse={() => setSidebarExpanded(false)}
            />
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {sidebarExpanded && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarExpanded(false)}
          >
            {/* scrim */}
          </button>
          <div className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] md:hidden transform translate-x-0 transition-transform duration-300 ease-out bg-white dark:bg-[var(--surface)] border-r border-[var(--border)] shadow-xl">
            <ExpandedSidebarContent
              plans={plans}
              onNavigate={() => setSidebarExpanded(false)}
              onCollapse={() => setSidebarExpanded(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

