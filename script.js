// Sistema de música de fondo PERSISTENTE entre páginas
class BackgroundMusic {
    constructor() {
        this.audio = null;
        this.isMuted = localStorage.getItem('musicMuted') === 'true';
        this.isPlaying = false;
        this.volume = 0.4;
        this.currentTime = 0;
        this.init();
    }

    init() {
        // Recuperar el tiempo actual de sessionStorage
        this.currentTime = parseFloat(sessionStorage.getItem('musicCurrentTime')) || 0;
        
        // Crear elemento de audio
        this.audio = new Audio();
        this.audio.src = 'sounds/background/angry-birds-theme.mp3';
        this.audio.loop = true;
        this.audio.volume = this.volume;
        this.audio.preload = 'auto';
        
        // Establecer el tiempo guardado
        this.audio.currentTime = this.currentTime;
        
        // Cargar el audio
        this.audio.load();
        
        // Configurar eventos para guardar el tiempo
        this.setupTimeSaving();
        
        // Restaurar estado guardado
        this.updateButton();
        
        console.log('🎵 Sistema de música inicializado - Tiempo:', this.currentTime, 'Estado:', this.isMuted ? 'Muted' : 'Playing');
    }

    setupTimeSaving() {
        // Guardar el tiempo actual cada segundo
        setInterval(() => {
            if (this.audio && !this.isMuted) {
                this.currentTime = this.audio.currentTime;
                sessionStorage.setItem('musicCurrentTime', this.currentTime.toString());
            }
        }, 1000);

        // Guardar tiempo antes de cambiar de página
        window.addEventListener('beforeunload', () => {
            if (this.audio && !this.isMuted) {
                sessionStorage.setItem('musicCurrentTime', this.audio.currentTime.toString());
            }
        });
    }

    play() {
        if (this.isMuted || !this.audio) return;
        
        // Restaurar el tiempo guardado
        this.audio.currentTime = this.currentTime;
        
        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                console.log('🎶 Música de fondo reproduciéndose - Tiempo:', this.currentTime);
            }).catch(error => {
                console.log('❌ Error reproduciendo música:', error);
                this.enableAutoplay();
            });
        }
    }

    stop() {
        if (this.audio) {
            // Guardar tiempo actual antes de pausar
            this.currentTime = this.audio.currentTime;
            sessionStorage.setItem('musicCurrentTime', this.currentTime.toString());
            
            this.audio.pause();
            this.isPlaying = false;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        // Guardar estado en localStorage
        localStorage.setItem('musicMuted', this.isMuted.toString());
        
        if (this.isMuted) {
            this.stop();
        } else {
            this.play();
        }
        
        this.updateButton();
        this.showNotification();
        return this.isMuted;
    }

    enableAutoplay() {
        const enableMusic = () => {
            this.play();
            document.removeEventListener('click', enableMusic);
            document.removeEventListener('keydown', enableMusic);
        };
        
        document.addEventListener('click', enableMusic);
        document.addEventListener('keydown', enableMusic);
    }

    updateButton() {
        const muteBtn = document.getElementById('musicMuteBtn');
        if (muteBtn) {
            muteBtn.innerHTML = this.isMuted ? '🔇' : '🔊';
            muteBtn.title = this.isMuted ? 'Activar música' : 'Silenciar música';
        }
    }

    showNotification() {
        const notification = document.createElement('div');
        notification.className = 'music-notification';
        notification.textContent = this.isMuted ? 'Música desactivada' : 'Música activada';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }
}

// Inicializar sistema de música GLOBAL
const backgroundMusic = new BackgroundMusic();

// Sistema de sonidos de efectos
class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = localStorage.getItem('sfxMuted') === 'true';
        this.initSounds();
    }

    initSounds() {
        // Sonidos base64 como fallback
        const fallbackSound = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
        
        this.sounds = {
            buttonClick: this.createSound('sounds/ui/button-click.mp3') || this.createSound(fallbackSound),
            pageTransition: this.createSound('sounds/ui/page-transition.mp3') || this.createSound(fallbackSound),
            cardFlip: this.createSound('sounds/ui/card-flip.mp3') || this.createSound(fallbackSound),
            cardClose: this.createSound('sounds/ui/card-close.mp3') || this.createSound(fallbackSound),
            success: this.createSound('sounds/ui/success.mp3') || this.createSound(fallbackSound),
            birdSqueak: this.createSound(fallbackSound)
        };
    }

    createSound(src) {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        return audio;
    }

    play(soundName, volume = 0.3) {
        if (this.muted || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = volume;
            sound.play().catch(e => console.log('Error en sonido:', e));
        } catch (error) {
            console.log('Error con sonido:', error);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('sfxMuted', this.muted.toString());
        return this.muted;
    }
}

