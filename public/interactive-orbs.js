// Optimized Interactive Orbs JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const orbs = document.querySelectorAll('.interactive-orb');
    
    orbs.forEach((orb, index) => {
        // Simple click effect
        orb.addEventListener('click', function(e) {
            // Single ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'orb-trail';
            ripple.style.width = this.offsetWidth + 'px';
            ripple.style.height = this.offsetHeight + 'px';
            ripple.style.left = '0';
            ripple.style.top = '0';
            ripple.style.background = window.getComputedStyle(this).background;
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 1000);
            
            // Simple glow effect
            this.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.8)';
            this.style.transform = 'scale(1.2)';
            
            setTimeout(() => {
                this.style.boxShadow = '';
                this.style.transform = '';
            }, 500);
        });
        
        // Simple mouse move effect
        orb.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.1)`;
        });
        
        // Mouse leave effect
        orb.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        // Random color change on double click
        orb.addEventListener('dblclick', function() {
            const colors = [
                'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                'linear-gradient(45deg, #f59e0b, #d97706)',
                'linear-gradient(45deg, #10b981, #059669)',
                'linear-gradient(45deg, #ef4444, #dc2626)',
                'linear-gradient(45deg, #06b6d4, #0891b2)',
                'linear-gradient(45deg, #f97316, #ea580c)',
                'linear-gradient(45deg, #84cc16, #65a30d)'
            ];
            
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.style.background = randomColor;
            
            // Add sparkle effect
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'particle particle-1';
                    sparkle.style.position = 'absolute';
                    sparkle.style.left = Math.random() * 20 - 10 + 'px';
                    sparkle.style.top = Math.random() * 20 - 10 + 'px';
                    sparkle.style.animation = 'orbTrail 0.8s ease-out forwards';
                    
                    this.appendChild(sparkle);
                    
                    setTimeout(() => {
                        if (sparkle.parentNode) {
                            sparkle.parentNode.removeChild(sparkle);
                        }
                    }, 800);
                }, i * 100);
            }
        });
    });
    
    // Add floating animation to particles
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
        particle.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.5)';
            this.style.opacity = '1';
        });
        
        particle.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.opacity = '0.7';
        });
    });
});

// Simple dynamic behavior
setInterval(() => {
    const orbs = document.querySelectorAll('.interactive-orb');
    orbs.forEach(orb => {
        // Simple random glow
        if (Math.random() < 0.05) {
            orb.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
            setTimeout(() => {
                orb.style.boxShadow = '';
            }, 1500);
        }
    });
}, 6000);
