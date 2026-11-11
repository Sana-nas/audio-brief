document.addEventListener('DOMContentLoaded', () => {
    // Initialize message popups with icons and close buttons
    initializeMessagePopups();
    
    // Handle sidebar navigation highlighting
    initializeSidebarNav();
    
    // Handle other interactive elements
    initializeInteractiveElements();
});

/**
 * Initialize message popups with icons and close buttons
 */
function initializeMessagePopups() {
    const messages = document.querySelectorAll('.message-popup');
    
    // Add icons and close buttons to each message
    messages.forEach(message => {
        // Add appropriate icon based on message type
        const messageType = message.classList.contains('error') ? 'error' :
                           message.classList.contains('warning') ? 'warning' :
                           message.classList.contains('info') ? 'info' : 'success';
        
        const iconMap = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'success': '✅'
        };
        
        // Create icon span
        const iconSpan = document.createElement('span');
        iconSpan.className = 'message-popup-icon';
        iconSpan.textContent = iconMap[messageType];
        
        // Create close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'message-popup-close';
        closeBtn.textContent = '×';
        
        // Add event listener to close button
        closeBtn.addEventListener('click', () => {
            fadeOutAndRemove(message);
        });
        
        // Insert icon at the beginning of the message
        message.insertBefore(iconSpan, message.firstChild);
        // Append close button
        message.appendChild(closeBtn);
        
        // Show message with animation
        setTimeout(() => {
            message.style.opacity = '1';
        }, 100);
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
            fadeOutAndRemove(message);
        }, 5000);
    });
}

/**
 * Fade out and remove a message element
 */
function fadeOutAndRemove(element) {
    element.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 500);
}

/**
 * Initialize sidebar navigation
 */
function initializeSidebarNav() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const currentPath = window.location.pathname;
    
    navItems.forEach(item => {
        // Add icons to menu items if they don't already have them
        if (!item.querySelector('i')) {
            const icon = document.createElement('i');
            if (item.textContent.includes('Home')) {
                icon.className = 'fas fa-home';
            } else if (item.textContent.includes('Audio')) {
                icon.className = 'fas fa-microphone';
            } else if (item.textContent.includes('YouTube')) {
                icon.className = 'fab fa-youtube';
            } else {
                icon.className = 'fas fa-chevron-right';
            }
            item.insertBefore(icon, item.firstChild);
        }
        
        // Highlight active menu item based on current path
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        
        // Add hover effect
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(5px)';
        });
        
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('active')) {
                item.style.transform = 'translateX(0)';
            }
        });
    });
}

/**
 * Initialize other interactive elements
 */
function initializeInteractiveElements() {
    // Handle YouTube form submission
    const youtubeForm = document.querySelector('.youtube-form');
    if (youtubeForm) {
        youtubeForm.addEventListener('submit', function(e) {
            const urlInput = this.querySelector('input[name="youtube_url"]');
            if (!urlInput.value.trim().includes('youtube.com') && 
                !urlInput.value.trim().includes('youtu.be')) {
                e.preventDefault();
                showCustomMessage('Please enter a valid YouTube URL', 'error');
            }
        });
    }
    
    // Handle batch summarize button
    const batchBtn = document.querySelector('.batch-summarize-btn');
    if (batchBtn) {
        batchBtn.addEventListener('click', function() {
            showCustomMessage('Batch summarize feature coming soon!', 'info');
        });
    }
}

/**
 * Show a custom message popup
 * This function is made available globally for other pages to use
 */
function showCustomMessage(messageText, type = 'success') {
    // Create container if it doesn't exist
    let container = document.getElementById('message-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'message-container';
        container.className = 'message-container';
        document.body.appendChild(container);
    }
    
    // Create message element
    const message = document.createElement('div');
    message.className = `message-popup ${type}`;
    message.textContent = messageText;
    
    // Add icon
    const iconMap = {
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️',
        'success': '✅'
    };
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'message-popup-icon';
    iconSpan.textContent = iconMap[type];
    message.insertBefore(iconSpan, message.firstChild);
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'message-popup-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
        fadeOutAndRemove(message);
    });
    message.appendChild(closeBtn);
    
    // Add to container
    container.appendChild(message);
    
    // Show with animation
    setTimeout(() => {
        message.style.opacity = '1';
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        fadeOutAndRemove(message);
    }, 5000);
    
    return message;
}

