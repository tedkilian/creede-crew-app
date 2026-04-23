import React, { useState, useEffect, useMemo } from "react";

// ==== Data: Creede 100 2026 ====
// Distances from Tempest Adventures course page. Cutoffs per 2026 AS chart.
// Elevation per-segment is estimated from the published 20,822 ft total.
const RACE_START_ISO = "2026-07-25T08:00:00-06:00"; // 8 AM Sat MDT
const RACE_CUTOFF_ISO = "2026-07-26T23:59:00-06:00"; // 40 h later

const SEGMENTS = [
  { n: 0,  name: "Start – Creede",            cumMi: 0,     elev: 8786,  type: "start",   cutoff: null,                         crew: true,  dropBag: false, pacer: false, notes: "Start line behind Kentucky Belle Market. Race begins 8:00 AM Sat." },
  { n: 1,  name: "AS1 Oso Creek",             cumMi: 15.5,  elev: 11900, type: "aid",     cutoff: "2026-07-25T13:30:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "No crew access. Water, aid food. 15.5 mi of climbing to get here." },
  { n: 2,  name: "AS2 Spring Creek Pass",     cumMi: 24.8,  elev: 10898, type: "aid",     cutoff: "2026-07-25T16:00:00-06:00",   crew: true,  dropBag: true,  pacer: false, notes: "First crew stop. Crosses HWY 149. Drop bag #1. Runner should feel like they haven't raced yet." },
  { n: 3,  name: "AS3 Jarosa",                cumMi: 30.35, elev: 12500, type: "aid",     cutoff: "2026-07-25T18:15:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "No crew. Short leg. Stay disciplined on the climb." },
  { n: 4,  name: "AS4 Bent (inbound)",        cumMi: 42.4,  elev: 11600, type: "aid",     cutoff: "2026-07-25T22:00:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "No crew. Last fuel before the 13.35 mi soul-suck to Lost Trail." },
  { n: 5,  name: "AS5 Lost Trail",            cumMi: 55.75, elev: 8786,  type: "aid",     cutoff: "2026-07-26T03:00:00-06:00",   crew: true,  dropBag: true,  pacer: true,  notes: "MAJOR CREW STOP. Pacer pick-up. Lowest point on the course. Consider 15-min nap. Swap headlamp, socks, layers." },
  { n: 6,  name: "AS6 Bent (outbound)",       cumMi: 62.85, elev: 12000, type: "aid",     cutoff: "2026-07-26T07:00:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "Steep muddy climb back up from Lost Trail. This is the hardest cutoff to make. DNF zone." },
  { n: 7,  name: "AS7 Jarosa (outbound)",     cumMi: 74.9,  elev: 12500, type: "aid",     cutoff: "2026-07-26T11:30:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "Dawn to mid-morning. Sun will be back. Hydrate, sunscreen, EAT." },
  { n: 8,  name: "AS8 Spring Creek (out)",    cumMi: 80.45, elev: 10898, type: "aid",     cutoff: "2026-07-26T13:30:00-06:00",   crew: true,  dropBag: true,  pacer: true,  notes: "Crew stop. Mile 80 bonk zone — offer SAVORY food (chips, broth, potatoes). Pacer swap possible." },
  { n: 9,  name: "AS9 Willow Creek",          cumMi: 91.85, elev: 12000, type: "aid",     cutoff: "2026-07-26T17:30:00-06:00",   crew: true,  dropBag: true,  pacer: true,  notes: "Last crew stop. 15 mi to go. Last headlamp check." },
  { n: 10, name: "AS10 McKenzie",             cumMi: 103.05,elev: 10500, type: "aid",     cutoff: "2026-07-26T22:00:00-06:00",   crew: false, dropBag: false, pacer: false, notes: "Last aid before finish. 4 miles home." },
  { n: 11, name: "Finish – Creede",           cumMi: 107.1, elev: 8786,  type: "finish",  cutoff: "2026-07-26T23:59:00-06:00",   crew: true,  dropBag: false, pacer: false, notes: "Kentucky Belle Market. Buckle time." },
];

// Drive legs for crew (between meet-ups)
const DRIVE_LEGS = {
  2:  { from: "Creede Start",        to: "Spring Creek #1", miles: 33.2, minutes: 40,  route: "South on Loma St (0.55 mi), right on HWY 149 east for 32.65 mi. Crew parking just before mile marker 55 at Spring Creek Pass Info Site." },
  5:  { from: "Spring Creek #1",     to: "Lost Trail",      miles: 31.3, minutes: 85,  route: "HWY 149 east 13.1 mi, right on FR 520 for 18.2 mi dirt (Rio Grande Reservoir). Lost Trail AS on the right." },
  8:  { from: "Lost Trail",          to: "Spring Creek #2", miles: 31.3, minutes: 85,  route: "Reverse: FR 520 west 18.2 mi to HWY 149, right on 149." },
  9:  { from: "Spring Creek #2",     to: "Willow Creek",    miles: 10.8, minutes: 30,  route: "HWY 149 east 6.2 mi, left on FR 532 just before North Clear Creek Falls. Small stream crossing, 4.6 mi dirt to 881 trailhead." },
  11: { from: "Willow Creek",        to: "Finish (Creede)", miles: 31.6, minutes: 60,  route: "FR 532 west 4.6 mi, left on HWY 149 for 27 mi to Creede. Left on Loma St, 0.55 mi to Kentucky Belle." },
};

// Aid station crew checklists
const CREW_CHECKLISTS = {
  2: {
    title: "AS2 Spring Creek #1 — first crew touch",
    before: [
      "Be on site by 11:00 AM",
      "Unfold chair, lay tarp, open Bin A (fuel) + Bin B (clothing)",
      "Skratch bottle pre-mixed, cold Coke open",
      "Drop bag #1 unzipped and ready",
      "Sunscreen stick out"
    ],
    onArrival: [
      "Ask ONE question: 'How's your stomach?'",
      "Take vest, refill both flasks",
      "Hand them: grilled cheese + apple slices + half Coke",
      "Reapply sunscreen on face & neck",
      "Check feet ONLY if they mention them"
    ],
    departWith: [
      "Vest on, bib visible",
      "Both flasks full",
      "2 gels in hand",
      "Reminder: 'Next crew is Lost Trail — 30 miles, between 10 PM and 2 AM'"
    ]
  },
  5: {
    title: "AS5 Lost Trail — BIGGEST crew moment",
    before: [
      "Arrive by 8:00 PM at latest",
      "Hot water ready (ramen, thermos)",
      "Chair set up nearly flat for nap",
      "ALL night gear laid out + pre-loosened",
      "Headlamp #2 tested with fresh batteries",
      "Pacer briefed, CORSAR card confirmed, waiver signed at any previous AS or here"
    ],
    onArrival: [
      "Sit runner down immediately",
      "REMOVE SHOES + SOCKS. Inspect feet. Tape hot spots.",
      "Ramen + grilled cheese + Coke",
      "Offer (do not insist on) 10-15 min nap",
      "Swap to fresh headlamp",
      "Warm layer + gloves + buff ON before they stand"
    ],
    departWith: [
      "PACER with them",
      "Fresh socks + (optional) fresh shoes",
      "Jacket + gloves + buff ON",
      "Headlamp + backup light",
      "6 gels + 1 bar in pack, 3 L fluid",
      "Read-back: 'Stay on Lost Trail 821, 5 mi to Bent, don't take 822'"
    ]
  },
  8: {
    title: "AS8 Spring Creek #2 — mile 80 bonk zone",
    before: [
      "Savory food ready: boiled potatoes + salt, chips, broth",
      "Cold Coke",
      "Fresh pacer briefed if swapping",
      "Caffeine gel on standby"
    ],
    onArrival: [
      "KEEP IT SHORT — 10 min max",
      "Brief new pacer if swapping",
      "300 kcal savory food",
      "Brush teeth if they want",
      "Check feet if they mention"
    ],
    departWith: [
      "Fresh socks",
      "Flasks refilled (more water, less sweet)",
      "Jerky in hand",
      "4 gels in pack",
      "Reminder: 'Willow Creek is 11 mi, next crew point'"
    ]
  },
  9: {
    title: "AS9 Willow Creek — final crew touch",
    before: [
      "Celebration food ready (their favorite snack)",
      "Last batteries / last headlamp",
      "Jacket warming if evening cooling"
    ],
    onArrival: [
      "Short stop, don't chat",
      "Quick feet check",
      "Tylenol if they want (NOT ibuprofen)",
      "Warm jacket if cool"
    ],
    departWith: [
      "Final pacer OR solo for last 15",
      "Flasks topped",
      "Last caffeine gel",
      "Parting line: 'See you at Kentucky Belle'"
    ]
  }
};

// ==== Persistent storage keys ====
const K = {
  unit: "unit",
  splits: "splits", // { [segmentN]: ISOstring }
  checkItems: "checkItems", // { [segN-list-idx]: true }
  goalHours: "goalHours",
  notes: "notes" // { [segmentN]: string }
};

// ==== Helpers ====
const miToKm = (mi) => mi * 1.609344;
const ftToM = (ft) => Math.round(ft * 0.3048);
function fmtDist(mi, unit) {
  if (unit === "km") return `${miToKm(mi).toFixed(1)} km`;
  return `${mi.toFixed(1)} mi`;
}
function fmtElev(ft, unit) {
  if (unit === "km") return `${ftToM(ft).toLocaleString()} m`;
  return `${ft.toLocaleString()} ft`;
}
function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDur(ms) {
  if (ms == null || isNaN(ms)) return "—";
  const neg = ms < 0;
  const s = Math.abs(ms) / 1000;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${neg ? "-" : ""}${h}h ${m.toString().padStart(2, "0")}m`;
}
function parseTime(str) {
  // Accept "HH:MM" 24h or "H:MM AM/PM" — build a date for race start day or next day
  const s = str.trim();
  if (!s) return null;
  const ampm = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(s);
  const mil = /^(\d{1,2}):(\d{2})$/.exec(s);
  let h, m;
  if (ampm) {
    h = parseInt(ampm[1], 10) % 12;
    if (/pm/i.test(ampm[3])) h += 12;
    m = parseInt(ampm[2], 10);
  } else if (mil) {
    h = parseInt(mil[1], 10);
    m = parseInt(mil[2], 10);
  } else return null;

  const raceStart = new Date(RACE_START_ISO);
  const candidate = new Date(raceStart);
  candidate.setHours(h, m, 0, 0);
  // If candidate is before race start, assume next day
  if (candidate < raceStart) candidate.setDate(candidate.getDate() + 1);
  return candidate.toISOString();
}

// ==== Component ====
export default function CreedeCrewApp() {
  const [unit, setUnit] = useState("mi");
  const [splits, setSplits] = useState({}); // segN -> ISO string
  const [checks, setChecks] = useState({});
  const [notes, setNotes] = useState({});
  const [goalHours, setGoalHours] = useState(33);
  const [tab, setTab] = useState("track"); // track | plan | drive | checks
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [now, setNow] = useState(new Date());
  const [loaded, setLoaded] = useState(false);

  // Load persistent state
  useEffect(() => {
    (async () => {
      try {
        const u = await window.storage.get(K.unit);
        if (u) setUnit(u.value);
      } catch {}
      try {
        const s = await window.storage.get(K.splits);
        if (s) setSplits(JSON.parse(s.value));
      } catch {}
      try {
        const c = await window.storage.get(K.checkItems);
        if (c) setChecks(JSON.parse(c.value));
      } catch {}
      try {
        const n = await window.storage.get(K.notes);
        if (n) setNotes(JSON.parse(n.value));
      } catch {}
      try {
        const g = await window.storage.get(K.goalHours);
        if (g) setGoalHours(parseFloat(g.value));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Tick clock every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Save helpers
  const saveUnit = async (v) => { setUnit(v); try { await window.storage.set(K.unit, v); } catch {} };
  const saveSplits = async (v) => { setSplits(v); try { await window.storage.set(K.splits, JSON.stringify(v)); } catch {} };
  const saveChecks = async (v) => { setChecks(v); try { await window.storage.set(K.checkItems, JSON.stringify(v)); } catch {} };
  const saveNotes = async (v) => { setNotes(v); try { await window.storage.set(K.notes, JSON.stringify(v)); } catch {} };
  const saveGoal = async (v) => { setGoalHours(v); try { await window.storage.set(K.goalHours, String(v)); } catch {} };

  // Derived: current segment (last one with a split recorded)
  const lastSplit = useMemo(() => {
    const keys = Object.keys(splits).map(Number).sort((a, b) => b - a);
    return keys.length ? { n: keys[0], at: splits[keys[0]] } : null;
  }, [splits]);

  // Current pace and ETA projection
  const projection = useMemo(() => {
    if (!lastSplit) return null;
    const elapsedMs = new Date(lastSplit.at) - new Date(RACE_START_ISO);
    const seg = SEGMENTS.find(s => s.n === lastSplit.n);
    if (!seg || seg.cumMi === 0) return { pacePerMi: null, etaFinish: null, elapsed: elapsedMs };
    const pacePerMi = elapsedMs / seg.cumMi; // ms per mile
    const remainingMi = 107.1 - seg.cumMi;
    const etaFinish = new Date(new Date(lastSplit.at).getTime() + remainingMi * pacePerMi);
    return { pacePerMi, etaFinish, elapsed: elapsedMs };
  }, [lastSplit]);

  // ETA for each segment based on current pace
  const segEtas = useMemo(() => {
    const r = {};
    if (!projection || !projection.pacePerMi) return r;
    const pace = projection.pacePerMi;
    for (const s of SEGMENTS) {
      if (splits[s.n]) { r[s.n] = { at: splits[s.n], actual: true }; continue; }
      if (!lastSplit) continue;
      const lastSeg = SEGMENTS.find(x => x.n === lastSplit.n);
      if (s.cumMi <= lastSeg.cumMi) continue;
      const deltaMi = s.cumMi - lastSeg.cumMi;
      const eta = new Date(new Date(lastSplit.at).getTime() + deltaMi * pace);
      r[s.n] = { at: eta.toISOString(), actual: false };
    }
    return r;
  }, [projection, splits, lastSplit]);

  // Cutoff status for each aid
  function cutoffStatus(seg) {
    if (!seg.cutoff) return null;
    const cutoffTime = new Date(seg.cutoff);
    const actual = splits[seg.n] ? new Date(splits[seg.n]) : null;
    const eta = segEtas[seg.n] ? new Date(segEtas[seg.n].at) : null;

    if (actual) {
      const margin = cutoffTime - actual;
      return { kind: margin >= 0 ? "made" : "missed", margin, label: margin >= 0 ? `Made, +${fmtDur(margin)} margin` : `MISSED by ${fmtDur(-margin)}` };
    }
    if (eta) {
      const margin = cutoffTime - eta;
      return { kind: margin >= 30 * 60 * 1000 ? "safe" : margin >= 0 ? "tight" : "danger",
        margin, label: margin >= 0 ? `Proj +${fmtDur(margin)} margin` : `Proj -${fmtDur(-margin)} LATE` };
    }
    return null;
  }

  // Record split handler
  function recordSplit(segN, timeStr) {
    const iso = timeStr ? parseTime(timeStr) : new Date().toISOString();
    if (!iso) return;
    saveSplits({ ...splits, [segN]: iso });
  }
  function clearSplit(segN) {
    const c = { ...splits }; delete c[segN]; saveSplits(c);
  }

  if (!loaded) {
    return (<div style={{ padding: 24, color: "#cfe3b7", fontFamily: "ui-monospace, monospace" }}>Loading crew data…</div>);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');
        :root {
          --bg:           #0b120a;
          --bg-2:         #101a0f;
          --panel:        #18241a;
          --panel-2:      #1f2e20;
          --line:         #2a3b2b;
          --line-strong:  #3e5440;
          --ink:          #e8f0df;
          --ink-2:        #b5c7a7;
          --ink-3:        #7f9275;
          --safety:       #f2c14e;
          --blaze:        #ff7a2a;
          --blaze-2:      #b85217;
          --blood:        #d34040;
          --go:           #7fb86b;
          --mint:         #c3e28f;
          --sky:          #7ab4d9;
          --caution:      #e4a94a;
          --shadow:       0 1px 0 rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.5);
        }
        * { box-sizing: border-box; }
        .app {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg);
          background-image:
            radial-gradient(ellipse at 10% -10%, rgba(242,193,78,.06), transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(122,180,217,.04), transparent 40%),
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,.015) 24px, rgba(255,255,255,.015) 25px);
          color: var(--ink);
          min-height: 100vh;
          padding-bottom: 96px;
        }
        .wrap { max-width: 520px; margin: 0 auto; padding: 16px 14px 0; }
        .topbar {
          display: flex; align-items: flex-end; justify-content: space-between;
          padding: 8px 14px 12px; max-width: 520px; margin: 0 auto;
          border-bottom: 1px solid var(--line);
        }
        .brand { display: flex; align-items: baseline; gap: 8px; }
        .brand h1 {
          margin: 0; font-family: 'Archivo Black', sans-serif; font-weight: 900;
          font-size: 20px; letter-spacing: 0.02em; text-transform: uppercase; color: var(--safety);
        }
        .brand small { font-family: 'Space Mono', monospace; color: var(--ink-3); font-size: 11px; letter-spacing: 0.08em; }
        .unit-toggle {
          display: inline-flex; border: 1px solid var(--line-strong); border-radius: 2px; overflow: hidden;
          background: var(--panel);
        }
        .unit-toggle button {
          background: transparent; border: 0; color: var(--ink-2); padding: 6px 12px;
          font-family: 'Space Mono', monospace; font-size: 12px; cursor: pointer;
        }
        .unit-toggle button.on { background: var(--safety); color: #0b120a; font-weight: 700; }

        .hero {
          background: linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 14px 14px 12px;
          margin-top: 14px;
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(-45deg, transparent 0 18px, rgba(242,193,78,.05) 18px 19px);
        }
        .hero-label {
          font-family: 'Space Mono', monospace; color: var(--safety); font-size: 10px;
          letter-spacing: 0.2em; text-transform: uppercase;
        }
        .hero-big { font-family: 'Archivo Black', sans-serif; font-size: 26px; line-height: 1.05; margin: 4px 0 6px; color: var(--ink); }
        .hero-sub { font-family: 'Space Mono', monospace; color: var(--ink-2); font-size: 12px; }
        .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
        .kpi {
          background: rgba(0,0,0,.3); border: 1px solid var(--line); border-radius: 3px;
          padding: 8px 10px;
        }
        .kpi-l { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.12em; color: var(--ink-3); text-transform: uppercase; }
        .kpi-v { font-family: 'Archivo Black', sans-serif; font-size: 16px; color: var(--ink); }
        .kpi-v.go { color: var(--mint); }
        .kpi-v.warn { color: var(--caution); }
        .kpi-v.bad { color: var(--blood); }

        .section-title {
          display: flex; align-items: center; gap: 10px; margin: 20px 0 8px;
          font-family: 'Space Mono', monospace; font-size: 11px;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--safety);
        }
        .section-title::after { content: ""; flex: 1; border-top: 1px dashed var(--line-strong); }

        .seg-list { display: flex; flex-direction: column; gap: 8px; }
        .seg {
          background: var(--panel);
          border: 1px solid var(--line);
          border-left: 4px solid var(--line-strong);
          border-radius: 3px;
          padding: 10px 12px;
          position: relative;
          cursor: pointer;
          transition: border-color .15s, transform .1s;
        }
        .seg:active { transform: scale(0.997); }
        .seg.crew { border-left-color: var(--safety); }
        .seg.pacer { border-left-color: var(--blaze); }
        .seg.done { background: #14201a; opacity: 0.88; }
        .seg.next { border-left-color: var(--mint); box-shadow: 0 0 0 1px var(--mint) inset; }
        .seg.danger { border-left-color: var(--blood); }
        .seg-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
        .seg-n {
          font-family: 'Space Mono', monospace; color: var(--ink-3); font-size: 11px;
          letter-spacing: 0.1em;
        }
        .seg-name { font-family: 'Archivo Black', sans-serif; font-size: 14px; color: var(--ink); }
        .seg-mi { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ink-2); white-space: nowrap; }
        .seg-row2 { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
        .chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em;
          padding: 2px 6px; border-radius: 2px; border: 1px solid currentColor; text-transform: uppercase;
        }
        .chip.crew { color: var(--safety); }
        .chip.drop { color: var(--sky); }
        .chip.pacer { color: var(--blaze); }
        .chip.done { color: var(--mint); background: rgba(127,184,107,.1); }
        .chip.safe { color: var(--mint); }
        .chip.tight { color: var(--caution); }
        .chip.danger { color: var(--blood); }
        .chip.missed { color: var(--blood); background: rgba(211,64,64,.15); border-color: var(--blood); }

        .seg-meta { display: flex; gap: 14px; margin-top: 6px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ink-2); }
        .seg-meta div b { color: var(--ink); font-weight: 700; }

        .drawer-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,.7);
          z-index: 50; animation: fadeIn .15s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .drawer {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 51;
          background: var(--bg-2); border-top: 1px solid var(--line-strong);
          border-top-left-radius: 14px; border-top-right-radius: 14px;
          max-height: 90vh; overflow-y: auto; padding: 16px;
          box-shadow: 0 -20px 60px rgba(0,0,0,.6);
          animation: slideUp .2s ease;
        }
        @keyframes slideUp { from { transform: translateY(40px); opacity:0; } to { transform: translateY(0); opacity: 1; } }
        .drawer-handle {
          width: 40px; height: 4px; background: var(--line-strong); border-radius: 2px;
          margin: 0 auto 14px;
        }
        .drawer h2 {
          font-family: 'Archivo Black', sans-serif; font-size: 18px; margin: 0 0 4px;
          color: var(--safety);
        }
        .drawer .sub { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ink-3); margin-bottom: 14px; }

        .btn {
          background: var(--safety); color: #0b120a; border: 0;
          padding: 10px 14px; font-family: 'Space Mono', monospace;
          font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; border-radius: 2px;
        }
        .btn.ghost { background: transparent; color: var(--ink-2); border: 1px solid var(--line-strong); }
        .btn.blaze { background: var(--blaze); color: #fff; }
        .btn.danger { background: var(--blood); color: #fff; }
        .btn-row { display: flex; gap: 8px; flex-wrap: wrap; }

        .check-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        .check {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 10px;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 2px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1.35;
          color: var(--ink);
        }
        .check.on { text-decoration: line-through; color: var(--ink-3); background: #14201a; }
        .check .box {
          width: 18px; height: 18px; border: 2px solid var(--safety); border-radius: 2px;
          flex-shrink: 0; margin-top: 1px; display: grid; place-items: center;
          font-size: 13px; color: #0b120a;
        }
        .check.on .box { background: var(--safety); }

        .note-input {
          width: 100%; background: #0f1810; color: var(--ink); border: 1px solid var(--line-strong);
          border-radius: 2px; padding: 8px 10px; font-family: 'Space Mono', monospace; font-size: 13px;
          margin-top: 6px; resize: vertical;
        }
        .time-input {
          background: #0f1810; color: var(--ink); border: 1px solid var(--line-strong);
          padding: 8px 10px; font-family: 'Space Mono', monospace; font-size: 14px;
          border-radius: 2px; width: 130px;
        }

        .nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--bg-2); border-top: 1px solid var(--line-strong);
          display: grid; grid-template-columns: repeat(4, 1fr);
          z-index: 40;
        }
        .nav-item {
          background: transparent; border: 0; padding: 12px 4px 16px;
          color: var(--ink-3); font-family: 'Space Mono', monospace; font-size: 10px;
          letter-spacing: 0.1em; cursor: pointer; text-transform: uppercase;
          border-top: 3px solid transparent;
        }
        .nav-item .icon { display: block; font-size: 18px; margin-bottom: 2px; filter: grayscale(0.3); }
        .nav-item.on { color: var(--safety); border-top-color: var(--safety); }

        .drive-card {
          background: var(--panel); border: 1px solid var(--line); border-radius: 3px;
          padding: 12px; margin-bottom: 10px;
        }
        .drive-card .big {
          font-family: 'Archivo Black', sans-serif; font-size: 16px; color: var(--ink);
        }
        .drive-card .mono { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--ink-2); margin: 4px 0; }
        .drive-card .route { font-size: 13px; line-height: 1.45; color: var(--ink-2); margin-top: 6px; }

        .goal-bar {
          background: var(--panel); border: 1px solid var(--line);
          border-radius: 3px; padding: 10px 12px;
          display: flex; align-items: center; gap: 10px;
          margin-top: 12px;
        }
        .goal-bar label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.1em; }
        .goal-bar input { flex: 1; }
        .goal-bar .v { font-family: 'Archivo Black', sans-serif; color: var(--safety); font-size: 16px; }

        .banner {
          padding: 10px 12px; margin-bottom: 10px; border-radius: 3px;
          font-family: 'Space Mono', monospace; font-size: 12px;
          border: 1px solid currentColor;
        }
        .banner.info { color: var(--sky); background: rgba(122,180,217,.08); }
        .banner.warn { color: var(--caution); background: rgba(228,169,74,.08); }
        .banner.danger { color: var(--blood); background: rgba(211,64,64,.08); }

        details {
          background: var(--panel); border: 1px solid var(--line); border-radius: 3px;
          padding: 10px 12px; margin-top: 8px;
        }
        details summary {
          font-family: 'Space Mono', monospace; font-size: 12px; color: var(--safety);
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
        }
        details p, details li { font-size: 13px; color: var(--ink-2); line-height: 1.45; }
        details ul { margin: 8px 0 0 18px; padding: 0; }
      `}</style>

      <div className="app">
        <div className="topbar">
          <div className="brand">
            <h1>Creede 100</h1>
            <small>CREW · 2026-07-25</small>
          </div>
          <div className="unit-toggle">
            <button className={unit === "mi" ? "on" : ""} onClick={() => saveUnit("mi")}>MI</button>
            <button className={unit === "km" ? "on" : ""} onClick={() => saveUnit("km")}>KM</button>
          </div>
        </div>

        <div className="wrap">
          {tab === "track" && (
            <TrackTab
              unit={unit}
              splits={splits}
              segEtas={segEtas}
              projection={projection}
              now={now}
              cutoffStatus={cutoffStatus}
              onOpenSeg={(s) => setSelectedSeg(s.n)}
              goalHours={goalHours}
              saveGoal={saveGoal}
            />
          )}
          {tab === "plan" && <PlanTab unit={unit} />}
          {tab === "drive" && <DriveTab />}
          {tab === "checks" && (
            <ChecksTab
              checks={checks}
              saveChecks={saveChecks}
            />
          )}
        </div>

        {selectedSeg !== null && (
          <SegDrawer
            seg={SEGMENTS.find(s => s.n === selectedSeg)}
            splits={splits}
            segEtas={segEtas}
            notes={notes}
            saveNotes={saveNotes}
            checks={checks}
            saveChecks={saveChecks}
            recordSplit={recordSplit}
            clearSplit={clearSplit}
            cutoffStatus={cutoffStatus}
            unit={unit}
            close={() => setSelectedSeg(null)}
          />
        )}

        <nav className="nav">
          <button className={`nav-item ${tab === "track" ? "on" : ""}`} onClick={() => setTab("track")}>
            <span className="icon">◈</span>Track
          </button>
          <button className={`nav-item ${tab === "checks" ? "on" : ""}`} onClick={() => setTab("checks")}>
            <span className="icon">✓</span>Crew-list
          </button>
          <button className={`nav-item ${tab === "drive" ? "on" : ""}`} onClick={() => setTab("drive")}>
            <span className="icon">↗</span>Drive
          </button>
          <button className={`nav-item ${tab === "plan" ? "on" : ""}`} onClick={() => setTab("plan")}>
            <span className="icon">☰</span>Plan
          </button>
        </nav>
      </div>
    </>
  );
}

// ==== TRACK TAB ====
function TrackTab({ unit, splits, segEtas, projection, now, cutoffStatus, onOpenSeg, goalHours, saveGoal }) {
  const raceStart = new Date(RACE_START_ISO);
  const raceCutoff = new Date(RACE_CUTOFF_ISO);
  const lastN = Object.keys(splits).map(Number).sort((a,b)=>b-a)[0];
  const lastSeg = lastN !== undefined ? SEGMENTS.find(s => s.n === lastN) : null;
  const nextSeg = lastSeg ? SEGMENTS.find(s => s.n === lastSeg.n + 1) : SEGMENTS[1];

  const elapsed = lastSeg ? (new Date(splits[lastSeg.n]) - raceStart) : (now - raceStart);
  const raceStarted = now >= raceStart;

  let finishStatus = { label: "—", cls: "" };
  if (projection?.etaFinish) {
    const margin = raceCutoff - projection.etaFinish;
    if (margin >= 60 * 60 * 1000) finishStatus = { label: `ETA ${fmtTime(projection.etaFinish.toISOString())} (+${fmtDur(margin)})`, cls: "go" };
    else if (margin >= 0) finishStatus = { label: `ETA ${fmtTime(projection.etaFinish.toISOString())} (+${fmtDur(margin)})`, cls: "warn" };
    else finishStatus = { label: `ETA ${fmtTime(projection.etaFinish.toISOString())} (LATE ${fmtDur(-margin)})`, cls: "bad" };
  }

  return (
    <>
      <div className="hero">
        <div className="hero-label">Current leg</div>
        <div className="hero-big">
          {nextSeg ? nextSeg.name : (raceStarted ? "Pre-start" : "Awaiting start")}
        </div>
        <div className="hero-sub">
          {lastSeg
            ? `Last split: ${lastSeg.name} @ ${fmtTime(splits[lastSeg.n])}`
            : "No splits logged yet — tap the start to begin."}
        </div>
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-l">Elapsed</div>
            <div className="kpi-v">{fmtDur(elapsed)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-l">Dist done</div>
            <div className="kpi-v">{lastSeg ? fmtDist(lastSeg.cumMi, unit) : fmtDist(0, unit)}</div>
          </div>
          <div className="kpi">
            <div className="kpi-l">Finish ETA</div>
            <div className={`kpi-v ${finishStatus.cls}`}>{projection?.etaFinish ? fmtTime(projection.etaFinish.toISOString()) : "—"}</div>
          </div>
        </div>
        {projection?.etaFinish && (
          <div style={{ marginTop: 10, fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--ink-3)" }}>
            Projected pace: {((projection.pacePerMi/60000)).toFixed(1)} min/mi · 40-h hard cutoff {fmtTime(RACE_CUTOFF_ISO)}
          </div>
        )}
      </div>

      <div className="goal-bar">
        <label>Target finish</label>
        <input type="range" min={24} max={40} step={0.5} value={goalHours} onChange={(e) => saveGoal(parseFloat(e.target.value))} />
        <span className="v">{goalHours}h</span>
      </div>

      <div className="section-title">Timeline</div>
      <div className="seg-list">
        {SEGMENTS.map((s) => {
          const status = cutoffStatus(s);
          const done = !!splits[s.n];
          const isNext = !done && lastSeg && s.n === lastSeg.n + 1;
          const cls = ["seg"];
          if (s.crew) cls.push("crew");
          if (s.pacer) cls.push("pacer");
          if (done) cls.push("done");
          if (isNext) cls.push("next");
          if (status?.kind === "danger" || status?.kind === "missed") cls.push("danger");
          return (
            <div key={s.n} className={cls.join(" ")} onClick={() => onOpenSeg(s)}>
              <div className="seg-head">
                <div>
                  <div className="seg-n">#{String(s.n).padStart(2, "0")}</div>
                  <div className="seg-name">{s.name}</div>
                </div>
                <div className="seg-mi">{fmtDist(s.cumMi, unit)}</div>
              </div>
              <div className="seg-row2">
                {s.crew && <span className="chip crew">CREW</span>}
                {s.dropBag && <span className="chip drop">DROP</span>}
                {s.pacer && <span className="chip pacer">PACER</span>}
                {done && <span className="chip done">✓ {fmtTime(splits[s.n])}</span>}
                {!done && segEtas[s.n]?.at && <span className="chip" style={{ color: "var(--ink-3)" }}>ETA {fmtTime(segEtas[s.n].at)}</span>}
                {status && <span className={`chip ${status.kind}`}>{status.label}</span>}
              </div>
              <div className="seg-meta">
                <div>Elev <b>{fmtElev(s.elev, unit)}</b></div>
                {s.cutoff && <div>Cutoff <b>{fmtTime(s.cutoff)}</b></div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ==== SEG DRAWER ====
function SegDrawer({ seg, splits, segEtas, notes, saveNotes, recordSplit, clearSplit, cutoffStatus, unit, close }) {
  const [manualTime, setManualTime] = useState("");
  const [localNote, setLocalNote] = useState(notes[seg.n] || "");
  const status = cutoffStatus(seg);
  const checklist = CREW_CHECKLISTS[seg.n];
  const hasSplit = !!splits[seg.n];

  useEffect(() => { setLocalNote(notes[seg.n] || ""); }, [seg.n, notes]);

  return (
    <>
      <div className="drawer-bg" onClick={close}></div>
      <div className="drawer">
        <div className="drawer-handle"></div>
        <h2>{seg.name}</h2>
        <div className="sub">Mile {seg.cumMi.toFixed(2)} · {fmtDist(seg.cumMi, unit)} · {fmtElev(seg.elev, unit)}</div>

        {seg.cutoff && status && (
          <div className={`banner ${status.kind === "safe" || status.kind === "made" ? "info" : status.kind === "tight" ? "warn" : "danger"}`}>
            CUTOFF {fmtTime(seg.cutoff)} · {status.label}
          </div>
        )}

        <div className="section-title" style={{ marginTop: 8 }}>Record split</div>
        {hasSplit ? (
          <div className="banner info" style={{ marginTop: 0 }}>
            Recorded: {fmtTime(splits[seg.n])}
            <div style={{ marginTop: 8 }}>
              <button className="btn ghost" onClick={() => clearSplit(seg.n)}>Clear split</button>
            </div>
          </div>
        ) : (
          <div className="btn-row" style={{ marginTop: 6 }}>
            <button className="btn" onClick={() => recordSplit(seg.n, null)}>Mark NOW</button>
            <input className="time-input" placeholder="e.g. 2:15pm" value={manualTime} onChange={(e) => setManualTime(e.target.value)} />
            <button className="btn ghost" onClick={() => { recordSplit(seg.n, manualTime); setManualTime(""); }}>Log time</button>
          </div>
        )}

        {checklist && (
          <>
            <div className="section-title">Crew checklist</div>
            <CrewChecklist segN={seg.n} checklist={checklist} />
          </>
        )}

        <div className="section-title">Notes & intel</div>
        <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.45 }}>{seg.notes}</div>

        <div className="section-title">Crew notes</div>
        <textarea
          className="note-input"
          rows={3}
          value={localNote}
          placeholder="e.g. 'Feet looked OK, ate half the sandwich, slight nausea'"
          onChange={(e) => setLocalNote(e.target.value)}
          onBlur={() => saveNotes({ ...notes, [seg.n]: localNote })}
        />

        <div style={{ marginTop: 18, textAlign: "center" }}>
          <button className="btn ghost" onClick={close}>Close</button>
        </div>
      </div>
    </>
  );
}

function CrewChecklist({ segN, checklist }) {
  const [checks, setChecks] = useState({});
  useEffect(() => {
    (async () => {
      try {
        const c = await window.storage.get(K.checkItems);
        if (c) setChecks(JSON.parse(c.value));
      } catch {}
    })();
  }, []);
  async function toggle(key) {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    try { await window.storage.set(K.checkItems, JSON.stringify(next)); } catch {}
  }
  function Section({ title, items, prefix }) {
    return (
      <>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", marginTop: 14, marginBottom: 4, textTransform: "uppercase" }}>{title}</div>
        <div className="check-list">
          {items.map((t, i) => {
            const key = `${segN}-${prefix}-${i}`;
            const on = !!checks[key];
            return (
              <div key={key} className={`check ${on ? "on" : ""}`} onClick={() => toggle(key)}>
                <div className="box">{on ? "✓" : ""}</div>
                <div>{t}</div>
              </div>
            );
          })}
        </div>
      </>
    );
  }
  return (
    <>
      <Section title="Before runner arrives" items={checklist.before} prefix="b" />
      <Section title="When runner arrives" items={checklist.onArrival} prefix="a" />
      <Section title="Send them out with" items={checklist.departWith} prefix="d" />
    </>
  );
}

// ==== PLAN TAB (race overview) ====
function PlanTab({ unit }) {
  return (
    <>
      <div className="section-title">Race plan at a glance</div>
      <div className="banner info">Race starts 8:00 AM Sat Jul 25 · 40-h cutoff 11:59 PM Sun Jul 26</div>

      <details open>
        <summary>Fueling targets per hour</summary>
        <ul>
          <li><b>Carbs:</b> 60–90 g/h (finishers average ~70)</li>
          <li><b>Fluid:</b> 500–750 ml/h</li>
          <li><b>Sodium:</b> 400–800 mg/h</li>
          <li><b>Protein:</b> 5–10 g every 1–2 h after hour 6</li>
          <li><b>Caffeine:</b> Save for Lost Trail + sunrise</li>
        </ul>
      </details>

      <details>
        <summary>Mandatory runner gear (Tempest)</summary>
        <ul>
          <li>Emergency rain jacket/poncho at all times</li>
          <li>Headlamp + backup light at night</li>
          <li>Extra insulating layer at night</li>
          <li>Whistle</li>
          <li>Buff + gloves (strongly advised → treat as mandatory)</li>
          <li>CORSAR card (runner + pacer)</li>
        </ul>
      </details>

      <details>
        <summary>Drop-bag locations</summary>
        <ul>
          <li>Spring Creek #1 (AS2) — first refresh, sunscreen, fresh socks</li>
          <li>Lost Trail (AS5) — biggest bag: full night kit, spare shoes, 10 gels</li>
          <li>Spring Creek #2 (AS8) — mile-80 savory-foods bag</li>
          <li>Willow Creek (AS9) — last headlamp, socks, jerky</li>
        </ul>
      </details>

      <details>
        <summary>Altitude red flags (STOP the race)</summary>
        <ul>
          <li>Shortness of breath AT REST + productive cough (HAPE)</li>
          <li>Confusion, ataxia, slurred speech (HACE)</li>
          <li>Frothy pink/white sputum</li>
          <li>Blue/grey lips or fingernails</li>
          <li>DESCEND immediately. No buckle is worth HAPE/HACE.</li>
        </ul>
      </details>

      <details>
        <summary>Mile-80 playbook</summary>
        <ul>
          <li>Switch from sweet → savory (chips, broth, potatoes, jerky)</li>
          <li>Buff over mouth if cold air hurts lungs</li>
          <li>10-min nap at Spring Creek #2 if daylight is winning</li>
          <li>Walk in 10-min segments with micro-goals</li>
          <li>Remember: sunrise ~6 AM Sun = morale boost</li>
        </ul>
      </details>

      <details>
        <summary>Key distances ({unit})</summary>
        <ul>
          <li>Total: {fmtDist(107.1, unit)}</li>
          <li>To first crew (Spring Creek #1): {fmtDist(24.8, unit)}</li>
          <li>Spring Creek #1 → Lost Trail: {fmtDist(30.95, unit)} (no crew)</li>
          <li>Lost Trail → Spring Creek #2: {fmtDist(24.7, unit)} (no crew)</li>
          <li>Spring Creek #2 → Willow Creek: {fmtDist(11.4, unit)}</li>
          <li>Willow Creek → Finish: {fmtDist(15.25, unit)}</li>
        </ul>
      </details>

      <details>
        <summary>Post-race</summary>
        <ul>
          <li>300–500 kcal + 20 g protein within 30 min</li>
          <li>Shower, get warm + dry fast</li>
          <li>NO ibuprofen for 48 h (kidney risk)</li>
          <li>Don't drive Sunday night — book a room</li>
          <li>Descend to lower altitude on Monday if possible</li>
        </ul>
      </details>
    </>
  );
}

// ==== DRIVE TAB ====
function DriveTab() {
  return (
    <>
      <div className="section-title">Crew driving plan</div>
      <div className="banner warn">NO CELL SERVICE on most of the course. Print directions + paper maps. Full tank of gas.</div>

      {Object.entries(DRIVE_LEGS).map(([segN, leg]) => (
        <div className="drive-card" key={segN}>
          <div className="big">{leg.from} → {leg.to}</div>
          <div className="mono">{leg.miles} mi · ~{leg.minutes} min</div>
          <div className="route">{leg.route}</div>
        </div>
      ))}

      <details open>
        <summary>Crew self-care</summary>
        <ul>
          <li>Eat every 3 hours</li>
          <li>Nap 11 AM–3 PM Sat before Lost Trail</li>
          <li>Nap 3–7 AM Sun at Lost Trail lot</li>
          <li>If drowsy driving → pull over. Always.</li>
        </ul>
      </details>

      <details>
        <summary>Vehicle readiness</summary>
        <ul>
          <li>Full tank before leaving Creede Saturday</li>
          <li>Gas only in: Creede, South Fork, Lake City</li>
          <li>Know how to change a flat — AAA is hours away</li>
          <li>Wash vehicle before entering forest service land (invasive species rule)</li>
          <li>One car per runner. No RVs at aid stations.</li>
        </ul>
      </details>

      <details>
        <summary>Communication plan</summary>
        <ul>
          <li>Satellite messenger (Garmin inReach / Zoleo) — both runner and crew</li>
          <li>Pre-set messages: "ok", "slowing", "dropping", "emergency"</li>
          <li>Cell spots: Creede (partial), South Fork (good), Lake City (partial)</li>
          <li>Home contact with race director's phone + runner inReach ID</li>
        </ul>
      </details>
    </>
  );
}

// ==== CHECKS TAB ====
function ChecksTab({ checks, saveChecks }) {
  const crewAidSegs = [2, 5, 8, 9];
  return (
    <>
      <div className="section-title">Crew-point checklists</div>
      <div className="banner info">Check these off as you prep each meet-up. They persist between sessions.</div>
      {crewAidSegs.map((n) => {
        const seg = SEGMENTS.find(s => s.n === n);
        const cl = CREW_CHECKLISTS[n];
        return (
          <details key={n} open={n === 5}>
            <summary>{seg.name} — {cl.title.split("—")[1] || ""}</summary>
            <MiniChecklist segN={n} items={cl.before} label="BEFORE arrival" prefix="b" checks={checks} saveChecks={saveChecks} />
            <MiniChecklist segN={n} items={cl.onArrival} label="WHEN runner arrives" prefix="a" checks={checks} saveChecks={saveChecks} />
            <MiniChecklist segN={n} items={cl.departWith} label="SEND them out with" prefix="d" checks={checks} saveChecks={saveChecks} />
          </details>
        );
      })}

      <details style={{ marginTop: 14 }}>
        <summary>Reset everything</summary>
        <div style={{ marginTop: 8 }}>
          <button className="btn danger" onClick={() => { if (confirm("Clear ALL splits, notes, and checklist state?")) { saveChecks({}); try { window.storage.delete(K.splits); window.storage.delete(K.notes); window.storage.delete(K.checkItems); } catch {} setTimeout(() => location.reload(), 300); } }}>
            Reset all data
          </button>
        </div>
      </details>
    </>
  );
}

function MiniChecklist({ segN, items, label, prefix, checks, saveChecks }) {
  async function toggle(key) {
    const next = { ...checks, [key]: !checks[key] };
    saveChecks(next);
  }
  return (
    <>
      <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", marginTop: 12, textTransform: "uppercase" }}>{label}</div>
      <div className="check-list">
        {items.map((t, i) => {
          const key = `${segN}-${prefix}-${i}`;
          const on = !!checks[key];
          return (
            <div key={key} className={`check ${on ? "on" : ""}`} onClick={() => toggle(key)}>
              <div className="box">{on ? "✓" : ""}</div>
              <div>{t}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
