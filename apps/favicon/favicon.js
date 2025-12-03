// Favicon sizes configuration
const faviconSizes = [
    { size: 16, label: '16×16', desc: 'Standard favicon', default: true },
    { size: 32, label: '32×32', desc: 'Standard favicon', default: true },
    { size: 48, label: '48×48', desc: 'Windows icon', default: false },
    { size: 64, label: '64×64', desc: 'High-res favicon', default: false },
    { size: 96, label: '96×96', desc: 'Android Chrome', default: false },
    { size: 128, label: '128×128', desc: 'Chrome Web Store', default: false },
    { size: 180, label: '180×180', desc: 'Apple Touch Icon', default: false },
    { size: 192, label: '192×192', desc: 'Android Chrome', default: false },
    { size: 256, label: '256×256', desc: 'High-res icon', default: false },
    { size: 512, label: '512×512', desc: 'PWA icon', default: false }
];

let uploadedImage = null;
let selectedSizes = [];
let generatedFavicons = [];

// Allowed file types
const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

// DOM Elements
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const sizesCard = document.getElementById('sizesCard');
const sizesGrid = document.getElementById('sizesGrid');
const resultsCard = document.getElementById('resultsCard');
const faviconsGrid = document.getElementById('faviconsGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeSizesGrid();
    setupEventListeners();
});

// Initialize sizes grid
function initializeSizesGrid() {
    sizesGrid.innerHTML = '';
    faviconSizes.forEach(faviconSize => {
        const sizeOption = document.createElement('div');
        sizeOption.className = `size-option ${faviconSize.default ? 'selected' : ''}`;
        sizeOption.innerHTML = `
            <input type="checkbox" id="size-${faviconSize.size}" value="${faviconSize.size}" ${faviconSize.default ? 'checked' : ''}>
            <label for="size-${faviconSize.size}">
                <div class="size-label">${faviconSize.label}</div>
                <div class="size-desc">${faviconSize.desc}</div>
            </label>
        `;
        sizesGrid.appendChild(sizeOption);
        
        if (faviconSize.default) {
            selectedSizes.push(faviconSize.size);
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Upload area click
    uploadArea.addEventListener('click', () => imageInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Remove image
    removeBtn.addEventListener('click', removeImage);
    
    // Size selection
    sizesGrid.addEventListener('change', handleSizeChange);
    
    // Generate button (will be added dynamically)
    // Download all button
    downloadAllBtn.addEventListener('click', downloadAllFavicons);
}

// Validate file type
function isValidImageFile(file) {
    // Check MIME type
    if (allowedTypes.includes(file.type.toLowerCase())) {
        return true;
    }
    
    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    return hasValidExtension;
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (isValidImageFile(file)) {
            processImage(file);
        } else {
            showToast('Please select a valid image file (JPG, PNG, GIF, WebP, or SVG)', 'error');
            // Clear the input
            e.target.value = '';
        }
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file) {
        if (isValidImageFile(file)) {
            processImage(file);
        } else {
            showToast('Please drop a valid image file (JPG, PNG, GIF, WebP, or SVG)', 'error');
        }
    } else {
        showToast('Please drop a valid image file', 'error');
    }
}

// Process uploaded image
function processImage(file) {
    // Double-check validation
    if (!isValidImageFile(file)) {
        showToast('Invalid file type. Please use JPG, PNG, GIF, WebP, or SVG', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            uploadedImage = img;
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadArea.style.display = 'none';
            sizesCard.style.display = 'block';
            
            // Add generate button if not exists
            if (!document.getElementById('generateBtn')) {
                const generateBtn = document.createElement('button');
                generateBtn.id = 'generateBtn';
                generateBtn.className = 'generate-btn';
                generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Favicons';
                generateBtn.addEventListener('click', generateFavicons);
                sizesCard.appendChild(generateBtn);
            }
        };
        img.onerror = () => {
            showToast('Failed to load image. Please ensure the file is a valid image.', 'error');
            imageInput.value = '';
        };
        img.src = e.target.result;
    };
    
    reader.onerror = () => {
        showToast('Failed to read file. Please try again.', 'error');
        imageInput.value = '';
    };
    
    reader.readAsDataURL(file);
}

// Remove image
function removeImage() {
    uploadedImage = null;
    previewImage.src = '';
    imagePreview.style.display = 'none';
    uploadArea.style.display = 'block';
    sizesCard.style.display = 'none';
    resultsCard.style.display = 'none';
    generatedFavicons = [];
    imageInput.value = '';
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.remove();
    }
}

// Handle size change
function handleSizeChange(e) {
    const size = parseInt(e.target.value);
    const sizeOption = e.target.closest('.size-option');
    
    if (e.target.checked) {
        selectedSizes.push(size);
        sizeOption.classList.add('selected');
    } else {
        selectedSizes = selectedSizes.filter(s => s !== size);
        sizeOption.classList.remove('selected');
    }
}

// Generate favicons
async function generateFavicons() {
    if (!uploadedImage) {
        showToast('Please upload an image first', 'error');
        return;
    }
    
    if (selectedSizes.length === 0) {
        showToast('Please select at least one size', 'error');
        return;
    }
    
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    generatedFavicons = [];
    faviconsGrid.innerHTML = '';
    
    // Generate each selected size
    for (let i = 0; i < selectedSizes.length; i++) {
        const size = selectedSizes[i];
        const favicon = await generateFavicon(size);
        generatedFavicons.push(favicon);
        displayFavicon(favicon);
    }
    
    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Favicons';
    }
    
    showToast(`Generated ${selectedSizes.length} favicon(s) successfully!`);
}

// Generate favicon for a specific size
function generateFavicon(size) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw image to canvas
        ctx.drawImage(uploadedImage, 0, 0, size, size);
        
        // Get PNG data first for preview
        canvas.toBlob((pngBlob) => {
            const previewUrl = URL.createObjectURL(pngBlob);
            
            // Convert to ICO format
            canvas.toBlob((pngBlobForIco) => {
                pngBlobForIco.arrayBuffer().then((pngData) => {
                    const icoBlob = createIcoFile(size, pngData);
                    const icoUrl = URL.createObjectURL(icoBlob);
                    
                    resolve({
                        size: size,
                        blob: icoBlob,
                        url: icoUrl,
                        previewUrl: previewUrl, // PNG for preview
                        label: `${size}×${size}`,
                        format: 'ICO'
                    });
                });
            }, 'image/png');
        }, 'image/png');
    });
}

