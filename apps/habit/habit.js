// Habit Tracker App
class HabitTracker {
    constructor() {
        this.habits = [];
        this.selectedHabitId = null;
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const habitInput = document.getElementById('habitInput');
        
        addBtn.addEventListener('click', () => this.addHabit());
        habitInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });

        document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    }

    addHabit() {
        const input = document.getElementById('habitInput');
        const frequency = document.getElementById('frequencySelect').value;
        const name = input.value.trim();

        if (!name) {
            this.showToast('Please enter a habit name', 'error');
            return;
        }

        const habit = {
            id: Date.now(),
            name,
            frequency,
            createdAt: new Date().toISOString(),
            completedDates: []
        };

        this.habits.push(habit);
        input.value = '';
        this.saveToStorage();
        this.render();
        this.showToast(`Habit "${name}" added successfully!`);
    }

    deleteHabit(id) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h.id !== id);
            if (this.selectedHabitId === id) {
                this.selectedHabitId = null;
            }
            this.saveToStorage();
            this.render();
            this.showToast('Habit deleted');
        }
    }

    toggleHabitToday(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = this.getDateString(new Date());
        const index = habit.completedDates.indexOf(today);

        if (index > -1) {
            habit.completedDates.splice(index, 1);
        } else {
            habit.completedDates.push(today);
        }

        this.saveToStorage();
        this.render();
    }

    showCalendar(id) {
        this.selectedHabitId = id;
        const habit = this.habits.find(h => h.id === id);
        
        document.getElementById('calendarCard').style.display = 'block';
        document.getElementById('habitName').textContent = habit.name;
        
        this.renderCalendar();
        document.getElementById('calendarCard').scrollIntoView({ behavior: 'smooth' });
    }

    renderCalendar() {
        const habit = this.habits.find(h => h.id === this.selectedHabitId);
        if (!habit) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('monthYear').textContent = 
            new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = this.getDateString(new Date());

        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        // Day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            header.style.fontWeight = '600';
            header.style.textAlign = 'center';
            header.style.paddingBottom = '10px';
            calendar.appendChild(header);
        });

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            calendar.appendChild(empty);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            const dateStr = this.getDateString(new Date(year, month, day));
            
            if (dateStr === today) {
                dayDiv.classList.add('today');
            }

            if (habit.completedDates.includes(dateStr)) {
                dayDiv.classList.add('completed');
            }

            calendar.appendChild(dayDiv);
        }
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    getCurrentStreak(habit) {
        if (habit.completedDates.length === 0) return 0;

        const sortedDates = habit.completedDates
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        let streak = 0;
        let expectedDate = new Date();
        expectedDate.setHours(0, 0, 0, 0);

        for (const completedDate of sortedDates) {
            if (this.isSameDay(completedDate, expectedDate)) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else if (completedDate < expectedDate) {
                break;
            }
        }

        return streak;
    }

    getLongestStreak(habit) {
        if (habit.completedDates.length === 0) return 0;

        const sortedDates = habit.completedDates
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            
            prevDate.setDate(prevDate.getDate() + 1);

            if (this.isSameDay(prevDate, currDate)) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    isCompletedToday(habit) {
        const today = this.getDateString(new Date());
        return habit.completedDates.includes(today);
    }

    isHabitToday(habit) {
        const today = new Date().getDay();
        
        if (habit.frequency === 'daily') return true;
        if (habit.frequency === 'weekdays') return today > 0 && today < 6;
        if (habit.frequency === 'weekends') return today === 0 || today === 6;
        
        return true;
    }

    getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    updateStats() {
        const today = this.getDateString(new Date());
        const completedToday = this.habits.filter(h => h.completedDates.includes(today)).length;
        
        let bestStreak = 0;
        this.habits.forEach(h => {
            const streak = this.getLongestStreak(h);
            bestStreak = Math.max(bestStreak, streak);
        });

        const totalHabits = this.habits.length;
        const completionRate = totalHabits > 0 
            ? Math.round((completedToday / totalHabits) * 100)
            : 0;

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('completedToday').textContent = completedToday;
        document.getElementById('bestStreak').textContent = bestStreak;
        document.getElementById('completionRate').textContent = completionRate + '%';
    }

    render() {
        this.renderHabits();
        this.updateStats();
    }

    renderHabits() {
        const habitsList = document.getElementById('habitsList');
        
        if (this.habits.length === 0) {
            habitsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No habits yet. Add one to get started!</p>
                </div>
            `;
            return;
        }

        habitsList.innerHTML = this.habits.map(habit => {
            const isCompletedToday = this.isCompletedToday(habit);
            const currentStreak = this.getCurrentStreak(habit);
            const isHabitToday = this.isHabitToday(habit);
            
            return `
                <div class="habit-item ${isCompletedToday ? 'completed-today' : ''}">
                    <div class="habit-main">
                        <button class="habit-checkbox ${isCompletedToday ? 'completed' : ''}" 
                                onclick="tracker.toggleHabitToday(${habit.id})"
                                title="Mark as complete for today">
                            ${isCompletedToday ? '<i class="fas fa-check"></i>' : ''}
                        </button>
                        <div class="habit-info">
                            <span class="habit-name">${this.escapeHtml(habit.name)}</span>
                            <div class="habit-details">
                                <div class="detail-item">
                                    <i class="fas fa-fire"></i>
                                    <span>${currentStreak} day streak</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-calendar"></i>
                                    <span>${habit.completedDates.length} completed</span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-repeat"></i>
                                    <span>${habit.frequency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="btn-small" onclick="tracker.showCalendar(${habit.id})" 
                                title="View calendar">
                            <i class="fas fa-calendar-alt"></i>
                        </button>
                        <button class="btn-small btn-delete" onclick="tracker.deleteHabit(${habit.id})" 
                                title="Delete habit">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    saveToStorage() {
        localStorage.setItem('habits', JSON.stringify(this.habits));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('habits');
        this.habits = stored ? JSON.parse(stored) : [];
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize
const tracker = new HabitTracker();
