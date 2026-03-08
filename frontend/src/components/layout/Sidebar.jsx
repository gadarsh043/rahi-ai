import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import { fetchPlans } from '../../services/api';

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

  const handleNewTrip = () => {
    navigate('/new');
    onNavigate?.();
  };

  const handleGoTrip = (plan) => {
    const path = plan.status === 'saved' ? `/trip/${plan.id}` : `/plan/${plan.id}`;
    if (location.pathname !== path) {
      navigate(path);
    }
    onNavigate?.();
  };

  const handleGoHome = () => {
    navigate('/');
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border)] space-y-3">
        <button
          type="button"
          onClick={handleGoHome}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
        >
          <span className="text-base">🏠</span>
          <span>Home</span>
        </button>
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

      <div className="border-t border-[var(--border)] px-3 py-3 flex justify-end">
        <button
          type="button"
          onClick={onCollapse}
          className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
        >
          ◀
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const sidebarExpanded = useUIStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useUIStore((s) => s.setSidebarExpanded);

  const [plans, setPlans] = useState([]);

  // Re-fetch plans when sidebar opens or route changes so the list stays in sync
  useEffect(() => {
    if (!sidebarExpanded) return;
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
  }, [sidebarExpanded, location.pathname]);

  // Hide entire sidebar for logged-out users
  if (!user) return null;

  const isPlanPage = location.pathname.startsWith('/plan') || location.pathname.startsWith('/trip');

  return (
    <>
      {/* Floating toggle — visible when sidebar is closed, hidden on plan pages (TopBar has it) */}
      {!sidebarExpanded && !isPlanPage && (
        <button
          type="button"
          onClick={() => setSidebarExpanded(true)}
          className="fixed left-3 top-1/2 -translate-y-1/2 z-[var(--z-topbar)] w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] shadow-md transition-all duration-150 ease-out cursor-pointer"
          aria-label="Open sidebar"
        >
          ☰
        </button>
      )}

      {/* Sidebar drawer — same on mobile & desktop */}
      {sidebarExpanded && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[var(--z-overlay-backdrop)] bg-black/40"
            onClick={() => setSidebarExpanded(false)}
          >
            {/* scrim */}
          </button>
          <div className="fixed top-0 left-0 bottom-0 z-[var(--z-overlay)] w-[85vw] max-w-[320px] transform translate-x-0 transition-transform duration-250 ease-out bg-white dark:bg-[var(--surface)] border-r border-[var(--border)] shadow-xl">
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

