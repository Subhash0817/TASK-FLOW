// ── State ──────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let editingTask = null;
let searchText = "";

// ── DOM References ──────────────────────────────────────────
const themeBtn      = document.getElementById("themeBtn");
const progressText  = document.getElementById("progressText");
const progressBar   = document.getElementById("progressBar");
const taskCount     = document.getElementById("taskCount");
const completedCount = document.getElementById("completedCount");
const streakCount   = document.getElementById("streakCount");
const addBtn        = document.getElementById("addBtn");
const taskInput     = document.getElementById("taskInput");
const taskList      = document.getElementById("taskList");
const clearBtn      = document.getElementById("clearBtn");
const priorityInput = document.getElementById("priority");
const dueTimeInput  = document.getElementById("due-time"); // fixed: was "dueTime"
const dueDateInput  = document.getElementById("dueDate");
const emptyState    = document.getElementById("emptyState");
const toast         = document.getElementById("toast");
const tabs          = document.querySelectorAll(".tab");
const dailyGoalInput = document.getElementById("dailyGoal");
const searchInput   = document.getElementById("searchInput");
const searchEmpty   = document.getElementById("searchEmpty");
const editModal     = document.getElementById("editModal");
const editInput     = document.getElementById("editInput");
const saveEdit      = document.getElementById("saveEdit");
const cancelEdit    = document.getElementById("cancelEdit");
const categoryInput = document.getElementById("category");

// ── Persistence Helpers ─────────────────────────────────────
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveGoal() {
  localStorage.setItem("dailyGoal", dailyGoalInput.value);
}

function loadGoal() {
  const saved = localStorage.getItem("dailyGoal");
  if (saved) dailyGoalInput.value = saved;
}

function saveStreak(value) {
  localStorage.setItem("streak", value);
}

function loadStreak() {
  return Number(localStorage.getItem("streak")) || 0;
}

// ── Streak Logic ────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function checkStreak() {
  const goal = Number(dailyGoalInput.value);
  const completed = tasks.filter(t => t.completed).length;
  const today = getToday();
  const lastStreakDate = localStorage.getItem("lastStreakDate");

  if (completed < goal || lastStreakDate === today) {
    streakCount.textContent = loadStreak();
    return;
  }

  let newStreak = 1;
  if (lastStreakDate) {
    const diff = Math.floor(
      (new Date(today) - new Date(lastStreakDate)) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) newStreak = loadStreak() + 1;
  }

  saveStreak(newStreak);
  localStorage.setItem("lastStreakDate", today);
  streakCount.textContent = newStreak;
  showToast(`🔥 Streak: ${newStreak}`);
}

// ── UI Helpers ──────────────────────────────────────────────
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function formatDate(dateValue) {
  if (!dateValue) return "No due date";
  return new Date(dateValue + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// ── Stats ───────────────────────────────────────────────────
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  taskCount.textContent = total;
  completedCount.textContent = completed;
  progressText.textContent = progress + "%";
  progressBar.style.width = progress + "%";
  streakCount.textContent = loadStreak();
}

// ── Filtering ───────────────────────────────────────────────
function getFilteredTasks() {
  let filtered = tasks;

  if (currentFilter === "active") {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentFilter === "completed") {
    filtered = filtered.filter(t => t.completed);
  }

  if (searchText) {
    const lower = searchText.toLowerCase();
    filtered = filtered.filter(t => t.text.toLowerCase().includes(lower));
  }

  return filtered;
}

// ── Task Element ────────────────────────────────────────────
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-card" + (task.completed ? " completed" : "");

  li.innerHTML = `
    <label class="check-wrap">
      <input type="checkbox" ${task.completed ? "checked" : ""} />
      <span class="custom-check"></span>
    </label>
    <div class="task-content">
      <p class="task-title"></p>
      <div class="task-meta">
        <span class="category-pill ${task.category}">${task.category}</span>
        <span class="priority-pill ${task.priority}">${task.priority}</span>
        <span class="due-date">📅 ${formatDate(task.dueDate)}</span>
        <span class="due-time">🕒 ${task.dueTime || "No time"}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="edit-btn" type="button">✏️</button>
      <button class="delete-btn" type="button">🗑️</button>
    </div>
  `;

  // Search highlight
  const taskTitle = li.querySelector(".task-title");
  if (searchText) {
    const regex = new RegExp(`(${searchText})`, "gi");
    taskTitle.innerHTML = task.text.replace(regex, '<span class="highlight">$1</span>');
  } else {
    taskTitle.textContent = task.text;
  }

  // Checkbox
  const checkbox = li.querySelector("input[type='checkbox']");
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    saveTasks();
    if (task.completed) checkStreak();
    renderTasks();
    showToast(task.completed ? "Task completed" : "Task marked active");
  });

  // Edit
  li.querySelector(".edit-btn").addEventListener("click", () => {
    editingTask = task;
    editInput.value = task.text;
    editModal.classList.remove("hide");
    editInput.focus();
  });

  // Delete
  li.querySelector(".delete-btn").addEventListener("click", () => {
    tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    renderTasks();
    showToast("Task deleted");
  });

  return li;
}

