// js/app.js

// ------- TEAM DATA -------
// You can add real logo URLs later in `logoUrl`.
// For now, we show abbreviations in big text.

const TEAMS = [
  { id: "ari", name: "Arizona Cardinals", short: "ARI", logoUrl: "" },
  { id: "atl", name: "Atlanta Falcons", short: "ATL", logoUrl: "" },
  { id: "bal", name: "Baltimore Ravens", short: "BAL", logoUrl: "" },
  { id: "buf", name: "Buffalo Bills", short: "BUF", logoUrl: "" },
  { id: "car", name: "Carolina Panthers", short: "CAR", logoUrl: "" },
  { id: "chi", name: "Chicago Bears", short: "CHI", logoUrl: "" },
  { id: "cin", name: "Cincinnati Bengals", short: "CIN", logoUrl: "" },
  { id: "cle", name: "Cleveland Browns", short: "CLE", logoUrl: "" },
  { id: "dal", name: "Dallas Cowboys", short: "DAL", logoUrl: "" },
  { id: "den", name: "Denver Broncos", short: "DEN", logoUrl: "" },
  { id: "det", name: "Detroit Lions", short: "DET", logoUrl: "" },
  { id: "gb", name: "Green Bay Packers", short: "GB", logoUrl: "" },
  { id: "hou", name: "Houston Texans", short: "HOU", logoUrl: "" },
  { id: "ind", name: "Indianapolis Colts", short: "IND", logoUrl: "" },
  { id: "jax", name: "Jacksonville Jaguars", short: "JAX", logoUrl: "" },
  { id: "kc", name: "Kansas City Chiefs", short: "KC", logoUrl: "" },
  { id: "lv", name: "Las Vegas Raiders", short: "LV", logoUrl: "" },
  { id: "lac", name: "Los Angeles Chargers", short: "LAC", logoUrl: "" },
  { id: "lar", name: "Los Angeles Rams", short: "LAR", logoUrl: "" },
  { id: "mia", name: "Miami Dolphins", short: "MIA", logoUrl: "" },
  { id: "min", name: "Minnesota Vikings", short: "MIN", logoUrl: "" },
  { id: "ne", name: "New England Patriots", short: "NE", logoUrl: "" },
  { id: "no", name: "New Orleans Saints", short: "NO", logoUrl: "" },
  { id: "nyg", name: "New York Giants", short: "NYG", logoUrl: "" },
  { id: "nyj", name: "New York Jets", short: "NYJ", logoUrl: "" },
  { id: "phi", name: "Philadelphia Eagles", short: "PHI", logoUrl: "" },
  { id: "pit", name: "Pittsburgh Steelers", short: "PIT", logoUrl: "" },
  { id: "sf", name: "San Francisco 49ers", short: "SF", logoUrl: "" },
  { id: "sea", name: "Seattle Seahawks", short: "SEA", logoUrl: "" },
  { id: "tb", name: "Tampa Bay Buccaneers", short: "TB", logoUrl: "" },
  { id: "ten", name: "Tennessee Titans", short: "TEN", logoUrl: "" },
  { id: "wsh", name: "Washington Commanders", short: "WSH", logoUrl: "" }
];

const STORAGE_KEY = "card_break_roller_state_v1";

// ------- STATE -------

const state = {
  teams: [],
  assignments: [],
  settings: {
    streamName: "",
    bannerLogoUrl: "",
    iconLogoUrl: "",
    colors: {}
  }
};

// ------- UTILITIES -------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      initDefaultState();
      return;
    }
    const parsed = JSON.parse(raw);

    // Rebuild teams from TEAMS list but keep taken / viewer info if matching ids.
    const teamsById = {};
    (parsed.teams || []).forEach((t) => {
      teamsById[t.id] = t;
    });

    state.teams = TEAMS.map((base) => {
      const saved = teamsById[base.id];
      return {
        ...base,
        taken: saved ? !!saved.taken : false,
        takenBy: saved ? saved.takenBy || "" : "",
        logoUrl: base.logoUrl || saved?.logoUrl || ""
      };
    });

    state.assignments = parsed.assignments || [];
    state.settings = parsed.settings || state.settings;
  } catch (e) {
    console.warn("Failed to load state, starting fresh.", e);
    initDefaultState();
  }
}

