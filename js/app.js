// js/app.js

// -------- TEAM DATA --------
// Add logoUrl paths later when you have actual team logo images.

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

const STORAGE_KEY = "card_break_roller_state_v3";

// Grid constants: 10 x 4 with a central 2x4 streamer block.
const GRID_COLUMNS = 10;
const GRID_ROWS = 4;
const TOTAL_CELLS = GRID_COLUMNS * GRID_ROWS;

// Reserved indices for streamer block (row-major, 0-based):
// Layout (C = col, R = row):
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
    useGradientBg: false
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
      useGradientBg: !!savedSettings.useGradientBg
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
    useGradientBg: false
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
    // Simple gradient using selected color to white
    streamSectionEl.style.backgroundImage = `linear-gradient(135deg, ${color}, #ffffff)`;
    streamSectionEl.style.backgroundColor = "";
  } else {
    streamSectionEl.style.backgroundImage = "none";
    streamSectionEl.style.backgroundColor = color;
  }
}

// -------- DOM ELEMENTS --------

const teamsGridEl = document.getElementById("teamsGrid");
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

// -------- RENDERING --------

function renderTeamsGrid() {
  teamsGridEl.innerHTML = "";

  // Place team cards into the non-reserved positions
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

  // Add central streamer block (one element spanning 2 rows x 4 cols)
  const streamerCard = document.createElement("div");
  streamerCard.className = "streamer-card";
  streamerCard.style.gridColumn = "4 / span 4"; // columns 4,5,6,7
  streamerCard.style.gridRow = "2 / span 2"; // rows 2 and 3

  const innerStreamer = document.createElement("div");
  innerStreamer.className = "streamer-card-inner";

  const hasImage = !!state.settings.bannerImageData;
  const hasName = !!state.settings.streamName;

  if (hasImage) {
    const img = document.createElement("img");
    img.className = "streamer-card-image";
    img.src = state.settings.bannerImageData;
    img.alt = state.settings.streamName || "Streamer";
    innerStreamer.appendChild(img);
  }

  const nameDiv = document.createElement("div");
  nameDiv.className = "streamer-card-name";
  nameDiv.textContent = hasName ? state.settings.streamName : "Stream Name";
  innerStreamer.appendChild(nameDiv);

  streamerCard.appendChild(innerStreamer);
  teamsGridEl.appendChild(streamerCard);
}

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

  // Streamer card uses same data; re-render grid to reflect it
  renderTeamsGrid();
}

function initColorControls() {
  // Stream background color from settings
  colorStreamBgEl.value = state.settings.streamBgColor || "#ffffff";
  useGradientBgEl.checked = !!state.settings.useGradientBg;

  const root = getComputedStyle(document.documentElement);

  // Card border
  const cardBorderFromState =
    state.settings.colors["--card-border-color"] ||
    root.getPropertyValue("--card-border-color").trim() ||
    "#d1d5db";
  colorCardBorderEl.value = rgbToHex(cardBorderFromState);

  // Accent
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
  renderAssignments();
  saveState();
}

function handleReset() {
  const confirmed = window.confirm("Reset all teams and assignments?");
  if (!confirmed) return;

  // Preserve theme settings
  const { colors, streamBgColor, useGradientBg, bannerImageData, streamName } =
    state.settings;

  initDefaultState();
  state.settings.colors = colors || {};
  state.settings.streamBgColor = streamBgColor || "#ffffff";
  state.settings.useGradientBg = !!useGradientBg;
  state.settings.bannerImageData = bannerImageData || "";
  state.settings.streamName = streamName || "";

  restoreCustomCssColors();
  applyStreamBackground();
  renderTeamsGrid();
  renderAssignments();
  renderBranding();
  initColorControls();

  lastResultEl.textContent = "Break reset.";
  saveState();
}

function handleBrandingChange() {
  state.settings.streamName = streamNameInputEl.value.trim();
  saveState();
  renderBranding();
}

function setupColorEvents() {
  // Stream background color
  colorStreamBgEl.addEventListener("input", (e) => {
    state.settings.streamBgColor = e.target.value || "#ffffff";
    applyStreamBackground();
    saveState();
  });

  // Gradient toggle
  useGradientBgEl.addEventListener("change", (e) => {
    state.settings.useGradientBg = e.target.checked;
    applyStreamBackground();
    saveState();
  });

  // Card border color (CSS var)
  colorCardBorderEl.addEventListener("input", (e) => {
    applyCssColor("--card-border-color", e.target.value);
  });

  // Accent color for X / highlights (CSS var)
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
  // Click zone triggers file input
  bannerDropZoneEl.addEventListener("click", () => {
    bannerFileInputEl.click();
  });

  // Handle file selection
  bannerFileInputEl.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleBannerFile(file);
    // Reset input so selecting the same file again still triggers change
    e.target.value = "";
  });

  // Drag & drop
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

// -------- INIT --------

function init() {
  loadState();
  restoreCustomCssColors();
  applyStreamBackground();

  renderTeamsGrid();
  renderAssignments();
  renderBranding();

  initColorControls();
  setupColorEvents();
  setupBannerUpload();

  rollButtonEl.addEventListener("click", handleRoll);
  resetButtonEl.addEventListener("click", handleReset);

  streamNameInputEl.addEventListener("input", handleBrandingChange);
}

document.addEventListener("DOMContentLoaded", init);
