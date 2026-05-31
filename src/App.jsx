import React, { useState, useEffect, useMemo } from "react";

const LS = {
  get: (key) => { try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, val); } catch {} },
  del: (key) => { try { localStorage.removeItem(key); } catch {} },
};

const RACE_START_ISO = "2026-07-25T08:00:00-06:00";
const RACE_CUTOFF_ISO = "2026-07-26T23:59:00-06:00";

const SEGMENTS = [
  { n: 0,  name: "Start - Creede",          cumMi: 0,      elev: 8786,  peakElev: 8786,  type: "start",  cutoff: null,                        crew: true,  dropBag: false, pacer: false, notes: "Start line behind Kentucky Belle Market. Race begins 8:00 AM Sat." },
  { n: 1,  name: "AS1 Oso Creek",           cumMi: 15.5,   elev: 11900, peakElev: 12100, type: "aid",    cutoff: "2026-07-25T13:30:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "No crew access. Water, aid food. 15.5 mi of sustained climbing." },
  { n: 2,  name: "AS2 Spring Creek Pass",   cumMi: 24.8,   elev: 10898, peakElev: 12300, type: "aid",    cutoff: "2026-07-25T16:00:00-06:00",  crew: true,  dropBag: true,  pacer: false, notes: "First crew stop. Drop bag #1. Runner should feel like they have not raced yet." },
  { n: 3,  name: "AS3 Jarosa",              cumMi: 30.35,  elev: 12500, peakElev: 12600, type: "aid",    cutoff: "2026-07-25T18:15:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "No crew. Short leg. Stay disciplined on the climb." },
  { n: 4,  name: "AS4 Bent inbound",        cumMi: 42.4,   elev: 11600, peakElev: 12800, type: "aid",    cutoff: "2026-07-25T22:00:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "No crew. Last fuel before the 13.35 mi soul-suck to Lost Trail." },
  { n: 5,  name: "AS5 Lost Trail",          cumMi: 55.75,  elev: 8786,  peakElev: 12600, type: "aid",    cutoff: "2026-07-26T03:00:00-06:00",  crew: true,  dropBag: true,  pacer: true,  notes: "MAJOR CREW STOP. Pacer pick-up. Lowest point. Consider 15-min nap. Swap headlamp socks layers." },
  { n: 6,  name: "AS6 Bent outbound",       cumMi: 62.85,  elev: 12000, peakElev: 12000, type: "aid",    cutoff: "2026-07-26T07:00:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "Steep muddy climb back from Lost Trail. Hardest cutoff to make. DNF zone." },
  { n: 7,  name: "AS7 Jarosa outbound",     cumMi: 74.9,   elev: 12500, peakElev: 12800, type: "aid",    cutoff: "2026-07-26T11:30:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "Dawn to mid-morning. Sun back. Hydrate sunscreen EAT." },
  { n: 8,  name: "AS8 Spring Creek out",    cumMi: 80.45,  elev: 10898, peakElev: 12500, type: "aid",    cutoff: "2026-07-26T13:30:00-06:00",  crew: true,  dropBag: true,  pacer: true,  notes: "Crew stop. Mile 80 bonk zone. SAVORY food. Pacer swap possible." },
  { n: 9,  name: "AS9 Willow Creek",        cumMi: 91.85,  elev: 12000, peakElev: 12600, type: "aid",    cutoff: "2026-07-26T17:30:00-06:00",  crew: true,  dropBag: true,  pacer: true,  notes: "Last crew stop. 15 mi to go. Last headlamp check." },
  { n: 10, name: "AS10 McKenzie",           cumMi: 103.05, elev: 10500, peakElev: 12200, type: "aid",    cutoff: "2026-07-26T22:00:00-06:00",  crew: false, dropBag: false, pacer: false, notes: "Last aid before finish. 4 miles home." },
  { n: 11, name: "Finish - Creede",         cumMi: 107.1,  elev: 8786,  peakElev: 10900, type: "finish", cutoff: "2026-07-26T23:59:00-06:00",  crew: true,  dropBag: false, pacer: false, notes: "Kentucky Belle Market. Buckle time." },
];

const DRIVE_LEGS = {
  2:  { from: "Creede Start",    to: "Spring Creek 1", miles: 33.2, minutes: 40, route: "South on Loma St 0.55 mi, right on HWY 149 east 32.65 mi. Crew parking just before mile marker 55." },
  5:  { from: "Spring Creek 1",  to: "Lost Trail",     miles: 31.3, minutes: 85, route: "HWY 149 east 13.1 mi, right on FR 520 for 18.2 mi dirt. Lost Trail AS on the right." },
  8:  { from: "Lost Trail",      to: "Spring Creek 2", miles: 31.3, minutes: 85, route: "Reverse: FR 520 west 18.2 mi to HWY 149, right on 149 west." },
  9:  { from: "Spring Creek 2",  to: "Willow Creek",   miles: 10.8, minutes: 30, route: "HWY 149 east 6.2 mi, left on FR 532 before North Clear Creek Falls. Stream crossing, 4.6 mi dirt." },
  11: { from: "Willow Creek",    to: "Finish Creede",  miles: 31.6, minutes: 60, route: "FR 532 west 4.6 mi, left on HWY 149 west 27 mi to Creede. Left on Loma St." },
};

const CREW_CHECKLISTS = {
  2: {
    title: "AS2 Spring Creek 1",
    before: ["Be on site by 11:00 AM","Unfold chair lay tarp open Bin A and Bin B","Skratch bottle pre-mixed cold Coke open","Drop bag 1 unzipped and ready","Sunscreen stick out"],
    onArrival: ["Ask ONE question: How is your stomach","Take vest refill both flasks","Hand them grilled cheese apple slices half Coke","Reapply sunscreen on face and neck","Check feet ONLY if they mention them"],
    departWith: ["Vest on bib visible","Both flasks full","2 gels in hand","Next crew is Lost Trail 30 miles between 10 PM and 2 AM"]
  },
  5: {
    title: "AS5 Lost Trail BIGGEST stop",
    before: ["Arrive by 8:00 PM","Hot water ready ramen thermos","Chair set nearly flat for nap","ALL night gear laid out","Headlamp 2 tested with fresh batteries","Pacer briefed CORSAR card confirmed"],
    onArrival: ["Sit runner down immediately","REMOVE SHOES AND SOCKS. Inspect feet. Tape hot spots.","Ramen grilled cheese Coke","Offer do not insist 10-15 min nap","Swap to fresh headlamp","Warm layer gloves buff ON before they stand"],
    departWith: ["PACER with them","Fresh socks optional new shoes","Jacket gloves buff ON","Headlamp and backup light","6 gels 1 bar 3L fluid","Stay on Lost Trail 821 5 mi to Bent"]
  },
  8: {
    title: "AS8 Spring Creek 2 mile 80",
    before: ["Savory food ready potatoes chips broth","Cold Coke","Fresh pacer briefed if swapping","Caffeine gel on standby"],
    onArrival: ["KEEP IT SHORT 10 min max","Brief new pacer if swapping","300 kcal savory food","Check feet if they mention"],
    departWith: ["Fresh socks","Flasks refilled water less sweet","Jerky in hand","4 gels in pack","Willow Creek is 11 mi"]
  },
  9: {
    title: "AS9 Willow Creek final stop",
    before: ["Celebration food ready","Last batteries headlamp","Jacket if cooling"],
    onArrival: ["Short stop do not chat","Quick feet check","Tylenol if needed NOT ibuprofen","Warm jacket if cool"],
    departWith: ["Flasks topped","Last caffeine gel","See you at Kentucky Belle"]
  }
};

const RUNNER_ASSESSMENT = [
  { key: "eat",   icon: "🍌", label: "Eat",            detail: "Did they eat real food? Calories logged? Any nausea?" },
  { key: "drink", icon: "💧", label: "Drink (salt)",   detail: "Flasks full? Sodium caps taken? Electrolytes topped up?" },
  { key: "feet",  icon: "👟", label: "Feet",           detail: "Hot spots? Blisters? Toenails? Socks changed?" },
  { key: "temp",  icon: "🌡", label: "Hot/Cold",       detail: "Core temp OK? Layers right? Sweating appropriately?" },
  { key: "pain",  icon: "⚡", label: "Pains & muscles",detail: "Cramps? Chafing? IT band? Achilles? Any alarming pain?" },
  { key: "dir",   icon: "🗺", label: "Directions",     detail: "Know the next segment? Key turns briefed? Map/GPX visible?" },
];

function segInfo(seg, goalHours, actualStartISO) {
  if (seg.n === 0) return null;
  const prev = SEGMENTS.find(s => s.n === seg.n - 1);
  if (!prev) return null;
  const segMi = seg.cumMi - prev.cumMi;
  const segKm = segMi * 1.609344;
  const gainFt = Math.max(0, seg.peakElev - prev.elev);
  const lossFt = Math.max(0, seg.peakElev - seg.elev);
  const gainM  = Math.round(gainFt * 0.3048);
  const lossM  = Math.round(lossFt * 0.3048);
  const raceStartMs = actualStartISO ? new Date(actualStartISO).getTime() : new Date(RACE_START_ISO).getTime();
  const cutoffMs   = seg.cutoff ? new Date(seg.cutoff).getTime() - raceStartMs : null;
  const prevCutoff = prev.cutoff ? new Date(prev.cutoff).getTime() - raceStartMs : 0;
  const windowMs   = cutoffMs != null ? cutoffMs - prevCutoff : null;
  const reqPaceMinMi = windowMs != null && segMi > 0 ? (windowMs / 60000) / segMi : null;
  const reqPaceMinKm = reqPaceMinMi != null ? reqPaceMinMi / 1.609344 : null;
  const totalWindowMs = 40 * 60 * 60 * 1000;
  const goalPaceMinMi = windowMs != null && segMi > 0 ? (windowMs / totalWindowMs) * (goalHours * 60) / segMi : null;
  const goalPaceMinKm = goalPaceMinMi != null ? goalPaceMinMi / 1.609344 : null;
  return { segMi, segKm, gainFt, gainM, lossFt, lossM, reqPaceMinMi, reqPaceMinKm, goalPaceMinMi, goalPaceMinKm };
}

function fmtPace(minPerUnit, unit) {
  if (minPerUnit == null || isNaN(minPerUnit) || !isFinite(minPerUnit)) return "-";
  const m = Math.floor(minPerUnit);
  const s = Math.round((minPerUnit - m) * 60);
  return m + ":" + s.toString().padStart(2,"0") + " /" + (unit === "km" ? "km" : "mi");
}

const miToKm = (mi) => mi * 1.609344;
const ftToM  = (ft) => Math.round(ft * 0.3048);
function fmtDist(mi, unit) { return unit === "km" ? miToKm(mi).toFixed(1) + " km" : mi.toFixed(1) + " mi"; }
function fmtElev(ft, unit) { return unit === "km" ? ftToM(ft).toLocaleString() + " m" : ft.toLocaleString() + " ft"; }
function fmtTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
}
function fmtDur(ms) {
  if (ms == null || isNaN(ms)) return "-";
  const neg = ms < 0;
  const s = Math.abs(ms) / 1000;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (neg ? "-" : "") + h + "h " + m.toString().padStart(2,"0") + "m";
}
function parseTime(str) {
  const s = str.trim();
  if (!s) return null;
  const ampm = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(s);
  const mil  = /^(\d{1,2}):(\d{2})$/.exec(s);
  let h, m;
  if (ampm) { h = parseInt(ampm[1],10)%12; if(/pm/i.test(ampm[3]))h+=12; m=parseInt(ampm[2],10); }
  else if (mil) { h=parseInt(mil[1],10); m=parseInt(mil[2],10); }
  else return null;
  const base = new Date(RACE_START_ISO);
  const c = new Date(base); c.setHours(h,m,0,0);
  if (c < base) c.setDate(c.getDate()+1);
  return c.toISOString();
}

function computeExpectedTimes(goalHours, actualStartISO) {
  const startMs = actualStartISO ? new Date(actualStartISO).getTime() : new Date(RACE_START_ISO).getTime();
  const totalMs = goalHours * 60 * 60 * 1000;
  const result = {};
  for (const s of SEGMENTS) {
    result[s.n] = new Date(startMs + (s.cumMi / 107.1) * totalMs).toISOString();
  }
  return result;
}

const K = { unit:"creede_unit", splits:"creede_splits", checks:"creede_checks", notes:"creede_notes", goalHours:"creede_goalHours", actualStart:"creede_actualStart", assessment:"creede_assessment" };

export default function CreedeCrewApp() {
  const [unit,        setUnit]        = useState("mi");
  const [splits,      setSplits]      = useState({});
  const [checks,      setChecks]      = useState({});
  const [notes,       setNotes]       = useState({});
  const [assessment,  setAssessment]  = useState({});
  const [goalHours,   setGoalHours]   = useState(33);
  const [actualStart, setActualStart] = useState(null);
  const [tab,         setTab]         = useState("track");
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [now,         setNow]         = useState(new Date());
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    const u  = LS.get(K.unit);        if (u)  setUnit(u.value);
    const sp = LS.get(K.splits);      if (sp) setSplits(JSON.parse(sp.value));
    const ch = LS.get(K.checks);      if (ch) setChecks(JSON.parse(ch.value));
    const no = LS.get(K.notes);       if (no) setNotes(JSON.parse(no.value));
    const as = LS.get(K.assessment);  if (as) setAssessment(JSON.parse(as.value));
    const gh = LS.get(K.goalHours);   if (gh) setGoalHours(parseFloat(gh.value));
    const ac = LS.get(K.actualStart); if (ac) setActualStart(ac.value);
    setLoaded(true);
  }, []);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const saveUnit        = (v) => { setUnit(v);        LS.set(K.unit, v); };
  const saveSplits      = (v) => { setSplits(v);      LS.set(K.splits, JSON.stringify(v)); };
  const saveChecks      = (v) => { setChecks(v);      LS.set(K.checks, JSON.stringify(v)); };
  const saveNotes       = (v) => { setNotes(v);       LS.set(K.notes, JSON.stringify(v)); };
  const saveAssessment  = (v) => { setAssessment(v);  LS.set(K.assessment, JSON.stringify(v)); };
  const saveGoal        = (v) => { setGoalHours(v);   LS.set(K.goalHours, String(v)); };
  const saveActualStart = (v) => { setActualStart(v); if(v) LS.set(K.actualStart, v); else LS.del(K.actualStart); };

  const expectedTimes = useMemo(() => computeExpectedTimes(goalHours, actualStart), [goalHours, actualStart]);

  const lastSplit = useMemo(() => {
    const keys = Object.keys(splits).map(Number).sort((a,b)=>b-a);
    return keys.length ? { n: keys[0], at: splits[keys[0]] } : null;
  }, [splits]);

  const projection = useMemo(() => {
    if (!lastSplit) return null;
    const startMs   = actualStart ? new Date(actualStart).getTime() : new Date(RACE_START_ISO).getTime();
    const elapsedMs = new Date(lastSplit.at).getTime() - startMs;
    const seg = SEGMENTS.find(s => s.n === lastSplit.n);
    if (!seg || seg.cumMi === 0) return { pacePerMi: null, etaFinish: null, elapsed: elapsedMs };
    const pacePerMi  = elapsedMs / seg.cumMi;
    const etaFinish  = new Date(new Date(lastSplit.at).getTime() + (107.1 - seg.cumMi) * pacePerMi);
    return { pacePerMi, etaFinish, elapsed: elapsedMs };
  }, [lastSplit, actualStart]);

  const segEtas = useMemo(() => {
    const r = {};
    if (!projection?.pacePerMi) return r;
    for (const s of SEGMENTS) {
      if (splits[s.n]) { r[s.n] = { at: splits[s.n], actual: true }; continue; }
      if (!lastSplit) continue;
      const lastSeg = SEGMENTS.find(x => x.n === lastSplit.n);
      if (s.cumMi <= lastSeg.cumMi) continue;
      r[s.n] = { at: new Date(new Date(lastSplit.at).getTime() + (s.cumMi - lastSeg.cumMi) * projection.pacePerMi).toISOString(), actual: false };
    }
    return r;
  }, [projection, splits, lastSplit]);

  function cutoffStatus(seg) {
    if (!seg.cutoff) return null;
    const cutoffTime = new Date(seg.cutoff);
    const actual = splits[seg.n] ? new Date(splits[seg.n]) : null;
    const eta    = segEtas[seg.n] ? new Date(segEtas[seg.n].at) : null;
    if (actual) { const margin = cutoffTime - actual; return { kind: margin >= 0 ? "made" : "missed", margin, label: margin >= 0 ? "+" + fmtDur(margin) : "MISSED " + fmtDur(-margin) }; }
    if (eta)    { const margin = cutoffTime - eta;    return { kind: margin >= 1800000 ? "safe" : margin >= 0 ? "tight" : "danger", margin, label: margin >= 0 ? "+" + fmtDur(margin) : "-" + fmtDur(-margin) }; }
    return null;
  }

  function recordSplit(segN, timeStr) {
    const iso = timeStr ? parseTime(timeStr) : new Date().toISOString();
    if (!iso) return;
    saveSplits({ ...splits, [segN]: iso });
  }
  function clearSplit(segN) { const c = { ...splits }; delete c[segN]; saveSplits(c); }

  if (!loaded) return <div style={{padding:32,color:"#c3e28f",fontFamily:"monospace"}}>Loading...</div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="topbar">
          <div className="brand"><h1>Creede 100</h1><small>CREW · Jul 25-26 2026</small></div>
          <div className="unit-toggle">
            <button className={unit==="mi"?"on":""} onClick={()=>saveUnit("mi")}>MI</button>
            <button className={unit==="km"?"on":""} onClick={()=>saveUnit("km")}>KM</button>
          </div>
        </div>
        <div className="wrap">
          {tab==="track"  && <TrackTab unit={unit} splits={splits} segEtas={segEtas} projection={projection} now={now} cutoffStatus={cutoffStatus} onOpenSeg={s=>setSelectedSeg(s.n)} goalHours={goalHours} saveGoal={saveGoal} actualStart={actualStart} saveActualStart={saveActualStart} expectedTimes={expectedTimes} />}
          {tab==="checks" && <ChecksTab checks={checks} saveChecks={saveChecks} />}
          {tab==="drive"  && <DriveTab />}
          {tab==="plan"   && <PlanTab unit={unit} />}
        </div>
        {selectedSeg !== null && (
          <SegDrawer seg={SEGMENTS.find(s=>s.n===selectedSeg)} splits={splits} segEtas={segEtas} notes={notes} saveNotes={saveNotes} assessment={assessment} saveAssessment={saveAssessment} recordSplit={recordSplit} clearSplit={clearSplit} cutoffStatus={cutoffStatus} unit={unit} goalHours={goalHours} actualStart={actualStart} expectedTimes={expectedTimes} close={()=>setSelectedSeg(null)} />
        )}
        <nav className="nav">
          {[["track","◈","Track"],["checks","✓","Crew"],["drive","↗","Drive"],["plan","☰","Plan"]].map(([id,icon,label])=>(
            <button key={id} className={"nav-item"+(tab===id?" on":"")} onClick={()=>setTab(id)}>
              <span className="icon">{icon}</span>{label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

function TrackTab({ unit, splits, segEtas, projection, now, cutoffStatus, onOpenSeg, goalHours, saveGoal, actualStart, saveActualStart, expectedTimes }) {
  const raceCutoff = new Date(RACE_CUTOFF_ISO);
  const lastN = Object.keys(splits).map(Number).sort((a,b)=>b-a)[0];
  const lastSeg = lastN !== undefined ? SEGMENTS.find(s=>s.n===lastN) : null;
  const nextSeg = lastSeg ? SEGMENTS.find(s=>s.n===lastSeg.n+1) : SEGMENTS[1];
  const startMs = actualStart ? new Date(actualStart).getTime() : new Date(RACE_START_ISO).getTime();
  const elapsed = lastSeg ? (new Date(splits[lastSeg.n]).getTime()-startMs) : Math.max(0, now-startMs);
  let finishCls="", finishLabel="-";
  if (projection?.etaFinish) { const margin=raceCutoff-projection.etaFinish; finishCls=margin>=3600000?"go":margin>=0?"warn":"bad"; finishLabel=fmtTime(projection.etaFinish.toISOString()); }
  const [startInput, setStartInput] = useState("");
  return (
    <>
      <div className="hero">
        <div className="hero-label">Current leg</div>
        <div className="hero-big">{nextSeg?.name ?? "Finished!"}</div>
        <div className="hero-sub">{lastSeg ? "Last: "+lastSeg.name+" @ "+fmtTime(splits[lastSeg.n]) : "No splits yet - tap Start to begin."}</div>
        <div className="kpis">
          <div className="kpi"><div className="kpi-l">Elapsed</div><div className="kpi-v">{fmtDur(elapsed)}</div></div>
          <div className="kpi"><div className="kpi-l">Done</div><div className="kpi-v">{fmtDist(lastSeg?.cumMi??0,unit)}</div></div>
          <div className="kpi"><div className="kpi-l">ETA finish</div><div className={"kpi-v "+finishCls}>{finishLabel}</div></div>
        </div>
        {projection?.pacePerMi && <div className="hero-sub" style={{marginTop:8}}>Pace: {(projection.pacePerMi/60000).toFixed(1)} min/mi · cutoff {fmtTime(RACE_CUTOFF_ISO)}</div>}
      </div>
      <div className="panel" style={{marginTop:12}}>
        <div className="panel-label">Actual race start time</div>
        <div className="row-gap" style={{marginTop:6}}>
          <input className="time-input" placeholder="e.g. 8:05am" value={startInput} onChange={e=>setStartInput(e.target.value)} />
          <button className="btn" onClick={()=>{const iso=parseTime(startInput);if(iso){saveActualStart(iso);setStartInput("");}}}>Set</button>
          {actualStart && <button className="btn ghost" onClick={()=>saveActualStart(null)}>Clear ({fmtTime(actualStart)})</button>}
        </div>
        <div style={{fontSize:11,color:"var(--ink-3)",marginTop:4,fontFamily:"Space Mono,monospace"}}>Defaults to 8:00 AM. Set if runner started early or late.</div>
      </div>
      <div className="goal-bar">
        <label>Goal finish</label>
        <input type="range" min={24} max={40} step={0.5} value={goalHours} onChange={e=>saveGoal(parseFloat(e.target.value))} />
        <span className="v">{goalHours}h</span>
      </div>
      <div className="section-title">Aid station timeline</div>
      <div className="seg-list">
        {SEGMENTS.map(s => {
          const status=cutoffStatus(s), done=!!splits[s.n], isNext=!done&&lastSeg&&s.n===lastSeg.n+1;
          const info=segInfo(s,goalHours,actualStart), exp=expectedTimes[s.n], liveEta=segEtas[s.n];
          const cls=["seg",s.crew?"crew":"",s.pacer?"pacer":"",done?"done":"",isNext?"next":"",(status?.kind==="danger"||status?.kind==="missed")?"danger":""].filter(Boolean).join(" ");
          return (
            <div key={s.n} className={cls} onClick={()=>onOpenSeg(s)}>
              <div className="seg-head">
                <div>
                  <div className="seg-n">{"#"+String(s.n).padStart(2,"0")+(info?" · "+(unit==="km"?info.segKm.toFixed(1)+"km":info.segMi.toFixed(1)+"mi")+" leg":"")}</div>
                  <div className="seg-name">{s.name}</div>
                </div>
                <div className="seg-mi">{fmtDist(s.cumMi,unit)}</div>
              </div>
              <div className="time-row">
                <div className="time-cell"><span className="time-label">Goal</span><span className="time-val goal">{exp?fmtTime(exp):"-"}</span></div>
                {done ? <div className="time-cell"><span className="time-label">Actual</span><span className="time-val actual">✓ {fmtTime(splits[s.n])}</span></div>
                      : liveEta ? <div className="time-cell"><span className="time-label">Proj ETA</span><span className="time-val eta">{fmtTime(liveEta.at)}</span></div> : null}
                {s.cutoff && <div className="time-cell"><span className="time-label">Cutoff</span><span className="time-val cutoff">{fmtTime(s.cutoff)}</span></div>}
              </div>
              <div className="seg-row2">
                {s.crew   && <span className="chip crew">CREW</span>}
                {s.dropBag && <span className="chip drop">DROP</span>}
                {s.pacer  && <span className="chip pacer">PACER</span>}
                {status   && <span className={"chip "+status.kind}>{status.label}</span>}
              </div>
              {info && <div className="seg-meta">
                <div>{"↑"}<b>{unit==="km"?info.gainM.toLocaleString()+"m":info.gainFt.toLocaleString()+"ft"}</b></div>
                <div>{"↓"}<b>{unit==="km"?info.lossM.toLocaleString()+"m":info.lossFt.toLocaleString()+"ft"}</b></div>
                <div>Peak <b>{fmtElev(s.peakElev,unit)}</b></div>
                <div>End <b>{fmtElev(s.elev,unit)}</b></div>
              </div>}
              {info && <div className="seg-meta" style={{marginTop:3,borderTop:"1px dashed var(--line)",paddingTop:3}}>
                <div>Cutoff pace <b style={{color:"var(--caution)"}}>{fmtPace(unit==="km"?info.reqPaceMinKm:info.reqPaceMinMi,unit)}</b></div>
                <div>Goal pace <b style={{color:"var(--mint)"}}>{fmtPace(unit==="km"?info.goalPaceMinKm:info.goalPaceMinMi,unit)}</b></div>
              </div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SegDrawer({ seg, splits, segEtas, notes, saveNotes, assessment, saveAssessment, recordSplit, clearSplit, cutoffStatus, unit, goalHours, actualStart, expectedTimes, close }) {
  const [manualTime, setManualTime] = useState("");
  const [localNote,  setLocalNote]  = useState(notes[seg.n]||"");
  const status=cutoffStatus(seg), checklist=CREW_CHECKLISTS[seg.n], hasSplit=!!splits[seg.n];
  const info=segInfo(seg,goalHours,actualStart), exp=expectedTimes[seg.n];
  useEffect(()=>setLocalNote(notes[seg.n]||""),[seg.n,notes]);
  function toggleAssessment(segN,key) { const cur=assessment[segN]||{}; saveAssessment({...assessment,[segN]:{...cur,[key]:!cur[key]}}); }
  return (
    <>
      <div className="drawer-bg" onClick={close} />
      <div className="drawer">
        <div className="drawer-handle" />
        <h2>{seg.name}</h2>
        <div className="sub">{info ? "Leg: "+(unit==="km"?info.segKm.toFixed(1)+"km":info.segMi.toFixed(1)+"mi")+" · End: "+fmtElev(seg.elev,unit)+" · Peak: "+fmtElev(seg.peakElev,unit) : fmtDist(seg.cumMi,unit)+" total"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,margin:"10px 0"}}>
          <div className="kpi"><div className="kpi-l">Goal arrival</div><div className="kpi-v go" style={{fontSize:13}}>{exp?fmtTime(exp):"-"}</div></div>
          <div className="kpi"><div className="kpi-l">Actual</div><div className="kpi-v" style={{fontSize:13}}>{hasSplit?fmtTime(splits[seg.n]):"-"}</div></div>
          <div className="kpi"><div className="kpi-l">Cutoff</div><div className="kpi-v warn" style={{fontSize:13}}>{seg.cutoff?fmtTime(seg.cutoff):"none"}</div></div>
        </div>
        {info && <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
          <div className="kpi"><div className="kpi-l">↑ Gain</div><div className="kpi-v" style={{fontSize:14}}>{unit==="km"?info.gainM.toLocaleString()+" m":info.gainFt.toLocaleString()+" ft"}</div></div>
          <div className="kpi"><div className="kpi-l">↓ Loss</div><div className="kpi-v" style={{fontSize:14}}>{unit==="km"?info.lossM.toLocaleString()+" m":info.lossFt.toLocaleString()+" ft"}</div></div>
          <div className="kpi"><div className="kpi-l">Cutoff pace</div><div className="kpi-v warn" style={{fontSize:14}}>{fmtPace(unit==="km"?info.reqPaceMinKm:info.reqPaceMinMi,unit)}</div></div>
          <div className="kpi"><div className="kpi-l">{"Goal pace ("+goalHours+"h)"}</div><div className="kpi-v go" style={{fontSize:14}}>{fmtPace(unit==="km"?info.goalPaceMinKm:info.goalPaceMinMi,unit)}</div></div>
        </div>}
        {status && <div className={"banner "+(status.kind==="safe"||status.kind==="made"?"info":status.kind==="tight"?"warn":"danger")}>CUTOFF {fmtTime(seg.cutoff)} · {status.label}</div>}
        <div className="section-title" style={{marginTop:8}}>Record split</div>
        {hasSplit ? (
          <div className="banner info">Recorded: {fmtTime(splits[seg.n])}<div style={{marginTop:8}}><button className="btn ghost" onClick={()=>clearSplit(seg.n)}>Clear split</button></div></div>
        ) : (
          <div className="row-gap" style={{marginTop:6}}>
            <button className="btn" onClick={()=>recordSplit(seg.n,null)}>Mark NOW</button>
            <input className="time-input" placeholder="e.g. 2:15pm" value={manualTime} onChange={e=>setManualTime(e.target.value)} />
            <button className="btn ghost" onClick={()=>{recordSplit(seg.n,manualTime);setManualTime("");}}>Log time</button>
          </div>
        )}
        {checklist && <>
          <div className="section-title">Crew checklist</div>
          <CrewChecklist segN={seg.n} checklist={checklist} />
        </>}
        <div className="section-title">Runner assessment</div>
        <div className="check-list">
          {RUNNER_ASSESSMENT.map(item => {
            const on=!!(assessment[seg.n]?.[item.key]);
            return (
              <div key={item.key} className={"check "+(on?"on":"")} onClick={()=>toggleAssessment(seg.n,item.key)}>
                <div className="box">{on?"✓":""}</div>
                <div><div style={{fontWeight:600}}>{item.icon+" "+item.label}</div><div style={{fontSize:12,color:"var(--ink-3)",marginTop:2}}>{item.detail}</div></div>
              </div>
            );
          })}
        </div>
        <div className="section-title">Crew notes</div>
        <div style={{fontSize:13,color:"var(--ink-2)",lineHeight:1.45,marginBottom:6}}>{seg.notes}</div>
        <textarea className="note-input" rows={3} value={localNote} placeholder="e.g. Feet OK, ate half sandwich, slight nausea" onChange={e=>setLocalNote(e.target.value)} onBlur={()=>saveNotes({...notes,[seg.n]:localNote})} />
        <div style={{marginTop:18,textAlign:"center"}}><button className="btn ghost" onClick={close}>Close</button></div>
      </div>
    </>
  );
}

function CrewChecklist({ segN, checklist }) {
  const [checks, setChecks] = useState(() => { const v=LS.get(K.checks); return v?JSON.parse(v.value):{}; });
  function toggle(key) { const next={...checks,[key]:!checks[key]}; setChecks(next); LS.set(K.checks,JSON.stringify(next)); }
  function Section({ title, items, prefix }) {
    return <>
      <div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--ink-3)",letterSpacing:"0.1em",marginTop:12,textTransform:"uppercase"}}>{title}</div>
      <div className="check-list">
        {items.map((t,i) => { const key=segN+"-"+prefix+"-"+i, on=!!checks[key]; return (
          <div key={key} className={"check "+(on?"on":"")} onClick={()=>toggle(key)}>
            <div className="box">{on?"✓":""}</div><div>{t}</div>
          </div>
        );})}
      </div>
    </>;
  }
  return <>
    <Section title="Before runner arrives" items={checklist.before}     prefix="b" />
    <Section title="When runner arrives"   items={checklist.onArrival}  prefix="a" />
    <Section title="Send them out with"    items={checklist.departWith} prefix="d" />
  </>;
}

function PlanTab({ unit }) {
  const sections = [
    ["Fueling targets per hour", ["Carbs: 60-90 g/h aim 70","Fluid: 500-750 ml/h","Sodium: 400-800 mg/h","Protein: 5-10 g every 1-2 h after hour 6","Caffeine: save for Lost Trail and sunrise"]],
    ["Mandatory gear", ["Rain jacket/poncho always","Headlamp + backup at night","Insulating layer at night","Whistle","Buff and gloves treat as mandatory","CORSAR card runner and pacer"]],
    ["Drop-bag locations", ["AS2 Spring Creek 1 - refresh sunscreen socks","AS5 Lost Trail - full night kit spare shoes 10 gels","AS8 Spring Creek 2 - mile 80 savory-foods bag","AS9 Willow Creek - last headlamp socks jerky"]],
    ["Altitude red flags STOP RACE", ["Shortness of breath AT REST + cough = HAPE","Confusion ataxia slurred speech = HACE","Frothy pink or white sputum","Blue/grey lips or fingernails","DESCEND immediately - no buckle is worth HAPE/HACE"]],
    ["Mile 80 playbook", ["Switch sweet to savory chips broth potatoes","Buff over mouth if cold air hurts lungs","10-min nap at Spring Creek 2 if daylight winning","Walk in 10-min segments with micro-goals","Sunrise 6 AM Sunday = morale boost"]],
    ["Key nav warnings", ["Oso Creek: turn RIGHT and UPHILL at junction 1.5 mi in","Bent inbound: LEFT on West Lost Creek Trail 822 at mi 4.15","Willow Creek tundra: no trail on ground - follow flags only"]],
    ["Post-race", ["300-500 kcal + 20g protein within 30 min","Shower dry warm fast","NO ibuprofen for 48 h kidney risk","Do not drive Sunday night keep hotel room","Descend altitude Monday if possible"]],
  ];
  return <>
    <div className="section-title">Race plan</div>
    <div className="banner info">Start 8:00 AM Sat Jul 25 · 40-h cutoff 11:59 PM Sun Jul 26</div>
    {sections.map(([title,items])=>(
      <details key={title}><summary>{title}</summary><ul>{items.map(i=><li key={i}>{i}</li>)}</ul></details>
    ))}
  </>;
}

function DriveTab() {
  const extras = [
    ["Crew self-care", ["Eat every 3 hours","Nap 11 AM-3 PM Sat before Lost Trail","Nap 3-7 AM Sun at Lost Trail lot after runner departs","If drowsy driving pull over always"]],
    ["Vehicle readiness", ["Full tank before leaving Creede Saturday","Gas only in Creede South Fork Lake City","Know how to change a flat","Wash vehicle before entering Forest Service land"]],
    ["Communication", ["Satellite messenger Garmin inReach or Zoleo for crew and runner","Pre-set messages ok slowing dropping emergency","Cell spots Creede partial South Fork good Lake City partial","Home contact with race director phone and runner inReach ID"]],
  ];
  return <>
    <div className="section-title">Crew driving plan</div>
    <div className="banner warn">NO CELL SERVICE on most of the course. Print directions. Full tank of gas.</div>
    {Object.entries(DRIVE_LEGS).map(([n,leg])=>(
      <div className="drive-card" key={n}>
        <div className="big">{leg.from+" → "+leg.to}</div>
        <div className="mono">{leg.miles+" mi · ~"+leg.minutes+" min drive"}</div>
        <div className="route">{leg.route}</div>
      </div>
    ))}
    {extras.map(([title,items])=>(
      <details key={title}><summary>{title}</summary><ul>{items.map(i=><li key={i}>{i}</li>)}</ul></details>
    ))}
  </>;
}

function ChecksTab({ checks, saveChecks }) {
  return <>
    <div className="section-title">Crew-point checklists</div>
    <div className="banner info">Check off as you prep each meet-up. Persists between sessions.</div>
    {[2,5,8,9].map(n => {
      const seg=SEGMENTS.find(s=>s.n===n), cl=CREW_CHECKLISTS[n];
      return (
        <details key={n} open={n===5}>
          <summary>{seg.name}</summary>
          {[["BEFORE arrival",cl.before,"b"],["WHEN runner arrives",cl.onArrival,"a"],["SEND out with",cl.departWith,"d"]].map(([title,items,prefix])=>(
            <div key={prefix}>
              <div style={{fontFamily:"Space Mono,monospace",fontSize:11,color:"var(--ink-3)",letterSpacing:"0.1em",marginTop:12,textTransform:"uppercase"}}>{title}</div>
              <div className="check-list">
                {items.map((t,i)=>{ const key=n+"-"+prefix+"-"+i, on=!!checks[key]; return (
                  <div key={key} className={"check "+(on?"on":"")} onClick={()=>saveChecks({...checks,[key]:!on})}>
                    <div className="box">{on?"✓":""}</div><div>{t}</div>
                  </div>
                );})}
              </div>
            </div>
          ))}
        </details>
      );
    })}
    <details style={{marginTop:14}}>
      <summary>Reset all data</summary>
      <div style={{marginTop:8}}>
        <button className="btn danger" onClick={()=>{ if(window.confirm("Clear ALL race data?")){Object.values(K).forEach(k=>localStorage.removeItem(k));setTimeout(()=>location.reload(),200);}}}>Reset everything</button>
      </div>
    </details>
  </>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');
:root{--bg:#0b120a;--bg-2:#101a0f;--panel:#18241a;--panel-2:#1f2e20;--line:#2a3b2b;--line-strong:#3e5440;--ink:#e8f0df;--ink-2:#b5c7a7;--ink-3:#7f9275;--safety:#f2c14e;--blaze:#ff7a2a;--blood:#d34040;--go:#7fb86b;--mint:#c3e28f;--sky:#7ab4d9;--caution:#e4a94a;}
*{box-sizing:border-box;}
.app{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;padding-bottom:100px;}
.wrap{max-width:520px;margin:0 auto;padding:14px 14px 0;}
.topbar{display:flex;align-items:flex-end;justify-content:space-between;padding:8px 14px 12px;max-width:520px;margin:0 auto;border-bottom:1px solid var(--line);}
.brand{display:flex;align-items:baseline;gap:8px;}
.brand h1{margin:0;font-family:Archivo Black,sans-serif;font-size:20px;letter-spacing:.02em;text-transform:uppercase;color:var(--safety);}
.brand small{font-family:Space Mono,monospace;color:var(--ink-3);font-size:11px;letter-spacing:.08em;}
.unit-toggle{display:inline-flex;border:1px solid var(--line-strong);border-radius:2px;overflow:hidden;background:var(--panel);}
.unit-toggle button{background:transparent;border:0;color:var(--ink-2);padding:6px 12px;font-family:Space Mono,monospace;font-size:12px;cursor:pointer;}
.unit-toggle button.on{background:var(--safety);color:#0b120a;font-weight:700;}
.hero{background:linear-gradient(180deg,var(--panel) 0%,var(--panel-2) 100%);border:1px solid var(--line);border-radius:4px;padding:14px;margin-top:14px;position:relative;overflow:hidden;}
.hero-label{font-family:Space Mono,monospace;color:var(--safety);font-size:10px;letter-spacing:.2em;text-transform:uppercase;}
.hero-big{font-family:Archivo Black,sans-serif;font-size:24px;line-height:1.05;margin:4px 0 6px;}
.hero-sub{font-family:Space Mono,monospace;color:var(--ink-2);font-size:11px;}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;}
.kpi{background:rgba(0,0,0,.3);border:1px solid var(--line);border-radius:3px;padding:8px 10px;}
.kpi-l{font-family:Space Mono,monospace;font-size:9px;letter-spacing:.12em;color:var(--ink-3);text-transform:uppercase;}
.kpi-v{font-family:Archivo Black,sans-serif;font-size:16px;color:var(--ink);}
.kpi-v.go{color:var(--mint);}.kpi-v.warn{color:var(--caution);}.kpi-v.bad{color:var(--blood);}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:10px 12px;}
.panel-label{font-family:Space Mono,monospace;font-size:11px;color:var(--safety);letter-spacing:.15em;text-transform:uppercase;}
.row-gap{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.goal-bar{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:10px 12px;display:flex;align-items:center;gap:10px;margin-top:8px;}
.goal-bar label{font-family:Space Mono,monospace;font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.1em;}
.goal-bar input{flex:1;}
.goal-bar .v{font-family:Archivo Black,sans-serif;color:var(--safety);font-size:16px;}
.section-title{display:flex;align-items:center;gap:10px;margin:18px 0 8px;font-family:Space Mono,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--safety);}
.section-title::after{content:"";flex:1;border-top:1px dashed var(--line-strong);}
.seg-list{display:flex;flex-direction:column;gap:8px;}
.seg{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--line-strong);border-radius:3px;padding:10px 12px;cursor:pointer;}
.seg.crew{border-left-color:var(--safety);}.seg.pacer{border-left-color:var(--blaze);}
.seg.done{background:#14201a;opacity:.88;}.seg.next{border-left-color:var(--mint);box-shadow:0 0 0 1px var(--mint) inset;}
.seg.danger{border-left-color:var(--blood);}
.seg-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;}
.seg-n{font-family:Space Mono,monospace;color:var(--ink-3);font-size:11px;letter-spacing:.1em;}
.seg-name{font-family:Archivo Black,sans-serif;font-size:14px;color:var(--ink);}
.seg-mi{font-family:Space Mono,monospace;font-size:12px;color:var(--ink-2);white-space:nowrap;}
.time-row{display:flex;gap:10px;margin-top:7px;flex-wrap:wrap;}
.time-cell{display:flex;flex-direction:column;min-width:80px;}
.time-label{font-family:Space Mono,monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);}
.time-val{font-family:Space Mono,monospace;font-size:11px;font-weight:700;}
.time-val.goal{color:var(--mint);}.time-val.actual{color:var(--safety);}.time-val.eta{color:var(--sky);}.time-val.cutoff{color:var(--blood);}
.seg-row2{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap;}
.chip{display:inline-flex;align-items:center;font-family:Space Mono,monospace;font-size:10px;letter-spacing:.08em;padding:2px 6px;border-radius:2px;border:1px solid currentColor;text-transform:uppercase;}
.chip.crew{color:var(--safety);}.chip.drop{color:var(--sky);}.chip.pacer{color:var(--blaze);}
.chip.safe,.chip.made{color:var(--mint);background:rgba(127,184,107,.1);}
.chip.tight{color:var(--caution);}
.chip.danger,.chip.missed{color:var(--blood);background:rgba(211,64,64,.15);}
.seg-meta{display:flex;gap:12px;margin-top:5px;font-family:Space Mono,monospace;font-size:11px;color:var(--ink-2);flex-wrap:wrap;}
.seg-meta b{color:var(--ink);}
.drawer-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:50;}
.drawer{position:fixed;left:0;right:0;bottom:0;z-index:51;background:var(--bg-2);border-top:1px solid var(--line-strong);border-top-left-radius:14px;border-top-right-radius:14px;max-height:90vh;overflow-y:auto;padding:16px;box-shadow:0 -20px 60px rgba(0,0,0,.6);}
.drawer-handle{width:40px;height:4px;background:var(--line-strong);border-radius:2px;margin:0 auto 14px;}
.drawer h2{font-family:Archivo Black,sans-serif;font-size:18px;margin:0 0 4px;color:var(--safety);}
.drawer .sub{font-family:Space Mono,monospace;font-size:12px;color:var(--ink-3);margin-bottom:10px;}
.btn{background:var(--safety);color:#0b120a;border:0;padding:10px 14px;font-family:Space Mono,monospace;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;border-radius:2px;}
.btn.ghost{background:transparent;color:var(--ink-2);border:1px solid var(--line-strong);}
.btn.danger{background:var(--blood);color:#fff;}
.check-list{display:flex;flex-direction:column;gap:6px;margin-top:6px;}
.check{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;background:var(--panel);border:1px solid var(--line);border-radius:2px;cursor:pointer;font-size:14px;line-height:1.35;color:var(--ink);}
.check.on{text-decoration:line-through;color:var(--ink-3);background:#14201a;}
.check .box{width:18px;height:18px;border:2px solid var(--safety);border-radius:2px;flex-shrink:0;margin-top:1px;display:grid;place-items:center;font-size:13px;color:#0b120a;}
.check.on .box{background:var(--safety);}
.note-input{width:100%;background:#0f1810;color:var(--ink);border:1px solid var(--line-strong);border-radius:2px;padding:8px 10px;font-family:Space Mono,monospace;font-size:13px;margin-top:6px;resize:vertical;}
.time-input{background:#0f1810;color:var(--ink);border:1px solid var(--line-strong);padding:8px 10px;font-family:Space Mono,monospace;font-size:14px;border-radius:2px;width:120px;}
.banner{padding:10px 12px;margin-bottom:10px;border-radius:3px;font-family:Space Mono,monospace;font-size:12px;border:1px solid currentColor;}
.banner.info{color:var(--sky);background:rgba(122,180,217,.08);}
.banner.warn{color:var(--caution);background:rgba(228,169,74,.08);}
.banner.danger{color:var(--blood);background:rgba(211,64,64,.08);}
details{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:10px 12px;margin-top:8px;}
details summary{font-family:Space Mono,monospace;font-size:12px;color:var(--safety);letter-spacing:.1em;text-transform:uppercase;cursor:pointer;}
details li{font-size:13px;color:var(--ink-2);line-height:1.6;margin-left:16px;}
.drive-card{background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:12px;margin-bottom:10px;}
.drive-card .big{font-family:Archivo Black,sans-serif;font-size:16px;color:var(--ink);}
.drive-card .mono{font-family:Space Mono,monospace;font-size:12px;color:var(--ink-2);margin:4px 0;}
.drive-card .route{font-size:13px;line-height:1.45;color:var(--ink-2);margin-top:6px;}
.nav{position:fixed;bottom:0;left:0;right:0;background:var(--bg-2);border-top:1px solid var(--line-strong);display:grid;grid-template-columns:repeat(4,1fr);z-index:40;}
.nav-item{background:transparent;border:0;padding:12px 4px 16px;color:var(--ink-3);font-family:Space Mono,monospace;font-size:10px;letter-spacing:.1em;cursor:pointer;text-transform:uppercase;border-top:3px solid transparent;}
.nav-item .icon{display:block;font-size:18px;margin-bottom:2px;}
.nav-item.on{color:var(--safety);border-top-color:var(--safety);}
`;
