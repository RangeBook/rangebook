// === Rangebook Core Script with Overdrive Integration (Merged with Original Functionality) ===

const isDevMode = false;
let summitAccess = localStorage.getItem("rangebook-summit-access") === "true";
let usedSecondWindCount = parseInt(localStorage.getItem("used-second-wind-count")) || 0;
const MAX_SECOND_WINDS = 1;

const currentDate = new Date();
const month = currentDate.getMonth() + 1;
const year = currentDate.getFullYear();
const day = currentDate.getDate();
const todayKey = currentDate.toISOString().slice(0, 10);
const currentMonthKey = `goal_${year}_${month}`;
const personalGoalKey = `personal_goal_${year}_${month}`;
const checkInKey = `checkin_${year}_${month}`;
const reflectionKey = `reflection_${year}_${month}`;
const monthlyThemes = {
  1: "Discipline", 2: "Reflection", 3: "Decision-Making",
  4: "Focus", 5: "Resilience", 6: "Growth",
  7: "Responsibility", 8: "Presence", 9: "Leadership",
  10: "Grit", 11: "Vision", 12: "Mastery"
};
const thisMonthTheme = monthlyThemes[month];
// === Overdrive Usage Tracking ===
const MAX_OVERDRIVES = 4;
const TOTAL_OVERDRIVE_LIMIT = 1000;
const overdriveDailyKey = `overdrive-${todayKey}`;
const overdriveTotalKey = "rangebook-overdrive-total";

function updateOverdriveCounter() {
  const el = document.getElementById("overdriveCounter");
  if (!el) return;

  const dailyUsed = parseInt(localStorage.getItem(overdriveDailyKey) || "0");
  const totalUsed = JSON.parse(localStorage.getItem(overdriveTotalKey) || "[]").length;

  el.textContent = `Overdrive: ${dailyUsed}/${MAX_OVERDRIVES} today | ${totalUsed}/${TOTAL_OVERDRIVE_LIMIT} total`;
}

function updateSecondWindState() {
  const btn = document.getElementById("secondPromptBtn");
  if (!btn) return;
  
  const remaining = MAX_SECOND_WINDS - usedSecondWindCount;
  btn.textContent = `Second Wind (${remaining} left)`;
  btn.disabled = remaining <= 0;
}

function getMonthlyPromptList() {
  const promptBank = JSON.parse(localStorage.getItem("rangebook-prompt-bank") || "{}");
  const monthPrompts = promptBank[month] || [];
  return monthPrompts.map(p => typeof p === "string" ? p : p.text || "[Invalid prompt]");
}

function getBonusPromptList() {
  const bonusBank = JSON.parse(localStorage.getItem("rangebook-bonus-bank") || "[]");
  return bonusBank.map(p => typeof p === "string" ? p : p.text || "[Invalid bonus prompt]");
}

function getRandomFromList(prompts, exclude = []) {
  const available = prompts.filter(p => !exclude.includes(p));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;
}