function initDefaultState() {
  state.teams = TEAMS.map((t) => ({
    ...t,
    taken: false,
    takenBy: ""
  }));
  state.assignments = [];
  state.settings = {
    streamName: "",
    bannerLogoUrl: "",
    iconLogoUrl: "",
    colors: {}
  };
}

function saveState() {
  const payload = {
    teams: state.teams,
    assignments: state.assignments,
    settings: state.settings
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ------- DOM CACHING -------

const teamsGridEl = document.getElementById("teamsGrid");
const assignmentsBodyEl = document.getElementById("assignmentsBody");

const viewerNameInputEl = document.getElementById("viewerNameInput");
const streamNameInputEl = document.getElementById("streamNameInput");
const streamNameDisplayEl = document.getElementById("streamNameDisplay");
const bannerLogoInputEl = document.getElementById("bannerLogoInput");
const iconLogoInputEl = document.getElementById("iconLogoInput");
const bannerLogoEl = document.getElementById("bannerLogo");
const iconLogoEl = document.getElementById("iconLogo");
const watermarkEl = document.getElementById("watermark");
const lastResultEl = document.getElementById("lastResult");

const rollButtonEl = document.getElementById("rollButton");
const resetButtonEl = document.getElementById("resetButton");

const colorPrimaryEl = document.getElementById("colorPrimary");
const colorAccentEl = document.getElementById("colorAccent");
const colorBackgroundEl = document.getElementById("colorBackground");
const colorCardEl = document.getElementById("colorCard");

const navButtons = document.querySelectorAll(".nav-btn");
const streamViewEl = document.getElementById("streamView");
const controlViewEl = document.getElementById("controlView");

// ------- RENDERING -------

function renderTeamsGrid() {
  teamsGridEl.innerHTML = "";
  state.teams.forEach((team) => {
    const card = document.createElement("div");
    card.className = "team-card" + (team.taken ? " team-card--taken" : "");
    card.dataset.teamId = team.id;

    const inner = document.createElement("div");
    inner.className = "team-card-inner";

    if (team.logoUrl) {
      const img = document.createElement("img");
      img.className = "team-logo";
      img.src = team.logoUrl;
      img.alt = `${team.name} logo`;
      inner.appendChild(img);
    } else {
      const abbrev = document.createElement("div");
      abbrev.className = "team-abbrev";
      abbrev.textContent = team.short;
      inner.appendChild(abbrev);
    }

    const labelRow = document.createElement("div");
    labelRow.className = "team-label-row";

    const nameEl = document.createElement("div");
    nameEl.className = "team-name";
    nameEl.textContent = team.name;

    const ownerEl = document.createElement("div");
    ownerEl.className = "team-owner";
    ownerEl.textContent = team.taken ? team.takenBy : "";

    labelRow.appendChild(nameEl);
    labelRow.appendChild(ownerEl);

    card.appendChild(inner);
    card.appendChild(labelRow);

    teamsGridEl.appendChild(card);
  });
}

function renderAssignments() {
  assignmentsBodyEl.innerHTML = "";
  state.assignments.forEach((entry, idx) => {
    const tr = document.createElement("tr");

    const tdIndex = document.createElement("td");
    tdIndex.textContent = idx + 1;

    const tdViewer = document.createElement("td");
    tdViewer.textContent = entry.viewer || "(no name)";

    const tdTeam = document.createElement("td");
    tdTeam.textContent = entry.teamName;

    const tdTime = document.createElement("td");
    tdTime.textContent = formatTime(entry.timestamp);

    tr.appendChild(tdIndex);
    tr.appendChild(tdViewer);
    tr.appendChild(tdTeam);
    tr.appendChild(tdTime);

    assignmentsBodyEl.appendChild(tr);
  });
}

function renderBranding() {
  const { streamName, bannerLogoUrl, iconLogoUrl } = state.settings;

  streamNameDisplayEl.textContent = streamName || "";
  watermarkEl.textContent = streamName ? streamName.toUpperCase() : "";

  // Banner
  if (bannerLogoUrl) {
    bannerLogoEl.src = bannerLogoUrl;
    bannerLogoEl.style.display = "block";
  } else {
    bannerLogoEl.src = "";
    bannerLogoEl.style.display = "none";
  }

  // Icon
  if (iconLogoUrl) {
    iconLogoEl.src = iconLogoUrl;
    iconLogoEl.style.display = "block";
  } else {
    iconLogoEl.src = "";
    iconLogoEl.style.display = "none";
  }

  streamNameInputEl.value = streamName || "";
  bannerLogoInputEl.value = bannerLogoUrl || "";
  iconLogoInputEl.value = iconLogoUrl || "";
}

function initColorControls() {
  const rootStyles = getComputedStyle(document.documentElement);

  function getVar(name, fallback) {
    const v = rootStyles.getPropertyValue(name).trim();
    return v || fallback;
  }

  colorPrimaryEl.value = rgbToHex(getVar("--primary", "#2aa9ff"));
  colorAccentEl.value = rgbToHex(getVar("--accent", "#ff3b6a"));
  colorBackgroundEl.value = rgbToHex(getVar("--bg-main", "#050810"));
  colorCardEl.value = rgbToHex(getVar("--bg-card", "#101624"));
}

// Convert "rgb(...)" or hex to hex strictly
function rgbToHex(color) {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color;

  const match = color.match(
    /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i
  );
  if (!match) return "#000000";

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const h = x.toString(16);
        return h.length === 1 ? "0" + h : h;
      })
      .join("")
  );
}

