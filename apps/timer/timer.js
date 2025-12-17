class PomodoroApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.completedTasks = this.loadCompletedTasks();
        this.timer = null;
        this.timeRemaining = 1500; // 25 minutes in seconds
        this.isRunning = false;
        this.isWorkSession = true;
        this.sessionsCompleted = 0;
        this.currentTaskId = null;
        this.workDuration = 25 * 60; // 25 minutes
        this.breakDuration = 5 * 60; // 5 minutes
        this.longBreakDuration = 15 * 60; // 15 minutes
        this.soundEnabled = true;
        this.autoStart = false;
        this.totalFocusTime = 0;

        this.initElements();
        this.loadSettings();
        this.renderTasks();
        this.updateDisplay();
    }

    initElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerType = document.getElementById('timerType');
        this.timerTask = document.getElementById('timerTask');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.pomodoroCount = document.getElementById('pomodoroCount');
        this.focusTime = document.getElementById('focusTime');
        this.taskInput = document.getElementById('taskInput');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.tasksList = document.getElementById('tasksList');
        this.completedTasksList = document.getElementById('completedTasksList');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.soundToggle = document.getElementById('soundToggle');
        this.autoStartToggle = document.getElementById('autoStartToggle');
    }

    loadSettings() {
        const saved = localStorage.getItem('pomodoro_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.workDuration = (settings.workDuration || 25) * 60;
            this.breakDuration = (settings.breakDuration || 5) * 60;
            this.longBreakDuration = (settings.longBreakDuration || 15) * 60;
            this.soundEnabled = settings.soundEnabled !== false;
            this.autoStart = settings.autoStart || false;

            document.getElementById('workDuration').value = this.workDuration / 60;
            document.getElementById('breakDuration').value = this.breakDuration / 60;
            document.getElementById('longBreakDuration').value = this.longBreakDuration / 60;
            this.soundToggle.checked = this.soundEnabled;
            this.autoStartToggle.checked = this.autoStart;
        }

        this.timeRemaining = this.workDuration;
        this.loadDailyStats();
    }

    saveSettings() {
        const settings = {
            workDuration: this.workDuration / 60,
            breakDuration: this.breakDuration / 60,
            longBreakDuration: this.longBreakDuration / 60,
            soundEnabled: this.soundEnabled,
            autoStart: this.autoStart
        };
        localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    }

    loadDailyStats() {
        const saved = localStorage.getItem('pomodoro_today');
        if (saved) {
            const data = JSON.parse(saved);
            const today = new Date().toDateString();
            if (data.date === today) {
                this.sessionsCompleted = data.sessionsCompleted || 0;
                this.totalFocusTime = data.totalFocusTime || 0;
                this.updateStats();
                return;
            }
        }
        this.resetDailyStats();
    }

    saveDailyStats() {
        const today = new Date().toDateString();
        localStorage.setItem('pomodoro_today', JSON.stringify({
            date: today,
            sessionsCompleted: this.sessionsCompleted,
            totalFocusTime: this.totalFocusTime
        }));
    }

    resetDailyStats() {
        this.sessionsCompleted = 0;
        this.totalFocusTime = 0;
        this.saveDailyStats();
        this.updateStats();
    }

    addTask() {
        const taskName = this.taskInput.value.trim();
        if (!taskName) {
            alert('Please enter a task name!');
            return;
        }

        const task = {
            id: Date.now().toString(),
            name: taskName,
            priority: this.prioritySelect.value,
            completed: false,
            sessionsToComplete: 1,
            sessionsSpent: 0,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.prioritySelect.value = 'medium';
        this.renderTasks();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
            this.timerTask.textContent = 'No task selected';
        }
        this.saveTasks();
        this.renderTasks();
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
            this.completedTasks.unshift(task);
            this.tasks = this.tasks.filter(t => t.id !== taskId);

            if (this.currentTaskId === taskId) {
                this.currentTaskId = null;
                this.timerTask.textContent = 'No task selected';
            }

            this.saveTasks();
            this.saveCompletedTasks();
            this.renderTasks();
            this.renderCompletedTasks();
        }
    }

    selectTask(taskId) {
        this.currentTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.timerTask.textContent = task.name;
        }
        this.renderTasks();
    }

    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-block';

        this.timer = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.onSessionComplete();
            } else {
                this.updateDisplay();
            }
        }, 1000);

        this.updateDisplay();
    }

    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.pauseBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
        this.updateDisplay();
    }

    resetTimer() {
        this.pauseTimer();
        this.timeRemaining = this.isWorkSession ? this.workDuration : this.breakDuration;
        this.updateDisplay();
    }

    skipSession() {
        if (confirm('Skip this session?')) {
            this.pauseTimer();
            this.onSessionComplete();
        }
    }

    onSessionComplete() {
        this.pauseTimer();

        if (this.isWorkSession) {
            // Work session complete
            this.sessionsCompleted++;
            this.totalFocusTime += this.workDuration;
            this.saveDailyStats();

            // Update current task
            if (this.currentTaskId) {
                const task = this.tasks.find(t => t.id === this.currentTaskId);
                if (task) {
                    task.sessionsSpent++;
                    this.saveTasks();
                }
            }

            this.playNotification();
            this.showNotification('Work Session Complete!', 'Great work! Time for a break.');

            // Switch to break
            this.isWorkSession = false;
            const isLongBreak = this.sessionsCompleted % 4 === 0;
            this.timeRemaining = isLongBreak ? this.longBreakDuration : this.breakDuration;
            this.timerType.textContent = isLongBreak ? 'Long Break' : 'Break Time';
        } else {
            // Break complete
            this.playNotification();
            this.showNotification('Break Complete!', 'Ready for another work session?');

            // Switch back to work
            this.isWorkSession = true;
            this.timeRemaining = this.workDuration;
            this.timerType.textContent = 'Work Session';
        }

        this.updateDisplay();

        // Auto-start next session if enabled
        if (this.autoStart) {
            setTimeout(() => this.startTimer(), 2000);
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.isWorkSession) {
            this.timerType.textContent = 'Work Session';
            document.body.classList.remove('break-mode');
            document.body.classList.add('work-mode');
        } else {
            const isLongBreak = this.sessionsCompleted % 4 === 0;
            this.timerType.textContent = isLongBreak ? 'Long Break' : 'Break Time';
            document.body.classList.remove('work-mode');
            document.body.classList.add('break-mode');
        }

        this.updateStats();
    }

    updateStats() {
        this.pomodoroCount.textContent = this.sessionsCompleted;
        const hours = Math.floor(this.totalFocusTime / 3600);
        const minutes = Math.floor((this.totalFocusTime % 3600) / 60);
        this.focusTime.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    playNotification() {
        if (!this.soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Notification sound failed:', e);
        }
    }

    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'https://robinthomasonline.github.io/assets/pomodoro.png'
            });
        }
    }

    switchTab(tab) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        // Show selected tab
        document.getElementById(`${tab}-content`).classList.add('active');
        event.target.classList.add('active');

        if (tab === 'settings') {
            this.loadSettings();
        }
    }

    renderTasks() {
        if (this.tasks.length === 0) {
            this.tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one to get started!</div>';
            return;
        }

        // Sort by priority (high > medium > low)
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const sorted = [...this.tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        this.tasksList.innerHTML = sorted.map(task => {
            const isActive = this.currentTaskId === task.id;
            const priorityBadge = {
                high: '<span class="priority-badge high">High</span>',
                medium: '<span class="priority-badge medium">Medium</span>',
                low: '<span class="priority-badge low">Low</span>'
            }[task.priority];

            return `
                <div class="task-item ${isActive ? 'active' : ''}">
                    <div class="task-info">
                        <div class="task-header">
                            <span class="task-name">${task.name}</span>
                            ${priorityBadge}
                        </div>
                        <div class="task-meta">
                            <span class="sessions">Sessions: ${task.sessionsSpent}/${task.sessionsToComplete}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn-action ${isActive ? 'active' : ''}" onclick="pomodoroApp.selectTask('${task.id}')" title="Select task">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action" onclick="pomodoroApp.completeTask('${task.id}')" title="Complete task">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button class="btn-action delete" onclick="pomodoroApp.deleteTask('${task.id}')" title="Delete task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCompletedTasks() {
        if (this.completedTasks.length === 0) {
            this.completedTasksList.innerHTML = '<div class="empty-state">No completed tasks yet.</div>';
            this.clearCompletedBtn.style.display = 'none';
            return;
        }

        this.completedTasksList.innerHTML = this.completedTasks.map(task => {
            const completedDate = new Date(task.completedAt);
            const dateStr = completedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: completedDate.toDateString() !== new Date().toDateString() ? 'numeric' : undefined
            });

            return `
                <div class="completed-task-item">
                    <div class="task-info">
                        <span class="task-name completed">${task.name}</span>
                        <span class="completed-date">${dateStr}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-action" onclick="pomodoroApp.restoreTask('${task.id}')" title="Restore task">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn-action delete" onclick="pomodoroApp.deleteCompletedTask('${task.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.clearCompletedBtn.style.display = 'inline-block';
    }

    restoreTask(taskId) {
        const taskIndex = this.completedTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.completedTasks[taskIndex];
            delete task.completedAt;
            task.completed = false;
            this.tasks.push(task);
            this.completedTasks.splice(taskIndex, 1);
            this.saveTasks();
            this.saveCompletedTasks();
            this.renderTasks();
            this.renderCompletedTasks();
        }
    }

    deleteCompletedTask(taskId) {
        this.completedTasks = this.completedTasks.filter(t => t.id !== taskId);
        this.saveCompletedTasks();
        this.renderCompletedTasks();
    }

    clearCompleted() {
        if (confirm('Clear all completed tasks? This cannot be undone.')) {
            this.completedTasks = [];
            this.saveCompletedTasks();
            this.renderCompletedTasks();
        }
    }

    exportData() {
        const data = {
            tasks: this.tasks,
            completedTasks: this.completedTasks,
            stats: {
                sessionsCompleted: this.sessionsCompleted,
                totalFocusTime: this.totalFocusTime,
                date: new Date().toISOString()
            }
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    resetAllData() {
        if (confirm('Reset all data? This cannot be undone.')) {
            this.tasks = [];
            this.completedTasks = [];
            this.resetDailyStats();
            this.currentTaskId = null;
            this.saveTasks();
            this.saveCompletedTasks();
            this.renderTasks();
            this.renderCompletedTasks();
            this.timerTask.textContent = 'No task selected';
        }
    }

    saveTasks() {
        localStorage.setItem('pomodoro_tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('pomodoro_tasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveCompletedTasks() {
        localStorage.setItem('pomodoro_completed', JSON.stringify(this.completedTasks));
    }

    loadCompletedTasks() {
        const saved = localStorage.getItem('pomodoro_completed');
        return saved ? JSON.parse(saved) : [];
    }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Initialize app
let pomodoroApp;
document.addEventListener('DOMContentLoaded', () => {
    pomodoroApp = new PomodoroApp();
    window.pomodoroApp = pomodoroApp;

    // Add event listeners for settings
    document.getElementById('workDuration')?.addEventListener('change', (e) => {
        pomodoroApp.workDuration = parseInt(e.target.value) * 60;
        if (pomodoroApp.isWorkSession && !pomodoroApp.isRunning) {
            pomodoroApp.timeRemaining = pomodoroApp.workDuration;
            pomodoroApp.updateDisplay();
        }
        pomodoroApp.saveSettings();
    });

    document.getElementById('breakDuration')?.addEventListener('change', (e) => {
        pomodoroApp.breakDuration = parseInt(e.target.value) * 60;
        if (!pomodoroApp.isWorkSession && !pomodoroApp.isRunning) {
            pomodoroApp.timeRemaining = pomodoroApp.breakDuration;
            pomodoroApp.updateDisplay();
        }
        pomodoroApp.saveSettings();
    });

    document.getElementById('longBreakDuration')?.addEventListener('change', (e) => {
        pomodoroApp.longBreakDuration = parseInt(e.target.value) * 60;
        pomodoroApp.saveSettings();
    });

    document.getElementById('soundToggle')?.addEventListener('change', (e) => {
        pomodoroApp.soundEnabled = e.target.checked;
        pomodoroApp.saveSettings();
    });

    document.getElementById('autoStartToggle')?.addEventListener('change', (e) => {
        pomodoroApp.autoStart = e.target.checked;
        pomodoroApp.saveSettings();
    });

    // Add task on Enter key
    document.getElementById('taskInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            pomodoroApp.addTask();
        }
    });

    // Render completed tasks on load
    pomodoroApp.renderCompletedTasks();
});

// Register Service Worker
// Service Worker registration removed - PWA functionality disabled

