// === Rangebook Core Script ===

const isDevMode = true;
let summitAccess = localStorage.getItem("rangebook-summit-access") === "true";
let usedSecondWindCount = parseInt(localStorage.getItem("used-second-wind-count")) || 0;
const MAX_SECOND_WINDS = 5;

function getMonthlyPromptList() {
  const currentMonth = new Date().getMonth() + 1;
  const promptBank = JSON.parse(localStorage.getItem("rangebook-prompt-bank") || "{}");
  const monthPrompts = promptBank[currentMonth] || [];

  // Fix: If prompts are stored as objects (e.g. {text: "..."}), extract only the text
  return monthPrompts.map(p => (typeof p === "string" ? p : p.text || "[Invalid prompt]"));
}


function getRandomPrompt(exclude = []) {
  const prompts = getMonthlyPromptList();
  const available = prompts.filter(p => !exclude.includes(p));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : prompts[0] || "No prompt available.";
}

function setSummitAccess(enabled) {
  summitAccess = enabled;
  localStorage.setItem("rangebook-summit-access", enabled);
}

function updateSecondWindState() {
  const btn = document.getElementById("secondPromptBtn");
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

function showPrompt() {
  const prompt = getRandomPrompt();
  const promptText = document.getElementById("promptText");

  promptText.textContent = prompt;
  promptText.dataset.currentPrompt = prompt;

  updateBookmarkButton(prompt);
  document.getElementById("bookmarkControls").style.display = "block";

  localStorage.setItem("last-prompt", prompt);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.display = "block";
  toast.style.opacity = 1;
  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => (toast.style.display = "none"), 500);
  }, 2500);
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
  list.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("rangebook-history") || "[]");
  history.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${new Date(item.date).toLocaleDateString()}:</strong> <em>${item.prompt}</em><br>${item.entry}`;
    list.appendChild(li);
  });
  document.getElementById("historyContainer").style.display = "block";
}

function undoPrompt() {
  const last = localStorage.getItem("last-prompt");
  if (last) {
    document.getElementById("promptText").textContent = last;
    document.getElementById("promptText").dataset.currentPrompt = last;
    showToast("Prompt reverted.");
  }
}

function saveGoal() {
  const goal = document.getElementById("monthlyGoal").value.trim();
  if (!goal) return showToast("Goal is empty.");
  localStorage.setItem("rangebook-monthly-goal", goal);
  document.getElementById("goalStatus").textContent = "Goal saved.";
}
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

// 🔹 Utility function to update the UI
function displayGoal(goalText, elementId) {
  const goalDisplay = document.getElementById(elementId);
  if (goalDisplay) goalDisplay.textContent = goalText || "No goal set.";
}

// 🔹 Prompt for goal if not set
function promptForGoals() {
  if (!localStorage.getItem(currentMonthKey)) {
    const goal = prompt(`This month's theme is ${thisMonthTheme}. Set one goal that puts it into action.`);
    if (goal) localStorage.setItem(currentMonthKey, goal);
  }

  if (summitAccess && !localStorage.getItem(personalGoalKey)) {
    const personal = prompt("Summit Access: Set a second personal goal for this month (optional).");
    if (personal) localStorage.setItem(personalGoalKey, personal);
  }
}

// 🔹 Mid-month check-in
function midMonthCheckIn() {
  if (summitAccess && day >= 14 && day <= 16 && !localStorage.getItem(checkInKey)) {
    const checkIn = prompt(`Mid-month check-in: Are you on track with your goal for ${thisMonthTheme}?`);
    if (checkIn) localStorage.setItem(checkInKey, checkIn);
  }
}

// 🔹 End-of-month reflection
function endOfMonthReflection() {
  if (summitAccess && day >= 28 && !localStorage.getItem(reflectionKey)) {
    const reflection = prompt(`End-of-month reflection: How well did you follow through on your goal for ${thisMonthTheme}?`);
    if (reflection) localStorage.setItem(reflectionKey, reflection);
  }
}

// 🔹 Display goals in UI
function loadGoals() {
  displayGoal(localStorage.getItem(currentMonthKey), "monthlyGoalDisplay");
  if (summitAccess) {
    displayGoal(localStorage.getItem(personalGoalKey), "personalGoalDisplay");
  }
}