// ── Render ──────────────────────────────────────────────────
function renderTasks() {
  taskList.innerHTML = "";
  const filtered = getFilteredTasks();

  searchEmpty.classList.toggle("hide", !(filtered.length === 0 && searchText));
  filtered.forEach(task => taskList.appendChild(createTaskElement(task)));
  emptyState.classList.toggle("hide", filtered.length !== 0);
  clearBtn.disabled = tasks.length === 0;
  updateStats();
}

// ── Add Task ────────────────────────────────────────────────
function addTask() {
  const text = taskInput.value.trim();
  if (!text) {
    showToast("Please enter a task");
    taskInput.focus();
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text,
    priority: priorityInput.value,
    category: categoryInput.value,
    dueDate: dueDateInput.value,
    dueTime: dueTimeInput.value,
    completed: false
  });

  saveTasks();
  renderTasks();
  taskInput.value = "";
  dueDateInput.value = "";
  taskInput.focus();
  showToast("Task added");
}

// ── Theme ───────────────────────────────────────────────────
function loadTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeBtn.querySelector(".theme-icon").textContent = "☀️";
  }
}

// ── Event Listeners ─────────────────────────────────────────
addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

clearBtn.addEventListener("click", () => {
  if (!tasks.length) return;
  tasks = [];
  saveTasks();
  renderTasks();
  showToast("All tasks cleared");
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderTasks();
  });
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeBtn.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
});

dailyGoalInput.addEventListener("change", saveGoal);

searchInput.addEventListener("input", () => {
  searchText = searchInput.value;
  renderTasks();
});

saveEdit.addEventListener("click", () => {
  const updated = editInput.value.trim();
  if (!updated) return;
  editingTask.text = updated;
  saveTasks();
  renderTasks();
  editModal.classList.add("hide");
  showToast("Task updated");
});

cancelEdit.addEventListener("click", () => {
  editModal.classList.add("hide");
});

