// === Cleaned & Consolidated Rangebook Core Script ===

const isDevMode = true;
let summitAccess = localStorage.getItem("rangebook-summit-access") === "true";
let usedSecondWindCount = parseInt(localStorage.getItem("used-second-wind-count")) || 0;
const MAX_SECOND_WINDS = 5;

function updateSecondWindState() {
  const btn = document.getElementById("secondPromptBtn");
  if (!btn) return;
  if (!summitAccess) {
    btn.textContent = "Second Wind (Upgrade Required)";
    btn.disabled = true;
  } else if (usedSecondWindCount >= MAX_SECOND_WINDS) {
    btn.textContent = "Second Wind (0 left)";
    btn.disabled = true;
  } else {
    const remaining = MAX_SECOND_WINDS - usedSecondWindCount;
    btn.textContent = `Second Wind (${remaining} left)`;
    btn.disabled = false;
  }
}

// === Month & Theme Setup ===
const currentDate = new Date();
const month = currentDate.getMonth() + 1;
const year = currentDate.getFullYear();
const day = currentDate.getDate();
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

// === Prompts ===
function getMonthlyPromptList() {
  const promptBank = JSON.parse(localStorage.getItem("rangebook-prompt-bank") || "{}");
  const monthPrompts = promptBank[month] || [];
  return monthPrompts.map(p => typeof p === "string" ? p : p.text || "[Invalid prompt]");
}

function getRandomPrompt(exclude = []) {
  const prompts = getMonthlyPromptList();
  const available = prompts.filter(p => !exclude.includes(p));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : prompts[0] || "No prompt available.";
}
function exportJournal() {
  const entriesJSON = localStorage.getItem("journalEntries");
  if (!entriesJSON) {
    alert("No journal entries found.");
    return;
  }

  const entries = JSON.parse(entriesJSON);
  let textOutput = "";

  for (const date in entries) {
    textOutput += `Date: ${date}\n${entries[date]}\n\n`;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
  const entriesJSON = localStorage.getItem("journalEntries");
  if (!entriesJSON) {
    alert("No journal entries found.");
    return;
  }

  const entries = JSON.parse(entriesJSON);
  let textOutput = "";

  for (const date in entries) {
    textOutput += `Date: ${date}\n${entries[date]}\n\n`;
  }

  navigator.clipboard.writeText(textOutput).then(() => {
    alert("Journal copied to clipboard.");
  }).catch(err => {
    console.error("Copy failed:", err);
    alert("Failed to copy journal to clipboard.");
  });
}

function showPrompt() {
  const prompt = getRandomPrompt();
  const promptText = document.getElementById("promptText");
  promptText.textContent = prompt;
  promptText.dataset.currentPrompt = prompt;
  updateBookmarkButton(prompt);
  const controls = document.getElementById("bookmarkControls");
  if (controls) controls.style.display = "block";
  localStorage.setItem("last-prompt", prompt);
}

// === Bookmarks ===
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

// === Journal ===
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

// === Toast ===
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

// === Event Listeners ===
window.onload = function () {
  const promptBank = localStorage.getItem("rangebook-prompt-bank");
  if (!promptBank) {
    fetch("https://raw.githubusercontent.com/RangeBook/rangebook/main/prompts.json")
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("rangebook-prompt-bank", JSON.stringify(data));
        location.reload();
      })
      .catch(err => {
        console.error("Failed to load prompt bank:", err);
        showToast("Error loading prompts. Please refresh.");
      });
    return;
  }

  showPrompt();

  // Load and Display Goals
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

  const saveEntryBtn = document.getElementById("saveEntryBtn");
  if (saveEntryBtn) saveEntryBtn.addEventListener("click", saveEntry);

  const undoBtn = document.getElementById("undoButton");
  if (undoBtn) undoBtn.addEventListener("click", undoPrompt);

  const toggleHistoryBtn = document.getElementById("toggleHistoryBtn");
  if (toggleHistoryBtn) toggleHistoryBtn.addEventListener("click", loadJournalHistory);

  const viewBookmarksBtn = document.getElementById("viewBookmarksBtn");
  if (viewBookmarksBtn) viewBookmarksBtn.addEventListener("click", loadBookmarkedPrompts);

  const bookmarkBtn = document.getElementById("bookmarkButton");
  if (bookmarkBtn) bookmarkBtn.addEventListener("click", toggleBookmark);

  const secondPromptBtn = document.getElementById("secondPromptBtn");
  if (secondPromptBtn) {
    secondPromptBtn.addEventListener("click", () => {
      if (summitAccess && usedSecondWindCount < MAX_SECOND_WINDS) {
        const current = document.getElementById("promptText").dataset.currentPrompt;
        const newPrompt = getRandomPrompt([current]);
        document.getElementById("promptText").textContent = newPrompt;
        document.getElementById("promptText").dataset.currentPrompt = newPrompt;
        usedSecondWindCount++;
        localStorage.setItem("used-second-wind-count", usedSecondWindCount);
        updateSecondWindState();
      } else {
        showToast("Second Wind is unavailable.");
      }
    });
  }

  const resetButton = document.getElementById("resetButton");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      localStorage.clear();
      usedSecondWindCount = 0;
      location.reload();
    });
  }

  const upgradeNowBtn = document.getElementById("upgradeNowBtn");
  if (upgradeNowBtn) {
    upgradeNowBtn.addEventListener("click", () => {
      summitAccess = true;
      localStorage.setItem("rangebook-summit-access", true);
      localStorage.setItem("used-second-wind-count", 0);
      document.getElementById("upgradeModal").style.display = "none";
      showToast("Summit Access unlocked!");
      updateSecondWindState();
      location.reload();
    });
  }

  const cancelUpgradeBtn = document.getElementById("cancelUpgradeBtn");
  if (cancelUpgradeBtn) {
    cancelUpgradeBtn.addEventListener("click", () => {
      document.getElementById("upgradeModal").style.display = "none";
    });
  }

  document.querySelectorAll("[data-upgrade]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("upgradeModal").style.display = "flex";
    });
  });
};