function showPrompt(type = "main") {
  const promptText = document.getElementById("promptText");
  const usedMainKey = `used-main-${todayKey}`;
  const usedOverdriveKey = overdriveTotalKey;

  let prompt;

  if (type === "main") {
    const used = JSON.parse(localStorage.getItem(usedMainKey) || "[]");
    prompt = getRandomFromList(getMonthlyPromptList(), used);
    if (prompt) {
      used.push(prompt);
      localStorage.setItem(usedMainKey, JSON.stringify(used));
    }
  } else if (type === "second") {
    if (usedSecondWindCount >= MAX_SECOND_WINDS) {
      showToast("Second Wind is unavailable.");
      return;
    }
    const used = JSON.parse(localStorage.getItem(usedMainKey) || "[]");
    prompt = getRandomFromList(getMonthlyPromptList(), used);
    if (prompt) {
      used.push(prompt);
      localStorage.setItem(usedMainKey, JSON.stringify(used));
      usedSecondWindCount++;
      localStorage.setItem("used-second-wind-count", usedSecondWindCount);
      updateSecondWindState();
    }
  } else if (type === "overdrive") {
    if (!summitAccess) return showToast("Upgrade required for Overdrive.");

    const dailyCount = parseInt(localStorage.getItem(overdriveDailyKey) || "0");
    const totalUsed = JSON.parse(localStorage.getItem(overdriveTotalKey) || "[]");

    if (dailyCount >= MAX_OVERDRIVES) return showToast("Overdrive limit reached today.");
    if (totalUsed.length >= TOTAL_OVERDRIVE_LIMIT) return showToast("All Overdrive prompts used.");

    prompt = getRandomFromList(getBonusPromptList(), totalUsed);
if (prompt) {
  totalUsed.push(prompt);
  localStorage.setItem(overdriveDailyKey, `${dailyCount + 1}`);
  localStorage.setItem(overdriveTotalKey, JSON.stringify(totalUsed));
} else {
  promptText.textContent = "No Overdrive prompt available.";
}

    updateOverdriveCounter();
  }

  if (prompt) {
    promptText.textContent = prompt;
    promptText.dataset.currentPrompt = prompt;
    updateBookmarkButton(prompt);
    const controls = document.getElementById("bookmarkControls");
    if (controls) controls.style.display = "block";
    localStorage.setItem("last-prompt", prompt);
  } else {
    promptText.textContent = "No prompt available.";
  }
}

function exportJournal() {
  const entriesJSON = localStorage.getItem("rangebook-history");
  if (!entriesJSON) return alert("No journal entries found.");
  const entries = JSON.parse(entriesJSON);
  let textOutput = "";
  entries.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    textOutput += `Date: ${date}\nPrompt: ${item.prompt}\nEntry: ${item.entry}\n\n`;
  });
  const today = new Date().toISOString().slice(0, 10);
  const blob = new Blob([textOutput], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rangebook-Journal-${today}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyJournalToClipboard() {
  const entriesJSON = localStorage.getItem("rangebook-history");
  if (!entriesJSON) return alert("No journal entries found.");
  const entries = JSON.parse(entriesJSON);
  let textOutput = "";
  entries.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    textOutput += `Date: ${date}\nPrompt: ${item.prompt}\nEntry: ${item.entry}\n\n`;
  });
  navigator.clipboard.writeText(textOutput).then(() => alert("Journal copied to clipboard."))
    .catch(err => {
      console.error("Copy failed:", err);
      alert("Failed to copy journal to clipboard.");
    });
}

function updateBookmarkButton(prompt) {
  const btn = document.getElementById("bookmarkButton");
  if (!btn) return;
  const bookmarks = JSON.parse(localStorage.getItem("rangebook-bookmarks") || "[]");
  btn.textContent = bookmarks.includes(prompt) ? "❌ Remove Bookmark" : "📌 Bookmark This Prompt";
}

function toggleBookmark() {
  const prompt = document.getElementById("promptText").dataset.currentPrompt;
  if (!prompt) return;
  let bookmarks = JSON.parse(localStorage.getItem("rangebook-bookmarks") || "[]");
  const index = bookmarks.indexOf(prompt);
  if (index === -1) {
    bookmarks.push(prompt);
    showToast("Prompt bookmarked.");
  } else {
    bookmarks.splice(index, 1);
    showToast("Bookmark removed.");
  }
  localStorage.setItem("rangebook-bookmarks", JSON.stringify(bookmarks));
  updateBookmarkButton(prompt);
}

function loadBookmarkedPrompts() {
  const container = document.getElementById("bookmarkedContainer");
  const list = document.getElementById("bookmarkedList");
  if (!container || !list) return;
  const bookmarks = JSON.parse(localStorage.getItem("rangebook-bookmarks") || "[]");
  list.innerHTML = "";
  if (bookmarks.length === 0) {
    list.innerHTML = "<li>No bookmarks yet.</li>";
  } else {
    bookmarks.forEach(p => {
      const li = document.createElement("li");
      li.textContent = p;
      list.appendChild(li);
    });
  }
  container.style.display = "block";
}

