"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type View = "Today" | "Week" | "Content" | "Insights" | "History" | "Settings";
type GoalKey = "replies" | "posts" | "community" | "linkedin";

type Goals = Record<GoalKey, number>;
type Targets = Record<GoalKey, number>;

const INITIAL_GOALS: Goals = { replies: 99, posts: 1, community: 8, linkedin: 0 };
const INITIAL_TARGETS: Targets = { replies: 100, posts: 1, community: 10, linkedin: 1 };

const navItems: View[] = ["Today", "Week", "Content", "Insights", "History", "Settings"];

const goalMeta: { key: GoalKey; label: string; short: string; primary?: boolean }[] = [
  { key: "replies", label: "Thoughtful replies", short: "Replies", primary: true },
  { key: "posts", label: "Original posts", short: "Posts", primary: true },
  { key: "community", label: "Community interactions", short: "Community" },
  { key: "linkedin", label: "LinkedIn posts", short: "LinkedIn" },
];

const contentItems = [
  { title: "What designing with AI changed about my process", platform: "Both", category: "Thinking", status: "Ready", date: "Oct 8" },
  { title: "Launchpad: from private ritual to product", platform: "X", category: "Build", status: "Draft", date: "Oct 10" },
  { title: "The quiet leverage of a daily distribution habit", platform: "LinkedIn", category: "Proof", status: "Scheduled", date: "Oct 13" },
  { title: "Three interface details I keep noticing", platform: "X", category: "Design", status: "Idea", date: "Oct 15" },
  { title: "A month of building before the world wakes up", platform: "Both", category: "Personality", status: "Idea", date: "Oct 18" },
];

const weekValues = [
  { day: "M", value: 82, complete: true },
  { day: "T", value: 100, complete: true },
  { day: "W", value: 68, complete: false },
  { day: "T", value: 100, complete: true },
  { day: "F", value: 92, complete: false },
  { day: "S", value: 100, complete: true },
  { day: "S", value: 76, complete: false },
];

function clampPercent(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

function buildContributionDays(todayGoals: Goals, targets: Targets) {
  const start = new Date("2025-12-28T12:00:00Z");
  const end = new Date("2027-01-02T12:00:00Z");
  const today = "2026-10-07";
  const result = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = cursor.toISOString().slice(0, 10);
    const inYear = cursor.getUTCFullYear() === 2026;
    const future = iso > today;
    const ordinal = Math.floor((cursor.getTime() - Date.UTC(2026, 0, 1, 12)) / 86400000) + 1;
    const wave = Math.abs(Math.sin(ordinal * 1.87) * 100);
    let replies = future || !inYear ? 0 : Math.round(24 + wave * 0.84);
    let posts = future || !inYear ? 0 : ordinal % 4 === 0 || ordinal % 9 === 0 ? 1 : 0;
    let community = future || !inYear ? 0 : Math.round(2 + Math.abs(Math.cos(ordinal * 0.73)) * 10);

    if (iso === today) {
      replies = todayGoals.replies;
      posts = todayGoals.posts;
      community = todayGoals.community;
    }

    const replyPct = clampPercent(replies, targets.replies);
    const postPct = clampPercent(posts, targets.posts);
    const percentage = future || !inYear ? 0 : Math.round((replyPct + postPct) / 2);
    const complete = !future && inYear && replies >= targets.replies && posts >= targets.posts;
    const level = percentage === 0 ? 0 : percentage < 50 ? 1 : percentage < 100 ? 2 : 3;

    result.push({ iso, inYear, future, replies, posts, community, percentage, complete, level });
  }
  return result;
}

function MiniCheck() {
  return <span className="mini-check" aria-hidden="true">✓</span>;
}

