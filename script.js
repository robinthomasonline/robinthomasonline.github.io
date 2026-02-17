// Typing Animation
document.addEventListener('DOMContentLoaded', () => {
    const typingText = document.getElementById('typingText');
    if (!typingText) return;

    const words = [
        'Cloud Architect',
        'Cybersecurity Consultant',
        'DevOps Engineer',
        'GRC Specialist',
        'Infrastructure & Network Specialist',
        'IT Management Professional',
        'Business Consultant',
        'Software Developer',
        'IT Support Specialist'
    ];

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
            typingText.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingText.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            typingSpeed = 2000; // Pause at end of word
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 500; // Pause before next word
        }

        setTimeout(type, typingSpeed);
    }

    // Start typing animation
    type();
});

// Load and render contact information
document.addEventListener('DOMContentLoaded', () => {
    const contactContainer = document.getElementById('contact-info-container');
    if (!contactContainer || typeof CONTACT_CONFIG === 'undefined') return;

    // Clear container
    contactContainer.innerHTML = '';

    // Render each contact item
    CONTACT_CONFIG.contacts.forEach(contact => {
        const contactItem = document.createElement('a');
        contactItem.href = contact.href;
        contactItem.className = 'contact-item';

        if (contact.target) {
            contactItem.target = contact.target;
        }

        if (contact.rel) {
            contactItem.rel = contact.rel;
        }

        contactItem.innerHTML = `
            <i class="${contact.icon}"></i>
            <div class="contact-details">
                <h3>${contact.title}</h3>
                <span>${contact.label}</span>
            </div>
        `;

        contactContainer.appendChild(contactItem);
    });
});

// Sidebar Toggle
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
let isMinimized = false;

// Toggle sidebar minimize/maximize
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        isMinimized = !isMinimized;
        sidebar.classList.toggle('minimized', isMinimized);
        document.body.classList.toggle('sidebar-minimized', isMinimized);

        // Save state to localStorage
        localStorage.setItem('sidebarMinimized', isMinimized);
    });
}

// Load sidebar state from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('sidebarMinimized');
    if (savedState === 'true') {
        isMinimized = true;
        sidebar.classList.add('minimized');
        document.body.classList.add('sidebar-minimized');
    }
});

// Mobile sidebar toggle
let mobileMenuBtn = null;

function createMobileMenuButton() {
    if (window.innerWidth <= 768 && !mobileMenuBtn) {
        mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.style.cssText = `
            position: fixed;
            top: 1rem;
            left: 1rem;
            z-index: 1001;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.25rem;
            backdrop-filter: blur(10px);
        `;
        document.body.appendChild(mobileMenuBtn);

        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('active');
        });
    } else if (window.innerWidth > 768 && mobileMenuBtn) {
        mobileMenuBtn.remove();
        mobileMenuBtn = null;
    }
}

// Create mobile menu button on load and resize
createMobileMenuButton();
window.addEventListener('resize', createMobileMenuButton);

// Close sidebar when overlay is clicked
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
}

// Close mobile sidebar when nav link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
            // Close mobile menu if open
            if (menuOpen) {
                menuBtn.click();
            }
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';

    // Check if we're at the bottom of the page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        current = 'contact';
    } else {
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Contact Form Handling
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Get form values
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        // Disable submit button and show loading state
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        // Here you would typically send the data to your backend
        // For now, we'll simulate a submission
        setTimeout(() => {
            // Reset form
            e.target.reset();
            // Show success message
            alert('Thank you for your message! I will get back to you soon.');
            // Reset button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }, 1500);
    });
}

// Add smooth scrolling for contact links
document.querySelectorAll('.contact-link').forEach(link => {
    link.addEventListener('click', function (e) {
        // Don't prevent default for actual links (email, phone, etc.)
        if (this.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Cursor Effect
const cursor = document.querySelector('.cursor-effect');
const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .business-card, .expertise-card, .contact-link, input, textarea');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
    });

    element.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
    });
});

// Hide cursor when leaving window
document.addEventListener('mouseleave', () => {
    cursor.style.display = 'none';
});

document.addEventListener('mouseenter', () => {
    cursor.style.display = 'block';
});

// Disable cursor effect on mobile devices
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobile()) {
    cursor.style.display = 'none';
    document.body.style.cursor = 'auto';
}

// Experience Cards Expand/Collapse
document.addEventListener('DOMContentLoaded', () => {
    const experienceCards = document.querySelectorAll('.experience-card');

    experienceCards.forEach(card => {
        card.addEventListener('click', () => {
            // Toggle expanded class
            card.classList.toggle('expanded');
        });
    });
}); 