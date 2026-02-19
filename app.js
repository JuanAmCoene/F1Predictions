const SUPABASE_URL = "https://fwbhaqhwoxoklguarxyi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3YmhhcWh3b3hva2xndWFyeHlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDA1NjEsImV4cCI6MjA4NzExNjU2MX0.gzwEshgc3e_tH-yhSZUUZBlOinCiB4deidt9h76kQAM";

const RACES_2026 = [
  "Australian Grand Prix",
  "Chinese Grand Prix",
  "Japanese Grand Prix",
  "Bahrain Grand Prix",
  "Saudi Arabian Grand Prix",
  "Miami Grand Prix",
  "Canadian Grand Prix",
  "Monaco Grand Prix",
  "Barcelona-Catalunya Grand Prix",
  "Austrian Grand Prix",
  "British Grand Prix",
  "Belgian Grand Prix",
  "Hungarian Grand Prix",
  "Dutch Grand Prix",
  "Italian Grand Prix",
  "Spanish Grand Prix",
  "Azerbaijan Grand Prix",
  "Singapore Grand Prix",
  "United States Grand Prix",
  "Mexican Grand Prix",
  "Brazilian Grand Prix",
  "Las Vegas Grand Prix",
  "Qatar Grand Prix",
  "Abu Dhabi Grand Prix"
];

const DRIVERS_2026 = [
  "Max Verstappen",
  "Isack Hadjar",
  "Charles Leclerc",
  "Lewis Hamilton",
  "George Russell",
  "Kimi Antonelli",
  "Lando Norris",
  "Oscar Piastri",
  "Fernando Alonso",
  "Lance Stroll",
  "Alexander Albon",
  "Carlos Sainz",
  "Sergio Pérez",
  "Valtteri Bottas",
  "Nico Hülkenberg",
  "Gabriel Bortoleto",
  "Esteban Ocon",
  "Oliver Bearman",
  "Pierre Gasly",
  "Franco Colapinto",
  "Liam Lawson",
  "Arvid Lindblad"
];

const DRIVER_TEAMS_2026 = {
  "Max Verstappen": "Red Bull Racing",
  "Isack Hadjar": "Red Bull Racing",
  "Charles Leclerc": "Ferrari",
  "Lewis Hamilton": "Ferrari",
  "George Russell": "Mercedes",
  "Kimi Antonelli": "Mercedes",
  "Lando Norris": "McLaren",
  "Oscar Piastri": "McLaren",
  "Fernando Alonso": "Aston Martin",
  "Lance Stroll": "Aston Martin",
  "Alexander Albon": "Williams",
  "Carlos Sainz": "Williams",
  "Sergio Pérez": "Cadillac",
  "Valtteri Bottas": "Cadillac",
  "Nico Hülkenberg": "Audi",
  "Gabriel Bortoleto": "Audi",
  "Esteban Ocon": "Haas F1 Team",
  "Oliver Bearman": "Haas F1 Team",
  "Pierre Gasly": "Alpine",
  "Franco Colapinto": "Alpine",
  "Liam Lawson": "Racing Bulls",
  "Arvid Lindblad": "Racing Bulls"
};

const DRIVER_COUNT = DRIVERS_2026.length;

let supabaseClient = null;

const userNameInput = document.getElementById("userName");
const raceNameSelect = document.getElementById("raceName");
const driversGrid = document.getElementById("driversGrid");
const saveBtn = document.getElementById("saveBtn");
const refreshBtn = document.getElementById("refreshBtn");
const statusEl = document.getElementById("status");
const submissionsEl = document.getElementById("submissions");

let draggedCard = null;

function validateDomBindings() {
  const missing = [];

  if (!userNameInput) missing.push("#userName");
  if (!raceNameSelect) missing.push("#raceName");
  if (!driversGrid) missing.push("#driversGrid");
  if (!saveBtn) missing.push("#saveBtn");
  if (!refreshBtn) missing.push("#refreshBtn");
  if (!statusEl) missing.push("#status");
  if (!submissionsEl) missing.push("#submissions");

  if (missing.length) {
    throw new Error(`Missing required elements: ${missing.join(", ")}`);
  }
}

