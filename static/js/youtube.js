// YouTube Video Summarizer JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles.js
    initializeParticles();
    
    // Setup form event listeners
    setupFormEvents();
    
    // Initialize feature card effects
    initializeFeatureCards();
    
    // Setup notification button
    setupNotifyButton();
    
});

// Initialize particles.js for background effects
function initializeParticles() {
    if (typeof particlesJS !== 'undefined') {
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
                    "value": ["#4cc9f0", "#f72585", "#7209b7", "#4361ee"]
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    }
                },
                "opacity": {
                    "value": 0.3,
                    "random": true
                },
                "size": {
                    "value": 3,
                    "random": true
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#4cc9f0",
                    "opacity": 0.2,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 1.5,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false
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
                            "opacity": 0.5
                        }
                    },
                    "push": {
                        "particles_nb": 4
                    }
                }
            },
            "retina_detect": true
        });
    }
}

// Setup URL input and submit events
function setupFormEvents() {
    const youtubeUrl = document.getElementById('youtube-url');
    const summarizeBtn = document.getElementById('summarize-btn');
    const batchBtn = document.getElementById('batch-btn');
    
    if (youtubeUrl && summarizeBtn) {
        // Focus effect for URL input
        youtubeUrl.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        youtubeUrl.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Button click: this feature is not implemented yet, so say so honestly
        summarizeBtn.addEventListener('click', function() {
            const url = youtubeUrl.value.trim();
            if (!isValidYoutubeUrl(url)) {
                showNotification('Please enter a valid YouTube URL', 'error');
                addShakeEffect(youtubeUrl.parentElement);
                return;
            }
            showNotification('YouTube summarization is a planned future enhancement and is not available yet.', 'info');
        });

        if (batchBtn) {
            batchBtn.addEventListener('click', function() {
                showNotification('Batch summarization is a planned future enhancement and is not available yet.', 'info');
            });
        }
    }
}

// Add glowing effects to feature cards
function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        // Randomly generate glow effect
        setInterval(() => {
            const randomHue = Math.floor(Math.random() * 60) + 240; // Blue to purple range
            const randomSize = Math.floor(Math.random() * 5) + 5;
            card.style.boxShadow = `0 5px 15px rgba(0, 0, 0, 0.2), 0 0 ${randomSize}px hsl(${randomHue}, 80%, 60%)`;
            
            setTimeout(() => {
                card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
            }, 700);
        }, Math.random() * 3000 + 2000);
    });
}

// Setup notification button click
function setupNotifyButton() {
    const notifyBtn = document.getElementById('notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', function() {
            showNotification('Thanks for your interest! These features are planned but not available yet.', 'info');
        });
    }
}

// Helper Functions

// Show notification with animation
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `animated-notification ${type}`;
    
    // Icon based on notification type
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.remove();
    }, 3500);
}

// Add shake effect to element
function addShakeEffect(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// Validate YouTube URL
function isValidYoutubeUrl(url) {
    const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
} 