// Make the showCustomMessage function available globally
window.showCustomMessage = showCustomMessage;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize preloader
    initPreloader();
    
    // Initialize particles background
    initParticles();
    
    // Initialize AOS (Animate On Scroll)
    AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: false,
        mirror: false
    });
    
    // Handle notifications
    initNotifications();
    
    // Handle mobile menu toggle
    initMobileNav();

    // Message popup handling
    const messagePopups = document.querySelectorAll('.message-popup');
    messagePopups.forEach(popup => {
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            popup.style.animation = 'fadeOut 0.5s ease-in forwards';
            setTimeout(() => {
                popup.remove();
            }, 500);
        }, 5000);

        // Add close button functionality
        const closeBtn = popup.querySelector('.message-popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                popup.style.animation = 'fadeOut 0.5s ease-in forwards';
                setTimeout(() => {
                    popup.remove();
                }, 500);
            });
        }
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show-mobile');
            mobileMenuToggle.classList.toggle('active');
            
            // Toggle icon between bars and times
            const icon = mobileMenuToggle.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Add animation classes to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.classList.add('animate-on-scroll');
        card.style.animationDelay = (index * 0.2) + 's';
    });

    // Intersection Observer for scroll animations
    if ('IntersectionObserver' in window) {
        const animateElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, {
            threshold: 0.15, // Trigger when 15% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Adjusts the trigger point
        });
        
        animateElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for browsers that don't support Intersection Observer
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            element.classList.add('is-visible');
        });
    }

    // Smooth scroll to section when clicking on menu item
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Initialize preloader with delay for demonstration
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    
    setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1000); // 1 second delay for demonstration
}

// Initialize particles.js background
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (!particlesContainer) return;
    
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 80,
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#4361ee"
            },
            "shape": {
                "type": "circle",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                }
            },
            "opacity": {
                "value": 0.5,
                "random": false,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 3,
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": "#3a0ca3",
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": true,
                    "mode": "grab"
                },
                "onclick": {
                    "enable": true,
                    "mode": "push"
                },
                "resize": true
            },
            "modes": {
                "grab": {
                    "distance": 140,
                    "line_linked": {
                        "opacity": 1
                    }
                },
                "bubble": {
                    "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
                },
                "repulse": {
                    "distance": 200,
                    "duration": 0.4
                },
                "push": {
                    "particles_nb": 4
                },
                "remove": {
                    "particles_nb": 2
                }
            }
        },
        "retina_detect": true
    });
}

// Handle notification system
function initNotifications() {
    // Get all notification elements
    const notifications = document.querySelectorAll('.notification');
    
    // Add close functionality for each notification
    notifications.forEach(notification => {
        // Add close button if not present
        if (!notification.querySelector('.notification-close')) {
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.innerHTML = '&times;';
            notification.appendChild(closeButton);
        }
        
        // Add event listener to close button
        const closeButton = notification.querySelector('.notification-close');
        closeButton.addEventListener('click', () => {
            notification.classList.add('animate__fadeOutLeft');
            setTimeout(() => {
                notification.remove();
            }, 500);
        });
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            notification.classList.add('animate__fadeOutLeft');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 5000);
    });
}

// Handle mobile menu toggle
function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (!navToggle || !mainNav) return;
    
    navToggle.addEventListener('click', () => {
        if (mainNav.classList.contains('show')) {
            mainNav.classList.remove('show');
            mainNav.style.height = '0';
        } else {
            mainNav.classList.add('show');
            const height = mainNav.scrollHeight;
            mainNav.style.height = `${height}px`;
        }
        
        // Toggle hamburger animation
        const hamburger = navToggle.querySelector('.hamburger');
        hamburger.classList.toggle('active');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !mainNav.contains(e.target) && mainNav.classList.contains('show')) {
            mainNav.classList.remove('show');
            mainNav.style.height = '0';
            const hamburger = navToggle.querySelector('.hamburger');
            hamburger.classList.remove('active');
        }
    });
    
    // Adjust nav on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && mainNav.classList.contains('show')) {
            mainNav.classList.remove('show');
            mainNav.style.height = 'auto';
            const hamburger = navToggle.querySelector('.hamburger');
            hamburger.classList.remove('active');
        }
    });
}

// Show a custom notification
function showNotification(message, type = 'info') {
    const notificationArea = document.querySelector('.notification-area');
    if (!notificationArea) return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} animate__animated animate__fadeInLeft`;
    
    // Create icon based on type
    const iconElement = document.createElement('div');
    iconElement.className = 'notification-icon';
    
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    iconElement.innerHTML = icon;
    
    // Create content element
    const contentElement = document.createElement('div');
    contentElement.className = 'notification-content';
    contentElement.textContent = message;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    
    // Add close functionality
    closeButton.addEventListener('click', () => {
        notification.classList.replace('animate__fadeInLeft', 'animate__fadeOutLeft');
        setTimeout(() => {
            notification.remove();
        }, 500);
    });
    
    // Assemble notification
    notification.appendChild(iconElement);
    notification.appendChild(contentElement);
    notification.appendChild(closeButton);
    
    // Add to notification area
    notificationArea.appendChild(notification);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.replace('animate__fadeInLeft', 'animate__fadeOutLeft');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// Make function available globally
window.showNotification = showNotification;