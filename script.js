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
  document.getElementById("promptText").textContent = prompt;
  document.getElementById("promptText").dataset.currentPrompt = prompt;
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

window.onload = function () {
  const promptBank = localStorage.getItem("rangebook-prompt-bank");

  if (!promptBank) {
    fetch("prompts.json")
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

  document.getElementById("upgradeNowBtn").addEventListener("click", function () {
    setSummitAccess(true);
    usedSecondWindCount = 0;
    localStorage.setItem("used-second-wind-count", 0);
    document.getElementById("upgradeModal").style.display = "none";
    showToast("Summit Access unlocked!");
    updateSecondWindState();
    location.reload();
  });

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
};