function saveEntry() {
  const entry = document.getElementById("journalEntry").value.trim();
  const prompt = document.getElementById("promptText").dataset.currentPrompt;
  if (!entry) return showToast("Entry is empty.");
  const history = JSON.parse(localStorage.getItem("rangebook-history") || "[]");
  history.push({ date: new Date().toISOString(), prompt, entry });
  localStorage.setItem("rangebook-history", JSON.stringify(history));
  document.getElementById("journalEntry").value = "";
  showToast("Entry saved.");
}

function loadJournalHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("rangebook-history") || "[]");
  history.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${new Date(item.date).toLocaleDateString()}:</strong> <em>${item.prompt}</em><br>${item.entry}`;
    list.appendChild(li);
  });
  const container = document.getElementById("historyContainer");
  if (container) container.style.display = "block";
}

function undoPrompt() {
  const last = localStorage.getItem("last-prompt");
  if (last) {
    document.getElementById("promptText").textContent = last;
    document.getElementById("promptText").dataset.currentPrompt = last;
    showToast("Prompt reverted.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = "block";
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 500);
  }, 2500);
}

function editGoal(storageKey, promptMessage, displayId) {
  const currentValue = localStorage.getItem(storageKey) || "";
  const newValue = prompt(promptMessage, currentValue);
  if (newValue !== null) {
    localStorage.setItem(storageKey, newValue);
    const display = document.getElementById(displayId);
    if (display) display.textContent = newValue;
    showToast("Goal updated.");
  }
}

function dismissWelcome() {
  const modal = document.getElementById("welcomeModal");
  if (modal) modal.style.display = "none";
  localStorage.setItem("rangebook-seen-welcome", "true");
}
function saveMonthlyGoals() {
  const themeVal = document.getElementById("goalInput").value.trim();
  const personalVal = document.getElementById("personalGoalInput").value.trim();
  localStorage.setItem(currentMonthKey, themeVal);
  localStorage.setItem(personalGoalKey, personalVal);
  document.getElementById("goalModal").style.display = "none";
  showToast("Goals saved.");
}

function saveCheckIn() {
  const val = document.getElementById("checkinInput").value.trim();
  localStorage.setItem(checkInKey, val);
  document.getElementById("checkinModal").style.display = "none";
  showToast("Check-in saved.");
}

function saveReflection() {
  const val = document.getElementById("reflectionInput").value.trim();
  localStorage.setItem(reflectionKey, val);
  document.getElementById("reflectionModal").style.display = "none";
  showToast("Reflection saved.");
}

window.addEventListener("load", () => {
  const hasSeenWelcome = localStorage.getItem("rangebook-seen-welcome");
  if (!hasSeenWelcome) {
    const modal = document.getElementById("welcomeModal");
    if (modal) modal.style.display = "flex";
  }
});
function closeModal(el) {
  const modal = el.closest('.modal');
  if (modal) modal.style.display = 'none';
}

window.onload = function () {
  if (!localStorage.getItem("rangebook-prompt-bank") || !localStorage.getItem("rangebook-bonus-bank")) {
    const loadMonthly = fetch("https://raw.githubusercontent.com/RangeBook/rangebook/main/prompts.json")
      .then(res => res.json())
      .then(data => localStorage.setItem("rangebook-prompt-bank", JSON.stringify(data)));

    const loadBonus = fetch("https://raw.githubusercontent.com/RangeBook/rangebook/main/bonus_prompts.json")
      .then(res => res.json())
      .then(data => localStorage.setItem("rangebook-bonus-bank", JSON.stringify(data)));

    Promise.all([loadMonthly, loadBonus]).then(() => location.reload());
    return;
   }
 updateOverdriveCounter();
  showPrompt("main");
const isFirstVisitThisMonth = !localStorage.getItem(`seen-goalmodal-${year}-${month}`);
if (isFirstVisitThisMonth) {
  document.getElementById("goalInput").placeholder = `Set a goal for this month focused on ${thisMonthTheme}`;
document.getElementById("personalGoalInput").placeholder = "Something you’d like to improve, build, or change this month.";
document.getElementById("goalModal").style.display = "flex";

  localStorage.setItem(`seen-goalmodal-${year}-${month}`, "true");
}

if (summitAccess && day === 15 && !localStorage.getItem(`seen-checkin-${year}-${month}`)) {
  document.getElementById("checkinModal").style.display = "flex";
  localStorage.setItem(`seen-checkin-${year}-${month}`, "true");
}

if (summitAccess && day >= 28 && !localStorage.getItem(`seen-reflection-${year}-${month}`)) {
  document.getElementById("reflectionModal").style.display = "flex";
  localStorage.setItem(`seen-reflection-${year}-${month}`, "true");
}

  const goalText = localStorage.getItem(currentMonthKey) || "";
  const goalDisplay = document.getElementById("monthlyGoalDisplay");
  if (goalDisplay) goalDisplay.textContent = goalText;

  const personalGoal = localStorage.getItem(personalGoalKey) || "";
  const personalGoalDisplay = document.getElementById("personalGoalDisplay");
  if (personalGoalDisplay) personalGoalDisplay.textContent = personalGoal;

  if (isDevMode) {
    const resetBtn = document.getElementById("resetButton");
    if (resetBtn) resetBtn.style.display = "inline-block";
  }

  if (summitAccess) {
    const exp = document.getElementById("exportSection");
    if (exp) exp.style.display = "block";
  }

  updateSecondWindState();

  const reminderTime = document.getElementById("reminderTime");
  if (reminderTime) {
    const savedTime = localStorage.getItem("rangebook-reminder-time");
    if (savedTime) reminderTime.value = savedTime;
    reminderTime.addEventListener("change", function () {
      localStorage.setItem("rangebook-reminder-time", this.value);
      showToast("Reminder time saved.");
    });
  }

  document.getElementById("saveEntryBtn")?.addEventListener("click", saveEntry);
  document.getElementById("undoButton")?.addEventListener("click", undoPrompt);
  document.getElementById("toggleHistoryBtn")?.addEventListener("click", loadJournalHistory);
  document.getElementById("viewBookmarksBtn")?.addEventListener("click", loadBookmarkedPrompts);
  document.getElementById("bookmarkButton")?.addEventListener("click", toggleBookmark);

  document.getElementById("secondPromptBtn")?.addEventListener("click", () => showPrompt("second"));
  document.getElementById("overdriveBtn")?.addEventListener("click", () => showPrompt("overdrive"));

  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      localStorage.clear();
      usedSecondWindCount = 0;
      location.reload();
    });
  }

  document.getElementById("upgradeNowBtn")?.addEventListener("click", () => {
    summitAccess = true;
    localStorage.setItem("rangebook-summit-access", true);
    localStorage.setItem("used-second-wind-count", 0);
    document.getElementById("upgradeModal").style.display = "none";
    showToast("Summit Access unlocked!");
    updateSecondWindState();
    location.reload();
  });

  document.getElementById("cancelUpgradeBtn")?.addEventListener("click", () => {
    document.getElementById("upgradeModal").style.display = "none";
  });

  document.querySelectorAll("[data-upgrade]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("upgradeModal").style.display = "flex";
    });
  });

 if (!summitAccess) {
  const overdriveBtn = document.getElementById("overdriveBtn");
  if (overdriveBtn) {
    overdriveBtn.disabled = true;
    overdriveBtn.classList.add("locked");
    overdriveBtn.addEventListener("click", () => {
      showToast("Overdrive is available with Summit Access.");
      document.getElementById("upgradeModal").style.display = "flex";
    });
  }
}

};
