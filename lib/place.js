// Finding where you are: device location, reverse lookup to a city name, and city search.
// Lookups go to two free services with no account or key: BigDataCloud (coordinates to city) and
// Open-Meteo (city search). Only rounded coordinates (about 1 km) or the typed city name are sent.
export function here() {
  return new Promise((res, rej) => navigator.geolocation.getCurrentPosition(
    p => res({ lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4) }), rej, { timeout: 15000, maximumAge: 30 * 60000 }));
}
// Fetch JSON with a timeout; throws on network errors, non-2xx responses and non-JSON bodies, so callers
// never mistake an error page for "no country" (which would quietly switch the calculation method).
async function getJSON(u, ms = 8000) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(u, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(timer); }
}
export async function cityAt(lat, lng, lang = 'en') {
  // Only a rough position (2 decimals, about 1 km) leaves your computer; that's plenty to name the city.
  const u = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}&localityLanguage=${encodeURIComponent(lang)}`;
  const j = await getJSON(u);
  if (!/^[A-Z]{2}$/.test(j?.countryCode || '')) throw new Error('no country for these coordinates');
  const city = j.city || j.locality || j.principalSubdivision || '';
  const region = j.countryCode === 'US' ? (j.principalSubdivisionCode || '').replace('US-', '') : j.countryName;
  return { place: [city, region].filter(Boolean).join(', ') || `${lat}, ${lng}`, cc: j.countryCode || '' };
}
export async function searchCity(q, lang = 'en') {
  const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${encodeURIComponent(lang)}&format=json`;
  const j = await getJSON(u);
  return (Array.isArray(j?.results) ? j.results : []).filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude)).map(r => ({
    place: [r.name, r.country_code === 'US' ? r.admin1 : r.country].filter(Boolean).join(', '),
    detail: [r.admin1, r.country].filter(Boolean).join(', '),
    lat: +r.latitude.toFixed(4), lng: +r.longitude.toFixed(4), cc: r.country_code || '',
  }));
}
// Distance in km between two points.
export function km(a, b) {
  const R = 6371, t = x => x * Math.PI / 180, dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
