import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useTripStore from '../../../stores/tripStore';
import { apiPost } from '../../../services/apiClient';
import { toast } from '../../common/Toast/Toast';
import { trackEvent } from '../../../services/posthog';

const PICK_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍽' },
  { id: 'hotel', label: 'Hotels', icon: '🏠' },
  { id: 'attraction', label: 'Attractions', icon: '📍' },
];

export default function LetsPickPopup() {
  const trip = useTripStore((s) => s.trip);
  const letsPickOpen = useTripStore((s) => s.letsPickOpen);
  const toggleLetsPick = useTripStore((s) => s.toggleLetsPick);
  const setTrip = useTripStore((s) => s.setTrip);
  const addPendingChange = useTripStore((s) => s.addPendingChange);
  const removePlace = useTripStore((s) => s.removePlace);
  const addPlaceToItinerary = useTripStore((s) => s.addPlaceToItinerary);
  const isDemo = useTripStore((s) => s.isDemo);

  const allPlaces = trip?.places || [];

  const initialSelected = useMemo(
    () => new Set(allPlaces.filter((p) => p.isInItinerary).map((p) => p.id)),
    [allPlaces]
  );

  const [activeCategory, setActiveCategory] = useState('restaurant');
  const [selectedIds, setSelectedIds] = useState(initialSelected);

  // Re-sync selection whenever the popup opens or places change
  useEffect(() => {
    if (letsPickOpen) {
      setSelectedIds(initialSelected);
    }
  }, [letsPickOpen, initialSelected]);
  const [customPlace, setCustomPlace] = useState({
    url: '',
    name: '',
    category: 'restaurant',
  });
  const [customPlaces, setCustomPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!letsPickOpen || !trip) return null;

  const togglePlace = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustom = () => {
    const name = customPlace.name.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    setCustomPlaces((prev) => [...prev, { ...customPlace, id }]);
    setSelectedIds((prev) => new Set(prev).add(id));
    setCustomPlace((prev) => ({ ...prev, name: '', url: '' }));
  };

  const handleDone = async () => {
    if (!trip) return;
    if (isDemo) {
      toggleLetsPick();
      toast.info('Demo mode: generate a real trip to rebuild your itinerary.');
      return;
    }

    // Find what changed vs the original itinerary state
    const added = allPlaces.filter((p) => selectedIds.has(p.id) && !p.isInItinerary);
    const removed = allPlaces.filter((p) => !selectedIds.has(p.id) && p.isInItinerary);

    if (added.length === 0 && removed.length === 0 && customPlaces.length === 0) {
      toggleLetsPick();
      return;
    }

    const addedCount = added.length + customPlaces.length;
    const removedCount = removed.length;
    trackEvent('lets_pick_completed', {
      trip_id: trip.id,
      added: addedCount,
      removed: removedCount,
    });

    // Update local trip state + record pending changes
    for (const p of removed) {
      const gpid = p.googlePlaceId || p.google_place_id;
      removePlace(p.id);
      addPendingChange({ action: 'remove', place_id: gpid, name: p.name });
    }
    for (const p of added) {
      const gpid = p.googlePlaceId || p.google_place_id;
      addPlaceToItinerary(p.id);
      addPendingChange({ action: 'add', place_id: gpid, name: p.name });
    }
    for (const p of customPlaces) {
      addPendingChange({ action: 'add', name: p.name, custom: true });
    }

    // Persist selection changes to DB so rebuild can read them
    try {
      await apiPost(`/plans/${trip.id}/update-picks`, {
        selected_place_ids: allPlaces
          .filter((p) => selectedIds.has(p.id))
          .map((p) => p.googlePlaceId || p.google_place_id)
          .filter(Boolean),
        removed_place_ids: removed
          .map((p) => p.googlePlaceId || p.google_place_id)
          .filter(Boolean),
        custom_additions: customPlaces.map((p) => ({
          url: p.url,
          label: p.category,
          name: p.name,
        })),
      }, { context: 'pick', silent: true });
    } catch {
      // Best-effort — rebuild will still work with local state
    }

    toggleLetsPick();
    const total = added.length + removed.length + customPlaces.length;
    toast.success(`${total} change${total !== 1 ? 's' : ''} queued — hit Rebuild when ready.`);
  };

  const placesForCategory = allPlaces.filter((p) => p.category === activeCategory);

  const selectedCountForCategory = (categoryId) =>
    Array.from(selectedIds).filter((id) =>
      allPlaces.some((p) => p.id === id && p.category === categoryId)
    ).length;

  const renderPlaceRow = (place, isCustom = false) => (
    <div
      key={place.id}
      className="flex items-center gap-4 p-4 border-b border-[var(--border)]"
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => togglePlace(place.id)}
        className="flex-shrink-0"
      >
        {selectedIds.has(place.id) ? (
          <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center text-xs text-white">
            ✓
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md border-2 border-[var(--border)]" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[var(--text-primary)] truncate">
            {place.name}
          </h3>
          {isCustom && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)]">
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          {place.rating && (
            <span className="text-brand-500 font-medium">★ {place.rating}</span>
          )}
          {place.address && (
            <span>
              · {place.address.split(',')[1]?.trim() || place.address}
            </span>
          )}
        </div>
        {place.description && (
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
            {place.description}
          </p>
        )}
      </div>

      {/* Photo */}
      {place.photoUrl && (
        <img
          src={place.photoUrl}
          alt={place.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      )}

      {/* Details link */}
      {place.googleMapsUrl && (
        <a
          href={place.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--text-muted)] hover:text-brand-500 flex-shrink-0"
        >
          Details →
        </a>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {letsPickOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[var(--z-modal)] bg-black/40 flex items-center justify-center px-3"
        >
          <div className="flex flex-col w-full h-full max-w-5xl lg:h-[80vh] bg-[var(--bg)] rounded-none lg:rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">
                    Your Places
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Pick what goes into your final itinerary.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDone}
                disabled={loading}
                className="px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? 'Working…' : 'Done ✓'}
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* Left: categories */}
              <aside className="hidden md:flex w-40 border-r border-[var(--border)] bg-[var(--surface)] p-3 flex-col gap-1">
              {PICK_CATEGORIES.map((cat) => {
                const count = selectedCountForCategory(cat.id);
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-white'
                        : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20' : 'bg-[var(--surface-hover)]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </aside>

              {/* Right: place list */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex md:hidden border-b border-[var(--border)] px-4 py-2 gap-2 overflow-x-auto scrollbar-hide">
                  {PICK_CATEGORIES.map((cat) => {
                    const count = selectedCountForCategory(cat.id);
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'bg-brand-500 text-white'
                            : 'bg-[var(--surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label}
                        {count > 0 && (
                          <span className="ml-1 text-[10px] opacity-80">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto momentum-scroll">
                {placesForCategory.map((place) => renderPlaceRow(place))}
                {customPlaces
                  .filter((p) => p.category === activeCategory)
                  .map((place) => renderPlaceRow(place, true))}
              </div>

              {/* Add custom place */}
              <div className="border-t border-[var(--border)] p-4 space-y-2 bg-[var(--surface)]">
                <button
                  type="button"
                  className="text-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  + Add Custom Place
                </button>
                <div className="flex flex-wrap gap-2 mt-1">
                  <input
                    type="text"
                    value={customPlace.url}
                    onChange={(e) =>
                      setCustomPlace((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="Google Maps URL"
                    className="flex-1 min-w-[140px] text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    value={customPlace.name}
                    onChange={(e) =>
                      setCustomPlace((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Place name"
                    className="flex-1 min-w-[140px] text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <select
                    value={customPlace.category}
                    onChange={(e) =>
                      setCustomPlace((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1 outline-none"
                  >
                    {PICK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 active:scale-95 transition-transform"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

