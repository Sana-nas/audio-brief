// Modern Base JavaScript - AudioBrief

document.addEventListener('DOMContentLoaded', function() {
  // Initialize elements that need JavaScript functionality
  initNavbar();
  initAnimations();
  initParticles();
  initMobileMenu();
  initTypewriterEffect();
  initStatsCounter();
  initHowItWorksSection();
  initWaveAnimation();
  
  // Add smooth scrolling to all internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === "#") return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // Force visibility for critical elements
  document.querySelectorAll('.step-card, .step-connector').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  
  // Ensure waves are animated
  document.querySelectorAll('.wave').forEach((wave, index) => {
    wave.style.animationPlayState = 'running';
    
    // Explicitly set different animation for each wave
    if (index === 0) {
      wave.style.animation = 'wave-animation 15s linear infinite';
    } else if (index === 1) {
      wave.style.animation = 'wave-animation 10s linear infinite reverse';
    } else if (index === 2) {
      wave.style.animation = 'wave-animation 12s linear infinite';
    }
  });
});

// Navbar functionality
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  
  // Change navbar style on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
  
  // Initial check for page refresh
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  }
  
  // Add active class to current page link
  const currentLocation = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentLocation) {
      link.classList.add('active');
    }
  });
}

// Mobile menu toggle
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
  }
  
  // Close mobile menu when clicking on a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
}

// Stats counter animation
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');
  let animated = false;
  
  const animateStats = () => {
    if (animated) return;
    
    stats.forEach(stat => {
      const targetValue = parseInt(stat.getAttribute('data-count'));
      let currentValue = 0;
      const increment = targetValue / 100;
      const duration = 2000; // 2 seconds
      const interval = duration / 100;
      
      const counter = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
          currentValue = targetValue;
          clearInterval(counter);
        }
        stat.textContent = Math.round(currentValue).toLocaleString();
      }, interval);
    });
    
    animated = true;
  };
  
  // Animate when the section is in view
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStats();
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.3});
    
    observer.observe(statsSection);
  }
}

// Initialize animations
function initAnimations() {
  // Initialize AOS library for scroll animations if available
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out',
      once: false,
      mirror: true,
    });
  }
  
  // Add parallax effect to hero section
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const circles = document.querySelectorAll('.animated-circle');
      
      circles.forEach(circle => {
        const speed = circle.getAttribute('data-speed') || 0.1;
        circle.style.transform = `translateY(${scrollTop * speed}px)`;
      });
    });
  }
}

// Initialize particles for wave background
function initParticles() {
  const waveBg = document.querySelector('.wave-bg');
  if (!waveBg) return;
  
  const setParticlePosition = (particle) => {
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.width = `${Math.random() * 4 + 2}px`;
    particle.style.height = particle.style.width;
    particle.style.animationDuration = `${Math.random() * 8 + 4}s`;
  };
  
  // Create particles
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    setParticlePosition(particle);
    waveBg.appendChild(particle);
    
    // Reset particle position when animation completes
    particle.addEventListener('animationiteration', () => {
      setParticlePosition(particle);
    });
  }
}

// Typewriter effect
function initTypewriterEffect() {
  const heroTitle = document.querySelector('.hero-title');
  if (!heroTitle || !heroTitle.getAttribute('data-typewriter')) return;
  
  const text = heroTitle.getAttribute('data-typewriter');
  
  // Create a container with the same height to prevent layout shifts
  const originalHeight = heroTitle.offsetHeight;
  heroTitle.style.minHeight = `${originalHeight}px`;
  heroTitle.style.display = 'block';
  
  heroTitle.innerHTML = '';
  
  let charIndex = 0;
  const typeSpeed = 50; // faster to prevent layout shifts for too long
  
  function typeWriter() {
    if (charIndex < text.length) {
      heroTitle.innerHTML += text.charAt(charIndex);
      charIndex++;
      setTimeout(typeWriter, typeSpeed);
    } else {
      // Add blinking cursor at the end
      heroTitle.innerHTML += '<span class="cursor-blink">|</span>';
    }
  }
  
  // Start the effect
  setTimeout(() => {
    typeWriter();
  }, 300); // Short delay to ensure page is ready
}

// Tilt effect for cards
class TiltElement {
  constructor(element, settings = {}) {
    this.element = element;
    this.settings = {
      max: 15,
      perspective: 1000,
      scale: 1.05,
      speed: 800,
      ...settings
    };
    
    this.init();
  }
  
