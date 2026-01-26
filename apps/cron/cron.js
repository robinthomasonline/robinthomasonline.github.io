class CronApp {
    constructor() {
        this.templates = [
            {
                title: "Every Minute",
                description: "Runs a command every minute. Use with caution as it can be resource-intensive.",
                cron: "* * * * * /usr/bin/command.sh",
                complexity: "low"
            },
            {
                title: "Daily Backup at Midnight",
                description: "Runs a backup script every day at midnight (00:00). Perfect for daily maintenance tasks.",
                cron: "0 0 * * * /usr/bin/backup.sh",
                complexity: "low"
            },
            {
                title: "Every 5 Minutes",
                description: "Executes a command every 5 minutes. Useful for monitoring scripts or health checks.",
                cron: "*/5 * * * * /usr/bin/monitor.sh",
                complexity: "low"
            },
            {
                title: "Weekday Work Hours",
                description: "Runs during business hours (9 AM to 5 PM) on weekdays only (Monday to Friday).",
                cron: "0 9-17 * * 1-5 /usr/bin/business-task.sh",
                complexity: "medium"
            },
            {
                title: "First Day of Month",
                description: "Executes on the 1st day of every month at 2 AM. Ideal for monthly reports or billing.",
                cron: "0 2 1 * * /usr/bin/monthly-report.sh",
                complexity: "low"
            },
            {
                title: "Every 15 Minutes During Day",
                description: "Runs every 15 minutes but only between 8 AM and 8 PM. Good for frequent checks during active hours.",
                cron: "*/15 8-20 * * * /usr/bin/frequent-check.sh",
                complexity: "medium"
            },
            {
                title: "Weekend Maintenance",
                description: "Runs on Saturday and Sunday at 3 AM. Perfect for weekend maintenance windows.",
                cron: "0 3 * * 0,6 /usr/bin/weekend-maintenance.sh",
                complexity: "medium"
            },
            {
                title: "Complex Business Schedule",
                description: "Runs at 9:30 AM and 4:30 PM on weekdays. Uses comma-separated hours for multiple time slots in a single entry.",
                cron: "30 9,16 * * 1-5 /usr/bin/business.sh",
                complexity: "high"
            },
            {
                title: "Quarterly Reports",
                description: "Executes on the first day of each quarter (Jan, Apr, Jul, Oct) at 6 AM. For quarterly processing.",
                cron: "0 6 1 1,4,7,10 * /usr/bin/quarterly-report.sh",
                complexity: "high"
            },
            {
                title: "Advanced Multi-Pattern",
                description: "Complex schedule: Every 10 minutes during business hours (9 AM-5 PM) on weekdays. Combines step values with ranges.",
                cron: "*/10 9-17 * * 1-5 /usr/bin/weekday-task.sh",
                complexity: "extreme"
            }
        ];
        
        this.init();
    }

    init() {
        this.renderTemplates();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Enter key support for inputs
        document.querySelectorAll('.cron-input, .cron-textarea').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    if (input.id === 'parse-input') {
                        this.parseCron();
                    } else {
                        this.generateCron();
                    }
                }
            });
        });

        // Close quick select panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-select-panel') && !e.target.closest('.btn-quick-select')) {
                document.querySelectorAll('.quick-select-panel').forEach(panel => {
                    panel.style.display = 'none';
                });
            }
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-content`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    showQuickSelect(field) {
        const panel = document.getElementById(`${field}-quick-select`);
        const isVisible = panel.style.display !== 'none';
        
        // Hide all panels first
        document.querySelectorAll('.quick-select-panel').forEach(p => {
            p.style.display = 'none';
        });

        // Toggle current panel
        if (!isVisible) {
            panel.style.display = 'block';
        }
    }

    applyQuickSelect(field) {
        const panel = document.getElementById(`${field}-quick-select`);
        if (!panel) return;
        
        const checkboxes = panel.querySelectorAll('input[type="checkbox"]:checked');
        const values = Array.from(checkboxes).map(cb => cb.value);
        
        if (values.length > 0) {
            const input = document.getElementById(field);
            if (input) {
                input.value = values.join(',');
            }
        }
        
        panel.style.display = 'none';
        
        // Uncheck all checkboxes after applying
        checkboxes.forEach(cb => cb.checked = false);
    }

    generateCron() {
        const minute = document.getElementById('minute')?.value.trim() || '*';
        const hour = document.getElementById('hour')?.value.trim() || '*';
        const day = document.getElementById('day')?.value.trim() || '*';
        const month = document.getElementById('month')?.value.trim() || '*';
        const weekday = document.getElementById('weekday')?.value.trim() || '*';
        const command = document.getElementById('command')?.value.trim();

        if (!command) {
            alert('Please enter a command');
            return;
        }

        const cronEntry = `${minute} ${hour} ${day} ${month} ${weekday} ${command}`;
        
        const outputElement = document.getElementById('cron-output');
        const outputSection = document.getElementById('output-section');
        
        if (outputElement && outputSection) {
            outputElement.textContent = cronEntry;
            outputSection.style.display = 'block';
            
            // Scroll to output
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const text = element.textContent || element.innerText;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                const btn = element.nextElementSibling || element.parentElement.querySelector('.btn-copy');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.classList.add('copied');
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    
                    setTimeout(() => {
                        btn.classList.remove('copied');
                        btn.innerHTML = originalText;
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('Copied to clipboard!');
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Failed to copy to clipboard. Please copy manually.');
        }
        document.body.removeChild(textArea);
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = '';

        this.templates.forEach((template, index) => {
            const card = document.createElement('div');
            card.className = 'template-card';
            
            card.innerHTML = `
                <div class="template-header">
                    <div>
                        <div class="template-title">${template.title}</div>
                        <span class="template-complexity complexity-${template.complexity}">${template.complexity}</span>
                    </div>
                </div>
                <div class="template-description">${template.description}</div>
                <div class="template-cron">${template.cron}</div>
                <div class="template-actions">
                    <button class="template-btn" onclick="cronApp.copyTemplate(${index})">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    copyTemplate(index) {
        const template = this.templates[index];
        const buttons = document.querySelectorAll('.template-btn');
        const button = buttons[index];
        
        navigator.clipboard.writeText(template.cron).then(() => {
            const originalText = button.innerHTML;
            button.classList.add('copied');
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
    }

    parseCron() {
        let input = document.getElementById('parse-input').value.trim();
        
        if (!input) {
            alert('Please enter a crontab entry to parse');
            return;
        }

        // Remove comments (lines starting with #)
        if (input.includes('#')) {
            input = input.split('#')[0].trim();
        }

        // Split the input into parts (handle multiple spaces)
        const parts = input.split(/\s+/).filter(part => part.length > 0);
        
        if (parts.length < 6) {
            document.getElementById('parse-explanation').innerHTML = `
                <div class="explanation-item">
                    <span class="explanation-label">Error</span>
                    <div class="explanation-text">
                        Invalid crontab format. Expected format: <strong>minute hour day month weekday command</strong><br>
                        Found ${parts.length} parts. A valid crontab entry needs at least 6 parts (5 time fields + command).
                    </div>
                </div>
            `;
            document.getElementById('parse-output').style.display = 'block';
            return;
        }

        const minute = parts[0];
        const hour = parts[1];
        const day = parts[2];
        const month = parts[3];
        const weekday = parts[4];
        const command = parts.slice(5).join(' ');

        const explanation = this.explainCronField(minute, 'minute', 0, 59) +
                          this.explainCronField(hour, 'hour', 0, 23) +
                          this.explainCronField(day, 'day of month', 1, 31) +
                          this.explainCronField(month, 'month', 1, 12) +
                          this.explainCronField(weekday, 'day of week', 0, 7) +
                          `<div class="explanation-item">
                                <span class="explanation-label">Command</span>
                                <div class="explanation-text">
                                    Executes: <strong>${command}</strong>
                                </div>
                            </div>`;

        document.getElementById('parse-explanation').innerHTML = explanation;
        document.getElementById('parse-output').style.display = 'block';
        
        // Scroll to output
        document.getElementById('parse-output').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    explainCronField(value, fieldName, min, max) {
        let explanation = '';

        if (value === '*') {
            explanation = `Every ${fieldName}`;
        } else if (value.includes('/')) {
            // Step values (e.g., */5, 0-30/5)
            const parts = value.split('/');
            const range = parts[0];
            const step = parts[1];
            
            if (range === '*') {
                explanation = `Every ${step} ${fieldName}s`;
            } else if (range.includes('-')) {
                const [start, end] = range.split('-');
                explanation = `Every ${step} ${fieldName}s from ${start} to ${end}`;
            } else {
                explanation = `Every ${step} ${fieldName}s starting at ${range}`;
            }
        } else if (value.includes('-')) {
            // Range (e.g., 9-17)
            const [start, end] = value.split('-');
            explanation = `From ${start} to ${end} (${fieldName})`;
        } else if (value.includes(',')) {
            // List (e.g., 1,3,5)
            const values = value.split(',');
            explanation = `On ${values.join(', ')} (${fieldName})`;
        } else {
            // Single value
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
                if (fieldName === 'month') {
                    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                                   'July', 'August', 'September', 'October', 'November', 'December'];
                    explanation = `${months[numValue] || value} (${fieldName})`;
                } else if (fieldName === 'day of week') {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    explanation = `${days[numValue] || value} (${fieldName})`;
                } else {
                    explanation = `At ${value} (${fieldName})`;
                }
            } else {
                explanation = `At ${value} (${fieldName})`;
            }
        }

        // Special handling for day of week
        if (fieldName === 'day of week') {
            if (value === '0' || value === '7') {
                explanation = 'Sunday (day of week)';
            }
        }

        return `
            <div class="explanation-item">
                <span class="explanation-label">${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} (${value})</span>
                <div class="explanation-text">
                    ${explanation}
                </div>
            </div>
        `;
    }
}

// Initialize app
const cronApp = new CronApp();
