// DOM Elements
const markdownInput = document.getElementById('markdownInput');
const preview = document.getElementById('preview');
const loadFileBtn = document.getElementById('loadFileBtn');
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const exportDocBtn = document.getElementById('exportDocBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const wordCount = document.getElementById('wordCount');
const togglePreviewBtn = document.getElementById('togglePreviewBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Configure marked.js
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
    });
}

// Initialize
let previewVisible = true;

// Load sample markdown on page load
window.addEventListener('DOMContentLoaded', () => {
    const sampleMarkdown = `# Welcome to Markdown Converter

## Features

This tool allows you to convert Markdown to:
- **DOC** (Microsoft Word format)
- **PDF** (Portable Document Format)

### Getting Started

1. Enter your Markdown content in the editor
2. Preview the rendered output
3. Export to your desired format

### Markdown Syntax Examples

**Bold text** and *italic text*

\`\`\`javascript
// Code block example
function greet(name) {
    return \`Hello, \${name}!\`;
}
\`\`\`

> This is a blockquote

- Unordered list item 1
- Unordered list item 2

1. Ordered list item 1
2. Ordered list item 2

[Link example](https://example.com)

---

**Start editing to see live preview!**`;

    markdownInput.value = sampleMarkdown;
    updatePreview();
    updateWordCount();
});

// Update preview when markdown changes
markdownInput.addEventListener('input', () => {
    updatePreview();
    updateWordCount();
});

// Load file
loadFileBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            markdownInput.value = event.target.result;
            updatePreview();
            updateWordCount();
            showToast('File loaded successfully!');
        };
        reader.readAsText(file);
    }
});

// Clear editor
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the editor?')) {
        markdownInput.value = '';
        updatePreview();
        updateWordCount();
        showToast('Editor cleared');
    }
});

// Setup export functionality
function setupExportHandlers() {
    const exportDocBtn = document.getElementById('exportDocBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    
    if (!exportDocBtn || !exportPdfBtn) {
        console.error('Export buttons not found!', { exportDocBtn, exportPdfBtn });
        return;
    }
    
    // DOC export button
    exportDocBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Export DOC button clicked');
        exportToDoc();
    });
    
    // PDF export button
    exportPdfBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Export PDF button clicked');
        exportToPdf();
    });
    
    console.log('Export handlers setup complete');
}

// Setup export handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupExportHandlers);
} else {
    // DOM already loaded
    setupExportHandlers();
}

// Toggle preview
togglePreviewBtn.addEventListener('click', () => {
    const previewSection = document.querySelector('.preview-section');
    previewVisible = !previewVisible;
    
    if (previewVisible) {
        previewSection.style.display = 'flex';
        togglePreviewBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Hide Preview';
        document.querySelector('.editor-container').style.gridTemplateColumns = '1fr 1fr';
    } else {
        previewSection.style.display = 'none';
        togglePreviewBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Show Preview';
        document.querySelector('.editor-container').style.gridTemplateColumns = '1fr';
    }
});

// Update preview
function updatePreview() {
    const markdown = markdownInput.value;
    if (typeof marked !== 'undefined') {
        preview.innerHTML = marked.parse(markdown);
    } else {
        preview.innerHTML = '<p style="color: red;">Marked.js library not loaded. Please refresh the page.</p>';
    }
}

// Update word count
function updateWordCount() {
    const text = markdownInput.value.trim();
    const words = text ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

// Export to DOC
function exportToDoc() {
    const markdown = markdownInput.value;
    if (!markdown.trim()) {
        showToast('Please enter some Markdown content first!', 'error');
        return;
    }

    try {
        showToast('Generating DOC file...', 'info');
        
        // Convert markdown to HTML
        let html;
        if (typeof marked !== 'undefined' && marked.parse) {
            html = marked.parse(markdown);
        } else {
            // Fallback: simple markdown to HTML conversion
            html = markdown
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }
        
        // Create a full HTML document
        const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word">
    <meta name="Originator" content="Microsoft Word">
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
        </w:WordDocument>
    </xml>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5rem;
            margin-bottom: 1rem;
        }
        code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #4f46e5;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 0.75rem;
        }
        table th {
            background: #f4f4f4;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;

        // Create blob and download
        const blob = new Blob(['\ufeff', fullHtml], { 
            type: 'application/msword;charset=utf-8' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.doc';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showToast('DOC file exported successfully!');
    } catch (error) {
        console.error('Error exporting to DOC:', error);
        showToast('Error exporting to DOC: ' + error.message, 'error');
    }
}

// Export to PDF
async function exportToPdf() {
    const markdown = markdownInput.value;
    if (!markdown.trim()) {
        showToast('Please enter some Markdown content first!', 'error');
        return;
    }

    try {
        // Convert markdown to HTML
        let html;
        if (typeof marked !== 'undefined' && marked.parse) {
            html = marked.parse(markdown);
        } else {
            // Fallback: simple markdown to HTML conversion
            html = markdown
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }
        
        // Create a temporary container for PDF generation
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '210mm'; // A4 width
        tempContainer.style.padding = '20mm';
        tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
        tempContainer.style.fontSize = '12pt';
        tempContainer.style.lineHeight = '1.6';
        tempContainer.style.color = '#000';
        tempContainer.style.backgroundColor = '#fff';
        tempContainer.innerHTML = html;
        
        // Add styles for better PDF rendering
        const style = document.createElement('style');
        style.textContent = `
            h1, h2, h3, h4, h5, h6 {
                margin-top: 1.5rem;
                margin-bottom: 1rem;
                page-break-after: avoid;
            }
            h1 { font-size: 24pt; }
            h2 { font-size: 20pt; }
            h3 { font-size: 16pt; }
            p { margin-bottom: 1rem; }
            code {
                background: #f4f4f4;
                padding: 0.2rem 0.4rem;
                border-radius: 0.25rem;
                font-family: monospace;
            }
            pre {
                background: #f4f4f4;
                padding: 1rem;
                border-radius: 0.5rem;
                overflow-x: auto;
                page-break-inside: avoid;
            }
            blockquote {
                border-left: 4px solid #4f46e5;
                padding-left: 1rem;
                margin: 1rem 0;
                font-style: italic;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                page-break-inside: avoid;
            }
            table th, table td {
                border: 1px solid #ddd;
                padding: 0.75rem;
            }
            table th {
                background: #f4f4f4;
            }
            img {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
            }
        `;
        tempContainer.appendChild(style);
        document.body.appendChild(tempContainer);
        
        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Convert to canvas then PDF
        if (typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
            showToast('Generating PDF...', 'info');
            
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            pdf.save('document.pdf');
            showToast('PDF file exported successfully!');
        } else {
            // Fallback: Use browser print to PDF
            showToast('Using browser print dialog...', 'info');
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                showToast('Please allow popups to export PDF', 'error');
                return;
            }
            
            printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Export to PDF</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        @media print {
            body { margin: 0; padding: 1rem; }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                showToast('Use browser print dialog to save as PDF', 'info');
            }, 250);
        }
        
        // Clean up
        document.body.removeChild(tempContainer);
    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showToast('Error exporting to PDF. Please try again.', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle keyboard shortcuts
markdownInput.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to export as DOC
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        exportDocBtn?.click();
    }
    
    // Ctrl/Cmd + P to export as PDF
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        exportPdfBtn?.click();
    }
    
    // Tab key inserts spaces
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const value = markdownInput.value;
        markdownInput.value = value.substring(0, start) + '    ' + value.substring(end);
        markdownInput.selectionStart = markdownInput.selectionEnd = start + 4;
    }
});
