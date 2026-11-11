// AudioBrief Register - Modern JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Modern register.js loaded');
    
    // Initialize all components
    initWaveAnimation();
    initFormValidation();
    initNotifications();
    initAnimations();
    initMobileMenu();
    initPasswordToggles();
    
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
    
    // Password Visibility Toggle
    function initPasswordToggles() {
        const passwordFields = [
            { input: document.getElementById('password1'), icon: null },
            { input: document.getElementById('password2'), icon: null }
        ];
        
        passwordFields.forEach(field => {
            if (!field.input) return;
            
            // Create toggle icon
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'password-toggle';
            toggleIcon.innerHTML = '<i class="fas fa-eye"></i>';
            toggleIcon.style.position = 'absolute';
            toggleIcon.style.right = '15px';
            toggleIcon.style.top = '50%';
            toggleIcon.style.transform = 'translateY(-50%)';
            toggleIcon.style.cursor = 'pointer';
            toggleIcon.style.color = '#777';
            toggleIcon.style.zIndex = '10';
            
            // Append toggle icon to the input's parent
            const formGroup = field.input.closest('.form-group');
            if (formGroup) {
                // Position the container relatively for absolute positioning of the icon
                formGroup.style.position = 'relative';
                
                // Add padding to the right of the input for the icon
                field.input.style.paddingRight = '40px';
                
                // Add the icon after the input
                field.input.parentNode.appendChild(toggleIcon);
                
                // Store the icon reference
                field.icon = toggleIcon;
                
                // Add click event to toggle password visibility
                toggleIcon.addEventListener('click', function() {
                    if (field.input.type === 'password') {
                        field.input.type = 'text';
                        toggleIcon.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                        field.input.type = 'password';
                        toggleIcon.innerHTML = '<i class="fas fa-eye"></i>';
                    }
                });
            }
        });
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
        const registerForm = document.getElementById('register-form');
        const usernameInput = document.getElementById('username');
        const password1Input = document.getElementById('password1');
        const password2Input = document.getElementById('password2');
        const termsCheckbox = document.querySelector('input[name="terms"]');
        
        if (!registerForm || !usernameInput || !password1Input || !password2Input) return;
        
        // Add form validation
        registerForm.addEventListener('submit', function(e) {
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
            isValid = false;
            } else if (usernameInput.value.trim().length < 3) {
                e.preventDefault();
                markFieldAsInvalid(usernameInput, 'Username must be at least 3 characters');
            isValid = false;
            }
            
            // Validate password
            if (!password1Input.value) {
                e.preventDefault();
                markFieldAsInvalid(password1Input, 'Password is required');
            isValid = false;
            } else if (password1Input.value.length < 8) {
                e.preventDefault();
                markFieldAsInvalid(password1Input, 'Password must be at least 8 characters');
            isValid = false;
            }
            
            // Validate password confirmation
            if (!password2Input.value) {
                e.preventDefault();
                markFieldAsInvalid(password2Input, 'Please confirm your password');
                isValid = false;
            } else if (password1Input.value !== password2Input.value) {
                e.preventDefault();
                markFieldAsInvalid(password2Input, 'Passwords do not match');
                isValid = false;
            }
            
            // Validate terms acceptance
            if (termsCheckbox && !termsCheckbox.checked) {
                e.preventDefault();
                const formGroup = termsCheckbox.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('error');
                    formGroup.classList.add('shake');
                    
                    // Add error message
                    const errorMessage = document.createElement('span');
                    errorMessage.className = 'error-message';
                    errorMessage.textContent = 'You must agree to the terms';
                    
                    // Check if error message already exists
                    if (!formGroup.querySelector('.error-message')) {
                        formGroup.appendChild(errorMessage);
                    }
                }
                isValid = false;
            }
            
            // Show error notification if form is invalid
            if (!isValid) {
                showNotification('Please correct the errors in the form', 'error');
            }
        });
        
        // Add input event listeners to clear error state on typing
        [usernameInput, password1Input, password2Input].forEach(input => {
            input.addEventListener('input', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup && formGroup.classList.contains('error')) {
                    formGroup.classList.remove('error');
                    formGroup.classList.remove('shake');
                    
                    // Remove error message
                    const errorMessage = formGroup.querySelector('.error-message');
                    if (errorMessage) errorMessage.remove();
                }
                
                // Clear browser validation messages
                this.setCustomValidity('');
                
                // For password confirmation, validate match on input
                if (this === password2Input || this === password1Input) {
                    if (password1Input.value && password2Input.value) {
                        if (password1Input.value !== password2Input.value) {
                            markFieldAsInvalid(password2Input, 'Passwords do not match');
                        }
                    }
                }
            });
        });
        
        // Add change event for terms checkbox
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', function() {
                const formGroup = this.closest('.form-group');
                if (formGroup) {
                    if (this.checked && formGroup.classList.contains('error')) {
                        formGroup.classList.remove('error');
                        formGroup.classList.remove('shake');
                        
                        // Remove error message
                        const errorMessage = formGroup.querySelector('.error-message');
                        if (errorMessage) errorMessage.remove();
                    }
                }
            });
        }
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