// ── Custom Time Picker ──────────────────────────────────────
(function () {
  const picker     = document.getElementById("timePicker");
  const panel      = document.getElementById("timePanel");
  const hourDisplay   = document.getElementById("timeHour");
  const minDisplay    = document.getElementById("timeMinute");
  const panelHour  = document.getElementById("panelHour");
  const panelMin   = document.getElementById("panelMinute");
  const setBtn     = document.getElementById("timeSetBtn");
  const clearBtn2  = document.getElementById("timeClearBtn");
  const hidden     = document.getElementById("due-time");

  let h = 12, m = 0;

  function pad(n) { return String(n).padStart(2, "0"); }

  function tickAnim(el) {
    el.classList.remove("tick");
    void el.offsetWidth; // reflow
    el.classList.add("tick");
  }

  function updatePanel() {
    panelHour.textContent = pad(h);
    panelMin.textContent  = pad(m);
    tickAnim(panelHour);
    tickAnim(panelMin);
  }

  function openPanel() {
    picker.classList.add("open");
    updatePanel();
  }

  function closePanel() {
    picker.classList.remove("open");
  }

  function setTime() {
    hourDisplay.textContent = pad(h);
    minDisplay.textContent  = pad(m);
    hidden.value = `${pad(h)}:${pad(m)}`;
    picker.classList.add("has-time");
    closePanel();
  }

  function clearTime() {
    hourDisplay.textContent = "--";
    minDisplay.textContent  = "--";
    hidden.value = "";
    picker.classList.remove("has-time");
    h = 12; m = 0;
    closePanel();
  }

  picker.addEventListener("click", e => {
    if (e.target === setBtn || e.target === clearBtn2) return;
    picker.classList.contains("open") ? closePanel() : openPanel();
  });

  document.querySelectorAll(".time-arrow").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const { unit, dir } = btn.dataset;
      if (unit === "hour") {
        h = dir === "up" ? (h + 1) % 24 : (h + 23) % 24;
        panelHour.textContent = pad(h);
        tickAnim(panelHour);
      } else {
        m = dir === "up" ? (m + 1) % 60 : (m + 59) % 60;
        panelMin.textContent = pad(m);
        tickAnim(panelMin);


      }
    });
  });

  setBtn.addEventListener("click", e => { e.stopPropagation(); setTime(); });
  clearBtn2.addEventListener("click", e => { e.stopPropagation(); clearTime(); });

  // Close on outside click
  document.addEventListener("click", e => {
    if (!picker.contains(e.target)) closePanel();
  });
})();
// ── Custom Date Picker ──────────────────────────────────────
(function () {
  const picker     = document.getElementById("datePicker");
  const panel      = document.getElementById("datePanel");
  const dayDisplay   = document.getElementById("dateDay");
  const monDisplay   = document.getElementById("dateMonth");
  const yrDisplay    = document.getElementById("dateYear");
  const panelDay   = document.getElementById("panelDay");
  const panelMon   = document.getElementById("panelMonth");
  const panelYr    = document.getElementById("panelYear");
  const setBtn     = document.getElementById("dateSetBtn");
  const clearBtn3  = document.getElementById("dateClearBtn");
  const hidden     = document.getElementById("dueDate");

  const now = new Date();
  let d = now.getDate(), mo = now.getMonth() + 1, y = now.getFullYear();

  function pad(n) { return String(n).padStart(2, "0"); }

  function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  function tickAnim(el) {
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }

  function updatePanel() {
    panelDay.textContent = pad(d);
    panelMon.textContent = pad(mo);
    panelYr.textContent  = y;
    tickAnim(panelDay); tickAnim(panelMon); tickAnim(panelYr);
  }

  function openPanel() { picker.classList.add("open"); updatePanel(); }
  function closePanel() { picker.classList.remove("open"); }

  function setDate() {
    dayDisplay.textContent = pad(d);
    monDisplay.textContent = pad(mo);
    yrDisplay.textContent  = y;
    hidden.value = `${y}-${pad(mo)}-${pad(d)}`;
    picker.classList.add("has-date");
    closePanel();
  }

  function clearDate() {
    dayDisplay.textContent = "--";
    monDisplay.textContent = "--";
    yrDisplay.textContent  = "----";
    hidden.value = "";
    picker.classList.remove("has-date");
    const n = new Date();
    d = n.getDate(); mo = n.getMonth() + 1; y = n.getFullYear();
    closePanel();
  }

  picker.addEventListener("click", e => {
    if (e.target === setBtn || e.target === clearBtn3) return;
    picker.classList.contains("open") ? closePanel() : openPanel();
  });

  panel.querySelectorAll(".time-arrow").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const { unit, dir } = btn.dataset;
      if (unit === "day") {
        const max = daysInMonth(mo, y);
        d = dir === "up" ? (d % max) + 1 : ((d - 2 + max) % max) + 1;
        panelDay.textContent = pad(d); tickAnim(panelDay);
      } else if (unit === "month") {
        mo = dir === "up" ? (mo % 12) + 1 : ((mo - 2 + 12) % 12) + 1;
        panelMon.textContent = pad(mo); tickAnim(panelMon);
      } else {
        y = dir === "up" ? y + 1 : y - 1;
        panelYr.textContent = y; tickAnim(panelYr);
      }
    });
  });

  setBtn.addEventListener("click", e => { e.stopPropagation(); setDate(); });
  clearBtn3.addEventListener("click", e => { e.stopPropagation(); clearDate(); });

  document.addEventListener("click", e => {
    if (!picker.contains(e.target)) closePanel();
  });
})();

// ── Init ────────────────────────────────────────────────────
loadTheme();
loadGoal();
renderTasks();

const streak = loadStreak();
streakCount.textContent = `${streak} Day${streak !== 1 ? "s" : ""}`;