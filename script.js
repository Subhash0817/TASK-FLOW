// ── State ──────────────────────────────────────────────────
let tasks = [];
let currentFilter = "all";
let editingTask = null;
let searchText = "";

// ── DOM ─────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const themeBtn       = $("themeBtn");
const progressText   = $("progressText");
const progressBar    = $("progressBar");
const taskCount      = $("taskCount");
const completedCount = $("completedCount");
const streakCount    = $("streakCount");
const addBtn         = $("addBtn");
const taskInput      = $("taskInput");
const taskList       = $("taskList");
const clearBtn       = $("clearBtn");
const priorityInput  = $("priority");
const categoryInput  = $("category");
const dueDateInput   = $("dueDate");
const dueTimeInput   = $("due-time");
const emptyState     = $("emptyState");
const toast          = $("toast");
const tabs           = document.querySelectorAll(".tab");
const dailyGoalInput = $("dailyGoal");
const searchInput    = $("searchInput");
const searchEmpty    = $("searchEmpty");
const editModal      = $("editModal");
const editInput      = $("editInput");
const homePage       = $("homePage");
const notificationsPage = $("notificationsPage");
const profilePage    = $("profilePage");

// ── Persistence ─────────────────────────────────────────────

const saveGoal   = () => localStorage.setItem("dailyGoal", dailyGoalInput.value);
const loadGoal   = () => { const g = localStorage.getItem("dailyGoal"); if (g) dailyGoalInput.value = g; };
const saveStreak = v  => localStorage.setItem("streak", v);
const loadStreak = () => Number(localStorage.getItem("streak")) || 0;
const getToday   = () => new Date().toISOString().split("T")[0];

// ── Streak ──────────────────────────────────────────────────
function checkStreak() {
  const goal = Number(dailyGoalInput.value);
  const done  = tasks.filter(t => t.completed).length;
  const today = getToday();
  const last  = localStorage.getItem("lastStreakDate");
  if (done < goal || last === today) { streakCount.textContent = loadStreak(); return; }
  let streak = 1;
  if (last) {
    const diff = Math.floor((new Date(today) - new Date(last)) / 86400000);
    if (diff === 1) streak = loadStreak() + 1;
  }
  saveStreak(streak);
  localStorage.setItem("lastStreakDate", today);
  streakCount.textContent = streak;
  showToast(`🔥 Streak: ${streak}`);
}

// ── Helpers ─────────────────────────────────────────────────
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function formatDate(v) {
  if (!v) return "No due date";
  return new Date(v + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

// ── Stats ────────────────────────────────────────────────────
function updateStats() {
  const total    = tasks.length;
  const done     = tasks.filter(t => t.completed).length;
  const pct      = total ? Math.round((done / total) * 100) : 0;
  taskCount.textContent      = total;
  completedCount.textContent = done;
  progressText.textContent   = pct + "%";
  progressBar.style.width    = pct + "%";
  streakCount.textContent    = loadStreak();
  // sync profile page
  $("profileTasks").textContent  = total;
  $("profileDone").textContent   = done;
  $("profileStreak").textContent = loadStreak();
}

// ── Filter ───────────────────────────────────────────────────
function getFiltered() {
  let list = tasks;
  if (currentFilter === "active")    list = list.filter(t => !t.completed);
  if (currentFilter === "completed") list = list.filter(t => t.completed);
  if (searchText) list = list.filter(t => t.text.toLowerCase().includes(searchText.toLowerCase()));
  return list;
}

// ── Task Element ─────────────────────────────────────────────
function createTaskEl(task) {
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
    </div>`;

  const title = li.querySelector(".task-title");
  if (searchText) {
    const re = new RegExp(`(${searchText})`, "gi");
    title.innerHTML = task.text.replace(re, '<span class="highlight">$1</span>');
  } else {
    title.textContent = task.text;
  }

  const cb = li.querySelector("input[type='checkbox']");

cb.addEventListener("change", async () => {
console.log("Checkbox event fired");
    const response = await fetch(
        `http://127.0.0.1:5000/tasks/${task.id}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: task.text,
                completed: cb.checked ? 1 : 0
            })
        }
    );
