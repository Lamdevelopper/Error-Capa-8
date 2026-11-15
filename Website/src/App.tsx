import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  SquaresFour,
  Notebook,
  GearSix,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Broadcast,
  WifiSlash,
  Clock,
  Plus,
  X,
  CaretRight,
  Check,
  CheckCircle,
  BookOpen,
  ArrowCounterClockwise,
  WarningCircle,
  Circle,
  Planet,
  Sun,
  MoonStars,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  crew,
  crewStatus,
  statusText,
  JOURNAL_KEY,
  NASA_URL,
  type Crew,
  type Metric,
  type Range,
} from "./data";
import {
  appendJournal,
  mergeJournals,
  prioritizeCategories,
  readJournal,
  type CategoryId,
  type JournalEntry,
} from "./model";
import { CrewCard, CrewShape, CategoryIcon, StatusPill } from "./components";
import { MetricCard, TrendChart } from "./charts";

type View = "crew" | "journal" | "sources" | "settings";
const ranges: Range[] = ["24h", "7d", "30d"];
const navigation = [
  { id: "crew" as const, icon: SquaresFour, label: "Crew overview" },
  { id: "journal" as const, icon: Notebook, label: "Mission journal" },
  { id: "sources" as const, icon: BookOpen, label: "Evidence & sources" },
];

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`modal ${wide ? "wide" : ""}`}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className="modal-header">
        <span className="eyebrow">ERROR EN CAPA 8 / PERSONAL REVIEW</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={22} />
        </button>
      </div>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
}

