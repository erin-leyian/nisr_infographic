import { useEffect, useRef, useState } from "react";

// ---- DATA (source: NISR, Seasonal Agricultural Survey 2025) ----
// [small-scale %, large-scale %]
const INPUTS = [
  { id: "seeds", n: "Improved seeds", icon: "🌱", A: [35.9, 85.4], B: [16.7, 72.1] },
  { id: "irr", n: "Irrigation", icon: "💧", A: [12, 64.1], B: [10.3, 62] },
  { id: "fert", n: "Inorganic fertilizer", icon: "🧪", A: [62.4, 91.9], B: [54.8, 83.7] },
  { id: "pest", n: "Pesticides", icon: "🐛", A: [40.6, 86.9], B: [35.6, 77.7] },
  { id: "mech", n: "Mechanical equipment", icon: "🚜", A: [0.3, 23], B: [0.2, 19] },
  { id: "org", n: "Organic fertilizer", icon: "♻️", A: [88.3, 77.5], B: [81.2, 63.8] },
];

// All farmers, three seasons (Annual Report 2025 summary)
const ALL = [
  { n: "Improved seeds", v: [37.3, 18, 18.9] },
  { n: "Inorganic fertilizer", v: [63.2, 55.5, 65.8] },
  { n: "Organic fertilizer", v: [88, 80.8, 83.5] },
  { n: "Pesticides", v: [41.9, 36.6, 67] },
  { n: "Irrigation", v: [13.4, 11.5, 58.9] },
];

// Average yield, t/ha: [small-scale, large-scale]. Reported by farmers (SAS 2025 A and B reports)
const YIELDS = [
  { n: "Maize", A: [1.9, 4.1], B: [1.2, 4.2] },
  { n: "Paddy rice", A: [2.0, 4.1], B: [2.0, 4.1] },
  { n: "Irish potato", A: [8.7, 11.4], B: [6.8, 14.2] },
  { n: "Cassava", A: [13.5, 17.9], B: [14.4, 17.7] },
  { n: "Banana", A: [11.6, 15.2], B: [12.4, 19.1] },
];
const gapText = (r) =>
  (r >= 10 ? Math.round(r) : (Math.round((r + 1e-9) * 10) / 10).toFixed(1)) + "× gap";

const STATS = [
  { n: 59, icon: "🏞️", text: "of national land (1.399M of 2.376M ha) used for agriculture" },
  { n: 90.3, icon: "🛡️", text: "of farmers practiced erosion control" },
  { n: 46.2, icon: "🌳", text: "of farmers practiced agroforestry" },
  { n: 0.9, icon: "🚜", text: "of farmers used mechanical equipment" },
];

function CountUp({ to, suffix = "%" }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    let raf;
    const run = () => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1300, 1);
        setVal(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { run(); io.disconnect(); }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  const dec = String(to).includes(".") ? 1 : 0;
  return <b ref={ref}>{val.toFixed(dec)}{suffix}</b>;
}

function Dots({ value, kind }) {
  const filled = Math.round(value);
  return (
    <div className="dots" aria-label={`${filled} of 100 farmers`}>
      {Array.from({ length: 100 }, (_, i) => (
        <i key={i} className={i < filled ? `dot on ${kind}` : "dot"} style={{ "--d": `${i * 9}ms` }} />
      ))}
    </div>
  );
}

function Bar({ type, label, value, pct = value, unit = "%" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 50);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="bar">
      <span className="lab">{label}</span>
      <div className="track"><div className={`fill ${type}`} style={{ width: `${w}%` }} /></div>
      <span className="val">{value}{unit}</span>
    </div>
  );
}

function Row({ d, season }) {
  const v = d[season];
  if (!v) {
    return (
      <div className="row">
        <h3>{d.icon} {d.n}</h3>
        <p className="na">{d.note || "Not reported for this season."}</p>
      </div>
    );
  }
  const ratio = v[1] / v[0];
  const gap = ratio >= 1 ? gapText(ratio) : "Small-scale lead";
  return (
    <div className="row">
      <h3><span>{d.icon} {d.n}</span><span className="gap">{gap}</span></h3>
      <Bar type="s" label="Small" value={v[0]} />
      <Bar type="l" label="Large" value={v[1]} />
    </div>
  );
}