function GoalRow({
  item,
  value,
  target,
  onChange,
}: {
  item: (typeof goalMeta)[number];
  value: number;
  target: number;
  onChange: (next: number) => void;
}) {
  const percentage = clampPercent(value, target);
  const done = value >= target;

  return (
    <div className={`goal-row ${done ? "is-done" : ""}`}>
      <div className="goal-main">
        <div className="goal-heading">
          <div>
            <span className="goal-name">{item.label}</span>
            {item.primary && <span className="required-dot" title="Required for streak">Primary</span>}
          </div>
          <span className="goal-value">{value} <span>/ {target}</span>{done && <MiniCheck />}</span>
        </div>
        <div className="progress-track" aria-label={`${item.label}: ${percentage}% complete`}>
          <span style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="stepper" aria-label={`Adjust ${item.label}`}>
        <button onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Subtract one ${item.short}`}>−</button>
        <button className="stepper-add" onClick={() => onChange(value + 1)} aria-label={`Add one ${item.short}`}>+</button>
      </div>
    </div>
  );
}

function ContributionGraph({
  goals,
  targets,
  justCompleted,
  compact = false,
}: {
  goals: Goals;
  targets: Targets;
  justCompleted: boolean;
  compact?: boolean;
}) {
  const days = useMemo(() => buildContributionDays(goals, targets), [goals, targets]);

  return (
    <div className={`contribution-wrap ${compact ? "is-compact" : ""}`}>
      <div className="month-labels" aria-hidden="true"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span></div>
      <div className="contribution-scroll">
        <div className="contribution-grid" role="grid" aria-label="2026 daily contribution history">
          {days.map((day) => {
            const label = `${dateLabel(day.iso)}. ${day.replies} replies, ${day.posts} posts, ${day.community} community interactions. ${day.complete ? "Goals complete" : `${day.percentage}% complete`}.`;
            return (
              <button
                key={day.iso}
                className={`day-cell level-${day.level} ${!day.inYear ? "outside-year" : ""} ${day.future ? "future" : ""} ${day.iso === "2026-10-07" && justCompleted ? "just-completed" : ""}`}
                aria-label={label}
                disabled={!day.inYear || day.future}
                type="button"
              >
                <span className="day-tooltip" role="tooltip">
                  <strong>{dateLabel(day.iso)}</strong>
                  <span>{day.replies} replies</span>
                  <span>{day.posts} {day.posts === 1 ? "post" : "posts"}</span>
                  <span>{day.community} community interactions</span>
                  <em>{day.complete ? <>Goals complete <MiniCheck /></> : `${day.percentage}% of primary goals`}</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="graph-legend">
        <span>Less</span><i className="day-cell level-0" /><i className="day-cell level-1" /><i className="day-cell level-2" /><i className="day-cell level-3" /><span>Complete</span>
      </div>
    </div>
  );
}

function TodayView({
  goals,
  targets,
  setGoal,
  justCompleted,
  streak,
}: {
  goals: Goals;
  targets: Targets;
  setGoal: (key: GoalKey, value: number) => void;
  justCompleted: boolean;
  streak: number;
}) {
  const primaryComplete = goals.replies >= targets.replies && goals.posts >= targets.posts;
  const overall = Math.round(goalMeta.reduce((sum, item) => sum + clampPercent(goals[item.key], targets[item.key]), 0) / goalMeta.length);
  const [logOpen, setLogOpen] = useState(false);
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState("Reply");
  const [savedNote, setSavedNote] = useState("Great conversation under a designer’s post about generative interfaces.");

  return (
    <>
      <section className="today-hero">
        <div>
          <p className="eyebrow">Wednesday, October 7</p>
          <h1>Good morning, Austin.</h1>
          <p className="hero-line">Build distribution.</p>
        </div>
        <div className={`today-score ${primaryComplete ? "complete" : ""}`}>
          <span>{primaryComplete ? "Today complete" : "Today"}</span>
          <strong>{primaryComplete ? `${streak} day streak` : `${overall}%`}</strong>
          <small>{primaryComplete ? "Both primary goals reached" : "of your plan complete"}</small>
        </div>
      </section>

      {justCompleted && (
        <div className="milestone" role="status" aria-live="polite">
          <span className="milestone-pulse"><MiniCheck /></span>
          <div><span>Today complete</span><strong>{streak} day streak</strong></div>
          <p>Do the work. Let the results compound.</p>
        </div>
      )}

      <div className="today-layout">
        <div className="primary-column">
          <section className="section-block" aria-labelledby="daily-goals-title">
            <div className="section-heading">
              <div><p className="eyebrow">Daily goals</p><h2 id="daily-goals-title">The work for today</h2></div>
              <span className="primary-rule"><i /> Replies + posts keep the streak</span>
            </div>
            <div className="goal-list">
              {goalMeta.map((item) => (
                <GoalRow key={item.key} item={item} value={goals[item.key]} target={targets[item.key]} onChange={(value) => setGoal(item.key, value)} />
              ))}
            </div>
          </section>

          <section className="section-block quick-log" aria-labelledby="quick-log-title">
            <div className="section-heading">
              <div><p className="eyebrow">Quick log</p><h2 id="quick-log-title">Capture the useful moments</h2></div>
              <button className="quiet-button" onClick={() => setLogOpen(!logOpen)}>{logOpen ? "Close" : "Add note"}</button>
            </div>
            <div className="quick-actions">
              <button onClick={() => setGoal("replies", goals.replies + 1)}><span>+</span> Reply</button>
              <button onClick={() => setGoal("posts", goals.posts + 1)}><span>+</span> X post</button>
              <button onClick={() => setGoal("community", goals.community + 1)}><span>+</span> Community</button>
              <button onClick={() => setGoal("linkedin", goals.linkedin + 1)}><span>+</span> LinkedIn</button>
            </div>
            {logOpen && (
              <form className="log-form" onSubmit={(event) => { event.preventDefault(); if (note.trim()) setSavedNote(note.trim()); setNote(""); setLogOpen(false); }}>
                <select value={activity} onChange={(event) => setActivity(event.target.value)} aria-label="Activity type">
                  <option>Reply</option><option>X post</option><option>LinkedIn post</option><option>Community interaction</option><option>Conversation</option><option>Other</option>
                </select>
                <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note…" aria-label="Activity note" autoFocus />
                <button type="submit">Save</button>
              </form>
            )}
            <div className="latest-log"><span className="activity-pill">{activity}</span><p>“{savedNote}”</p><time>9:42 AM</time></div>
          </section>
        </div>

        <aside className="streak-panel" aria-labelledby="streak-title">
          <div className="streak-stats">
            <div><span>Current streak</span><strong id="streak-title">{streak} <small>days</small></strong></div>
            <div><span>Best streak</span><strong>37 <small>days</small></strong></div>
          </div>
          <p className="streak-note">Only days with both primary goals complete count.</p>
          <ContributionGraph goals={goals} targets={targets} justCompleted={justCompleted} compact />
          <button className="year-link" onClick={() => document.getElementById("year-view")?.scrollIntoView({ behavior: "smooth" })}>View the year <span>→</span></button>
        </aside>
      </div>

      <section className="year-section" id="year-view">
        <div className="year-header">
          <div><p className="eyebrow">Long-term view</p><h2>2026</h2><p className="year-thought">The body of work, one day at a time.</p></div>
          <div className="year-summary"><span><strong>1,842</strong> replies</span><span><strong>74</strong> posts</span><span><strong>63</strong> completed days</span><span><strong>37</strong> longest streak</span></div>
        </div>
        <ContributionGraph goals={goals} targets={targets} justCompleted={justCompleted} />
      </section>

      <section className="philosophy"><p>Followers are an outcome. Showing up is the work.</p><strong>Do the work. Let the results compound.</strong></section>
    </>
  );
}

function WeekView() {
  return (
    <section className="view-page">
      <div className="view-heading"><div><p className="eyebrow">This week · Oct 5–11</p><h1>A steady week.</h1><p>Four complete days. Three still in motion.</p></div><span className="week-score">76%<small>weekly plan</small></span></div>
      <div className="metric-strip">
        <div><span>Replies</span><strong>384</strong><small>of 700</small></div><div><span>Original posts</span><strong>4</strong><small>of 7</small></div><div><span>Community</span><strong>51</strong><small>of 70</small></div><div><span>LinkedIn posts</span><strong>2</strong><small>goal met</small></div>
      </div>
      <div className="week-grid">
        <section className="section-block weekly-activity"><div className="section-heading"><div><p className="eyebrow">Daily activity</p><h2>Showing up</h2></div><span className="soft-label">4 complete days</span></div><div className="bar-chart">{weekValues.map((item, index) => <div className="bar-item" key={`${item.day}-${index}`}><div className="bar-track"><i style={{ height: `${item.value}%` }} className={item.complete ? "bar-complete" : ""} /></div><span>{item.day}</span><small>{item.value}%</small></div>)}</div></section>
        <section className="section-block outcomes"><div className="section-heading"><div><p className="eyebrow">Outcomes</p><h2>What happened</h2></div><span className="soft-label">Manually logged</span></div><div className="outcome-list"><div><span>X followers</span><strong>+17</strong></div><div><span>LinkedIn followers</span><strong>+8</strong></div><div><span>Profile views</span><strong>486</strong></div><div><span>Inbound conversations</span><strong>6</strong></div></div><p className="outcome-note">Outcomes inform the work. They do not define whether you showed up.</p></section>
      </div>
    </section>
  );
}

function ContentView() {
  const [mode, setMode] = useState<"List" | "Calendar">("List");
  return (
    <section className="view-page">
      <div className="view-heading"><div><p className="eyebrow">Content inventory</p><h1>32 posts. 8 weeks of runway.</h1><p>Ideas ready when it is time to publish.</p></div><button className="primary-button">New idea</button></div>
      <div className="content-toolbar"><div className="segmented"><button className={mode === "List" ? "active" : ""} onClick={() => setMode("List")}>List</button><button className={mode === "Calendar" ? "active" : ""} onClick={() => setMode("Calendar")}>Calendar</button></div><div className="content-counts"><span>12 ideas</span><span>7 drafts</span><span>5 ready</span><span>8 scheduled</span></div></div>
      {mode === "List" ? <div className="content-list">{contentItems.map((item) => <article key={item.title}><time>{item.date}</time><div><h3>{item.title}</h3><p>{item.category} · {item.platform}</p></div><span className={`status status-${item.status.toLowerCase()}`}>{item.status}</span></article>)}</div> : <div className="content-calendar"><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{Array.from({ length: 35 }, (_, i) => <div key={i} className={i < 3 || i > 33 ? "muted" : ""}><span>{i < 3 ? 28 + i : i - 2}</span>{[7, 9, 12, 14, 17].includes(i) && <i />}</div>)}</div></div>}
    </section>
  );
}

function InsightsView() {
  return (
    <section className="view-page">
      <div className="view-heading"><div><p className="eyebrow">Insights · Last 8 weeks</p><h1>What may be compounding.</h1><p>Patterns, carefully stated. Not promises.</p></div></div>
      <div className="insight-feature"><span>01</span><div><p>Your highest-growth days contain an average of</p><strong>31 thoughtful replies</strong><small>12 more than your overall daily average.</small></div></div>
      <div className="insight-grid"><article><span>02 · Profile visits</span><h2>Original design posts coincide with <strong>2.4×</strong> more profile visits.</h2><p>Based on 9 published design posts. This is a correlation, not a claim of causation.</p></article><article><span>03 · Consistency</span><h2>Weeks with 5+ complete days show <strong>38%</strong> stronger follower growth.</h2><p>Compared with weeks containing fewer than 5 complete days.</p></article></div>
      <div className="ratio-row"><div><span>Replies / follower gained</span><strong>22.6</strong></div><div><span>Posts / follower gained</span><strong>0.24</strong></div><div><span>Profile-view conversion</span><strong>5.1%</strong></div><div><span>Weekly consistency</span><strong>81%</strong></div></div>
    </section>
  );
}

function HistoryView({ goals, targets }: { goals: Goals; targets: Targets }) {
  const [selected, setSelected] = useState(7);
  return (
    <section className="view-page">
      <div className="view-heading"><div><p className="eyebrow">History</p><h1>October 2026</h1><p>Consistency is visible in retrospect.</p></div><div className="month-switch"><button aria-label="Previous month">←</button><button aria-label="Next month">→</button></div></div>
      <div className="history-layout"><div className="month-calendar"><div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div><div className="calendar-days history-days">{Array.from({ length: 35 }, (_, i) => { const day = i - 2; const active = day >= 1 && day <= 31; const complete = [1,2,4,5,6].includes(day); return <button key={i} disabled={!active} className={`${day === selected ? "selected" : ""} ${complete ? "complete-day" : ""}`} onClick={() => active && setSelected(day)}><span>{active ? day : ""}</span>{complete && <i />}</button>; })}</div></div><aside className="day-detail"><p className="eyebrow">Selected day</p><h2>October {selected}</h2><div className="detail-goals"><div><span>Replies</span><strong>{selected === 7 ? goals.replies : 87} / {targets.replies}</strong></div><div><span>Posts</span><strong>{selected === 7 ? goals.posts : 1} / {targets.posts}</strong></div><div><span>Community</span><strong>{selected === 7 ? goals.community : 9} / {targets.community}</strong></div></div><div className="detail-outcome"><span>X followers</span><strong>142 → 147</strong></div><div className="history-note"><span>Notes</span><p>“Poster-design post generated unusually high profile traffic.”</p></div></aside></div>
    </section>
  );
}

function SettingsView({ targets, setTarget, accent, setAccent, dark, setDark }: { targets: Targets; setTarget: (key: GoalKey, value: number) => void; accent: string; setAccent: (value: string) => void; dark: boolean; setDark: (value: boolean) => void }) {
  return (
    <section className="view-page settings-page">
      <div className="view-heading"><div><p className="eyebrow">Settings</p><h1>Make the system yours.</h1><p>Keep the targets ambitious, clear, and quick to update.</p></div></div>
      <div className="settings-group"><div><h2>Daily targets</h2><p>Replies and original posts are primary streak goals.</p></div><div className="setting-fields">{goalMeta.map(item => <label key={item.key}><span>{item.label}{item.primary && <small>Primary</small>}</span><input type="number" min="0" value={targets[item.key]} onChange={event => setTarget(item.key, Math.max(0, Number(event.target.value)))} /></label>)}</div></div>
      <div className="settings-group"><div><h2>Follower goals</h2><p>Outcomes stay visible without becoming the score.</p></div><div className="follower-goals"><div><span>X</span><strong>147 <small>/ 1,000 followers</small></strong><i><b style={{ width: "14.7%" }} /></i></div><div><span>LinkedIn</span><strong>320 <small>/ 1,000 followers</small></strong><i><b style={{ width: "32%" }} /></i></div></div></div>
      <div className="settings-group"><div><h2>Appearance</h2><p>One accent. No visual noise.</p></div><div className="appearance-settings"><div className="swatches" aria-label="Accent color">{["#4F6BFF", "#5A7A68", "#B05C3B", "#7B61A8"].map(color => <button key={color} style={{ background: color }} className={accent === color ? "active" : ""} onClick={() => setAccent(color)} aria-label={`Use ${color} accent`} />)}</div><label className="theme-toggle"><span>Dark mode</span><input type="checkbox" checked={dark} onChange={event => setDark(event.target.checked)} /><i /></label></div></div>
    </section>
  );
}

export default function Launchpad() {
  const [view, setView] = useState<View>("Today");
  const [goals, setGoals] = useState<Goals>(INITIAL_GOALS);
  const [targets, setTargets] = useState<Targets>(INITIAL_TARGETS);
  const [accent, setAccent] = useState("#4F6BFF");
  const [dark, setDark] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const hydrated = useRef(false);
  const wasComplete = useRef(false);
  const complete = goals.replies >= targets.replies && goals.posts >= targets.posts;
  const streak = complete ? 13 : 12;

  useEffect(() => {
    const stored = window.localStorage.getItem("launchpad-state");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.goals) setGoals(parsed.goals);
        if (parsed.targets) setTargets(parsed.targets);
        if (parsed.accent) setAccent(parsed.accent);
        if (typeof parsed.dark === "boolean") setDark(parsed.dark);
      } catch { /* Keep the polished seeded state if stored data is invalid. */ }
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem("launchpad-state", JSON.stringify({ goals, targets, accent, dark }));
  }, [goals, targets, accent, dark]);

  useEffect(() => {
    if (complete && !wasComplete.current && hydrated.current) {
      setJustCompleted(true);
      const timer = window.setTimeout(() => setJustCompleted(false), 4200);
      wasComplete.current = true;
      return () => window.clearTimeout(timer);
    }
    wasComplete.current = complete;
  }, [complete]);

  const style = { "--accent": accent } as React.CSSProperties;
  const setGoal = (key: GoalKey, value: number) => setGoals(current => ({ ...current, [key]: value }));
  const setTarget = (key: GoalKey, value: number) => setTargets(current => ({ ...current, [key]: value }));

  return (
    <main className="launchpad" data-theme={dark ? "dark" : "light"} style={style}>
      <header className="topbar">
        <button className="brand" onClick={() => setView("Today")} aria-label="Launchpad home"><span className="brand-mark"><i /><i /></span><strong>Launchpad</strong></button>
        <nav aria-label="Primary navigation">{navItems.map(item => <button key={item} className={view === item ? "active" : ""} onClick={() => { setView(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item}</button>)}</nav>
        <div className="top-actions"><span className={`status-dot ${complete ? "complete" : ""}`}>{complete ? "Today complete" : "1 reply left"}</span><button className="theme-button" onClick={() => setDark(value => !value)} aria-label={dark ? "Use light mode" : "Use dark mode"}>{dark ? "☼" : "◐"}</button><button className="avatar" aria-label="Account for Austin">AS</button></div>
      </header>

      <div className="app-shell">
        {view === "Today" && <TodayView goals={goals} targets={targets} setGoal={setGoal} justCompleted={justCompleted} streak={streak} />}
        {view === "Week" && <WeekView />}
        {view === "Content" && <ContentView />}
        {view === "Insights" && <InsightsView />}
        {view === "History" && <HistoryView goals={goals} targets={targets} />}
        {view === "Settings" && <SettingsView targets={targets} setTarget={setTarget} accent={accent} setAccent={setAccent} dark={dark} setDark={setDark} />}
      </div>
    </main>
  );
}
