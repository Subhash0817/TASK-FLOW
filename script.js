let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";
let editingTask = null;
let searchText = ""; 

const themeBtn = document.getElementById("themeBtn");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const taskCount = document.getElementById("taskCount");
const completedCount = document.getElementById("completedCount");
const streakCount = document.getElementById("streakCount");
const addBtn = document.getElementById("addBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const clearBtn = document.getElementById("clearBtn");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
const tabs = document.querySelectorAll(".tab");
const dailyGoalInput = document.getElementById("dailyGoal");
const searchInput = document.getElementById("searchInput");
const searchEmpty = document.getElementById("searchEmpty");
const editModal = document.getElementById("editModal");
const editInput = document.getElementById("editInput");
const saveEdit = document.getElementById("saveEdit");
const cancelEdit = document.getElementById("cancelEdit");
const categoryInput = document.getElementById("category");

function saveGoal() {
  localStorage.setItem(
    "dailyGoal",
    dailyGoalInput.value
  );
}
function saveStreak(value) {
  localStorage.setItem("streak", value);
}

function loadStreak() {
  return Number(
    localStorage.getItem("streak")
  ) || 0;
}
function getToday() {
  return new Date().toISOString().split("T")[0];
}

function checkStreak() {
  const goal = Number(dailyGoalInput.value);

  const completed = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const today = getToday();

  const lastStreakDate =
    localStorage.getItem("lastStreakDate");

  if (completed < goal) {
    streakCount.textContent = loadStreak();
    return;
  }

  if (lastStreakDate === today) {
    streakCount.textContent = loadStreak();
    return;
  }

  let newStreak = 1;

  if (lastStreakDate) {
    const lastDate = new Date(lastStreakDate);
    const currentDate = new Date(today);

    const differenceInDays =
      Math.floor(
        (currentDate - lastDate) /
        (1000 * 60 * 60 * 24)
      );

    if (differenceInDays === 1) {
      newStreak = loadStreak() + 1;
    }
  }

  saveStreak(newStreak);

  localStorage.setItem(
    "lastStreakDate",
    today
  );

  streakCount.textContent = newStreak;

  showToast(
    `🔥 Streak: ${newStreak}`
  );
}
function loadGoal() {
  const savedGoal =
    localStorage.getItem("dailyGoal");

  if (savedGoal) {
    dailyGoalInput.value = savedGoal;
  }
}
function loadStats() {
  streakCount.textContent = loadStreak();
}
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
}

function formatDate(dateValue) {
  if (!dateValue) return "No due date";

  const date = new Date(dateValue + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getFilteredTasks() {

  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = filteredTasks.filter(
      function (task) {
        return !task.completed;
      }
    );
  }

  if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter(
      function (task) {
        return task.completed;
      }
    );
  }

  if (searchText !== "") {
    filteredTasks = filteredTasks.filter(
      function (task) {
        return task.text
          .toLowerCase()
          .includes(searchText.toLowerCase());
      }
    );
  }

  return filteredTasks;
}
function updateStats() {
  const total = tasks.length;

  const completed = tasks.filter(function (task) {
    return task.completed;
  }).length;
const goal = Number(dailyGoalInput.value);
streakCount.textContent = loadStreak();
  const progress = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  taskCount.textContent = total;
  completedCount.textContent = completed;

  progressText.textContent = progress + "%";
  progressBar.style.width = progress + "%";
  
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-card";

  if (task.completed) {
    li.classList.add("completed");
  }

  li.innerHTML = `
    <label class="check-wrap">
      <input type="checkbox" ${task.completed ? "checked" : ""} />
      <span class="custom-check"></span>
    </label>

    <div class="task-content">
      <p class="task-title"></p>
      <div class="task-meta">

    <span class="category-pill ${task.category}">
    ${task.category}
  </span>

  <span class="priority-pill ${task.priority}">
    ${task.priority}
  </span>

  <span class="due-date">
    ${formatDate(task.dueDate)}
  </span>

</div>
    </div>

   <div class="task-actions">
  <button class="edit-btn" type="button">✏️</button>
  <button class="delete-btn" type="button">🗑️</button>
</div>
  `;

  const taskTitle =
  li.querySelector(".task-title");

if (searchText !== "") {

  const regex = new RegExp(
    `(${searchText})`,
    "gi"
  );

  taskTitle.innerHTML =
    task.text.replace(
      regex,
      '<span class="highlight">$1</span>'
    );

} else {

  taskTitle.textContent = task.text;

}

  const checkbox = li.querySelector("input");
  const deleteBtn = li.querySelector(".delete-btn");
  const editBtn = li.querySelector(".edit-btn");

checkbox.addEventListener("change", function () {
  task.completed = checkbox.checked;

  saveTasks();

  if (task.completed) {
    checkStreak();
  }

  renderTasks();

  showToast(
    task.completed
      ? "Task completed"
      : "Task marked active"
  );
});
editBtn.addEventListener(
  "click",
  function () {

    editingTask = task;

    editInput.value = task.text;

    editModal.classList.remove(
      "hide"
    );

    editInput.focus();
  }
);
  deleteBtn.addEventListener("click", function () {
    tasks = tasks.filter(function (item) {
      return item.id !== task.id;
    });

    saveTasks();
    renderTasks();
    showToast("Task deleted");
  });

  return li;
}

function renderTasks() {
  taskList.innerHTML = "";

  const filteredTasks = getFilteredTasks();
  if (
  filteredTasks.length === 0 &&
  searchText !== ""
) {
  searchEmpty.classList.remove("hide");
} else {
  searchEmpty.classList.add("hide");
}

  filteredTasks.forEach(function (task) {
    taskList.appendChild(createTaskElement(task));
  });

  emptyState.classList.toggle("hide", filteredTasks.length !== 0);
  clearBtn.disabled = tasks.length === 0;
  updateStats();
}

function addTask() {
  const taskText = taskInput.value.trim();

  if (taskText === "") {
    showToast("Please enter a task");
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    text: taskText,
    priority: priorityInput.value,
    category: categoryInput.value,
    dueDate: dueDateInput.value,
    completed: false
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();

  taskInput.value = "";
  dueDateInput.value = "";
  taskInput.focus();
  showToast("Task added");
}

addBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTask();
  }
});

clearBtn.addEventListener("click", function () {
  if (tasks.length === 0) return;

  tasks = [];
  saveTasks();
  renderTasks();
  showToast("All tasks cleared");
});

tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    tabs.forEach(function (item) {
      item.classList.remove("active");
    });

    tab.classList.add("active");
    currentFilter = tab.dataset.filter;
    renderTasks();
  });
});

themeBtn.addEventListener("click", function () {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");

  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeBtn.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
});

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeBtn.querySelector(".theme-icon").textContent = "☀️";
  }
}
dailyGoalInput.addEventListener(
  "change",
  saveGoal
);

searchInput.addEventListener(
  "input",
  function () {

    searchText = searchInput.value;

    renderTasks();
  }
);

saveEdit.addEventListener(
  "click",
  function () {

    const updatedText =
      editInput.value.trim();

    if (updatedText === "") {
      return;
    }

    editingTask.text =
      updatedText;

    saveTasks();
    renderTasks();

    editModal.classList.add(
      "hide"
    );

    showToast(
      "Task updated"
    );
  }
);
cancelEdit.addEventListener(
  "click",
  function () {

    editModal.classList.add(
      "hide"
    );
  }
);

loadTheme();
loadGoal();
loadStats();
renderTasks();
streakCount.textContent =
  loadStreak() + " Day" +
  (loadStreak() !== 1 ? "s" : "");