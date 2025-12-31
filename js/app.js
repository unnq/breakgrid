// js/app.js

// -------- TEAM DATA --------

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

const STORAGE_KEY = "card_break_roller_state_v4";

// Grid constants: 10 x 4 with a central 2x4 streamer block.
const GRID_COLUMNS = 10;
const GRID_ROWS = 4;
const TOTAL_CELLS = GRID_COLUMNS * GRID_ROWS;

// Reserved indices for streamer block (row-major, 0-based):
// R1:  0..9 (all teams)
// R2:  10 11 12 [13 14 15 16] 17 18 19
// R3:  20 21 22 [23 24 25 26] 27 28 29
// R4:  30..39 (all teams)
const RESERVED_INDICES = new Set([13, 14, 15, 16, 23, 24, 25, 26]);

// Non-reserved positions for teams.
const NON_RESERVED_INDICES = Array.from({ length: TOTAL_CELLS }, (_, i) => i).filter(
  (i) => !RESERVED_INDICES.has(i)
);

// -------- STATE --------

const state = {
  teams: [],
  assignments: [],
  settings: {
    streamName: "",
    bannerImageData: "", // uploaded streamer image (data URL)
    colors: {}, // CSS variable overrides
    streamBgColor: "#ffffff",
    useGradientBg: false,
    viewMode: "auction" // "auction" | "results"
  }
};

