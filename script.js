// === Rangebook Core Script with Overdrive Integration ===

const isDevMode = true;
let summitAccess = localStorage.getItem("rangebook-summit-access") === "true";
const todayKey = new Date().toISOString().slice(0, 10);

// === Configuration ===
const MAX_SECOND_WINDS = 1;
const MAX_OVERDRIVES = 4;

const monthlyThemes = {
  1: "Discipline", 2: "Reflection", 3: "Decision-Making",
  4: "Focus", 5: "Resilience", 6: "Growth",
  7: "Responsibility", 8: "Presence", 9: "Leadership",
  10: "Grit", 11: "Vision", 12: "Mastery"
};

const currentMonth = new Date().getMonth() + 1;
const thisMonthTheme = monthlyThemes[currentMonth];

// === Utility Functions ===
function getUsedPromptSet(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveUsedPrompt(key, prompt) {
  const used = getUsedPromptSet(key);
  used.push(prompt);
  localStorage.setItem(key, JSON.stringify(used));
}

function resetDailyCounts() {
  localStorage.setItem("used-second-wind", "false");
  localStorage.setItem("used-overdrive-prompts", JSON.stringify([]));
  localStorage.setItem("last-prompt-date", todayKey);
}

function checkNewDay() {
  const last = localStorage.getItem("last-prompt-date");
  if (last !== todayKey) resetDailyCounts();
}

// === Prompt Handling ===
function getMonthlyPromptList() {
  const promptBank = JSON.parse(localStorage.getItem("rangebook-prompt-bank") || "{}");
  const monthPrompts = promptBank[currentMonth] || [];
  return monthPrompts.map(p => (typeof p === "string" ? p : p.text || "[Invalid prompt]"));
}

function getBonusPromptList() {
  const bonusBank = JSON.parse(localStorage.getItem("rangebook-bonus-bank") || "[]");
  return bonusBank.map(p => (typeof p === "string" ? p : p.text || "[Invalid bonus prompt]"));
}

function getRandomFromList(prompts, exclude = []) {
  const available = prompts.filter(p => !exclude.includes(p));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

function showPrompt(type = "main") {
  checkNewDay();
  const promptText = document.getElementById("promptText");
  let prompt, usedKey;

  if (type === "main") {
    usedKey = `used-main-${todayKey}`;
    const used = getUsedPromptSet(usedKey);
    prompt = getRandomFromList(getMonthlyPromptList(), used);
    if (prompt) saveUsedPrompt(usedKey, prompt);
  } else if (type === "second") {
    if (localStorage.getItem("used-second-wind") === "true") {
      showToast("Second Wind already used today.");
      return;
    }
    const used = getUsedPromptSet(`used-main-${todayKey}`);
    prompt = getRandomFromList(getMonthlyPromptList(), used);
    if (prompt) {
      saveUsedPrompt(`used-main-${todayKey}`, prompt);
      localStorage.setItem("used-second-wind", "true");
    }
  } else if (type === "overdrive") {
    if (!summitAccess) return showToast("Upgrade required for Overdrive.");
    const used = getUsedPromptSet("used-overdrive-prompts");
    if (used.length >= MAX_OVERDRIVES) return showToast("Overdrive limit reached.");
    prompt = getRandomFromList(getBonusPromptList(), used);
    if (prompt) saveUsedPrompt("used-overdrive-prompts", prompt);
  }

  if (prompt) {
    promptText.textContent = prompt;
    promptText.dataset.currentPrompt = prompt;
    updateBookmarkButton(prompt);
  } else {
    promptText.textContent = "No prompt available.";
  }
}

// === Load Prompt Banks on First Visit ===
function loadPromptBanks() {
  const loadMonthly = fetch("https://raw.githubusercontent.com/RangeBook/rangebook/main/prompts.json")
    .then(res => res.json())
    .then(data => localStorage.setItem("rangebook-prompt-bank", JSON.stringify(data)));

  const loadBonus = fetch("https://raw.githubusercontent.com/RangeBook/rangebook/main/bonus_prompts.json")
    .then(res => res.json())
    .then(data => localStorage.setItem("rangebook-bonus-bank", JSON.stringify(data)));

  return Promise.all([loadMonthly, loadBonus]);
}

// === On Load Initialization ===
window.onload = () => {
  if (!localStorage.getItem("rangebook-prompt-bank") || !localStorage.getItem("rangebook-bonus-bank")) {
    loadPromptBanks().then(() => location.reload());
    return;
  }

  checkNewDay();
  showPrompt("main");

  document.getElementById("secondPromptBtn")?.addEventListener("click", () => showPrompt("second"));
  document.getElementById("overdriveBtn")?.addEventListener("click", () => showPrompt("overdrive"));
};
