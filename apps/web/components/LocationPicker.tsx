"use client";

import { Check, ChevronDown, LocateFixed, MapPin, Navigation, X, Zap } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { store } from "@/lib/store";

type SavedLocation = { label: "Home" | "Work" | "Current location"; area: string; detail: string; source: "gps" | "manual" | "account" };

function neighbourhoodFromAddress(line1: string, city: string) {
  const parts = line1.split(",").map((part) => part.trim()).filter(Boolean);
  const neighbourhood = [...parts].reverse().find((part) => !/^\d/.test(part));
  return neighbourhood || city;
}

export function LocationPicker() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [accountLocation, setAccountLocation] = useState<SavedLocation | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [manualLabel, setManualLabel] = useState<"Home" | "Work">("Home");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nesto-delivery-location") || window.localStorage.getItem("zaply-delivery-location");
      if (saved) setLocation(JSON.parse(saved));
    } catch { /* Ignore invalid local data. */ }
    fetch("/api/auth/session").then((response) => response.json()).then(({ address }) => {
      if (!address) return;
      setAccountLocation({ label: "Home", area: neighbourhoodFromAddress(address.line1, address.city) || address.label, detail: `${address.line1}, ${address.city} ${address.pincode}`.trim(), source: "account" });
    }).catch(() => undefined);
  }, []);

  function save(next: SavedLocation) {
    setLocation(next);
    window.localStorage.setItem("nesto-delivery-location", JSON.stringify(next));
    setError("");
    setOpen(false);
  }

  function detectLocation() {
    setError("");
    if (!navigator.geolocation) return setError("Location detection is not supported by this browser.");
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`/api/location/reverse?lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        save({ label: "Current location", area: data.area, detail: data.detail, source: "gps" });
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Location lookup failed.");
      } finally {
        setDetecting(false);
      }
    }, (positionError) => {
      setDetecting(false);
      setError(positionError.code === 1 ? "Location permission was denied. Enter your area manually." : "We could not detect your location. Try again or enter it manually.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const area = String(new FormData(event.currentTarget).get("area") ?? "").trim();
    if (area.length < 3) return setError("Enter your neighbourhood and city.");
    save({ label: manualLabel, area: area.split(",")[0].trim(), detail: area, source: "manual" });
  }

  return (
    <div className="location-picker">
      <button className="location-trigger" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <MapPin className="location-trigger__pin" />
        <span><small>Deliver to</small><strong>{location ? `${location.label} · ${location.area}` : "Choose delivery location"}<ChevronDown /></strong></span>
        <b><Zap /> {store.eta}</b>
      </button>
      {open && <><button className="location-backdrop" aria-label="Close location picker" onClick={() => setOpen(false)} /><section className="location-panel" role="dialog" aria-modal="true" aria-labelledby="location-title">
        <header><div><span>DELIVERY LOCATION</span><h2 id="location-title">Where should we deliver?</h2></div><button aria-label="Close" onClick={() => setOpen(false)}><X /></button></header>
        <button className="detect-location" onClick={detectLocation} disabled={detecting}><LocateFixed /><span><strong>{detecting ? "Finding your location…" : "Use my current location"}</strong><small>Allow GPS access for suburb-level detection</small></span><Navigation /></button>
        {accountLocation && <button className="saved-location" onClick={() => save(accountLocation)}><MapPin /><span><strong>Use saved home address</strong><small>{accountLocation.detail}</small></span><Check /></button>}
        <div className="location-divider"><span>or enter it manually</span></div>
        <form onSubmit={submitManual}>
          <div className="location-labels"><button type="button" className={manualLabel === "Home" ? "active" : ""} onClick={() => setManualLabel("Home")}>Home</button><button type="button" className={manualLabel === "Work" ? "active" : ""} onClick={() => setManualLabel("Work")}>Work</button></div>
          <label>Neighbourhood and city<input name="area" placeholder="HSR Layout, Bengaluru" autoComplete="street-address" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="save-location">Save delivery location</button>
        </form>
        <footer>Location data © OpenStreetMap contributors</footer>
      </section></>}
    </div>
  );
}
