const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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

let supabase = null;

const userNameInput = document.getElementById("userName");
const raceNameSelect = document.getElementById("raceName");
const driversGrid = document.getElementById("driversGrid");
const saveBtn = document.getElementById("saveBtn");
const refreshBtn = document.getElementById("refreshBtn");
const statusEl = document.getElementById("status");
const submissionsEl = document.getElementById("submissions");

function formatDriverWithTeam(driver) {
  const team = DRIVER_TEAMS_2026[driver];
  return team ? `${team} — ${driver}` : driver;
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

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function setupRaceOptions() {
  raceNameSelect.innerHTML = RACES_2026.map((race) => `<option value="${race}">${race}</option>`).join("");
}

function setupDriverInputs() {
  driversGrid.innerHTML = DRIVERS_2026.map((driver) => {
    return `
      <div class="driver-row">
        <span>${formatDriverWithTeam(driver)}</span>
        <input type="number" min="1" max="${DRIVER_COUNT}" data-driver="${driver}" placeholder="Pos" required />
      </div>
    `;
  }).join("");
}

function collectPredictions() {
  const inputs = Array.from(driversGrid.querySelectorAll("input[data-driver]"));
  const predictions = {};

  for (const input of inputs) {
    const driver = input.getAttribute("data-driver");
    const value = Number(input.value);

    if (!Number.isInteger(value) || value < 1 || value > DRIVER_COUNT) {
      throw new Error(`Invalid position for ${driver}. Use a number from 1 to ${DRIVER_COUNT}.`);
    }

    predictions[driver] = value;
  }

  return predictions;
}

function resetPositionInputs() {
  const inputs = driversGrid.querySelectorAll("input[data-driver]");
  inputs.forEach((input) => {
    input.value = "";
  });
}

async function savePrediction() {
  if (!supabase) {
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

  const { error } = await supabase.from("predictions").insert([
    {
      user_name: userName,
      race_name: raceName,
      predictions
    }
  ]);

  saveBtn.disabled = false;

  if (error) {
    statusEl.textContent = `Failed to save: ${error.message}`;
    return;
  }

  statusEl.textContent = "Prediction saved.";
  resetPositionInputs();
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
      .slice(0, 5)
      .map(([driver, pos]) => `<li>P${pos}: ${formatDriverWithTeam(driver)}</li>`)
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
  if (!supabase) return;

  submissionsEl.innerHTML = "<p class='hint'>Loading...</p>";

  const { data, error } = await supabase
    .from("predictions")
    .select("id, user_name, race_name, predictions, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    submissionsEl.innerHTML = `<p class='hint'>Failed to load: ${error.message}</p>`;
    return;
  }

  renderSubmissions(data || []);
}

saveBtn.addEventListener("click", savePrediction);
refreshBtn.addEventListener("click", loadSubmissions);

setupRaceOptions();
setupDriverInputs();
initSupabase();
loadSubmissions();