// -------- UTILITIES --------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      initDefaultState();
      return;
    }

    const parsed = JSON.parse(raw);
    const savedSettings = parsed.settings || {};
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
        logoUrl: base.logoUrl || (saved && saved.logoUrl) || ""
      };
    });

    state.assignments = parsed.assignments || [];
    state.settings = {
      streamName: savedSettings.streamName || "",
      bannerImageData: savedSettings.bannerImageData || "",
      colors: savedSettings.colors || {},
      streamBgColor: savedSettings.streamBgColor || "#ffffff",
      useGradientBg: !!savedSettings.useGradientBg,
      viewMode: savedSettings.viewMode === "results" ? "results" : "auction"
    };
  } catch (err) {
    console.warn("Error loading state, starting fresh", err);
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
    bannerImageData: "",
    colors: {},
    streamBgColor: "#ffffff",
    useGradientBg: false,
    viewMode: "auction"
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

  const toHex = (v) => {
    const h = v.toString(16);
    return h.length === 1 ? "0" + h : h;
  };

  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function applyCssColor(varName, value) {
  document.documentElement.style.setProperty(varName, value);
  if (!state.settings.colors) state.settings.colors = {};
  state.settings.colors[varName] = value;
  saveState();
}

function restoreCustomCssColors() {
  const colors = state.settings.colors || {};
  Object.entries(colors).forEach(([name, val]) => {
    document.documentElement.style.setProperty(name, val);
  });
}

function applyStreamBackground() {
  const color = state.settings.streamBgColor || "#ffffff";
  if (state.settings.useGradientBg) {
    streamSectionEl.style.backgroundImage = `linear-gradient(135deg, ${color}, #ffffff)`;
    streamSectionEl.style.backgroundColor = "";
  } else {
    streamSectionEl.style.backgroundImage = "none";
    streamSectionEl.style.backgroundColor = color;
  }
}

// -------- DOM ELEMENTS --------

const teamsGridEl = document.getElementById("teamsGrid");
const resultsGridEl = document.getElementById("resultsGrid");
const assignmentsBodyEl = document.getElementById("assignmentsBody");

const viewerNameInputEl = document.getElementById("viewerNameInput");
const streamNameInputEl = document.getElementById("streamNameInput");
const lastResultEl = document.getElementById("lastResult");

const watermarkEl = document.getElementById("watermark");

const rollButtonEl = document.getElementById("rollButton");
const resetButtonEl = document.getElementById("resetButton");

const colorStreamBgEl = document.getElementById("colorStreamBg");
const colorCardBorderEl = document.getElementById("colorCardBorder");
const colorAccentEl = document.getElementById("colorAccent");
const useGradientBgEl = document.getElementById("useGradientBg");
const streamSectionEl = document.getElementById("streamSection");

const bannerDropZoneEl = document.getElementById("bannerDropZone");
const bannerFileInputEl = document.getElementById("bannerFileInput");
const bannerPreviewEl = document.getElementById("bannerPreview");

const auctionViewEl = document.getElementById("auctionView");
const resultsViewEl = document.getElementById("resultsView");
const viewAuctionBtnEl = document.getElementById("viewAuctionBtn");
const viewResultsBtnEl = document.getElementById("viewResultsBtn");

// -------- RENDERING: AUCTION GRID --------

function renderTeamsGrid() {
  teamsGridEl.innerHTML = "";

  const teams = state.teams;
  const maxTeams = Math.min(teams.length, NON_RESERVED_INDICES.length);

  for (let i = 0; i < maxTeams; i++) {
    const team = teams[i];
    const cellIndex = NON_RESERVED_INDICES[i];
    const row = Math.floor(cellIndex / GRID_COLUMNS) + 1;
    const col = (cellIndex % GRID_COLUMNS) + 1;

    const card = document.createElement("div");
    card.className = "team-card" + (team.taken ? " team-card--taken" : "");
    card.dataset.teamId = team.id;
    card.style.gridRow = String(row);
    card.style.gridColumn = String(col);

    const inner = document.createElement("div");
    inner.className = "team-card-inner";

    if (team.logoUrl) {
      const img = document.createElement("img");
      img.src = team.logoUrl;
      img.alt = team.name + " logo";
      img.className = "team-logo";
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
  }

  // Central streamer block (2 rows x 4 columns, image only)
  const streamerCard = document.createElement("div");
  streamerCard.className = "streamer-card";
  streamerCard.style.gridColumn = "4 / span 4"; // columns 4,5,6,7
  streamerCard.style.gridRow = "2 / span 2"; // rows 2 and 3

  const innerStreamer = document.createElement("div");
  innerStreamer.className = "streamer-card-inner";

  if (state.settings.bannerImageData) {
    const img = document.createElement("img");
    img.className = "streamer-card-image";
    img.src = state.settings.bannerImageData;
    img.alt = state.settings.streamName || "Streamer";
    innerStreamer.appendChild(img);
  }

  streamerCard.appendChild(innerStreamer);
  teamsGridEl.appendChild(streamerCard);
}

// -------- RENDERING: RESULTS VIEW --------

function renderResultsGrid() {
  resultsGridEl.innerHTML = "";

  state.teams.forEach((team) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const top = document.createElement("div");

    if (team.logoUrl) {
      const logo = document.createElement("img");
      logo.src = team.logoUrl;
      logo.alt = team.name + " logo";
      logo.className = "result-team-logo";
      top.appendChild(logo);
    } else {
      const abbrev = document.createElement("div");
      abbrev.className = "result-team-abbrev";
      abbrev.textContent = team.short;
      top.appendChild(abbrev);
    }

    const teamNameEl = document.createElement("div");
    teamNameEl.className = "result-team-name";
    teamNameEl.textContent = team.name;

    const viewerEl = document.createElement("div");
    viewerEl.className = "result-viewer-name";
    if (team.taken && team.takenBy) {
      viewerEl.textContent = team.takenBy;
    } else {
      viewerEl.textContent = "Not assigned";
      viewerEl.classList.add("result-viewer-name--unassigned");
    }

    card.appendChild(top);
    card.appendChild(teamNameEl);
    card.appendChild(viewerEl);

    resultsGridEl.appendChild(card);
  });
}

// -------- RENDERING: ASSIGNMENTS / BRANDING --------

function renderAssignments() {
  assignmentsBodyEl.innerHTML = "";

  state.assignments.forEach((entry, index) => {
    const tr = document.createElement("tr");

    const tdIndex = document.createElement("td");
    tdIndex.textContent = index + 1;

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
  const { streamName, bannerImageData } = state.settings;

  // Watermark
  watermarkEl.textContent = streamName ? streamName.toUpperCase() : "";

  // Input
  streamNameInputEl.value = streamName || "";

  // Streamer image preview
  bannerPreviewEl.innerHTML = "";
  if (bannerImageData) {
    const img = document.createElement("img");
    img.src = bannerImageData;
    img.alt = streamName || "Streamer";
    bannerPreviewEl.appendChild(img);
  } else {
    bannerPreviewEl.textContent = "No image selected";
  }

  // Grid + results rely on same data
  renderTeamsGrid();
  renderResultsGrid();
}

// -------- VIEW MODE TOGGLING --------

function updateViewMode() {
  const mode = state.settings.viewMode || "auction";

  if (mode === "results") {
    auctionViewEl.classList.add("stream-view--hidden");
    resultsViewEl.classList.remove("stream-view--hidden");
  } else {
    resultsViewEl.classList.add("stream-view--hidden");
    auctionViewEl.classList.remove("stream-view--hidden");
  }

  viewAuctionBtnEl.classList.toggle(
    "view-toggle-btn--active",
    mode === "auction"
  );
  viewResultsBtnEl.classList.toggle(
    "view-toggle-btn--active",
    mode === "results"
  );
}

// -------- COLOR CONTROLS --------

function initColorControls() {
  colorStreamBgEl.value = state.settings.streamBgColor || "#ffffff";
  useGradientBgEl.checked = !!state.settings.useGradientBg;

  const root = getComputedStyle(document.documentElement);

  const cardBorderFromState =
    state.settings.colors["--card-border-color"] ||
    root.getPropertyValue("--card-border-color").trim() ||
    "#d1d5db";
  colorCardBorderEl.value = rgbToHex(cardBorderFromState);

  const accentFromState =
    state.settings.colors["--accent"] ||
    root.getPropertyValue("--accent").trim() ||
    "#ef4444";
  colorAccentEl.value = rgbToHex(accentFromState);
}

// -------- EVENTS --------

function handleRoll() {
  const viewerName = viewerNameInputEl.value.trim() || "(no name)";
  const available = state.teams.filter((t) => !t.taken);

  if (available.length === 0) {
    lastResultEl.textContent = "All teams have already been taken.";
    return;
  }

  const picked = randomItem(available);
  const idx = state.teams.findIndex((t) => t.id === picked.id);

  if (idx !== -1) {
    state.teams[idx].taken = true;
    state.teams[idx].takenBy = viewerName;
  }

  const assignment = {
    viewer: viewerName,
    teamId: picked.id,
    teamName: picked.name,
    short: picked.short,
    timestamp: Date.now()
  };

  state.assignments.push(assignment);
  lastResultEl.textContent = `${viewerName} → ${picked.name} (${picked.short})`;

  renderTeamsGrid();
  renderResultsGrid();
  renderAssignments();
  saveState();
}

function handleReset() {
  const confirmed = window.confirm("Reset all teams and assignments?");
  if (!confirmed) return;

  const {
    colors,
    streamBgColor,
    useGradientBg,
    bannerImageData,
    streamName,
    viewMode
  } = state.settings;

  initDefaultState();
  state.settings.colors = colors || {};
  state.settings.streamBgColor = streamBgColor || "#ffffff";
  state.settings.useGradientBg = !!useGradientBg;
  state.settings.bannerImageData = bannerImageData || "";
  state.settings.streamName = streamName || "";
  state.settings.viewMode = viewMode || "auction";

  restoreCustomCssColors();
  applyStreamBackground();
  renderTeamsGrid();
  renderResultsGrid();
  renderAssignments();
  renderBranding();
  initColorControls();
  updateViewMode();

  lastResultEl.textContent = "Break reset.";
  saveState();
}

function handleBrandingChange() {
  state.settings.streamName = streamNameInputEl.value.trim();
  saveState();
  renderBranding();
}

// Color events

function setupColorEvents() {
  colorStreamBgEl.addEventListener("input", (e) => {
    state.settings.streamBgColor = e.target.value || "#ffffff";
    applyStreamBackground();
    saveState();
  });

  useGradientBgEl.addEventListener("change", (e) => {
    state.settings.useGradientBg = e.target.checked;
    applyStreamBackground();
    saveState();
  });

  colorCardBorderEl.addEventListener("input", (e) => {
    applyCssColor("--card-border-color", e.target.value);
  });

  colorAccentEl.addEventListener("input", (e) => {
    applyCssColor("--accent", e.target.value);
  });
}

// File upload (banner / streamer image)

function handleBannerFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = () => {
    state.settings.bannerImageData = reader.result;
    saveState();
    renderBranding();
  };
  reader.readAsDataURL(file);
}

function setupBannerUpload() {
  bannerDropZoneEl.addEventListener("click", () => {
    bannerFileInputEl.click();
  });

  bannerFileInputEl.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleBannerFile(file);
    e.target.value = "";
  });

  bannerDropZoneEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    bannerDropZoneEl.classList.add("upload-dropzone--hover");
  });

  bannerDropZoneEl.addEventListener("dragleave", (e) => {
    e.preventDefault();
    bannerDropZoneEl.classList.remove("upload-dropzone--hover");
  });

  bannerDropZoneEl.addEventListener("drop", (e) => {
    e.preventDefault();
    bannerDropZoneEl.classList.remove("upload-dropzone--hover");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleBannerFile(file);
  });
}

// View toggle buttons

function setupViewToggle() {
  viewAuctionBtnEl.addEventListener("click", () => {
    state.settings.viewMode = "auction";
    saveState();
    updateViewMode();
  });

  viewResultsBtnEl.addEventListener("click", () => {
    state.settings.viewMode = "results";
    saveState();
    updateViewMode();
  });
}

// -------- INIT --------

function init() {
  loadState();
  restoreCustomCssColors();
  applyStreamBackground();

  renderTeamsGrid();
  renderResultsGrid();
  renderAssignments();
  renderBranding();

  initColorControls();
  setupColorEvents();
  setupBannerUpload();
  setupViewToggle();

  updateViewMode();

  rollButtonEl.addEventListener("click", handleRoll);
  resetButtonEl.addEventListener("click", handleReset);
  streamNameInputEl.addEventListener("input", handleBrandingChange);
}

document.addEventListener("DOMContentLoaded", init);
