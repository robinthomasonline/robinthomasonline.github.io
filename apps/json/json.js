// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const jsonOutput = document.getElementById('jsonOutput');
const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const validateBtn = document.getElementById('validateBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const indentSize = document.getElementById('indentSize');
const inputStatus = document.getElementById('inputStatus');
const outputStatus = document.getElementById('outputStatus');
const inputSizeEl = document.getElementById('inputSize');
const outputSizeEl = document.getElementById('outputSize');
const compressionEl = document.getElementById('compression');
const notification = document.getElementById('notification');

// Event Listeners
formatBtn.addEventListener('click', formatJSON);
minifyBtn.addEventListener('click', minifyJSON);
validateBtn.addEventListener('click', validateJSON);
copyBtn.addEventListener('click', copyToClipboard);
clearBtn.addEventListener('click', clearAll);
jsonInput.addEventListener('input', updateStats);

// Format JSON with indentation
function formatJSON() {
    const input = jsonInput.value.trim();
    
    if (!input) {
        showNotification('Please paste some JSON first', 'warning');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const indent = getIndentString();
        const formatted = JSON.stringify(parsed, null, indent);
        
        jsonOutput.value = formatted;
        outputStatus.textContent = 'Valid JSON';
        outputStatus.className = 'status-badge valid';
        inputStatus.className = 'status-badge valid';
        inputStatus.textContent = 'Valid JSON';
        updateStats();
        showNotification('JSON formatted successfully', 'success');
    } catch (error) {
        inputStatus.className = 'status-badge invalid';
        inputStatus.textContent = 'Invalid JSON';
        showNotification(`Invalid JSON: ${error.message}`, 'error');
    }
}

// Minify JSON
function minifyJSON() {
    const input = jsonInput.value.trim();
    
    if (!input) {
        showNotification('Please paste some JSON first', 'warning');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const minified = JSON.stringify(parsed);
        
        jsonOutput.value = minified;
        outputStatus.textContent = 'Valid JSON (Minified)';
        outputStatus.className = 'status-badge valid';
        inputStatus.className = 'status-badge valid';
        inputStatus.textContent = 'Valid JSON';
        updateStats();
        showNotification('JSON minified successfully', 'success');
    } catch (error) {
        inputStatus.className = 'status-badge invalid';
        inputStatus.textContent = 'Invalid JSON';
        showNotification(`Invalid JSON: ${error.message}`, 'error');
    }
}

// Validate JSON
function validateJSON() {
    const input = jsonInput.value.trim();
    
    if (!input) {
        showNotification('Please paste some JSON first', 'warning');
        return;
    }

    try {
        JSON.parse(input);
        inputStatus.className = 'status-badge valid';
        inputStatus.textContent = 'Valid JSON ✓';
        showNotification('JSON is valid', 'success');
    } catch (error) {
        inputStatus.className = 'status-badge invalid';
        inputStatus.textContent = 'Invalid JSON ✗';
        showNotification(`Invalid JSON: ${error.message}`, 'error');
    }
}

// Copy output to clipboard
function copyToClipboard() {
    const output = jsonOutput.value;
    
    if (!output) {
        showNotification('Nothing to copy', 'warning');
        return;
    }

    navigator.clipboard.writeText(output).then(() => {
        showNotification('Copied to clipboard', 'success');
    }).catch(() => {
        showNotification('Failed to copy', 'error');
    });
}

// Clear all
function clearAll() {
    jsonInput.value = '';
    jsonOutput.value = '';
    inputStatus.textContent = '';
    inputStatus.className = 'status-badge';
    outputStatus.textContent = '';
    outputStatus.className = 'status-badge';
    inputSizeEl.textContent = '0 B';
    outputSizeEl.textContent = '0 B';
    compressionEl.textContent = '0%';
    showNotification('Cleared all content', 'success');
}

// Get indent string based on selection
function getIndentString() {
    const value = indentSize.value;
    if (value === 'tab') return '\t';
    return ' '.repeat(parseInt(value));
}

// Update statistics
function updateStats() {
    const inputText = jsonInput.value;
    const outputText = jsonOutput.value;
    
    // Calculate sizes
    const inputSize = new Blob([inputText]).size;
    const outputSize = new Blob([outputText]).size;
    
    // Format bytes
    inputSizeEl.textContent = formatBytes(inputSize);
    outputSizeEl.textContent = formatBytes(outputSize);
    
    // Calculate compression
    if (inputSize > 0) {
        const compression = Math.round(((inputSize - outputSize) / inputSize) * 100);
        compressionEl.textContent = Math.max(0, compression) + '%';
    } else {
        compressionEl.textContent = '0%';
    }
}

// Format bytes to readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = 'notification show ' + type;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize with example on load
window.addEventListener('load', () => {
    // Auto-focus input
    jsonInput.focus();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + F to format
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        formatJSON();
    }
    // Ctrl/Cmd + Shift + M to minify
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
        e.preventDefault();
        minifyJSON();
    }
    // Ctrl/Cmd + Shift + C to copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
        e.preventDefault();
        copyToClipboard();
    }
});