function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (value: Range) => void;
}) {
  return (
    <div className="range-selector" aria-label="Chart time range">
      {ranges.map((range) => (
        <button
          key={range}
          aria-pressed={value === range}
          className={value === range ? "active" : ""}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export function App() {
  const [view, setView] = useState<View>("crew");
  const [selected, setSelected] = useState<Crew | null>(null);
  const [categoryId, setCategoryId] = useState<CategoryId>("recovery");
  const [range, setRange] = useState<Range>("7d");
  const [metric, setMetric] = useState<Metric | null>(null);
  const [checkinCrew, setCheckinCrew] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "attention">("all");
  const [groundLink, setGroundLink] = useState(true);
  const [journal, setJournal] = useState<JournalEntry[]>(() => {
    try {
      return readJournal(localStorage.getItem(JOURNAL_KEY));
    } catch {
      return [];
    }
  });
  const [sessionOnly, setSessionOnly] = useState(false);
  const [toast, setToast] = useState("");
  const [journalFilter, setJournalFilter] = useState("all");
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  const category = selected?.categories.find((item) => item.id === categoryId);
  const needsReview = crew.filter((p) =>
    ["review", "priority"].includes(crewStatus(p)),
  );
  function navigate(next: View) {
    setView(next);
    setSelected(null);
  }
  function openCrew(id: string, category?: CategoryId) {
    const person = crew.find((item) => item.id === id)!;
    setSelected(person);
    setView("crew");
    setCategoryId(category || prioritizeCategories(person.categories)[0].id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function saveCheckin(entry: JournalEntry) {
    let next = appendJournal(journal, entry);
    try {
      next = appendJournal(
        mergeJournals(journal, readJournal(localStorage.getItem(JOURNAL_KEY))),
        entry,
      );
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(next));
      setSessionOnly(false);
    } catch {
      setSessionOnly(true);
    }
    setJournal(next);
    setCheckinCrew(null);
    setToast(
      "Check-in recorded. Your observation remains available for follow-up.",
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <button
          className="brand-button"
          aria-label="Crew overview home"
          onClick={() => navigate("crew")}
        >
          <img src="/assets/logo.svg" alt="Error en Capa 8" />
        </button>
        <span className="rail-divider" />
        <nav>
          {navigation.map((item) => (
            <button
              key={item.id}
              title={item.label}
              aria-label={item.label}
              aria-current={view === item.id ? "page" : undefined}
              className={`nav-button ${view === item.id ? "active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              <item.icon
                size={25}
                weight={view === item.id ? "fill" : "regular"}
              />
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <button
            className={`nav-button ${view === "settings" ? "active" : ""}`}
            aria-label="Demo settings"
            title="Demo settings"
            onClick={() => navigate("settings")}
          >
            <GearSix size={25} />
          </button>
          <span className="rail-edition">EC—08</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mission-lockup">
            <Planet size={26} weight="duotone" />
            <div>
              <strong>ERROR EN CAPA 8</strong>
              <span>HUMAN HEALTH / MISSION SYSTEMS</span>
            </div>
          </div>
          <div className="mission-meta">
            <span className="mission-tag">EXPEDITION 08</span>
            <span className="mission-day">
              MISSION DAY <b>084</b>
            </span>
            <span className={`connection ${!groundLink ? "disconnected" : ""}`}>
              {groundLink ? <Broadcast size={17} /> : <WifiSlash size={17} />}
              <span>
                {groundLink ? "Ground link · demo" : "Ground link offline"}
              </span>
            </span>
          </div>
        </header>
        {!groundLink && (
          <div className="offline-banner">
            <WifiSlash size={18} />
            <span>
              <strong>Ground link offline.</strong> Local demo data and
              check-ins remain available. No data is being sent.
            </span>
          </div>
        )}
        <main id="main-content">
          {view === "crew" && !selected && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow dark">
                    A SMALL CHECK. A LONGER JOURNEY.
                  </div>
                  <h1>
                    Crew wellbeing<span className="heading-dot">.</span>
                  </h1>
                  <p>Looking out for each other, one signal at a time.</p>
                </div>
                <div className="heading-actions">
                  <span className="demo-badge">
                    <Circle weight="fill" size={7} />
                    SYNTHETIC DEMO
                  </span>
                  <button
                    className="primary-button"
                    onClick={() => setCheckinCrew(crew[0].id)}
                  >
                    <Plus size={18} />
                    New check-in
                  </button>
                </div>
              </section>
              <div className="overview-toolbar">
                <div className="segmented">
                  <button
                    className={filter === "all" ? "active" : ""}
                    aria-pressed={filter === "all"}
                    onClick={() => setFilter("all")}
                  >
                    All crew <span>04</span>
                  </button>
                  <button
                    className={filter === "attention" ? "active" : ""}
                    aria-pressed={filter === "attention"}
                    onClick={() => setFilter("attention")}
                  >
                    Needs review{" "}
                    <span>
                      {needsReview.length.toString().padStart(2, "0")}
                    </span>
                  </button>
                </div>
                <div className="overview-key">
                  <span>
                    <i className="dot nominal" />
                    Steady
                  </span>
                  <span>
                    <i className="dot review" />
                    Review
                  </span>
                  <span>
                    <i className="dot priority" />
                    Priority
                  </span>
                  <span>
                    <i className="dot unknown" />
                    Missing data
                  </span>
                </div>
              </div>
              <div className="crew-grid">
                {(filter === "all" ? crew : needsReview).map((person) => (
                  <CrewCard
                    key={person.id}
                    person={person}
                    index={crew.indexOf(person)}
                    onOpen={openCrew}
                  />
                ))}
              </div>
              <div className="mission-strip">
                <div className="strip-icon">
                  <Sun size={26} />
                </div>
                <div>
                  <span className="eyebrow dark">TODAY’S RHYTHM</span>
                  <p>Make room for a moment of care.</p>
                </div>
                <div className="next-check">
                  <Clock size={18} />
                  <span>
                    Next routine check <b>16:00</b>
                  </span>
                </div>
                <button
                  className="text-button"
                  onClick={() => setCheckinCrew(crew[0].id)}
                >
                  Start a check-in <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {view === "crew" && selected && category && (
            <>
              <button className="back-button" onClick={() => setSelected(null)}>
                <ArrowLeft size={17} />
                All crew<span>/</span>
                {selected.name}
              </button>
              <section className="individual-heading">
                <div>
                  <div className="eyebrow dark">
                    PERSONAL OVERVIEW / CREW 0{crew.indexOf(selected) + 1}
                  </div>
                  <h1>
                    {selected.name}
                    <span className="heading-dot">.</span>
                  </h1>
                  <p>{selected.description}</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setCheckinCrew(selected.id)}
                >
                  <Plus size={18} />
                  New check-in
                </button>
              </section>
              <div className="individual-layout">
                <aside className="personal-panel">
                  <div className="personal-identity">
                    <CrewShape
                      shape={selected.shape}
                      color={selected.color}
                      size={105}
                    />
                    <span className="eyebrow">{selected.role}</span>
                    <StatusPill status={crewStatus(selected)} />
                  </div>
                  <div className="personal-categories">
                    {prioritizeCategories(selected.categories).map((item) => (
                      <button
                        key={item.id}
                        className={`personal-category ${categoryId === item.id ? "active" : ""}`}
                        onClick={() => setCategoryId(item.id)}
                      >
                        <CategoryIcon id={item.id} />
                        <span>
                          <strong>{item.short}</strong>
                          <small className={item.status}>
                            {statusText[item.status]}
                          </small>
                        </span>
                        <CaretRight size={17} />
                      </button>
                    ))}
                  </div>
                  <div className="exposure-note">
                    <ShieldCheck size={22} />
                    <strong>Radiation exposure</strong>
                    <span>No dosimeter connected</span>
                    <small>Exposure requires a dedicated measurement.</small>
                  </div>
                </aside>
                <section
                  className="category-content"
                  aria-label={category.name}
                >
                  <div className="category-heading">
                    <div>
                      <span className="eyebrow dark">
                        {category.name.toUpperCase()}
                      </span>
                      <h2>{category.observation}</h2>
                    </div>
                    <RangeSelector value={range} onChange={setRange} />
                  </div>
                  {category.status !== "nominal" && (
                    <div className={`observation-banner ${category.status}`}>
                      <WarningCircle size={24} />
                      <p>
                        {category.status === "unknown"
                          ? "A missing sample is not a steady reading. Review the collection status."
                          : "A review flag is active in this simulated scenario. Check the signals and their context."}
                      </p>
                      <span>DEMO OBSERVATION</span>
                    </div>
                  )}
                  <div className="metric-grid">
                    {category.metrics.map((item) => (
                      <MetricCard
                        key={item.id}
                        metric={item}
                        range={range}
                        onOpen={() => setMetric(item)}
                      />
                    ))}
                  </div>
                  <div className="followup-card">
                    <div className="followup-icon">
                      <MoonStars size={28} />
                    </div>
                    <div>
                      <span className="eyebrow dark">YOUR NEXT SMALL STEP</span>
                      <h3>
                        {category.status === "unknown"
                          ? "Check the missing measurement."
                          : "Take a moment to check in."}
                      </h3>
                      <p>
                        Record how you feel and choose a follow-up to discuss or
                        review.
                      </p>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => setCheckinCrew(selected.id)}
                    >
                      Review together <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="evidence-inline">
                    <BookOpen size={19} />
                    <p>{category.evidence}</p>
                    <a href={NASA_URL} target="_blank" rel="noreferrer">
                      NASA HRP <ArrowUpRight size={16} />
                    </a>
                  </div>
                </section>
              </div>
            </>
          )}

          {view === "journal" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow dark">
                    SMALL ACTIONS. A CONTINUOUS STORY.
                  </div>
                  <h1>
                    Mission journal<span className="heading-dot">.</span>
                  </h1>
                  <p>
                    Check-ins and follow-ups, kept on this device for the demo.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setCheckinCrew(crew[0].id)}
                >
                  <Plus size={18} />
                  New check-in
                </button>
              </section>
              <div className="journal-toolbar">
                <span className="eyebrow dark">
                  {journal.length.toString().padStart(2, "0")} RECORDED
                  CHECK-INS
                </span>
                <label>
                  Show{" "}
                  <select
                    value={journalFilter}
                    onChange={(event) => setJournalFilter(event.target.value)}
                  >
                    <option value="all">All crew</option>
                    {crew.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {journal.filter(
                (item) =>
                  journalFilter === "all" || item.crewId === journalFilter,
              ).length === 0 ? (
                <div className="empty-state">
                  <Notebook size={64} weight="light" />
                  <h2>A little care starts here.</h2>
                  <p>
                    No check-ins recorded
                    {journalFilter !== "all" ? " for this crew member" : ""}.
                    Open a crew member or start a new check-in.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      setCheckinCrew(
                        journalFilter === "all" ? crew[0].id : journalFilter,
                      )
                    }
                  >
                    Start a check-in <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <div className="journal-list">
                  {journal
                    .filter(
                      (item) =>
                        journalFilter === "all" ||
                        item.crewId === journalFilter,
                    )
                    .map((entry) => {
                      const person = crew.find((p) => p.id === entry.crewId);
                      return (
                        <article key={entry.id} className="journal-entry">
                          <div className="journal-symbol">
                            {person && (
                              <CrewShape
                                shape={person.shape}
                                color={person.color}
                                size={46}
                              />
                            )}
                          </div>
                          <div>
                            <div className="journal-title">
                              <h2>{person?.name || "Demo crew"}</h2>
                              <span>
                                {new Date(entry.at).toLocaleString("en-GB", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            <strong>{entry.action}</strong>
                            <p>{entry.note}</p>
                            <small>
                              SYNTHETIC DEMO ·{" "}
                              {sessionOnly ? "THIS SESSION" : "LOCAL DEVICE"} ·
                              OBSERVATION RETAINED
                            </small>
                          </div>
                          <CheckCircle size={25} className="journal-check" />
                        </article>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {view === "sources" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow dark">
                    KNOW THE SIGNAL. KNOW ITS LIMITS.
                  </div>
                  <h1>
                    Evidence & sources<span className="heading-dot">.</span>
                  </h1>
                  <p>
                    Spaceflight research gives context. Every observation still
                    needs context of its own.
                  </p>
                </div>
                <BookOpen size={52} weight="light" />
              </section>
              <div className="source-grid">
                {crew[0].categories.map((c) => (
                  <article className="source-card" key={c.id}>
                    <CategoryIcon id={c.id} size={36} />
                    <h2>{c.name}</h2>
                    <p>{c.evidence}</p>
                    <a href={NASA_URL} target="_blank" rel="noreferrer">
                      Read NASA HRP risks <ArrowUpRight size={18} />
                    </a>
                    <small>
                      NASA RESEARCH CONTEXT · NOT A VALIDATION OF DEMO FLAGS
                    </small>
                  </article>
                ))}
              </div>
              <div className="data-explainer">
                <ShieldCheck size={30} />
                <div>
                  <h2>Clear about what you’re seeing.</h2>
                  <p>
                    All crew members, measurements, personal references and
                    status flags in this prototype are fictional. The graphs are
                    not NASA datasets. No sensors or AI services are connected.
                    This interface supports review and follow-up; it does not
                    diagnose a condition.
                  </p>
                  <a
                    href="https://srag.jsc.nasa.gov/spaceradiation/how/how.cfm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    How NASA measures radiation exposure{" "}
                    <ArrowUpRight size={16} />
                  </a>
                </div>
              </div>
            </>
          )}

          {view === "settings" && (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow dark">READY FOR THE WALKTHROUGH.</div>
                  <h1>
                    Demo controls<span className="heading-dot">.</span>
                  </h1>
                  <p>
                    Explore how the interface behaves with a disconnected ground
                    link.
                  </p>
                </div>
                <GearSix size={48} weight="light" />
              </section>
              <section className="settings-panel">
                <div className="settings-row">
                  <div>
                    <h2>Ground link</h2>
                    <p>
                      Simulated uplink status. Local observations and the
                      journal stay available.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={groundLink}
                    aria-label="Ground link available"
                    className={`switch ${groundLink ? "on" : ""}`}
                    onClick={() => setGroundLink(!groundLink)}
                  >
                    <span />
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <h2>Data source</h2>
                    <p>
                      Reproducible synthetic fixtures · 4 fictional crew ·
                      Mission day 084.
                    </p>
                  </div>
                  <span className="demo-badge">DEMO ONLY</span>
                </div>
                <div className="settings-row">
                  <div>
                    <h2>Journal storage</h2>
                    <p>
                      {sessionOnly
                        ? "Browser storage unavailable. New entries remain only in this session."
                        : "Saved in this browser. Use fictional information only."}
                    </p>
                  </div>
                  <span className="storage-label">
                    {sessionOnly ? "SESSION" : "LOCAL DEVICE"}
                  </span>
                </div>
                <div className="settings-row">
                  <div>
                    <h2>Replay the crew scenario</h2>
                    <p>
                      Return to the full crew overview. Recorded check-ins stay
                      in the journal.
                    </p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setGroundLink(true);
                      setFilter("all");
                      navigate("crew");
                    }}
                  >
                    <ArrowCounterClockwise size={17} />
                    Replay demo
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>
            EC—08 <b>HUMAN FIRST. MISSION ALWAYS.</b>
          </span>
          <span>
            Fictional crew & simulated readings <i />
            SPACE APPS 2026
          </span>
        </footer>
      </div>

      {metric && selected && category && (
        <Modal title={metric.name} wide onClose={() => setMetric(null)}>
          <div className="detail-summary">
            <div className="detail-reading">
              {metric.value}
              <span>{metric.unit}</span>
            </div>
            <StatusPill status={metric.status} />
            <RangeSelector value={range} onChange={setRange} />
          </div>
          <div className="detail-chart">
            <TrendChart metric={metric} range={range} large />
          </div>
          <div className="chart-legend">
            <span>
              <i className="reference-line" />
              Personal reference · synthetic
            </span>
            <span>
              {metric.trendLabel ? `${metric.trendLabel} · ` : ""}
              {range} / {metric.freshness}
            </span>
          </div>
          <div className="metric-facts">
            <div>
              <span>MEASUREMENT</span>
              <strong>{metric.method}</strong>
            </div>
            <div>
              <span>PROVENANCE</span>
              <strong>Synthetic demo</strong>
            </div>
            <div>
              <span>DATA QUALITY</span>
              <strong>
                {metric.quality === "good"
                  ? "Simulated sample available"
                  : "Stale · current sample missing"}
              </strong>
            </div>
          </div>
          <p className="metric-note">{metric.note}</p>
          <details className="evidence-details">
            <summary>
              <BookOpen size={18} />
              Why track this in space?
              <CaretRight size={17} />
            </summary>
            <p>{category.evidence}</p>
            <a href={NASA_URL} target="_blank" rel="noreferrer">
              Explore NASA HRP research <ArrowUpRight size={16} />
            </a>
          </details>
          <div className="modal-footer">
            <span>No clinical threshold is applied in this demo.</span>
            <button
              className="primary-button"
              onClick={() => {
                setMetric(null);
                setCheckinCrew(selected.id);
              }}
            >
              Record a check-in <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {checkinCrew && (
        <Checkin
          crewId={checkinCrew}
          onClose={() => setCheckinCrew(null)}
          onSave={saveCheckin}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={20} />
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={17} />
          </button>
        </div>
      )}
      {sessionOnly && (
        <div className="storage-warning" role="status">
          Storage unavailable. Your journal is available in this session only.
        </div>
      )}
    </div>
  );
}

function Checkin({
  crewId,
  onClose,
  onSave,
}: {
  crewId: string;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
}) {
  const [person, setPerson] = useState(crewId);
  const [feeling, setFeeling] = useState("");
  const [plan, setPlan] = useState("Review my routine");
  const [note, setNote] = useState("");
  return (
    <Modal title="A moment for you." onClose={onClose}>
      <p className="checkin-intro">
        A quick check-in adds the context a sensor can’t see.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!feeling) return;
          onSave({
            id: crypto.randomUUID(),
            crewId: person,
            at: new Date().toISOString(),
            action: "Check-in recorded",
            note: `Feeling: ${feeling}. Planned follow-up: ${plan}.${note.trim() ? ` Note: ${note.trim()}` : ""}`,
            synthetic: true,
          });
        }}
      >
        <label className="field-label" htmlFor="crew-member">
          CREW MEMBER
        </label>
        <select
          id="crew-member"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
        >
          {crew.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <fieldset>
          <legend>How are you feeling?</legend>
          <div className="feeling-options">
            {["Rested", "Tired", "Overloaded"].map((value) => (
              <label
                key={value}
                className={feeling === value ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="feeling"
                  value={value}
                  checked={feeling === value}
                  onChange={() => setFeeling(value)}
                  required
                />
                <span>{value}</span>
                {feeling === value && <Check size={16} />}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field-label" htmlFor="follow-up">
          MY NEXT FOLLOW-UP
        </label>
        <select
          id="follow-up"
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
        >
          <option>Review my routine</option>
          <option>Repeat a measurement</option>
          <option>Discuss with the medical officer</option>
          <option>Check a missing sample</option>
        </select>
        <label className="field-label" htmlFor="checkin-note">
          ADD CONTEXT <span>OPTIONAL · FICTIONAL INFORMATION ONLY</span>
        </label>
        <textarea
          id="checkin-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="What might help explain the change?"
          rows={3}
        />
        <div className="checkin-note">
          <ShieldCheck size={18} />
          <span>
            Saved on this device for the demo. Recording a check-in does not
            clear an observation.
          </span>
        </div>
        <div className="modal-footer">
          <button className="text-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={!feeling}>
            Save check-in <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