export default function App() {
  const [season, setSeason] = useState("A");
  const [pick, setPick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const go = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Autoplay tour for recording the MP4 (about 45 seconds)
  async function present() {
    setPlaying(true);
    setSeason("A");
    setPick(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await sleep(5000);
    go("sec-stats");
    await sleep(4500);
    go("sec-dots");
    setRun((r) => r + 1);
    await sleep(4500);
    for (const i of [1, 2, 3, 4, 5]) {
      setPick(i); setRun((r) => r + 1);
      await sleep(2500);
    }
    setSeason("B");
    for (const i of [0, 1, 2, 3, 4, 5]) {
      setPick(i); setRun((r) => r + 1);
      await sleep(2000);
    }
    go("sec-gap");
    setRun((r) => r + 1);
    await sleep(5000);
    go("sec-yield");
    setRun((r) => r + 1);
    await sleep(5000);
    go("sec-year");
    await sleep(5000);
    go("sec-take");
    await sleep(5000);
    go("foot");
    await sleep(3500);
    setPlaying(false);
  }

  const inp = INPUTS[pick];
  const v = inp[season];
  const ratio = v ? v[1] / v[0] : 0;

  return (
    <div>
      {!playing && (
        <button className="present" onClick={present}>▶ Play presentation</button>
      )}

      <header className="hero">
        <div className="sun" />
        <div className="inner">
          <span className="tag">Rwanda Seasonal Agricultural Survey 2025</span>
          <h1>
            One country,
            <br />
            <span>unequal tools.</span>
          </h1>
          <p className="lead">
            Rwanda uses 59% of its land for farming. But small-scale farmers use
            far fewer modern inputs than large-scale farmers.
          </p>
          <div className="big">
            <CountUp to={98} />
            <p>
              of Rwanda's cultivated crop area is farmed by small-scale
              farmers (Seasons A and B), yet they use far fewer modern tools.
            </p>
          </div>
        </div>
        <svg className="hills" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 130 C200 50 380 150 600 90 S1000 30 1200 110 V220 H0Z" fill="#1c6b3d" />
          <path d="M0 165 C250 105 450 195 700 145 S1050 105 1200 165 V220 H0Z" fill="#2f8f4e" />
          <path d="M0 200 C300 160 600 215 900 185 S1100 170 1200 195 V220 H0Z" fill="#7cc576" />
        </svg>
      </header>

      <main className="wrap">
        <section id="sec-stats">
          <h2>The farming landscape</h2>
          <p className="sub">Season A 2025 at a glance</p>
          <div className="stats">
            {STATS.map((s, i) => (
              <div className={`stat t${i}`} key={s.n}>
                <span className="ic">{s.icon}</span>
                <CountUp to={s.n} />
                <small>{s.text}</small>
              </div>
            ))}
          </div>
        </section>

        <section id="sec-dots">
          <h2>If you met 100 farmers…</h2>
          <p className="sub">Pick an input and a season. Each dot is one farmer.</p>
          <div className="chips" role="group" aria-label="Input">
            {INPUTS.map((d, i) => (
              <button key={d.id} className={i === pick ? "on" : ""}
                onClick={() => { setPick(i); setRun((r) => r + 1); }}>
                {d.icon} {d.n}
              </button>
            ))}
          </div>
          <div className="toggle" role="group" aria-label="Season">
            <button className={season === "A" ? "on" : ""} onClick={() => { setSeason("A"); setRun((r) => r + 1); }}>Season A</button>
            <button className={season === "B" ? "on" : ""} onClick={() => { setSeason("B"); setRun((r) => r + 1); }}>Season B</button>
          </div>
          {v ? (
            <div className="duo">
              <div className="panel">
                <b className="num s">{v[0]}%</b>
                <span>Small-scale farmers</span>
                <Dots key={`s${inp.id}${season}${run}`} value={v[0]} kind="s" />
              </div>
              <div className="panel">
                <b className="num l">{v[1]}%</b>
                <span>Large-scale farmers</span>
                <Dots key={`l${inp.id}${season}${run}`} value={v[1]} kind="l" />
              </div>
            </div>
          ) : (
            <p className="na card">{inp.note}</p>
          )}
          {v && (
            <p className="caption">
              {inp.icon} {inp.n}, Season {season}:{" "}
              {ratio >= 1 ? <strong>{gapText(ratio)}</strong> : <strong>small-scale farmers lead</strong>}.
              Dots are rounded to the nearest whole farmer.{v[0] < 0.5 && " Fewer than 1 in 100 small-scale farmers used it, so none of their dots are filled."}
            </p>
          )}
        </section>

        <section id="sec-gap">
          <h2>The scoreboard</h2>
          <p className="sub">All six inputs, Season {season}</p>
          <div className="legend">
            <span><i style={{ background: "var(--ssf)" }} />Small-scale farmers</span>
            <span><i style={{ background: "var(--lsf)" }} />Large-scale farmers</span>
          </div>
          {INPUTS.map((d) => (
            <Row key={d.id + season + run} d={d} season={season} />
          ))}
        </section>

        <section id="sec-yield">
          <h2>Does it show up in the harvest?</h2>
          <p className="sub">
            Average yield in tonnes per hectare, Season {season}. Yields are
            reported by farmers, and crop mix and location also differ, so this
            does not prove the inputs cause the gap.
          </p>
          {YIELDS.map((y) => {
            const v = y[season];
            return (
              <div className="row" key={y.n + season + run}>
                <h3><span>{y.n}</span><span className="gap">{gapText(v[1] / v[0])}</span></h3>
                <Bar type="s" label="Small" value={v[0]} pct={(v[0] / v[1]) * 100} unit=" t/ha" />
                <Bar type="l" label="Large" value={v[1]} pct={100} unit=" t/ha" />
              </div>
            );
          })}
        </section>

        <section id="sec-year">
          <h2>Across the whole year</h2>
          <p className="sub">
            Share of all farmers using each input, by season. Improved seed use
            dropped from 37.3% in Season A to 18% in Season B.
          </p>
          <table className="yr">
            <thead>
              <tr><th></th><th>Season A</th><th>Season B</th><th>Season C</th></tr>
            </thead>
            <tbody>
              {ALL.map((r) => (
                <tr key={r.n}>
                  <td>{r.n}</td>
                  {r.v.map((x, i) => <td key={i}>{x}%</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            Season C covered 946 survey segments (September 2025), fewer than
            Seasons A and B, so compare it with care.
          </p>
        </section>

        <section className="take" id="sec-take">
          <h2>What this means</h2>
          <ul>
            <li>Large-scale farmers are about 4 to 6 times more likely to use improved seeds and irrigation, and far more likely to use machines.</li>
            <li>Mechanical equipment shows the widest gap: 23% of large-scale farmers use it, against 0.3% of small-scale farmers (Season A).</li>
            <li>Narrowing these gaps is a clear priority for farm policy and support.</li>
          </ul>
        </section>

        <footer id="foot">
          Source: National Institute of Statistics of Rwanda (NISR), Seasonal
          Agricultural Survey 2025: Annual Report, Season A and Season B reports.
          Figures are shares of farmers using each input; the small-scale versus
          large-scale split comes from the Season A and Season B reports. The
          survey covered all 30 districts: 1,200 segments and about 380
          large-scale farmers in Seasons A and B, and 946 segments in Season C. Large-scale farmers are those with at least 10 hectares of agricultural land. The share of cultivated crop area comes from the Season A and Season B reports.
          <br />
          Created by Kenny Gael Ishimwe Gatete and Erin Wanjiru Leyian for the 2026 NISR Infographic Competition.
        </footer>
      </main>
    </div>
  );
}