console.log(await response.json());
    if (!response.ok) {
        showToast("Couldn't update task ❌");
        return;
    }

    task.completed = cb.checked;

    if (task.completed)
        checkStreak();

    await loadTasks();

    showToast(
        task.completed
            ? "Task completed ✅"
            : "Marked active"
    );

});

  li.querySelector(".edit-btn").addEventListener("click", () => {
    editingTask = task;
    editInput.value = task.text;
    editModal.classList.remove("hide");
    editInput.focus();
  });

  li.querySelector(".delete-btn").addEventListener("click", async () => {

    const response = await fetch(
        `http://127.0.0.1:5000/tasks/${task.id}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        showToast("Couldn't delete task ❌");
        return;
    }

    await loadTasks();

    showToast("Task deleted 🗑️");

});

  return li;
}
async function loadTasks() {

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/tasks"
        );

        const data = await response.json();

        tasks = data.tasks.map(task => ({

            id: task.id,

            text: task.title,

            completed: task.completed,

            priority: "medium",

            category: "Personal",

            dueDate: "",

            dueTime: ""

        }));

        renderTasks();

    }

    catch (error) {

        console.error(error);

        showToast("Couldn't load tasks");

    }

}
// ── Render ───────────────────────────────────────────────────
function renderTasks() {
  taskList.innerHTML = "";
  const filtered = getFiltered();
  searchEmpty.classList.toggle("hide", !(filtered.length === 0 && searchText));
  filtered.forEach(t => taskList.appendChild(createTaskEl(t)));
  emptyState.classList.toggle("hide", filtered.length > 0);
  clearBtn.disabled = tasks.length === 0;
  updateStats();
}

// ── Add Task ─────────────────────────────────────────────────
async function addTask() {
  const text = taskInput.value.trim();
  if (!text) { showToast("Please enter a task ✏️"); taskInput.focus(); return; }
 const response = await fetch(
  "http://127.0.0.1:5000/tasks",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      text: text
    })
  }
);

if (!response.ok) {
  showToast("Couldn't save task ❌");
  return;
}

await loadTasks();
  taskInput.value = ""; dueDateInput.value = "";
  taskInput.focus();
  showToast("Task added ✅");
}

// ── Theme ────────────────────────────────────────────────────
function loadTheme() {
  const dark = localStorage.getItem("theme") === "dark";
  document.body.classList.toggle("dark", dark);
  themeBtn.querySelector(".theme-icon").textContent = dark ? "☀️" : "🌙";
}

themeBtn.addEventListener("click", () => {
  const dark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  themeBtn.querySelector(".theme-icon").textContent = dark ? "☀️" : "🌙";
});

// ── Event Listeners ──────────────────────────────────────────
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", e => e.key === "Enter" && addTask());

clearBtn.addEventListener("click", () => {
  if (!tasks.length) return;
  tasks = [];  renderTasks(); showToast("All tasks cleared");
});

tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  currentFilter = tab.dataset.filter;
  renderTasks();
}));

dailyGoalInput.addEventListener("change", saveGoal);
searchInput.addEventListener("input", () => { searchText = searchInput.value; renderTasks(); });

$("saveEdit").addEventListener("click", async () => {

  const updated = editInput.value.trim();

  if (!updated) return;

  const response = await fetch(
    `http://127.0.0.1:5000/tasks/${editingTask.id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        title: updated
      })
    }
  );

  if (!response.ok) {
    showToast("Couldn't update task ❌");
    return;
  }

  await loadTasks();

  editModal.classList.add("hide");

  showToast("Task updated ✏️");

});

// ── Bottom Nav ───────────────────────────────────────────────
const pages = {
    home: $("homePage"),
    notifications: $("notificationsPage"),
    profile: $("profilePage")
};

const navBtns = document.querySelectorAll(".nav-btn");

navBtns.forEach(btn => {

    btn.addEventListener("click", () => {

        // Hide every page
        Object.values(pages).forEach(page => {
            page.classList.add("hide");
        });

        // Remove active state
        navBtns.forEach(button => {
            button.classList.remove("active");
        });

        // Show selected page
        pages[btn.dataset.page].classList.remove("hide");

      btn.classList.add("active");

        // Highlight current button
        btn.classList.add("active");

    });

});

// ── Custom Time Picker ────────────────────────────────────────
(function () {
  const picker = $("timePicker"), panel = $("timePanel");
  const hourDisp = $("timeHour"), minDisp = $("timeMinute");
  const panelHour = $("panelHour"), panelMin = $("panelMinute");
  const hidden = $("due-time");
  let h = 12, m = 0;

  const pad = n => String(n).padStart(2, "0");
  const tick = el => { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); };

  const openPanel  = () => { picker.classList.add("open"); panelHour.textContent = pad(h); panelMin.textContent = pad(m); };
  const closePanel = () => picker.classList.remove("open");

  picker.addEventListener("click", e => {
    if (e.target.classList.contains("time-set-btn") || e.target.classList.contains("time-clear-btn")) return;
    picker.classList.contains("open") ? closePanel() : openPanel();
  });

  panel.querySelectorAll(".time-arrow").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const { unit, dir } = btn.dataset;
    if (unit === "hour") { h = dir === "up" ? (h+1)%24 : (h+23)%24; panelHour.textContent = pad(h); tick(panelHour); }
    else                  { m = dir === "up" ? (m+1)%60 : (m+59)%60; panelMin.textContent  = pad(m); tick(panelMin);  }
  }));

  $("timeSetBtn").addEventListener("click", e => {
    e.stopPropagation();
    hourDisp.textContent = pad(h); minDisp.textContent = pad(m);
    hidden.value = `${pad(h)}:${pad(m)}`;
    picker.classList.add("has-time"); closePanel();
  });

  $("timeClearBtn").addEventListener("click", e => {
    e.stopPropagation();
    hourDisp.textContent = "--"; minDisp.textContent = "--";
    hidden.value = ""; h = 12; m = 0;
    picker.classList.remove("has-time"); closePanel();
  });

  document.addEventListener("click", e => { if (!picker.contains(e.target)) closePanel(); });
})();

