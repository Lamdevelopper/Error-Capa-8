import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Globe2,
  Heart,
  Moon,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  CREW,
  getMetrics,
  type CategoryId,
  type CrewId,
  type Metric,
  type Scenario,
} from "./data";
import { categoryStatus, sortMetrics, worstStatus } from "./health";
import {
  Brand,
  CATEGORY_ICONS,
  CrewShape,
  MetricWidget,
  SignalMark,
  StatusBadge,
  STATUS_LABELS,
} from "./components";

type Route = { crew?: CrewId; category?: CategoryId; metric?: string };
type LogEntry = {
  id: string;
  crew: string;
  metric: string;
  action: string;
  time: string;
};
const VALID_CATEGORIES = CATEGORIES.map((c) => c.id);

function readRoute(): Route {
  const [, crew, category, metric] = location.hash
    .replace(/^#\/?/, "")
    .split("/");
  if (!CREW.some((c) => c.id === crew)) return {};
  const selectedCrew = crew as CrewId;
  return {
    crew: selectedCrew,
    category: VALID_CATEGORIES.includes(category as CategoryId)
      ? (category as CategoryId)
      : undefined,
    metric: getMetrics(selectedCrew).some((m) => m.id === metric)
      ? metric
      : undefined,
  };
}

function go(route: Route = {}) {
  location.hash = route.crew
    ? `/crew/${route.crew}/${route.category ?? "all"}${route.metric ? `/${route.metric}` : ""}`
    : "/";
}

function useLocalLog() {
  const [log, setLog] = useState<LogEntry[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("iluikali-demo-log") ?? "[]",
      );
      return Array.isArray(value)
        ? value
            .filter(
              (entry) =>
                typeof entry?.action === "string" &&
                typeof entry?.metric === "string" &&
                typeof entry?.time === "string" &&
                typeof entry?.crew === "string",
            )
            .slice(0, 30)
        : [];
    } catch {
      return [];
    }
  });
  const [storageError, setStorageError] = useState(false);
  function append(entry: Omit<LogEntry, "id" | "time">) {
    const next = [
      { ...entry, id: crypto.randomUUID(), time: new Date().toISOString() },
      ...log,
    ].slice(0, 30);
    setLog(next);
    try {
      localStorage.setItem("iluikali-demo-log", JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }
  return { log, append, storageError };
}

/** Pending lab channels stay visible, while the overview summarizes available signals separately. */
function availableStatus(metrics: Metric[]) {
  return worstStatus(
    metrics.filter((m) => m.value !== null).map((m) => m.status),
  );
}

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [scenario, setScenario] = useState<Scenario>("fatigue");
  const [modal, setModal] = useState<"about" | "log" | "sos" | null>(null);
  const { log, append, storageError } = useLocalLog();
  const [notice, setNotice] = useState("");
  const selected = CREW.find((c) => c.id === route.crew);
  const metrics = selected ? getMetrics(selected.id, scenario) : [];
  const metric = metrics.find((m) => m.id === route.metric);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handler = () => {
      setRoute(readRoute());
      setNotice("");
      // Restore reading position and keyboard context after a client-side screen change.
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        document.getElementById("main-content")?.focus({ preventScroll: true });
      });
    };
    addEventListener("hashchange", handler);
    return () => removeEventListener("hashchange", handler);
  }, []);
  useEffect(() => {
    document.title = `${metric?.label ?? selected?.name ?? "Crew overview"} · iluikali.health`;
  }, [selected, metric]);
  useEffect(() => {
    if (modal) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      previousFocus.current?.focus();
    }
  }, [modal]);

  function record(action: string) {
    if (!selected || !metric) return;
    append({ crew: selected.name, metric: metric.label, action });
    setNotice(
      action === "Support requested (simulation)"
        ? "Support request recorded locally. No message has been sent."
        : "Check-in recorded. Your crew has your back.",
    );
    setModal(null);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault();
        document.getElementById("main-content")?.focus();
      }}>Skip to content</a>
      <header className="topbar">
        <Brand onClick={() => go()} />
        <div className="mission-tag">
          <span className="tiny-label">CREW WELLBEING SYSTEM</span>
          <span className="mission-name">
            <Globe2 size={13} /> ARES EXPEDITION{" "}
            <span className="mission-divider">/</span> SOL 042{" "}
            <span className="demo-word">DEMO</span>
          </span>
        </div>
        <div className="top-actions">
          <span className="offline-pill">
            <span />
            LOCAL MODE
          </span>
          <button
            className="icon-button about-button"
            aria-label="About this demo"
            onClick={() => setModal("about")}
          >
            <CircleHelp size={20} />
          </button>
        </div>
      </header>

      {selected ? (
        <>
          <div className="breadcrumb">
            <button onClick={() => go()}>Crew overview</button>
            <ChevronRight size={12} />
            <button onClick={() => go({ crew: selected.id })}>
              {selected.name}
            </button>
            {metric && (
              <>
                <ChevronRight size={12} />
                <span>{metric.label}</span>
              </>
            )}
          </div>
          <div className="individual-layout">
            <aside className="crew-sidebar">
              <button
                className="back-link"
                onClick={() =>
                  metric
                    ? go({ crew: selected.id, category: route.category })
                    : go()
                }
              >
                <ArrowLeft size={16} />
                {metric ? "Back to signals" : "All crew members"}
              </button>
              <div className="sidebar-identity">
                <CrewShape shape={selected.shape} />
                <span className="tiny-label">{selected.role}</span>
                <h1>{selected.name}</h1>
                <StatusBadge
                  status={availableStatus(metrics)}
                  label={
                    availableStatus(metrics) === "ok"
                      ? "Available signals stable"
                      : undefined
                  }
                />
              </div>
              <div className="sidebar-categories">
                <span className="tiny-label">HEALTH CATEGORIES</span>
                <button
                  className={!route.category ? "selected" : ""}
                  aria-pressed={!route.category}
                  onClick={() => go({ crew: selected.id })}
                >
                  <Activity size={17} />
                  <span>All signals</span>
                  <span className="category-count">{metrics.length}</span>
                </button>
                {CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category.id];
                  return (
                    <button
                      key={category.id}
                      className={
                        route.category === category.id ? "selected" : ""
                      }
                      aria-pressed={route.category === category.id}
                      aria-label={`${category.label}, ${STATUS_LABELS[categoryStatus(metrics, category.id)]}`}
                      onClick={() =>
                        go({ crew: selected.id, category: category.id })
                      }
                    >
                      <Icon size={17} />
                      <span>
                        {category.shortLabel === "Sleep"
                          ? "Sleep & recovery"
                          : category.label}
                      </span>
                      <span
                        className={`category-indicator status-${categoryStatus(metrics, category.id)}`}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="sidebar-note">
                <ShieldCheck size={23} />
                <p>
                  A little awareness.
                  <br />
                  <strong>A better next step.</strong>
                </p>
                <span>Personal patterns, shared care.</span>
              </div>
              <span className="sidebar-source">
                <span className="status-dot" /> Synthetic crew profile
              </span>
            </aside>
            <main id="main-content" className="signals-main" tabIndex={-1}>
              {metric ? (
                <>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">A CLOSER LOOK</span>
                      <h2>
                        {metric.label}
                        <span className="heading-dot">.</span>
                      </h2>
                    </div>
                    <span className="data-caption">SIMULATED TELEMETRY</span>
                  </div>
                  <div className="detail-layout">
                    <div>
                      <MetricWidget metric={metric} large />
                      <div className="baseline-note">
                        <Activity size={17} />
                        <span>{metric.baseline}</span>
                        <span>Illustrative reference</span>
                      </div>
                    </div>
                    <div className="insight-panel">
                      <span className="eyebrow">
                        <Sparkles size={14} /> SIGNAL CONTEXT
                      </span>
                      <h3>
                        {metric.status === "alert"
                          ? "A change worth a check-in."
                          : metric.status === "unknown"
                            ? "Some signals need more time."
                            : "Keep the bigger picture in view."}
                      </h3>
                      <p>{metric.description}</p>
                      {metric.id === "cortisol" || metric.id === "hrv" ? (
                        <div className="context-callout">
                          <Moon size={20} />
                          <p>
                            Consider this alongside sleep and the mission
                            schedule. A single signal does not explain how
                            someone feels.
                          </p>
                        </div>
                      ) : null}
                      <div className="next-step">
                        <span className="tiny-label">
                          A SUGGESTED NEXT STEP
                        </span>
                        <p>{metric.action}</p>
                      </div>
                      <div className="insight-footnote">
                        Rule-based demo context · AI not connected
                      </div>
                      <a
                        className="source-link"
                        href="https://www.nasa.gov/hrp/risks/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Explore NASA human spaceflight risks{" "}
                        <ArrowUpRight size={15} />
                      </a>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <div>
                      <Heart size={20} />
                      <span>Checking in is part of taking care.</span>
                    </div>
                    <button
                      className="text-button support-button"
                      onClick={() => setModal("sos")}
                    >
                      Request support <ArrowUpRight size={16} />
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => record("Check-in acknowledged")}
                    >
                      <Check size={16} /> Mark as reviewed
                    </button>
                  </div>
                  {notice && (
                    <div className="notice" role="status">
                      <Check size={17} />
                      {notice}
                      {storageError &&
                        " Browser storage is unavailable; this entry lasts for this session."}
                    </div>
                  )}
                </>
              ) : (
                <Signals
                  crewId={selected.id}
                  category={route.category}
                  scenario={scenario}
                />
              )}
            </main>
          </div>
        </>
      ) : (
        <Overview
          scenario={scenario}
          setScenario={setScenario}
          openLog={() => setModal("log")}
        />
      )}

      <footer className="footer">
        <div>
          <span className="footer-mark">i.</span>
          <span>Built around people. Designed for space.</span>
        </div>
        <span>PREVENTIVE SUPPORT · NOT A MEDICAL DIAGNOSIS</span>
        <button onClick={() => setModal("about")}>
          ERROR EN CAPA 8 <ArrowUpRight size={12} />
        </button>
      </footer>

      <dialog
        ref={dialogRef}
        onCancel={() => setModal(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setModal(null);
        }}
        aria-labelledby="dialog-title"
        className="app-dialog"
      >
        <button
          className="dialog-close icon-button"
          aria-label="Close dialog"
          onClick={() => setModal(null)}
        >
          <X size={20} />
        </button>
        {modal === "about" && (
          <>
            <span className="eyebrow">ABOUT THIS PROTOTYPE</span>
            <h2 id="dialog-title">Care, with context.</h2>
            <p>
              Iluikali is a shared crew wellbeing concept by Error en Capa 8 for
              NASA Space Apps. It helps a crew notice changes and start a
              conversation.
            </p>
            <p>
              All identities, measurements, trends, and status assignments here
              are synthetic. No wearable, radiation sensor, AI service, or
              medical decision system is connected.
            </p>
            <p>
              Grey signals have no data. Green describes the available demo
              signals; it does not certify someone as healthy.
            </p>
            <a
              className="source-link"
              href="https://www.nasa.gov/hrp/risks/"
              target="_blank"
              rel="noreferrer"
            >
              NASA Human Research Program <ArrowUpRight size={15} />
            </a>
          </>
        )}
        {modal === "log" && (
          <>
            <span className="eyebrow">LOCAL MISSION RECORD</span>
            <h2 id="dialog-title">The care continues.</h2>
            <p>
              Demo check-ins saved in this browser. Nothing is sent to the
              ground.
            </p>
            {log.length ? (
              <div className="log-list">
                {log.map((entry) => (
                  <article key={entry.id}>
                    <span className="log-check">
                      <Check size={16} />
                    </span>
                    <div>
                      <strong>{entry.crew}</strong>
                      <p>
                        {entry.metric} · {entry.action}
                      </p>
                      <time>
                        {new Date(entry.time).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </time>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-log">
                <Heart size={33} />
                <h3>A fresh mission record.</h3>
                <p>
                  Open a crew member, choose a signal, and mark it as reviewed
                  to start a local check-in log.
                </p>
              </div>
            )}
          </>
        )}
        {modal === "sos" && (
          <>
            <span className="eyebrow">SUPPORT REQUEST · SIMULATION</span>
            <h2 id="dialog-title">You don't have to do it alone.</h2>
            <p>
              Record a demo support request for {selected?.name}. This is a
              local prototype: it will not contact a crewmate, flight surgeon,
              or emergency service.
            </p>
            <div className="dialog-actions">
              <button className="text-button" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={() => record("Support requested (simulation)")}
              >
                Record demo request <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}

function Overview({
  scenario,
  setScenario,
  openLog,
}: {
  scenario: Scenario;
  setScenario: (value: Scenario) => void;
  openLog: () => void;
}) {
  const crewWithMetrics = CREW.map((crew) => ({
    ...crew,
    metrics: getMetrics(crew.id, scenario),
  }));
  const attention = crewWithMetrics.filter(
    (crew) => availableStatus(crew.metrics) === "alert",
  );
  const stable = crewWithMetrics.filter(
    (crew) => availableStatus(crew.metrics) === "ok",
  ).length;
  const watch = crewWithMetrics.filter(
    (crew) => availableStatus(crew.metrics) === "warn",
  ).length;
  return (
    <main id="main-content" className="overview-main" tabIndex={-1}>
      <div className="overview-heading">
        <div>
          <div className="eyebrow">
            CREW OVERVIEW
          </div>
          <h1>
            A shared picture.
            <br />
            <span>A healthier crew.</span>
          </h1>
        </div>
        <div className="overview-heading-right">
          <div className="flow-spectrum" aria-hidden="true">
            <i /><i /><i /><i /><i />
          </div>
          <span className="demo-label">
            <span /> SYNTHETIC DEMO
          </span>
          <p>
            Small changes, seen early.
            <br />
            Your crew's wellbeing at a glance.
          </p>
        </div>
      </div>
      <div className="overview-toolbar">
        <div>
          <span className="tiny-label">YOUR CREW</span>
          <span className="crew-count">{String(CREW.length).padStart(2, "0")}</span>
          <span className="toolbar-description">
            Different people. One mission.
          </span>
        </div>
        <div className="legend">
          <span>
            <i className="legend-dot ok" />
            Stable
          </span>
          <span>
            <i className="legend-dot warn" />
            Watch
          </span>
          <span>
            <i className="legend-dot alert" />
            Attention
          </span>
          <span>
            <i className="legend-dot unknown" />
            No data
          </span>
        </div>
      </div>
      <div className="overview-layout">
        <section className="crew-grid" aria-label="Crew health overview">
          {crewWithMetrics.map((crew, index) => {
            const status = availableStatus(crew.metrics);
            return (
              <article
                className={`crew-card crew-card-${crew.shape} crew-state-${status}`}
                key={crew.id}
              >
                <button
                  className="crew-card-main"
                  onClick={() => go({ crew: crew.id })}
                  aria-label={`View ${crew.name}`}
                >
                  <div className="crew-topline">
                    <span className="tiny-label">
                      CREW {String(index + 1).padStart(2, "0")}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                  <div className="crew-card-body">
                    <div className="shape-orbit">
                      <CrewShape shape={crew.shape} />
                      <span className="orbit-cross orbit-cross-one">+</span>
                      <span className="orbit-cross orbit-cross-two">+</span>
                    </div>
                    <div className="crew-identity">
                      <span className="crew-role">{crew.role}</span>
                      <h2>{crew.name}</h2>
                      <span className="crew-link">
                        View health signals <ArrowUpRight size={14} />
                      </span>
                    </div>
                    <ArrowUpRight className="crew-open" size={21} />
                  </div>
                </button>
                {/* A small set of real fixture values makes the shared view useful before drilling down. */}
                <div className="crew-vitals" aria-label={`${crew.name} quick signals`}>
                  {["heartRate", "sleep"].map((id) => {
                    const signal = crew.metrics.find((item) => item.id === id);
                    if (!signal) return null;
                    const Icon = id === "heartRate" ? Heart : Moon;
                    return (
                      <button key={id} onClick={() => go({ crew: crew.id, metric: id })}
                        aria-label={`${crew.name}, ${signal.label}, ${signal.displayValue} ${signal.unit}, ${STATUS_LABELS[signal.status]}`}>
                        <Icon size={16} aria-hidden="true" />
                        <span>{id === "heartRate" ? "Heart rate" : "Sleep"}</span>
                        <strong>{signal.displayValue}<small>{signal.unit}</small></strong>
                        <span className={`status-dot status-${signal.status}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="crew-categories">
                  {CATEGORIES.map((category) => {
                    const Icon = CATEGORY_ICONS[category.id];
                    const categoryState = categoryStatus(
                      crew.metrics,
                      category.id,
                    );
                    return (
                      <button
                        key={category.id}
                        className={`category-chip status-${categoryState}`}
                        onClick={() =>
                          go({ crew: crew.id, category: category.id })
                        }
                        aria-label={`${crew.name}, ${category.label}, ${categoryState === "unknown" ? "incomplete data" : categoryState}`}
                      >
                        <Icon size={15} />
                        <span>{category.shortLabel}<small>{categoryState === "unknown" ? "Incomplete" : STATUS_LABELS[categoryState]}</small></span>
                        <span className="status-dot" />
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
        <aside className="mission-panel">
          <div className="mission-panel-top">
            <span className="eyebrow">MISSION PULSE</span>
            <span className="pulse-icon">
              <Activity size={18} />
            </span>
          </div>
          <div className="mission-gauge">
            <svg viewBox="0 0 240 154" aria-hidden="true">
              <path
                d="M35 125 A85 85 0 1 1 205 125"
                pathLength="100"
                fill="none"
                stroke="#ddd8c9"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d="M35 125 A85 85 0 1 1 205 125"
                pathLength="100"
                fill="none"
                stroke="#6e8d71"
                strokeWidth="11"
                strokeDasharray={`${(stable / CREW.length) * 100} 100`}
                strokeLinecap="round"
              />
              <circle cx="205" cy="125" r="4" fill="#e7ab51" />
            </svg>
            <div>
              <span>
                {String(stable).padStart(2, "0")}
                <small>/ {String(CREW.length).padStart(2, "0")}</small>
              </span>
              <p>available signals stable</p>
            </div>
          </div>
          <div className="mission-counts">
            <span>
              <i className="legend-dot warn" />
              <strong>{String(watch).padStart(2, "0")}</strong>Watch
            </span>
            <span>
              <i className="legend-dot alert" />
              <strong>{String(attention.length).padStart(2, "0")}</strong>
              Attention
            </span>
          </div>
          <div className="mission-divider-line" />
          <div className="care-note">
            <span className="tiny-label">
              {attention.length
                ? "A MOMENT TO CHECK IN"
                : "ROOM TO KEEP CARING"}
            </span>
            <h3>
              {attention.length
                ? "A signal is a start."
                : "Steady signals. Shared care."}
            </h3>
            <p>
              {attention.length
                ? `${attention[0].name.split(" ")[0]}'s recovery signals have changed. A conversation can add the context numbers can't.`
                : "Keep an eye on the small things. Routine check-ins help put each signal in context."}
            </p>
            {attention.length ? (
              <button
                className="care-link"
                onClick={() =>
                  go({ crew: attention[0].id, category: "mental" })
                }
              >
                Check in with {attention[0].name.split(" ")[0]}{" "}
                <ArrowRight size={16} />
              </button>
            ) : (
              <span className="care-good">
                <ShieldCheck size={17} /> Demo available signals stable
              </span>
            )}
          </div>
          <div className="pending-note">
            <CircleHelp size={15} />
            <span>3 lab / sensor channels pending per crew member</span>
          </div>
        </aside>
      </div>
      <div className="mission-bottom">
        <div className="local-note">
          <span className="connection-icon">
            <WifiOff size={18} />
          </span>
          <div>
            <strong>Far from Earth. Still connected.</strong>
            <span>This demo runs locally, even without a network.</span>
          </div>
        </div>
        <div className="bottom-actions">
          <button className="text-button log-button" onClick={openLog}>
            <Clock3 size={16} /> Mission log <ArrowUpRight size={14} />
          </button>
          <button
            className={`demo-control ${scenario === "fatigue" ? "active" : ""}`}
            onClick={() =>
              setScenario(scenario === "fatigue" ? "nominal" : "fatigue")
            }
          >
            {scenario === "fatigue" ? (
              <RotateCcw size={14} />
            ) : (
              <Play size={14} />
            )}
            {scenario === "fatigue" ? "Reset demo" : "Simulate fatigue"}
          </button>
        </div>
      </div>
    </main>
  );
}

function Signals({
  crewId,
  category,
  scenario,
}: {
  crewId: CrewId;
  category?: CategoryId;
  scenario: Scenario;
}) {
  const [page, setPage] = useState(0);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const metrics = sortMetrics(getMetrics(crewId, scenario)).filter(
    (m) =>
      (!category || m.categories.includes(category)) &&
      (!onlyChanges || m.status === "alert" || m.status === "warn"),
  );
  // Unknown channels are listed after measured signals; they never masquerade as stable.
  const ordered = [
    ...metrics.filter((m) => m.value !== null),
    ...metrics.filter((m) => m.value === null),
  ];
  const pageSize = 6,
    pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  useEffect(() => {
    setPage(0);
  }, [crewId, category, onlyChanges]);
  return (
    <>
      <div className="section-heading">
        <div>
          <span className="eyebrow">PERSONAL PATTERNS, SHARED CARE</span>
          <h2>
            {category
              ? CATEGORIES.find((c) => c.id === category)?.label
              : "Health signals"}
            <span className="heading-dot">.</span>
          </h2>
          <p>
            Start with what needs attention. Explore the context behind each
            signal.
          </p>
        </div>
        <span className="data-caption">
          <span /> SYNTHETIC DATA
        </span>
      </div>
      <div className="signals-toolbar">
        <span>
          <ArrowDown size={14} />
          Attention first{" "}
          <span className="signal-total">{ordered.length} signals</span>
        </span>
        <button
          className={`filter-button ${onlyChanges ? "active" : ""}`}
          onClick={() => setOnlyChanges(!onlyChanges)}
          aria-pressed={onlyChanges}
        >
          <span className="filter-check">
            {onlyChanges && <Check size={11} />}
          </span>
          Only changes
        </button>
      </div>
      {ordered.length ? (
        <div className="metrics-grid">
          {ordered
            .slice(currentPage * pageSize, (currentPage + 1) * pageSize)
            .map((metric) => (
              <MetricWidget
                key={metric.id}
                metric={metric}
                onClick={() =>
                  go({ crew: crewId, category, metric: metric.id })
                }
              />
            ))}
        </div>
      ) : (
        <div className="empty-signals">
          <ShieldCheck size={44} />
          <h3>No changes in these demo signals.</h3>
          <p>Switch off the filter to explore all available measurements.</p>
          <button className="text-button" onClick={() => setOnlyChanges(false)}>
            Show all signals <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="signals-bottom">
        <span>
          <SignalMark checked /> Measurements inform. People add context.
        </span>
        {pageCount > 1 && (
          <div className="pagination">
            <button
              className="icon-button"
              disabled={currentPage === 0}
              aria-label="Previous signals"
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              {currentPage + 1} / {pageCount}
            </span>
            <button
              className="icon-button"
              disabled={currentPage + 1 >= pageCount}
              aria-label="Next signals"
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