const soundManager = new SoundManager();

// Funcionalidad principal
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    createParticles();
    createMuteButton();
    
    // Iniciar música solo si estamos logueados y no está muteada
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const isMusicMuted = localStorage.getItem('musicMuted') === 'true';
    
    if (isLoggedIn && !isMusicMuted) {
        // Pequeño delay para asegurar que el audio esté listo
        setTimeout(() => {
            backgroundMusic.play();
        }, 300);
    }
});

// Crear botón mute global
function createMuteButton() {
    if (document.getElementById('musicMuteBtn')) return;
    
    const muteBtn = document.createElement('button');
    muteBtn.id = 'musicMuteBtn';
    muteBtn.innerHTML = backgroundMusic.isMuted ? '🔇' : '🔊';
    muteBtn.title = backgroundMusic.isMuted ? 'Activar música' : 'Silenciar música';
    
    muteBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, var(--primary-red), var(--primary-yellow));
        border: 3px solid var(--primary-blue);
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 1.8rem;
        cursor: pointer;
        box-shadow: var(--shadow);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    muteBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(10deg)';
        this.style.boxShadow = '0 8px 25px rgba(255, 215, 64, 0.4)';
    });
    
    muteBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
        this.style.boxShadow = 'var(--shadow)';
    });
    
    muteBtn.addEventListener('click', function() {
        backgroundMusic.toggleMute();
        soundManager.play('buttonClick', 0.3);
        
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    
    document.body.appendChild(muteBtn);
}

// Navegación entre páginas SIN detener música
function navigateTo(page) {
    soundManager.play('pageTransition', 0.3);
    
    // Guardar tiempo actual de la música ANTES de cambiar de página
    if (backgroundMusic.audio && !backgroundMusic.isMuted) {
        const currentTime = backgroundMusic.audio.currentTime;
        sessionStorage.setItem('musicCurrentTime', currentTime.toString());
        console.log('💾 Guardando tiempo de música:', currentTime);
    }
    
    // Animación de salida suave
    document.body.style.opacity = '0.7';
    document.body.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
        window.location.href = page;
    }, 300);
}

// Login function
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username && password) {
        soundManager.play('success', 0.5);
        
        const loginBtn = document.querySelector('.login-btn');
        loginBtn.style.background = 'linear-gradient(135deg, var(--primary-green), var(--primary-blue))';
        loginBtn.textContent = '¡Bienvenido! 🎉';
        
        setTimeout(() => {
            document.body.style.opacity = '0';
            document.body.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                localStorage.setItem('userLoggedIn', 'true');
                // Limpiar tiempo anterior al hacer login
                sessionStorage.removeItem('musicCurrentTime');
                window.location.href = 'inicio.html';
            }, 500);
        }, 1000);
    } else {
        soundManager.play('birdSqueak', 0.3);
        showNotification('⚠️ Completa todos los campos');
    }
}

function initializePage() {
    document.body.classList.add('page-enter');
    animateOnScroll();
    setupNavigation();
    preloadResources();
    initializeCardSystem();
    initializeCardDrag();
}

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach((card, index) => {
        card.style.setProperty('--delay', `${index * 0.1}s`);
        
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('flipped')) {
                soundManager.play('birdSqueak', 0.1);
                this.classList.add('hover-effect');
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover-effect');
        });
    });

    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            soundManager.play('buttonClick', 0.4);
            navigateTo(this.getAttribute('onclick').match(/'([^']+)'/)[1]);
        });
        
        button.addEventListener('mouseenter', function() {
            this.classList.add('breathe');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('breathe');
        });
    });

    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            soundManager.play('birdSqueak', 0.1);
        });
    });

    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            hero.style.transform = `translateY(${rate}px)`;
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'm' || e.key === 'M') {
            const muted = soundManager.toggleMute();
            showNotification(muted ? '🔇 Efectos desactivados' : '🔊 Efectos activados');
        }
        
        if (e.key === 'Escape') {
            const flippedCards = document.querySelectorAll('.character-card.flipped');
            flippedCards.forEach(card => {
                unflipCard(card);
            });
        }
    });
}