function formatDriverWithTeam(driver) {
  const team = DRIVER_TEAMS_2026[driver];
  return team ? `${team} — ${driver}` : driver;
}

function getTeamClassName(team) {
  return `team-${team
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function formatSupabaseError(error, action) {
  if (!error) return `${action} failed.`;

  const tableMissing =
    error.code === "42P01" ||
    error.status === 404 ||
    String(error.message || "").toLowerCase().includes("not found");

  if (tableMissing) {
    return "Database table not found. Run supabase.sql in your Supabase SQL Editor, then refresh.";
  }

  return `${action} failed: ${error.message}`;
}

function initSupabase() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_URL.includes("YOUR_SUPABASE") ||
    SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
  ) {
    statusEl.textContent = "Configure SUPABASE_URL and SUPABASE_ANON_KEY in app.js first.";
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function setupRaceOptions() {
  raceNameSelect.innerHTML = RACES_2026.map((race) => `<option value="${race}">${race}</option>`).join("");
}

function setupDriverInputs() {
  driversGrid.innerHTML = DRIVERS_2026.map((driver) => {
    const team = DRIVER_TEAMS_2026[driver] || "Unknown Team";
    const teamClassName = getTeamClassName(team);

    return `
      <div class="driver-row ${teamClassName}" draggable="true" data-driver="${driver}">
        <span class="driver-pos"></span>
        <span class="driver-label">${formatDriverWithTeam(driver)}</span>
        <span class="driver-controls">
          <button type="button" class="move-btn" data-move="up" aria-label="Move ${driver} up">▲</button>
          <button type="button" class="move-btn" data-move="down" aria-label="Move ${driver} down">▼</button>
          <span class="drag-handle" aria-hidden="true">⋮⋮</span>
        </span>
      </div>
    `;
  }).join("");

  refreshPositionBadges();
}

function refreshPositionBadges() {
  const cards = Array.from(driversGrid.querySelectorAll(".driver-row[data-driver]"));

  cards.forEach((card, index) => {
    const badge = card.querySelector(".driver-pos");
    if (badge) {
      badge.textContent = `P${index + 1}`;
    }
  });
}

function collectPredictions() {
  const cards = Array.from(driversGrid.querySelectorAll(".driver-row[data-driver]"));
  const predictions = {};

  if (cards.length !== DRIVER_COUNT) {
    throw new Error("Driver list is incomplete. Refresh the page and try again.");
  }

  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const driver = card.getAttribute("data-driver");
    const value = index + 1;

    if (!driver) {
      throw new Error("A driver card is missing data. Refresh the page and try again.");
    }

    predictions[driver] = value;
  }

  return predictions;
}

function getDragAfterElement(container, y) {
  const draggableElements = Array.from(
    container.querySelectorAll(".driver-row[data-driver]:not(.dragging)")
  );

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }

      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  ).element;
}

function moveCardByOffset(card, offset) {
  if (!(card instanceof HTMLElement)) {
    return;
  }

  const sibling = offset < 0 ? card.previousElementSibling : card.nextElementSibling;

  if (!(sibling instanceof HTMLElement)) {
    return;
  }

  if (offset < 0) {
    driversGrid.insertBefore(card, sibling);
  } else {
    driversGrid.insertBefore(sibling, card);
  }

  refreshPositionBadges();
  statusEl.textContent = "Order updated. Drag cards or use arrows to rank all drivers.";
}

function setupDragAndDrop() {
  driversGrid.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || !target.classList.contains("move-btn")) {
      return;
    }

    const card = target.closest(".driver-row");
    const moveDirection = target.getAttribute("data-move");

    if (!card || !moveDirection) {
      return;
    }

    moveCardByOffset(card, moveDirection === "up" ? -1 : 1);
  });

  driversGrid.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("driver-row")) {
      return;
    }

    draggedCard = target;
    target.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", target.getAttribute("data-driver") || "");
    }
  });

  driversGrid.addEventListener("dragend", () => {
    if (!draggedCard) {
      return;
    }

    draggedCard.classList.remove("dragging");
    draggedCard = null;
    refreshPositionBadges();
  });

  driversGrid.addEventListener("dragover", (event) => {
    event.preventDefault();

    if (!draggedCard) {
      return;
    }

    const afterElement = getDragAfterElement(driversGrid, event.clientY);

    if (!afterElement) {
      driversGrid.appendChild(draggedCard);
      return;
    }

    driversGrid.insertBefore(draggedCard, afterElement);
  });

  driversGrid.addEventListener("drop", (event) => {
    event.preventDefault();
    refreshPositionBadges();
    statusEl.textContent = "Order updated. Drag cards or use arrows to rank all drivers.";
  });
}

async function savePrediction() {
  if (!supabaseClient) {
    statusEl.textContent = "Supabase is not configured yet.";
    return;
  }

  const userName = userNameInput.value.trim();
  const raceName = raceNameSelect.value;

  if (!userName) {
    statusEl.textContent = "Please fill in your name.";
    return;
  }

  let predictions;

  try {
    predictions = collectPredictions();
  } catch (error) {
    statusEl.textContent = error.message;
    return;
  }

  saveBtn.disabled = true;
  statusEl.textContent = "Saving...";

  const { error } = await supabaseClient.from("predictions").insert([
    {
      user_name: userName,
      race_name: raceName,
      predictions
    }
  ]);

  saveBtn.disabled = false;

  if (error) {
    statusEl.textContent = formatSupabaseError(error, "Save");
    return;
  }

  statusEl.textContent = "Prediction saved.";
  await loadSubmissions();
}

function renderSubmissions(rows) {
  if (!rows.length) {
    submissionsEl.innerHTML = "<p class='hint'>No submissions yet.</p>";
    return;
  }

  submissionsEl.innerHTML = rows.map((row) => {
    const ordered = Object.entries(row.predictions || {})
      .sort((a, b) => a[1] - b[1])
      .map(([driver, pos]) => {
        const team = DRIVER_TEAMS_2026[driver] || "Unknown Team";
        const teamClassName = getTeamClassName(team);
        return `<li class="prediction-item ${teamClassName}">P${pos}: ${formatDriverWithTeam(driver)}</li>`;
      })
      .join("");

    const date = new Date(row.created_at).toLocaleString();

    return `
      <article class="submission">
        <div class="submission-head">
          <strong>${row.user_name}</strong>
          <span>${row.race_name}</span>
          <span>${date}</span>
        </div>
        <ul>${ordered}</ul>
      </article>
    `;
  }).join("");
}

async function loadSubmissions() {
  if (!supabaseClient) return;

  submissionsEl.innerHTML = "<p class='hint'>Loading...</p>";

  const { data, error } = await supabaseClient
    .from("predictions")
    .select("id, user_name, race_name, predictions, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    submissionsEl.innerHTML = `<p class='hint'>${formatSupabaseError(error, "Load")}</p>`;
    return;
  }

  renderSubmissions(data || []);
}

function bootstrapApp() {
  validateDomBindings();

  saveBtn.addEventListener("click", savePrediction);
  refreshBtn.addEventListener("click", loadSubmissions);

  setupRaceOptions();
  setupDriverInputs();
  setupDragAndDrop();
  initSupabase();
  loadSubmissions();
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    bootstrapApp();
  } catch (error) {
    console.error("App bootstrap failed:", error);
    if (statusEl) {
      statusEl.textContent = `Startup error: ${error.message}`;
    }
  }
});