// 🔹 Edit goal functions
function editGoal(key, promptText, displayId) {
  const newGoal = prompt(promptText, localStorage.getItem(key) || "");
  if (newGoal !== null) {
    localStorage.setItem(key, newGoal);
    displayGoal(newGoal, displayId);
  }
}

// 🔹 Load archive
function loadGoalArchive() {
  const archive = document.getElementById("goalArchive");
  if (archive && summitAccess) {
    archive.innerHTML = "<strong>Past Goals:</strong><br>";
    for (let m = 1; m <= 12; m++) {
      const key = `goal_${year}_${m}`;
      const goal = localStorage.getItem(key);
      if (goal) {
        archive.innerHTML += `🗓️ ${monthlyThemes[m]}: "${goal}"<br>`;
      }
    }
  }
}

// Call everything on load
promptForGoals();
midMonthCheckIn();
endOfMonthReflection();
loadGoals();
loadGoalArchive();

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
  updateSecondWindState();

  if (summitAccess) {
    document.getElementById("goalSection").style.display = "block";
    document.getElementById("exportSection").style.display = "block";
  }

  if (isDevMode) {
    const resetBtn = document.getElementById("resetButton");
    if (resetBtn) resetBtn.style.display = "inline-block";
  }

  const savedTime = localStorage.getItem("rangebook-reminder-time");
  if (savedTime) {
    document.getElementById("reminderTime").value = savedTime;
  }
const bookmarkBtn = document.getElementById("bookmarkButton");
if (bookmarkBtn) {
  bookmarkBtn.addEventListener("click", function () {
    const prompt = document.getElementById("promptText").dataset.currentPrompt;
    if (!prompt) return;

    let bookmarks = JSON.parse(localStorage.getItem("rangebook-bookmarks") || "[]");
    const index = bookmarks.indexOf(prompt);

    if (index === -1) {
      bookmarks.push(prompt);
      localStorage.setItem("rangebook-bookmarks", JSON.stringify(bookmarks));
      showToast("Prompt bookmarked.");
    } else {
      bookmarks.splice(index, 1);
      localStorage.setItem("rangebook-bookmarks", JSON.stringify(bookmarks));
      showToast("Bookmark removed.");
    }

    updateBookmarkButton(prompt);
  });
}

function loadBookmarkedPrompts() {
  const container = document.getElementById("bookmarkedContainer");
  const list = document.getElementById("bookmarkedList");
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
function updateBookmarkButton(prompt) {
  const btn = document.getElementById("bookmarkButton");
  const bookmarks = JSON.parse(localStorage.getItem("rangebook-bookmarks") || "[]");

  if (bookmarks.includes(prompt)) {
    btn.textContent = "❌ Remove Bookmark";
  } else {
    btn.textContent = "📌 Bookmark This Prompt";
  }
}

  document.getElementById("reminderTime").addEventListener("change", function () {
    const time = this.value;
    localStorage.setItem("rangebook-reminder-time", time);
    showToast("Reminder time saved.");
  });

  document.getElementById("secondPromptBtn").addEventListener("click", function () {
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

  document.getElementById("resetButton").addEventListener("click", function () {
    localStorage.clear();
    usedSecondWindCount = 0;
    location.reload();
  });

  const upgradeBtn = document.getElementById("upgradeNowBtn");
if (upgradeBtn) {
  upgradeBtn.addEventListener("click", function () {
    setSummitAccess(true);
    usedSecondWindCount = 0;
    localStorage.setItem("used-second-wind-count", 0);
    document.getElementById("upgradeModal").style.display = "none";
    showToast("Summit Access unlocked!");
    updateSecondWindState();
    location.reload();
  });
}

  document.getElementById("cancelUpgradeBtn").addEventListener("click", function () {
    document.getElementById("upgradeModal").style.display = "none";
  });

  document.querySelectorAll("[data-upgrade]").forEach(btn => {
    btn.addEventListener("click", function () {
      document.getElementById("upgradeModal").style.display = "flex";
    });
  });

  document.getElementById("saveEntryBtn").addEventListener("click", saveEntry);
  document.getElementById("undoButton").addEventListener("click", undoPrompt);
  document.getElementById("saveGoalBtn").addEventListener("click", saveGoal);
  document.getElementById("toggleHistoryBtn").addEventListener("click", loadJournalHistory);
document.getElementById("viewBookmarksBtn").addEventListener("click", loadBookmarkedPrompts);
};