// Sistema de cartas flip
function initializeCardSystem() {
    const characterCards = document.querySelectorAll('.character-card');
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    document.body.appendChild(overlay);

    characterCards.forEach(card => {
        // Click para flip
        card.addEventListener('click', function(e) {
            if (!this.classList.contains('flipped')) {
                flipCard(this);
                soundManager.play('cardFlip', 0.4);
            }
        });

        // Botón de cerrar
        const closeBtn = card.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const card = this.closest('.character-card');
                unflipCard(card);
                soundManager.play('cardClose', 0.3);
            });
        }
    });

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', function() {
        const flippedCards = document.querySelectorAll('.character-card.flipped');
        flippedCards.forEach(card => {
            unflipCard(card);
        });
    });
}

function flipCard(card) {
    const overlay = document.querySelector('.card-overlay');
    const allCards = document.querySelectorAll('.character-card');
    
    // Desactivar otras cartas
    allCards.forEach(otherCard => {
        if (otherCard !== card) {
            otherCard.style.pointerEvents = 'none';
            otherCard.style.opacity = '0.6';
        }
    });

    // Activar overlay
    overlay.classList.add('active');
    
    // Añadir clase flipped
    card.classList.add('flipped', 'active', 'zoomed');
    card.style.zIndex = '1000';
    
    // Crear partículas de efecto
    createFlipParticles(card);
    
    // Animar barras de estadísticas
    animateStats(card);
}

function unflipCard(card) {
    const overlay = document.querySelector('.card-overlay');
    const allCards = document.querySelectorAll('.character-card');
    
    // Reactivar todas las cartas
    allCards.forEach(otherCard => {
        otherCard.style.pointerEvents = 'auto';
        otherCard.style.opacity = '1';
    });

    // Desactivar overlay
    overlay.classList.remove('active');
    
    // Sonido de cierre
    soundManager.play('cardClose', 0.4);
    
    // Remover clases
    card.classList.remove('flipped', 'active', 'zoomed');
    card.style.zIndex = '';
}

function createFlipParticles(card) {
    const rect = card.getBoundingClientRect();
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.left = '50%';
            particle.style.top = '50%';
            
            card.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 600);
        }, i * 50);
    }
}

function animateStats(card) {
    const statFills = card.querySelectorAll('.stat-fill');
    statFills.forEach((fill, index) => {
        setTimeout(() => {
            const currentWidth = fill.style.width;
            fill.style.width = '0%';
            
            setTimeout(() => {
                fill.style.width = currentWidth;
                fill.style.transition = 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            }, 100);
        }, index * 200);
    });
}