  init() {
    this.element.style.transition = `transform ${this.settings.speed}ms ease-out`;
    
    this.element.addEventListener('mouseenter', () => {
      this.element.style.willChange = 'transform';
    });
    
    this.element.addEventListener('mousemove', (e) => {
      const rect = this.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      const rotateX = this.settings.max * mouseY / (rect.height / 2) * -1;
      const rotateY = this.settings.max * mouseX / (rect.width / 2);
      
      this.element.style.transform = `perspective(${this.settings.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${this.settings.scale}, ${this.settings.scale}, ${this.settings.scale})`;
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        setTimeout(() => {
        this.element.style.willChange = 'auto';
      }, this.settings.speed);
    });
  }
}

// Initialize tilt effect on feature cards when page is loaded
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.feature-card, .step-card').forEach(card => {
    new TiltElement(card, {
      max: 5,
      perspective: 1000,
      scale: 1.03
    });
  });
});

// Dark/Light mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  
  // Save preference to localStorage
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  
  // Change icon
  const modeToggle = document.querySelector('.mode-toggle i');
  if (modeToggle) {
    modeToggle.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Check for saved dark mode preference
function checkDarkModePreference() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    
    const modeToggle = document.querySelector('.mode-toggle i');
    if (modeToggle) {
      modeToggle.className = 'fas fa-sun';
    }
  }
}

// Initialize dark mode preference
document.addEventListener('DOMContentLoaded', checkDarkModePreference);

// Add wave animation logic to create dynamic moving waves
function initWaveAnimation() {
  const waves = document.querySelectorAll('.wave');
  if (!waves.length) return;
  
  // Make sure wave animations are running
  waves.forEach((wave, index) => {
    // Ensure animation is applied and running
    wave.style.animationPlayState = 'running';
    
    // Dynamically update wave styles for more organic movement
    setInterval(() => {
      const randomHeight = 0.3 + (Math.random() * 0.15);
      const randomScale = 0.9 + (Math.random() * 0.2);
      wave.style.transform = `scaleY(${randomHeight}) scaleX(${randomScale})`;
    }, 3000 + (index * 1000));
  });
  
  // Add audio waveform visualization
  initAudioWaveform();
}

// Function to create and animate the audio waveform visualization
function initAudioWaveform() {
  const waveformVisualization = document.querySelector('.waveform-visualization');
  if (!waveformVisualization) return;
  
  // Clear any existing bars
  waveformVisualization.innerHTML = '';
  
  // Create bars for the waveform
  const barCount = 50;
  for (let i = 0; i < barCount; i++) {
    const bar = document.createElement('div');
    bar.classList.add('waveform-bar');
    
    // Set random initial height for each bar
    const randomHeight = Math.random() * 70 + 10; // between 10% and 80%
    bar.style.height = `${randomHeight}%`;
    
    // Position bars evenly across the container
    bar.style.left = `${(i / barCount) * 100}%`;
    bar.style.width = `${80 / barCount}%`; // slightly less than 100/barCount to create gaps
    
    // Create animation with different timing for each bar
    const animationDuration = Math.random() * 1 + 0.5; // between 0.5 and 1.5 seconds
    bar.style.animation = `waveform-dance ${animationDuration}s ease-in-out infinite`;
    bar.style.animationDelay = `${i * (1.5 / barCount)}s`; // staggered delay
    
    waveformVisualization.appendChild(bar);
  }
  
  // Simulate play button functionality
  const playButton = document.querySelector('.play-button');
  if (playButton) {
    playButton.addEventListener('click', () => {
      const icon = playButton.querySelector('i');
      const isPlaying = icon.classList.contains('fa-pause');
      
      if (isPlaying) {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        // Pause animation
        document.querySelectorAll('.waveform-bar').forEach(bar => {
          bar.style.animationPlayState = 'paused';
        });
      } else {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        // Resume animation
        document.querySelectorAll('.waveform-bar').forEach(bar => {
          bar.style.animationPlayState = 'running';
            });
        }
    });
  }
  
  // Start with animations running
  document.querySelectorAll('.waveform-bar').forEach(bar => {
    bar.style.animationPlayState = 'running';
  });
}

// Initialize the How It Works section
function initHowItWorksSection() {
  const howItWorksSection = document.getElementById('how-it-works');
  if (!howItWorksSection) return;
  
  // Make sure step cards are visible
  const stepCards = document.querySelectorAll('.step-card');
  stepCards.forEach(card => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });
  
  // Make sure connectors are visible
  const stepConnectors = document.querySelectorAll('.step-connector');
  stepConnectors.forEach(connector => {
    connector.style.width = '100%';
  });
  
  // Add animation classes if needed
  howItWorksSection.classList.add('loaded');
  
  // Only use Intersection Observer for scroll animations, not initial visibility
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  // Observe for scroll effects, but elements should be visible initially
  [...stepCards, ...stepConnectors].forEach(element => {
    observer.observe(element);
  });
}

// Helper function to check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0 &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right >= 0
  );
}