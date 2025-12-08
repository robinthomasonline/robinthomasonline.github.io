// Kanban Board - State Management and DOM Manipulation
class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.currentEditId = null;
        this.draggedElement = null;
        this.dragOverElement = null;
        this.dragOverIndex = null;
        this.sortMode = 'order'; // 'order', 'priority', 'duedate'
        this.timers = {}; // Store active timers for tasks
        this.taskTimeSpent = {}; // Store total time spent on each task
        
        this.initializeElements();
        this.loadTasks();
        this.attachEventListeners();
        this.updateTaskCounts();
        this.initializeTimers();
        this.updateSortSelect();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeModal = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveTaskBtn = document.getElementById('saveTaskBtn');
        
        // Form elements
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskPriority = document.getElementById('taskPriority');
        this.taskUser = document.getElementById('taskUser');
        this.taskDueDate = document.getElementById('taskDueDate');
        
        // Button elements
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.sortSelect = document.getElementById('sortSelect');
        
        // Column lists
        this.todoList = document.getElementById('todoList');
        this.inprogressList = document.getElementById('inprogressList');
        this.doneList = document.getElementById('doneList');
        
        // Task count elements
        this.todoCount = document.getElementById('todoCount');
        this.inprogressCount = document.getElementById('inprogressCount');
        this.doneCount = document.getElementById('doneCount');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    attachEventListeners() {
        // Modal controls
        this.addTaskBtn.addEventListener('click', () => this.openAddModal());
        this.closeModal.addEventListener('click', () => this.closeModalHandler());
        this.cancelBtn.addEventListener('click', () => this.closeModalHandler());
        this.saveTaskBtn.addEventListener('click', () => this.saveTask());
        
        // Export/Import controls
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.importBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.importFromCSV(e));
        
        // Sort dropdown
        this.sortSelect.addEventListener('change', (e) => this.changeSort(e.target.value));
        
        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModalHandler();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModalHandler();
            }
        });
        
        // Setup drag and drop for all columns
        this.setupDragAndDrop();
    }

    // Generate unique ID for tasks
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Local Storage Management
    saveTasks() {
        try {
            localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showToast('Error saving tasks to local storage', 'error');
        }
    }

    loadTasks() {
        try {
            const savedTasks = localStorage.getItem('kanbanTasks');
            if (savedTasks) {
                this.tasks = JSON.parse(savedTasks);
                // Ensure backward compatibility - add missing fields
                this.tasks = this.tasks.map(task => ({
                    ...task,
                    user: task.user || '',
                    dueDate: task.dueDate || null,
                    timeSpent: task.timeSpent || 0, // Total time in seconds
                    order: task.order !== undefined ? task.order : this.tasks.indexOf(task)
                }));
                this.renderTasks();
            }
            
            // Load saved time spent
            const savedTimeSpent = localStorage.getItem('kanbanTimeSpent');
            if (savedTimeSpent) {
                this.taskTimeSpent = JSON.parse(savedTimeSpent);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }
    
    saveTimeSpent() {
        try {
            localStorage.setItem('kanbanTimeSpent', JSON.stringify(this.taskTimeSpent));
        } catch (error) {
            console.error('Error saving time spent:', error);
        }
    }
    
    initializeTimers() {
        // Start timers for tasks that are in progress
        this.tasks.forEach(task => {
            if (task.status === 'inprogress' && !this.timers[task.id]) {
                // Resume timer from last duration
                this.startTimer(task.id);
            }
        });
    }

    // Task Management
    addTask(title, description, priority, user, dueDate) {
        if (!title.trim()) {
            this.showToast('Task title is required', 'error');
            return;
        }

        const maxOrder = this.tasks.length > 0 
            ? Math.max(...this.tasks.map(t => t.order || 0))
            : -1;

        const task = {
            id: this.generateId(),
            title: title.trim(),
            description: description.trim(),
            priority: priority || 'medium',
            user: user ? user.trim() : '',
            dueDate: dueDate || null,
            status: 'todo',
            createdAt: new Date().toISOString(),
            timeSpent: 0,
            order: maxOrder + 1
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounts();
        this.showToast('Task added successfully!');
    }

    updateTask(id, title, description, priority, user, dueDate) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.title = title.trim();
        task.description = description.trim();
        task.priority = priority || 'medium';
        task.user = user ? user.trim() : '';
        task.dueDate = dueDate || null;

        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounts();
        this.showToast('Task updated successfully!');
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            // Stop timer if running
            if (this.timers[id]) {
                this.stopTimer(id);
            }
            
            // Remove from time spent tracking
            delete this.taskTimeSpent[id];
            this.saveTimeSpent();
            
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
            this.showToast('Task deleted successfully!');
        }
    }

    moveTask(taskId, newStatus, newOrder = null) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const oldStatus = task.status;
        
        // Handle timer based on status change
        if (oldStatus === 'inprogress' && newStatus !== 'inprogress') {
            // Moving out of in progress
            if (newStatus === 'done') {
                // Moving to done - stop timer and save time
                this.stopTimer(taskId);
            } else {
                // Moving to todo/new - pause timer (save current time but keep it ready to resume)
                this.pauseTimer(taskId);
            }
        }
        
        if (newStatus === 'inprogress' && oldStatus !== 'inprogress') {
            // Moving into in progress - start/resume timer
            this.startTimer(taskId);
        }
        
        task.status = newStatus;
        
        // Update order if provided
        if (newOrder !== null) {
            task.order = newOrder;
        }
        
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounts();
    }
    
    reorderTask(taskId, newIndex, status) {
        const tasksInColumn = this.tasks
            .filter(t => t.status === status)
            .sort((a, b) => {
                if (this.sortMode === 'priority') {
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                } else if (this.sortMode === 'duedate') {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    return dateA - dateB;
                }
                return (a.order || 0) - (b.order || 0);
            });
        
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        // Remove task from its current position
        tasksInColumn.splice(tasksInColumn.findIndex(t => t.id === taskId), 1);
        
        // Insert at new position
        tasksInColumn.splice(newIndex, 0, task);
        
        // Update order values
        tasksInColumn.forEach((t, index) => {
            t.order = index;
        });
        
        this.saveTasks();
        this.renderTasks();
    }

    // DOM Rendering
    renderTasks() {
        // Clear all lists
        this.todoList.innerHTML = '';
        this.inprogressList.innerHTML = '';
        this.doneList.innerHTML = '';

        // Group tasks by status
        const tasksByStatus = {
            todo: this.tasks.filter(t => t.status === 'todo'),
            inprogress: this.tasks.filter(t => t.status === 'inprogress'),
            done: this.tasks.filter(t => t.status === 'done')
        };

        // Render tasks in each column
        Object.keys(tasksByStatus).forEach(status => {
            const list = this.getListByStatus(status);
            let tasks = tasksByStatus[status];

            // Sort tasks
            if (this.sortMode === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                tasks = tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            } else if (this.sortMode === 'duedate') {
                tasks = tasks.sort((a, b) => {
                    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    // Tasks without due dates go to the end
                    if (!a.dueDate && !b.dueDate) {
                        return (a.order || 0) - (b.order || 0);
                    }
                    return dateA - dateB;
                });
            } else {
                // Sort by order (default)
                tasks = tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
            }

            if (tasks.length === 0) {
                list.innerHTML = this.createEmptyState(status);
            } else {
                tasks.forEach(task => {
                    list.appendChild(this.createTaskElement(task));
                });
            }
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.status = task.status;

        const formattedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const dueDateFormatted = task.dueDate 
            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
            : null;
        
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
        
        const timeSpent = this.getTimeSpent(task.id);
        const timeDisplay = this.formatTime(timeSpent);

        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-actions">
                    <button class="task-action-btn edit" data-action="edit" data-id="${task.id}" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" data-action="delete" data-id="${task.id}" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            ${task.user ? `<div class="task-user"><i class="fas fa-user"></i> ${this.escapeHtml(task.user)}</div>` : ''}
            ${dueDateFormatted ? `<div class="task-due-date ${isOverdue ? 'overdue' : ''}"><i class="fas fa-calendar${isOverdue ? '-times' : ''}"></i> Due: ${dueDateFormatted}</div>` : ''}
            <div class="task-footer">
                <div class="task-footer-left">
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                    ${task.status === 'inprogress' ? `<span class="task-timer-inline"><i class="fas fa-clock"></i> <span class="timer-display" data-task-id="${task.id}">${timeDisplay}</span></span>` : ''}
                    ${timeSpent > 0 && task.status !== 'inprogress' ? `<span class="task-time-spent-inline"><i class="fas fa-hourglass-half"></i> ${timeDisplay}</span>` : ''}
                </div>
                <span class="task-date">${formattedDate}</span>
            </div>
        `;
        
        // Update timer display if task is in progress
        if (task.status === 'inprogress') {
            this.updateTimerDisplay(task.id);
        }

        // Attach event listeners
        const editBtn = taskElement.querySelector('[data-action="edit"]');
        const deleteBtn = taskElement.querySelector('[data-action="delete"]');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditModal(task.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });

        return taskElement;
    }

    createEmptyState(status) {
        const messages = {
            todo: 'No tasks to do',
            inprogress: 'No tasks in progress',
            done: 'No completed tasks'
        };

        const icons = {
            todo: 'fa-clipboard-list',
            inprogress: 'fa-spinner',
            done: 'fa-check-circle'
        };

        return `
            <div class="empty-column">
                <i class="fas ${icons[status]}"></i>
                <p>${messages[status]}</p>
            </div>
        `;
    }

    getListByStatus(status) {
        const statusMap = {
            todo: this.todoList,
            inprogress: this.inprogressList,
            done: this.doneList
        };
        return statusMap[status] || this.todoList;
    }

    updateTaskCounts() {
        const counts = {
            todo: this.tasks.filter(t => t.status === 'todo').length,
            inprogress: this.tasks.filter(t => t.status === 'inprogress').length,
            done: this.tasks.filter(t => t.status === 'done').length
        };

        this.todoCount.textContent = counts.todo;
        this.inprogressCount.textContent = counts.inprogress;
        this.doneCount.textContent = counts.done;
    }

    // Modal Management
    openAddModal() {
        this.currentEditId = null;
        this.modalTitle.textContent = 'Add Task';
        this.taskTitle.value = '';
        this.taskDescription.value = '';
        this.taskPriority.value = 'medium';
        this.taskUser.value = '';
        this.taskDueDate.value = '';
        this.modal.classList.add('show');
        this.taskTitle.focus();
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditId = taskId;
        this.modalTitle.textContent = 'Edit Task';
        this.taskTitle.value = task.title;
        this.taskDescription.value = task.description || '';
        this.taskPriority.value = task.priority;
        this.taskUser.value = task.user || '';
        this.taskDueDate.value = task.dueDate || '';
        this.modal.classList.add('show');
        this.taskTitle.focus();
    }

    closeModalHandler() {
        this.modal.classList.remove('show');
        this.currentEditId = null;
        // Reset form
        this.taskTitle.value = '';
        this.taskDescription.value = '';
        this.taskPriority.value = 'medium';
        this.taskUser.value = '';
        this.taskDueDate.value = '';
    }

    saveTask() {
        const title = this.taskTitle.value;
        const description = this.taskDescription.value;
        const priority = this.taskPriority.value;
        const user = this.taskUser.value;
        const dueDate = this.taskDueDate.value;

        if (!title.trim()) {
            this.showToast('Task title is required', 'error');
            return;
        }

        if (this.currentEditId) {
            this.updateTask(this.currentEditId, title, description, priority, user, dueDate);
        } else {
            this.addTask(title, description, priority, user, dueDate);
        }

        this.closeModalHandler();
    }

    // Drag and Drop Implementation
    setupDragAndDrop() {
        const columns = [this.todoList, this.inprogressList, this.doneList];

        columns.forEach(column => {
            // Allow drop
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const taskItem = e.target.closest('.task-item');
                const columnRect = column.getBoundingClientRect();
                const mouseY = e.clientY;
                
                if (this.draggedElement) {
                    const taskId = this.draggedElement.dataset.taskId;
                    const currentStatus = this.draggedElement.dataset.status;
                    const newStatus = column.dataset.status;
                    
                    // If dragging within same column, handle reordering
                    if (currentStatus === newStatus) {
                        const tasks = Array.from(column.querySelectorAll('.task-item:not(.dragging)'));
                        let insertIndex = tasks.length;
                        
                        for (let i = 0; i < tasks.length; i++) {
                            const taskRect = tasks[i].getBoundingClientRect();
                            const taskMiddle = taskRect.top + taskRect.height / 2;
                            
                            if (mouseY < taskMiddle) {
                                insertIndex = i;
                                break;
                            }
                        }
                        
                        // Visual feedback
                        tasks.forEach((t, index) => {
                            t.classList.remove('drag-over');
                            if (index === insertIndex) {
                                t.classList.add('drag-over');
                            }
                        });
                        
                        this.dragOverIndex = insertIndex;
                    } else {
                        // Different column - highlight the column
                        if (taskItem && taskItem !== this.draggedElement) {
                            taskItem.classList.add('drag-over');
                            this.dragOverElement = taskItem;
                        }
                    }
                }
            });

            column.addEventListener('dragleave', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    taskItem.classList.remove('drag-over');
                }
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                
                // Remove all drag-over classes
                document.querySelectorAll('.task-item').forEach(item => {
                    item.classList.remove('drag-over');
                });

                if (this.draggedElement) {
                    const taskId = this.draggedElement.dataset.taskId;
                    const oldStatus = this.draggedElement.dataset.status;
                    const newStatus = column.dataset.status;
                    
                    // If same column, reorder
                    if (oldStatus === newStatus && this.dragOverIndex !== null) {
                        this.reorderTask(taskId, this.dragOverIndex, newStatus);
                    } else {
                        // Different column - move task
                        this.moveTask(taskId, newStatus);
                    }
                    
                    this.draggedElement.classList.remove('dragging');
                    this.draggedElement = null;
                    this.dragOverIndex = null;
                }
            });

            // Handle task item drag events
            column.addEventListener('dragstart', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (taskItem && !e.target.closest('.task-actions')) {
                    this.draggedElement = taskItem;
                    taskItem.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', taskItem.outerHTML);
                }
            });

            column.addEventListener('dragend', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (taskItem) {
                    taskItem.classList.remove('dragging');
                    // Remove drag-over from all items
                    document.querySelectorAll('.task-item').forEach(item => {
                        item.classList.remove('drag-over');
                    });
                }
                this.draggedElement = null;
                this.dragOverIndex = null;
            });
        });
    }
    
    // Timer Functions
    startTimer(taskId) {
        if (this.timers[taskId]) {
            // Timer already running
            return;
        }
        
        const startTime = Date.now();
        this.timers[taskId] = {
            startTime: startTime,
            interval: setInterval(() => {
                this.updateTimerDisplay(taskId);
            }, 1000)
        };
    }
    
    pauseTimer(taskId) {
        if (!this.timers[taskId]) {
            return;
        }
        
        const timer = this.timers[taskId];
        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        
        // Add to total time spent
        if (!this.taskTimeSpent[taskId]) {
            this.taskTimeSpent[taskId] = 0;
        }
        this.taskTimeSpent[taskId] += elapsed;
        
        // Update task object
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.timeSpent = this.taskTimeSpent[taskId];
        }
        
        // Clear interval but keep the accumulated time
        clearInterval(timer.interval);
        delete this.timers[taskId];
        
        this.saveTasks();
        this.saveTimeSpent();
    }
    
    stopTimer(taskId) {
        // Stop timer and save time (used when moving to Done)
        this.pauseTimer(taskId);
    }
    
    getTimeSpent(taskId) {
        let total = this.taskTimeSpent[taskId] || 0;
        
        // Add current timer time if running
        if (this.timers[taskId]) {
            const elapsed = Math.floor((Date.now() - this.timers[taskId].startTime) / 1000);
            total += elapsed;
        }
        
        return total;
    }
    
    updateTimerDisplay(taskId) {
        const display = document.querySelector(`.timer-display[data-task-id="${taskId}"]`);
        if (display) {
            const timeSpent = this.getTimeSpent(taskId);
            display.textContent = this.formatTime(timeSpent);
        }
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    // Sort Change
    changeSort(mode) {
        this.sortMode = mode;
        this.updateSortSelect();
        this.renderTasks();
    }
    
    updateSortSelect() {
        if (this.sortSelect) {
            this.sortSelect.value = this.sortMode;
        }
    }

    // Utility Functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        const icon = this.toast.querySelector('i');
        
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
            icon.style.color = 'var(--danger-color)';
        } else {
            icon.className = 'fas fa-check-circle';
            icon.style.color = 'var(--success-color)';
        }

        this.toast.classList.add('show');
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }

    // CSV Export/Import
    exportToCSV() {
        if (this.tasks.length === 0) {
            this.showToast('No tasks to export', 'error');
            return;
        }

        // CSV Headers
        const headers = ['Title', 'Description', 'Priority', 'Status', 'Assigned To', 'Due Date', 'Time Spent (seconds)', 'Created At'];
        
        // Convert tasks to CSV rows
        const rows = this.tasks.map(task => {
            const timeSpent = this.getTimeSpent(task.id);
            return [
                this.escapeCsvField(task.title),
                this.escapeCsvField(task.description || ''),
                task.priority,
                task.status,
                this.escapeCsvField(task.user || ''),
                task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
                timeSpent,
                new Date(task.createdAt).toLocaleString()
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `kanban-tasks-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Tasks exported successfully!');
    }

    importFromCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length < 2) {
                    this.showToast('CSV file is empty or invalid', 'error');
                    return;
                }

                // Parse CSV (simple parser - handles basic cases)
                const headers = lines[0].split(',').map(h => h.trim());
                const importedTasks = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = this.parseCSVLine(lines[i]);
                    if (values.length < headers.length) continue;

                    const task = {
                        id: this.generateId(),
                        title: this.unescapeCsvField(values[0] || ''),
                        description: this.unescapeCsvField(values[1] || ''),
                        priority: values[2] || 'medium',
                        status: values[3] || 'todo',
                        user: this.unescapeCsvField(values[4] || ''),
                        dueDate: values[5] ? new Date(values[5]).toISOString().split('T')[0] : null,
                        timeSpent: parseInt(values[6]) || 0,
                        createdAt: values[7] ? new Date(values[7]).toISOString() : new Date().toISOString(),
                        order: importedTasks.length
                    };
                    
                    // Store time spent
                    if (task.timeSpent > 0) {
                        this.taskTimeSpent[task.id] = task.timeSpent;
                    }

                    // Validate task
                    if (task.title && ['todo', 'inprogress', 'done'].includes(task.status) && 
                        ['low', 'medium', 'high'].includes(task.priority)) {
                        importedTasks.push(task);
                    }
                }

                if (importedTasks.length === 0) {
                    this.showToast('No valid tasks found in CSV file', 'error');
                    return;
                }

                // Ask user if they want to replace or merge
                const action = confirm(
                    `Found ${importedTasks.length} task(s). Click OK to replace all tasks, or Cancel to merge with existing tasks.`
                );

                if (action) {
                    this.tasks = importedTasks;
                } else {
                    this.tasks = [...this.tasks, ...importedTasks];
                }

                this.saveTasks();
                this.saveTimeSpent();
                this.renderTasks();
                this.updateTaskCounts();
                this.initializeTimers();
                this.showToast(`Successfully imported ${importedTasks.length} task(s)!`);

            } catch (error) {
                console.error('Error importing CSV:', error);
                this.showToast('Error importing CSV file. Please check the format.', 'error');
            }
        };

        reader.onerror = () => {
            this.showToast('Error reading file', 'error');
        };

        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    escapeCsvField(field) {
        if (!field) return '';
        const stringField = String(field);
        // If field contains comma, newline, or quote, wrap in quotes and escape quotes
        if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    }

    unescapeCsvField(field) {
        if (!field) return '';
        // Remove surrounding quotes if present
        if (field.startsWith('"') && field.endsWith('"')) {
            return field.slice(1, -1).replace(/""/g, '"');
        }
        return field;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }
}

// Initialize the Kanban Board when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KanbanBoard();
});