function applyColor(name, value) {
  document.documentElement.style.setProperty(name, value);
  if (!state.settings.colors) state.settings.colors = {};
  state.settings.colors[name] = value;
  saveState();
}

function restoreCustomColors() {
  const colors = state.settings.colors || {};
  Object.entries(colors).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}

// ------- INTERACTIONS -------

function handleRoll() {
  const viewerName = viewerNameInputEl.value.trim() || "(no name)";
  const available = state.teams.filter((t) => !t.taken);

  if (available.length === 0) {
    lastResultEl.textContent = "All teams have already been taken.";
    return;
  }

  const picked = randomItem(available);

  // Mark team as taken
  const teamIndex = state.teams.findIndex((t) => t.id === picked.id);
  if (teamIndex !== -1) {
    state.teams[teamIndex].taken = true;
    state.teams[teamIndex].takenBy = viewerName;
  }

  // Record assignment
  const entry = {
    viewer: viewerName,
    teamId: picked.id,
    teamName: picked.name,
    short: picked.short,
    timestamp: Date.now()
  };
  state.assignments.push(entry);

  lastResultEl.textContent = `${viewerName} → ${picked.name} (${picked.short})`;

  renderTeamsGrid();
  renderAssignments();
  saveState();
}

function handleReset() {
  if (!confirm("Reset all teams and assignments?")) return;
  initDefaultState();
  restoreCustomColors(); // preserve theme but clear teams/assignments
  renderTeamsGrid();
  renderAssignments();
  renderBranding();
  lastResultEl.textContent = "Break reset.";
  saveState();
}

function handleBrandingChange() {
  state.settings.streamName = streamNameInputEl.value.trim();
  state.settings.bannerLogoUrl = bannerLogoInputEl.value.trim();
  state.settings.iconLogoUrl = iconLogoInputEl.value.trim();
  renderBranding();
  saveState();
}

function setupViewSwitching() {
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      navButtons.forEach((b) => b.classList.remove("nav-btn--active"));
      btn.classList.add("nav-btn--active");

      const viewId = btn.dataset.view;
      if (viewId === "streamView") {
        streamViewEl.classList.add("view--active");
        controlViewEl.classList.remove("view--active");
      } else {
        controlViewEl.classList.add("view--active");
        streamViewEl.classList.remove("view--active");
      }
    });
  });
}

function setupColorEvents() {
  colorPrimaryEl.addEventListener("input", (e) =>
    applyColor("--primary", e.target.value)
  );
  colorAccentEl.addEventListener("input", (e) =>
    applyColor("--accent", e.target.value)
  );
  colorBackgroundEl.addEventListener("input", (e) =>
    applyColor("--bg-main", e.target.value)
  );
  colorCardEl.addEventListener("input", (e) =>
    applyColor("--bg-card", e.target.value)
  );
}

// ------- INIT -------

function init() {
  loadState();
  restoreCustomColors();
  renderTeamsGrid();
  renderAssignments();
  renderBranding();
  initColorControls();
  setupViewSwitching();
  setupColorEvents();

  rollButtonEl.addEventListener("click", handleRoll);
  resetButtonEl.addEventListener("click", handleReset);

  streamNameInputEl.addEventListener("input", handleBrandingChange);
  bannerLogoInputEl.addEventListener("change", handleBrandingChange);
  iconLogoInputEl.addEventListener("change", handleBrandingChange);
}

document.addEventListener("DOMContentLoaded", init);
