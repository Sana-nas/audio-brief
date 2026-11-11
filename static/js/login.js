// AudioBrief Login - Modern JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Modern login.js loaded');
    
    // Initialize all components
    initWaveAnimation();
    initFormValidation();
    initNotifications();
    initWaveformVisualization();
    initAnimations();
    initMobileMenu();
    
    // Wave Background Animation
    function initWaveAnimation() {
        const waves = document.querySelectorAll('.wave');
        if (!waves.length) return;
        
        waves.forEach((wave, index) => {
            // Dynamically update wave styles for more organic movement
            setInterval(() => {
                const randomHeight = 0.3 + (Math.random() * 0.15);
                const randomScale = 0.9 + (Math.random() * 0.2);
                wave.style.transform = `scaleY(${randomHeight}) scaleX(${randomScale})`;
            }, 3000 + (index * 1000));
        });
    }
    
    // Audio Waveform Visualization
    function initWaveformVisualization() {
        const waveformContainer = document.querySelector('.waveform-visualization');
        if (!waveformContainer) return;
        
        // Create waveform bars
        const barCount = 28;
        
        for (let i = 0; i < barCount; i++) {
            const bar = document.createElement('div');
            bar.className = 'waveform-bar';
            
            // Set random heights for the initial state
            const height = 10 + Math.random() * 80;
            bar.style.height = `${height}%`;
            bar.style.left = `${(i * 100) / barCount}%`;
            
            // Add a tiny delay to each bar's animation
            bar.style.animationDelay = `${i * 0.05}s`;
            
            waveformContainer.appendChild(bar);
        }
        
        // Animate the bars
        setInterval(() => {
            document.querySelectorAll('.waveform-bar').forEach(bar => {
                const height = 10 + Math.random() * 80;
                bar.style.height = `${height}%`;
                
                // Add subtle color changes
                const hue = 240 + (Math.random() * 60); // Blue to purple range
                bar.style.backgroundColor = `hsla(${hue}, 70%, 60%, ${0.7 + Math.random() * 0.3})`;
            });
        }, 500);
    }
    
    // Mobile Menu Toggle
    function initMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        
        if (!hamburger || !navLinks) return;
        
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hamburger') && !e.target.closest('.nav-links')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
    
    // Form Validation
    function initFormValidation() {
        const loginForm = document.getElementById('login-form');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        if (!loginForm || !usernameInput || !passwordInput) return;
        
        // Add form validation
        loginForm.addEventListener('submit', function(e) {
            // Reset any previous error states
            document.querySelectorAll('.form-group.error').forEach(group => {
                group.classList.remove('error');
                group.classList.remove('shake');
                
                // Remove any existing error messages
                const errorMessage = group.querySelector('.error-message');
                if (errorMessage) errorMessage.remove();
            });
            
            let isValid = true;
            
            // Validate username
            if (!usernameInput.value.trim()) {
                e.preventDefault();
                markFieldAsInvalid(usernameInput, 'Username is required');
                showNotification('Please enter your username', 'error');
                isValid = false;
            }
            
            // Validate password
            if (!passwordInput.value) {
                e.preventDefault();
                markFieldAsInvalid(passwordInput, 'Password is required');
                if (isValid) {
                    showNotification('Please enter your password', 'error');
                }
                isValid = false;
            }
            
            // If both fields are invalid, show a combined message
            if (!usernameInput.value.trim() && !passwordInput.value) {
                showNotification('Please enter both username and password', 'error');
            }
        });
        
        // Add input event listeners to clear error state on typing
        [usernameInput, passwordInput].forEach(input => {
            input.addEventListener('input', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup && formGroup.classList.contains('error')) {
                    formGroup.classList.remove('error');
                    formGroup.classList.remove('shake');
                    
                    // Remove error message
                    const errorMessage = formGroup.querySelector('.error-message');
                    if (errorMessage) errorMessage.remove();
                }
            });
        });
    }
    
    // Function to mark a field as invalid
    function markFieldAsInvalid(field, message) {
        if (!field) return;
        
        // Find the parent form-group
        const formGroup = field.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            formGroup.classList.add('shake');
            
            // Add error message
            const errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            errorMessage.textContent = message;
            
            // Check if error message already exists
            if (!formGroup.querySelector('.error-message')) {
                formGroup.appendChild(errorMessage);
            }
            
            // Remove the shake class after animation completes
            setTimeout(() => {
                formGroup.classList.remove('shake');
            }, 600);
        }
        
        // Set field as invalid for browser validation
        field.setCustomValidity(message);
        field.focus();
    }
    
    // Notification System
    function initNotifications() {
        // Add event listeners to existing notification close buttons
        document.querySelectorAll('.notification .close-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const notification = this.closest('.notification');
                if (notification) {
                    notification.style.animation = 'fadeOut 0.3s forwards';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            });
        });
        
        // Auto-dismiss existing notifications
        document.querySelectorAll('.notification').forEach((notification, index) => {
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.5s forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }, 5000 + (index * 500)); // Stagger dismissal
        });
    }
    
    // Function to show a notification
    function showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.querySelector('.notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('span');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', function() {
            notification.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        notification.appendChild(closeBtn);
        
        // Add to container
        container.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 500);
        }, 5000);
        
        return notification;
    }
    
    // General animations and effects
    function initAnimations() {
        // Add parallax effect to circles
        document.addEventListener('mousemove', (e) => {
            const circles = document.querySelectorAll('.animated-circle');
            const container = document.querySelector('.login-left');
            
            if (!circles.length || !container) return;
            
            const containerRect = container.getBoundingClientRect();
            const centerX = containerRect.left + containerRect.width / 2;
            const centerY = containerRect.top + containerRect.height / 2;
            
            const moveX = (e.clientX - centerX) / 50;
            const moveY = (e.clientY - centerY) / 50;
            
            circles.forEach((circle, index) => {
                // Make each circle move slightly differently
                const factor = index === 0 ? 1 : -0.7;
                circle.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
            });
        });
        
        // Add subtle hover effects to buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });
    }
});

