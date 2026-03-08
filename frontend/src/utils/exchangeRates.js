const CACHE_KEY = 'rahify-fx-rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let ratesPromise = null;

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { rates, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL && rates) return rates;
  } catch {
    // ignore
  }
  return null;
}

function setCache(rates) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }));
  } catch {
    // ignore
  }
}

export async function fetchRates() {
  const cached = getCached();
  if (cached) return cached;

  // Deduplicate concurrent calls
  if (ratesPromise) return ratesPromise;

  ratesPromise = (async () => {
    try {
      const resp = await fetch('https://api.frankfurter.app/latest?from=USD');
      if (!resp.ok) return null;
      const data = await resp.json();
      const rates = { USD: 1, ...data.rates };
      setCache(rates);
      return rates;
    } catch {
      return null;
    } finally {
      ratesPromise = null;
    }
  })();

  return ratesPromise;
}

export function convertAmount(amountUSD, rate) {
  if (!rate || rate === 1) return amountUSD;
  return Math.round(amountUSD * rate);
}
