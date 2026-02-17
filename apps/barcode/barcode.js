document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const barcodeInput = document.getElementById('barcodeValue');
    const formatSelect = document.getElementById('barcodeFormat');
    const lineColorInput = document.getElementById('lineColor');
    const bgColorInput = document.getElementById('bgColor');
    const showTextInput = document.getElementById('showText');
    const generateBtn = document.getElementById('generateBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const downloadSvgBtn = document.getElementById('downloadSvgBtn');
    const apiLinkCode = document.getElementById('apiLink');

    // Debounce function to prevent excessive rendering
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Main Generation Function
    function generateBarcode() {
        const value = barcodeInput.value;
        const format = formatSelect.value;
        const lineColor = lineColorInput.value;
        const background = bgColorInput.value;
        const displayValue = showTextInput.checked;

        if (!value) {
            // Clear barcode if empty
            document.getElementById('barcode').innerHTML = '';
            return;
        }

        try {
            JsBarcode("#barcode", value, {
                format: format,
                lineColor: lineColor,
                background: background,
                displayValue: displayValue,
                width: 2,
                height: 100,
                margin: 10,
                valid: function (valid) {
                    if (!valid) {
                        // Handle invalid input silently or show basic feedback
                        // JsBarcode handles visual feedback usually by not rendering or rendering default
                    }
                }
            });
            updateApiLink(value, format, displayValue);
        } catch (e) {
            console.error("Barcode generation error:", e);
            // Optionally show error to user
        }
    }

    function updateApiLink(value, format, displayValue) {
        // Update the API usage example text
        const url = new URL(window.location.href);
        // Clean params
        url.search = '';
        const params = new URLSearchParams();
        params.set('value', value);
        params.set('format', format);
        if (displayValue !== true) { // Only show if false (since true is default) or always show? User asked to implement option, let's show it if it's explicitly interesting.
            // Actually, let's always show it or show it if it differs from default?
            // Let's just add it for clarity as requested "implement show text option in api"
            params.set('text', displayValue);
        }

        // We only show the query part for the user to copy
        apiLinkCode.textContent = `?${params.toString()}`;
    }

    // API Handling: Parse URL Params on Load
    function initFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const value = params.get('value');
        const format = params.get('format');
        const type = params.get('type'); // Handle 'type' as alias for 'format' as per user request context

        if (value) {
            barcodeInput.value = value;
        }

        if (format) {
            if (isValidFormat(format)) formatSelect.value = format;
        } else if (type) {
            if (isValidFormat(type)) formatSelect.value = type;
        }

        const textParam = params.get('text') || params.get('showText');
        if (textParam !== null) {
            const isFalse = textParam === 'false' || textParam === '0' || textParam === 'no';
            showTextInput.checked = !isFalse;
        }

        // Generate immediately if value exists
        if (value) {
            generateBarcode();
        } else {
            // Default generation
            generateBarcode();
        }
    }

    function isValidFormat(fmt) {
        const options = Array.from(formatSelect.options).map(opt => opt.value);
        return options.includes(fmt);
    }

    // Download Helpers
    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadSvgBtn.addEventListener('click', () => {
        const svg = document.getElementById('barcode');
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);

        // Add namespace if missing (sometimes needed for standalone viewing)
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        // Prepend XML declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        downloadFile(blob, `barcode-${barcodeInput.value}.svg`);
    });

    downloadPngBtn.addEventListener('click', () => {
        const svg = document.getElementById('barcode');
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Convert SVG string to base64
        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            canvas.toBlob(function (blob) {
                downloadFile(blob, `barcode-${barcodeInput.value}.png`);
            });
        };

        img.src = url;
    });


    // Event Listeners
    generateBtn.addEventListener('click', generateBarcode);

    // Live update with debounce
    const debouncedGenerate = debounce(generateBarcode, 300);

    barcodeInput.addEventListener('input', debouncedGenerate);
    formatSelect.addEventListener('change', generateBarcode);
    lineColorInput.addEventListener('input', debouncedGenerate);
    bgColorInput.addEventListener('input', debouncedGenerate);
    showTextInput.addEventListener('change', generateBarcode);

    // Initial load
    initFromUrl();
});
