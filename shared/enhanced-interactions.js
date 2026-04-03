/**
 * Ever Work - Enhanced Interactions
 * Confetti, haptic feedback, ripple effects, and delightful animations
 */

class EnhancedInteractions {
  constructor() {
    this.isTouch = window.matchMedia('(pointer: coarse)').matches;
    this.init();
  }

  init() {
    this.initRippleEffects();
    this.initHapticFeedback();
    this.initScrollAnimations();
  }

  // ============================================
  // Confetti Celebration
  // ============================================
  celebrate(options = {}) {
    const {
      particleCount = 50,
      colors = ['gold', 'orange', 'coral', 'white'],
      duration = 3000,
      origin = { x: 0.5, y: 0.5 }
    } = options;

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Create confetti particles
    for (let i = 0; i < particleCount; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      confetti.className = `confetti confetti--${color}`;
      
      // Random starting position around the origin
      const startX = (origin.x * 100) + (Math.random() - 0.5) * 20;
      confetti.style.left = `${startX}%`;
      confetti.style.top = `${origin.y * 100}%`;
      
      // Random animation properties
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 2;
      const rotation = Math.random() * 360;
      
      confetti.style.animationDelay = `${delay}s`;
      confetti.style.animationDuration = `${duration}s`;
      confetti.style.transform = `rotate(${rotation}deg)`;
      
      // Random horizontal drift
      const drift = (Math.random() - 0.5) * 200;
      confetti.style.setProperty('--drift', `${drift}px`);
      
      container.appendChild(confetti);
    }

    // Burst particles
    this.createBurst(origin);

    // Cleanup
    setTimeout(() => {
      container.remove();
    }, duration);

    // Haptic feedback
    this.haptic('success');
  }

  createBurst(origin) {
    const burst = document.createElement('div');
    burst.className = 'goal-burst';
    burst.style.left = `${origin.x * 100}%`;
    burst.style.top = `${origin.y * 100}%`;
    document.body.appendChild(burst);

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'goal-burst__particle';
      
      const angle = (360 / particleCount) * i;
      const distance = 100 + Math.random() * 100;
      const tx = Math.cos((angle * Math.PI) / 180) * distance;
      const ty = Math.sin((angle * Math.PI) / 180) * distance;
      
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.background = i % 2 === 0 ? '#FFD700' : '#FF9A56';
      
      burst.appendChild(particle);
    }

    setTimeout(() => burst.remove(), 1000);
  }

  // Goal completion celebration
  celebrateGoal() {
    this.celebrate({
      particleCount: 80,
      colors: ['gold', 'orange', 'coral', 'white'],
      duration: 4000,
      origin: { x: 0.5, y: 0.3 }
    });

    // Show goal completion message
    this.showGoalCompleteToast();
  }

  showGoalCompleteToast() {
    const messages = [
      '🎉 Daily goal crushed!',
      '⭐ Goal achieved! You\'re on fire!',
      '🏆 Daily target conquered!',
      '💪 Goal complete! Keep it up!',
      '🌟 Amazing work today!'
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    if (typeof showToast === 'function') {
      showToast(message, 'success');
    }
  }

  // ============================================
  // Ripple Effect
  // ============================================
  initRippleEffects() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.btn-primary, .btn-secondary, .job-card, .fab-primary');
      if (!button) return;
      
      this.createRipple(e, button);
    });
  }

  createRipple(e, element) {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple__effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
    ripple.style.marginLeft = ripple.style.marginTop = `${-Math.max(rect.width, rect.height) / 2}px`;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  // ============================================
  // Haptic Feedback
  // ============================================
  initHapticFeedback() {
    // Only enable on supported devices
    if (!this.isTouch) return;
    
    // Add haptic to interactive elements
    const selectors = '.btn-primary, .btn-secondary, .job-card, .fab-primary, button[type="submit"]';
    document.addEventListener('click', (e) => {
      if (e.target.closest(selectors)) {
        this.haptic('light');
      }
    });
  }

  haptic(type = 'light') {
    if (!navigator.vibrate) return;
    
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      error: [30, 50, 30],
      warning: [20, 30, 20]
    };
    
    navigator.vibrate(patterns[type] || patterns.light);
  }

  // ============================================
  // Scroll Animations
  // ============================================
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('stagger-item--visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements with stagger-item class
    document.querySelectorAll('.stagger-item').forEach(el => observer.observe(el));
  }

  // ============================================
  // Stagger Animation for Lists
  // ============================================
  staggerAnimate(elements, delay = 50) {
    elements.forEach((el, i) => {
      el.classList.add('stagger-item');
      setTimeout(() => {
        el.classList.add('stagger-item--visible');
      }, i * delay);
    });
  }

  // ============================================
  // Number Counter Animation
  // ============================================
  animateNumber(element, target, duration = 800) {
    const start = parseFloat(element.textContent) || 0;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeOut;
      
      element.textContent = current.toFixed(1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // ============================================
  // Shake Element (for errors)
  // ============================================
  shake(element) {
    element.classList.add('shake');
    this.haptic('error');
    setTimeout(() => element.classList.remove('shake'), 500);
  }

  // ============================================
  // Floating Animation
  // ============================================
  float(element, delay = 0) {
    element.classList.add('float-gentle');
    if (delay) {
      element.style.animationDelay = `${delay}s`;
    }
  }

  // ============================================
  // Pulse Animation
  // ============================================
  pulse(element, type = 'soft') {
    element.classList.add(type === 'ring' ? 'pulse-ring' : 'pulse-soft');
  }

  stopPulse(element) {
    element.classList.remove('pulse-ring', 'pulse-soft');
  }
}

// Create global instance
const interactions = new EnhancedInteractions();

// Export for use in other files
if (typeof window !== 'undefined') {
  window.interactions = interactions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnhancedInteractions, interactions };
}
