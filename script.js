"use strict";

// ==========================================
// 1. LOAD SAVED TASKS
// ==========================================

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("tasks");
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        return Array.isArray(parsedTasks) ? parsedTasks : [];
    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const searchInput = document.getElementById("searchTask");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortSelect = document.getElementById("sortTasks");

let editingTaskId = null;

// ==========================================
// 2. SAVE TASKS TO LOCAL STORAGE
// ==========================================

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Tasks could not be saved. Please check browser storage.");
        return false;
    }
}

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

// ==========================================
// 4. ADD OR UPDATE TASK
// ==========================================

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;

    if (!title || !description || !dueDate) {
        alert("Please fill in all required fields.");
        return;
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
        alert("Please select a valid priority.");
        return;
    }

    if (dueDateInput.validity.badInput || !dueDateInput.checkValidity()) {
        alert("Please select a valid due date.");
        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(item => item.id === editingTaskId);

        if (!task) {
            alert("Task not found. Please try again.");
            resetForm();
            return;
        }

        const oldTask = { ...task };

        task.title = title;
        task.description = description;
        task.priority = priority;
        task.dueDate = dueDate;

        if (!saveTasks()) {
            Object.assign(task, oldTask);
            return;
        }
    } else {
        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            dueDate,
            createdAt: new Date().toISOString(),
            completed: false
        };

        tasks.push(task);

        if (!saveTasks()) {
            tasks.pop();
            return;
        }
    }

    resetForm();
    displayTasks();
});

function resetForm() {
    taskForm.reset();
    editingTaskId = null;

    const submitButton = taskForm.querySelector('button[type="submit"]');

    if (submitButton) {
        submitButton.textContent = "Add Task";
    }
}

// ==========================================
// 5. DISPLAY TASKS, SEARCH, FILTER AND SORT
// ==========================================

function displayTasks() {
    taskList.replaceChildren();

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedPriority = priorityFilter.value;
    const sortBy = sortSelect.value;

    let filteredTasks = tasks.filter(function (task) {
        const title = String(task.title || "");
        const description = String(task.description || "");

        const matchesSearch =
            title.toLowerCase().includes(searchText) ||
            description.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            (selectedStatus === "Pending" && !task.completed) ||
            (selectedStatus === "Completed" && task.completed);

        const matchesPriority =
            selectedPriority === "All" ||
            task.priority === selectedPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const priorityOrder = {
        High: 3,
        Medium: 2,
        Low: 1
    };

    filteredTasks.sort(function (a, b) {
        if (sortBy === "dueDate") {
            return String(a.dueDate || "").localeCompare(
                String(b.dueDate || "")
            );
        }

        if (sortBy === "priority") {
            return (
                (priorityOrder[b.priority] || 0) -
                (priorityOrder[a.priority] || 0)
            );
        }

        return String(b.createdAt || "").localeCompare(
            String(a.createdAt || "")
        );
    });

    if (filteredTasks.length === 0) {
        const emptyMessage = createElement(
            "p",
            "empty-message",
            tasks.length === 0
                ? "No tasks yet. Add your first task above!"
                : "No tasks match your search or filters."
        );

        taskList.appendChild(emptyMessage);
    }

    filteredTasks.forEach(function (task) {
        const taskCard = createElement(
            "div",
            "task-item " + String(task.priority || "").toLowerCase()
        );

        if (task.completed) {
            taskCard.classList.add("completed-task");
        }

        const isOverdue =
            !task.completed &&
            Boolean(task.dueDate) &&
            task.dueDate < getToday();

        if (isOverdue) {
            taskCard.classList.add("overdue-task");

            const overdueLabel = createElement(
                "p",
                "overdue-label",
                "Overdue"
            );

            overdueLabel.style.display = "inline-block";
            overdueLabel.style.margin = "8px 0";
            overdueLabel.style.padding = "4px 10px";
            overdueLabel.style.borderRadius = "999px";
            overdueLabel.style.backgroundColor = "#dc2626";
            overdueLabel.style.color = "#ffffff";
            overdueLabel.style.fontSize = "0.85rem";
            overdueLabel.style.fontWeight = "700";

            taskCard.appendChild(overdueLabel);

            taskCard.style.border = "2px solid #dc2626";
            taskCard.style.backgroundColor = "#fef2f2";
            taskCard.style.boxShadow =
                "0 4px 12px rgba(220, 38, 38, 0.12)";
        }

        taskCard.appendChild(
            createElement("h3", "", String(task.title || "Untitled task"))
        );

        taskCard.appendChild(
            createElement("p", "description", String(task.description || ""))
        );

        taskCard.appendChild(
            createElement(
                "p",
                "priority",
                "Priority: " + String(task.priority || "Not set")
            )
        );

        taskCard.appendChild(
            createElement(
                "p",
                "due-date",
                "Due Date: " + String(task.dueDate || "Not set")
            )
        );

        taskCard.appendChild(
            createElement(
                "p",
                "task-status",
                task.completed ? "Status: Completed" : "Status: Pending"
            )
        );

        const actions = createElement("div", "task-actions");

        // Complete / Pending
        const completeButton = createElement(
            "button",
            "complete-btn",
            task.completed ? "Mark Pending" : "Complete"
        );

        completeButton.type = "button";

        completeButton.addEventListener("click", function () {
            const previousCompleted = task.completed;
            task.completed = !task.completed;

            if (!saveTasks()) {
                task.completed = previousCompleted;
                return;
            }

            displayTasks();
        });

        // Edit
        const editButton = createElement("button", "edit-btn", "Edit");
        editButton.type = "button";

        editButton.addEventListener("click", function () {
            editingTaskId = task.id;

            titleInput.value = task.title || "";
            descriptionInput.value = task.description || "";
            priorityInput.value = task.priority || "Medium";
            dueDateInput.value = task.dueDate || "";

            const submitButton =
                taskForm.querySelector('button[type="submit"]');

            if (submitButton) {
                submitButton.textContent = "Save Changes";
            }

            taskForm.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            titleInput.focus();
        });

        // Delete
        const deleteButton = createElement(
            "button",
            "delete-btn",
            "Delete"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            const confirmed = confirm(
                `Are you sure you want to delete "${task.title}"?`
            );

            if (!confirmed) {
                return;
            }

            const oldTasks = tasks;
            tasks = tasks.filter(item => item.id !== task.id);

            if (!saveTasks()) {
                tasks = oldTasks;
                return;
            }

            if (editingTaskId === task.id) {
                resetForm();
            }

            displayTasks();
        });

        actions.append(completeButton, editButton, deleteButton);
        taskCard.appendChild(actions);
        taskList.appendChild(taskCard);
    });

    updateDashboard();
}

// ==========================================
// 6. DASHBOARD STATISTICS
// ==========================================

function updateDashboard() {
    const today = getToday();

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;

    const overdue = tasks.filter(function (task) {
        return (
            !task.completed &&
            Boolean(task.dueDate) &&
            task.dueDate < today
        );
    }).length;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("overdueTasks").textContent = overdue;
}

// ==========================================
// 7. ACTIVATE SEARCH AND FILTER CONTROLS
// ==========================================

searchInput.addEventListener("input", displayTasks);
statusFilter.addEventListener("change", displayTasks);
priorityFilter.addEventListener("change", displayTasks);
sortSelect.addEventListener("change", displayTasks);

// ==========================================
// 8. INITIALIZE THE APPLICATION
// ==========================================

displayTasks();