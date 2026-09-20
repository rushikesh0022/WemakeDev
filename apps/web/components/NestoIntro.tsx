"use client";

import { useEffect, useState } from "react";

export function NestoIntro() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("nesto-intro-seen")) return;
    setVisible(true);
    window.sessionStorage.setItem("nesto-intro-seen", "1");
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1900);
    const closeTimer = window.setTimeout(() => setVisible(false), 2450);
    return () => { window.clearTimeout(leaveTimer); window.clearTimeout(closeTimer); };
  }, []);

  if (!visible) return null;
  return <div className={`nesto-intro${leaving ? " is-leaving" : ""}`} aria-label="Zaply is loading">
    <button onClick={() => { setLeaving(true); window.setTimeout(() => setVisible(false), 420); }}>Skip</button>
    <div className="nesto-intro__halo" aria-hidden="true" />
    <img src="/nesto/motion/intro-bag-v2.webp" alt="" />
    <div className="nesto-intro__copy"><span>zaply</span><strong>Everything you need.</strong><small>Almost already there.</small></div>
    <div className="nesto-intro__loader" aria-hidden="true"><i /></div>
  </div>;
}