// Sistema de drag para cartas
function initializeCardDrag() {
    const cards = document.querySelectorAll('.character-card');
    
    cards.forEach(card => {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        card.addEventListener('mousedown', startDrag);
        card.addEventListener('touchstart', startDrag);
        
        function startDrag(e) {
            if (card.classList.contains('flipped')) return;
            
            isDragging = true;
            card.classList.add('dragging');
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            initialX = card.offsetLeft;
            initialY = card.offsetTop;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.1}deg)`;
        }
        
        function stopDrag() {
            if (!isDragging) return;
            
            isDragging = false;
            card.classList.remove('dragging');
            
            // Snap back to original position
            card.style.transform = '';
            card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            setTimeout(() => {
                card.style.transition = '';
            }, 500);
            
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }
    });
}

function setupNavigation() {
    highlightActiveNav();
    
    window.addEventListener('beforeunload', function() {
        document.body.classList.add('page-exit');
    });
}

function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.classList.remove('active');
        const targetPage = button.getAttribute('onclick');
        
        if (targetPage && targetPage.includes(currentPage)) {
            button.classList.add('active');
            button.style.animation = 'rubberBand 1s';
        }
        
        if (currentPage === 'index.html' && targetPage && targetPage.includes('inicio.html')) {
            button.classList.add('active');
        }
    });
}

function animateCharacter(character, element) {
    const img = element.querySelector('.character-img');
    
    switch(character) {
        case 'red':
            img.style.filter = 'hue-rotate(0deg) brightness(1.2)';
            break;
        case 'chuck':
            img.style.filter = 'hue-rotate(60deg) saturate(1.5)';
            break;
        case 'bomb':
            img.style.filter = 'brightness(1.3) contrast(1.2)';
            break;
        case 'matilda':
            img.style.filter = 'hue-rotate(300deg) brightness(1.1)';
            break;
        case 'blues':
            img.style.filter = 'hue-rotate(240deg) saturate(1.4)';
            break;
        case 'terence':
            img.style.filter = 'brightness(0.8) contrast(1.3)';
            break;
    }
    
    setTimeout(() => {
        img.style.filter = 'none';
    }, 500);
}

function createParticles() {
    const container = document.querySelector('main') || document.body;
    
    for (let i = 0; i < 20; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 6 + 2;
    const colors = ['var(--primary-red)', 'var(--primary-yellow)', 'var(--primary-blue)', 'var(--primary-green)'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${Math.random() * 100}%;
        animation: particle-float ${Math.random() * 3 + 2}s linear infinite;
        animation-delay: ${Math.random() * 2}s;
    `;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 5000);
}

function createConfetti(position) {
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const colors = ['var(--primary-red)', 'var(--primary-yellow)', 'var(--primary-blue)', 'var(--primary-green)'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.cssText = `
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${color};
                left: ${position.left + position.width / 2}px;
                top: ${position.top + position.height / 2}px;
                animation: confetti-fall ${Math.random() * 1 + 0.5}s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 1000);
        }, i * 50);
    }
}

function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.timeline-item, .character-card, .news-card').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });
}

function preloadResources() {
    const criticalImages = [
        'images/characters/red.png',
        'images/characters/chuck.png',
        'images/characters/bomb.png',
        'images/characters/matilda.png',
        'images/characters/blues.png',
        'images/characters/terence.png'
    ];
    
    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
    
    const music = new Audio();
    music.src = 'sounds/background/angry-birds-theme.mp3';
    music.preload = 'auto';
    music.load();
    
    console.log('🎵 Música precargada');
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--gradient-card);
        color: var(--text-primary);
        padding: 1rem 2rem;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--primary-yellow);
        box-shadow: var(--shadow);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: 'Bangers', cursive;
        letter-spacing: 1px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

function handleImageError(img, type) {
    console.log(`Error cargando imagen: ${img.src}`);
    
    const parent = img.parentElement;
    img.style.display = 'none';
    
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder character';
    placeholder.innerHTML = `
        <div style="font-size: 3rem;">🐦</div>
        <span style="margin-top: 1rem; font-size: 1.2rem;">${type.toUpperCase()}</span>
    `;
    
    parent.appendChild(placeholder);
}

let lastScrollTop = 0;
window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (Math.abs(scrollTop - lastScrollTop) > 5) {
        requestAnimationFrame(updateParallax);
    }
    
    lastScrollTop = scrollTop;
});

function updateParallax() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(el => {
        const rate = el.dataset.rate || 0.5;
        const move = scrolled * rate;
        el.style.transform = `translateY(${move}px)`;
    });
}

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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Exportar para uso global
window.backgroundMusic = backgroundMusic;
window.soundManager = soundManager;
window.navigateTo = navigateTo;
window.handleImageError = handleImageError;
window.flipCard = flipCard;
window.unflipCard = unflipCard;

// Inicialización final
console.log('🎮 El Nido - Fan Page de Angry Birds cargada correctamente');
console.log('🔊 Sistema de sonidos inicializado');
console.log('🃏 Sistema de cartas listo');
console.log('🎵 Sistema de música PERSISTENTE activado');
console.log('💾 SessionStorage listo para guardar tiempo de música');
console.log('🚀 Todas las funcionalidades cargadas');

// Debug: Mostrar tiempo guardado
console.log('⏰ Tiempo de música recuperado:', sessionStorage.getItem('musicCurrentTime'));