// Create ICO file from PNG data
function createIcoFile(size, pngData) {
    const icoSize = pngData.byteLength;
    const width = size >= 256 ? 0 : size;
    const height = size >= 256 ? 0 : size;
    
    // ICO Header (6 bytes)
    const header = new ArrayBuffer(6);
    const headerView = new DataView(header);
    headerView.setUint16(0, 0, true); // Reserved
    headerView.setUint16(2, 1, true); // Type (1 = ICO)
    headerView.setUint16(4, 1, true); // Count (1 image)
    
    // Image Directory Entry (16 bytes)
    const directory = new ArrayBuffer(16);
    const dirView = new DataView(directory);
    dirView.setUint8(0, width); // Width
    dirView.setUint8(1, height); // Height
    dirView.setUint8(2, 0); // Color Palette (0 = no palette)
    dirView.setUint8(3, 0); // Reserved
    dirView.setUint16(4, 1, true); // Color Planes
    dirView.setUint16(6, 32, true); // Bits Per Pixel (32 for RGBA)
    dirView.setUint32(8, icoSize, true); // Size of image data
    dirView.setUint32(12, 22, true); // Offset to image data (6 + 16)
    
    // Combine header + directory + PNG data
    const icoFile = new Blob([header, directory, pngData], { type: 'image/x-icon' });
    
    return icoFile;
}

// Display generated favicon
function displayFavicon(favicon) {
    const faviconItem = document.createElement('div');
    faviconItem.className = 'favicon-item';
    
    const previewClass = favicon.size <= 32 ? 'small' : favicon.size >= 96 ? 'large' : '';
    // Use previewUrl (PNG) for display since browsers can't display ICO directly
    const previewSrc = favicon.previewUrl || favicon.url;
    
    faviconItem.innerHTML = `
        <div class="favicon-preview ${previewClass}">
            <img src="${previewSrc}" alt="${favicon.label}">
        </div>
        <div class="favicon-info">
            <div class="favicon-size">${favicon.label}</div>
            <div class="favicon-format">${favicon.format}</div>
        </div>
        <button class="download-btn" data-size="${favicon.size}">
            <i class="fas fa-download"></i> Download
        </button>
    `;
    
    faviconsGrid.appendChild(faviconItem);
    
    // Add download event listener
    const downloadBtn = faviconItem.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => downloadFavicon(favicon));
}

// Download individual favicon
function downloadFavicon(favicon) {
    const link = document.createElement('a');
    link.href = favicon.url;
    link.download = `favicon-${favicon.size}x${favicon.size}.ico`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Downloaded favicon-${favicon.size}x${favicon.size}.ico`);
}

// Download all favicons
function downloadAllFavicons() {
    if (generatedFavicons.length === 0) {
        showToast('No favicons generated yet', 'error');
        return;
    }
    
    generatedFavicons.forEach((favicon, index) => {
        setTimeout(() => {
            downloadFavicon(favicon);
        }, index * 200);
    });
    
    showToast(`Downloading ${generatedFavicons.length} favicon(s)...`);
}

// Show toast notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    
    if (type === 'error') {
        toast.querySelector('i').className = 'fas fa-exclamation-circle';
        toast.querySelector('i').style.color = 'var(--error-color)';
    } else {
        toast.querySelector('i').className = 'fas fa-check-circle';
        toast.querySelector('i').style.color = 'var(--success-color)';
    }
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