// ── Custom Date Picker ────────────────────────────────────────
(function () {
  const picker = $("datePicker"), panel = $("datePanel");
  const dayDisp = $("dateDay"), monDisp = $("dateMonth"), yrDisp = $("dateYear");
  const panelDay = $("panelDay"), panelMon = $("panelMonth"), panelYr = $("panelYear");
  const hidden = $("dueDate");
  const now = new Date();
  let d = now.getDate(), mo = now.getMonth()+1, y = now.getFullYear();

  const pad  = n => String(n).padStart(2, "0");
  const days = (month, year) => new Date(year, month, 0).getDate();
  const tick = el => { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); };

  const openPanel  = () => { picker.classList.add("open"); panelDay.textContent = pad(d); panelMon.textContent = pad(mo); panelYr.textContent = y; };
  const closePanel = () => picker.classList.remove("open");

  picker.addEventListener("click", e => {
    if (e.target.classList.contains("time-set-btn") || e.target.classList.contains("time-clear-btn")) return;
    picker.classList.contains("open") ? closePanel() : openPanel();
  });

  panel.querySelectorAll(".time-arrow").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation();
    const { unit, dir } = btn.dataset;
    if      (unit === "day")   { const max = days(mo, y); d  = dir==="up" ? (d%max)+1 : ((d-2+max)%max)+1; panelDay.textContent = pad(d);  tick(panelDay);  }
    else if (unit === "month") {                           mo = dir==="up" ? (mo%12)+1 : ((mo-2+12)%12)+1; panelMon.textContent = pad(mo); tick(panelMon); }
    else                       {                           y  = dir==="up" ? y+1 : y-1;                     panelYr.textContent  = y;       tick(panelYr);  }
  }));

  $("dateSetBtn").addEventListener("click", e => {
    e.stopPropagation();
    dayDisp.textContent = pad(d); monDisp.textContent = pad(mo); yrDisp.textContent = y;
    hidden.value = `${y}-${pad(mo)}-${pad(d)}`;
    picker.classList.add("has-date"); closePanel();
  });

  $("dateClearBtn").addEventListener("click", e => {
    e.stopPropagation();
    dayDisp.textContent = "--"; monDisp.textContent = "--"; yrDisp.textContent = "----";
    hidden.value = ""; const n = new Date(); d = n.getDate(); mo = n.getMonth()+1; y = n.getFullYear();
    picker.classList.remove("has-date"); closePanel();
  });

  document.addEventListener("click", e => { if (!picker.contains(e.target)) closePanel(); });
})();
const logoutBtn = $("logoutBtn");

logoutBtn.addEventListener("click", () => {

    localStorage.removeItem("currentUser");

    dashboard.classList.add("hide");

    authScreen.classList.remove("hide");

    $("loginPassword").value = "";

    showToast("Logged out 👋");

});
// ── Init ─────────────────────────────────────────────────────
loadTheme();
loadGoal();
const savedUser = localStorage.getItem("currentUser");

let currentUser = null;

if (savedUser && savedUser !== "undefined") {
    currentUser = JSON.parse(savedUser);
}

if (currentUser) {

    authScreen.classList.add("hide");

    dashboard.classList.remove("hide");

    loadTasks();

}
//loadTasks();
const authScreen = $("authScreen");
const dashboard = $("dashboard");
const loginBtn = $("loginBtn");

loginBtn.addEventListener("click", async () => {

    const email = $("loginEmail").value;
    const password = $("loginPassword").value;

    const response = await fetch(
        "http://127.0.0.1:5000/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );

    const data = await response.json();

  if (response.ok) {

    console.log("LOGIN SUCCESS");

    localStorage.setItem(
        "currentUser",
        JSON.stringify(data.user)
    );

    showToast("Welcome " + data.user.username + " 🎉");

    authScreen.classList.add("hide");

    dashboard.classList.remove("hide");

    await loadTasks();

    console.log("Finished loading tasks");

  }
  else {

    showToast(data.message);

}

});
