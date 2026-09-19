import { NextResponse } from "next/server";

type GeocodeResult = { area: string; city: string; detail: string };
type LocationGlobals = typeof globalThis & { zaplyGeocodeCache?: Map<string, GeocodeResult>; zaplyLastGeocodeAt?: number };

const shared = globalThis as LocationGlobals;
const cache = shared.zaplyGeocodeCache ??= new Map<string, GeocodeResult>();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = Number(url.searchParams.get("lat"));
  const longitude = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return NextResponse.json({ ...cached, cached: true });

  const sinceLastRequest = Date.now() - (shared.zaplyLastGeocodeAt ?? 0);
  if (sinceLastRequest < 1100) await new Promise((resolve) => setTimeout(resolve, 1100 - sinceLastRequest));
  shared.zaplyLastGeocodeAt = Date.now();

  try {
    const endpoint = process.env.GEOCODING_REVERSE_URL ?? "https://nominatim.openstreetmap.org/reverse";
    const target = new URL(endpoint);
    target.searchParams.set("format", "jsonv2");
    target.searchParams.set("lat", String(latitude));
    target.searchParams.set("lon", String(longitude));
    target.searchParams.set("zoom", "14");
    target.searchParams.set("addressdetails", "1");
    target.searchParams.set("accept-language", "en");
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Pico/1.0 (+https://github.com/rushikesh0022/WemakeDev)",
        "Accept-Language": "en"
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);
    const data = await response.json();
    const address = data.address ?? {};
    const area = address.suburb ?? address.neighbourhood ?? address.city_district ?? address.village ?? address.town ?? address.city ?? "Current location";
    const city = address.city ?? address.town ?? address.municipality ?? address.state_district ?? address.state ?? "";
    const result = { area, city, detail: [area, city, address.state].filter((part, index, values) => part && values.indexOf(part) === index).join(", ") };
    cache.set(key, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "We could not identify this location. Enter the area manually instead." }, { status: 502 });
  }
}
