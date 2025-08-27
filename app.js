// Enhanced Goblin Market Scramble with Mobile Support
// Game state and configuration
const game = {
    canvas: null,
    ctx: null,
    state: 'menu', // 'menu', 'playing', 'gameOver', 'leaderboard', 'instructions'
    score: 0,
    combo: 1,
    maxCombo: 1,
    timeLeft: 60,
    lastTime: 0,
    lastSpawn: 0,
    spawnInterval: 1200,
    stars: [],
    screenScale: 1,
    isMobile: false
};

// Player object - Golden mystical basket
const player = {
    x: 350,
    y: 450,
    width: 80,
    height: 25,
    speed: 8,
    color: '#ffd700'
};

// Items array
let items = [];

// Input tracking
const keys = {
    left: false,
    right: false
};

// Touch tracking for mobile
const touch = {
    left: false,
    right: false
};

// Leaderboard management
const leaderboard = {
    scores: [],
    
    load() {
        try {
            const saved = localStorage.getItem('goblinMarketScores');
            this.scores = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.scores = [];
        }
    },
    
    save() {
        try {
            localStorage.setItem('goblinMarketScores', JSON.stringify(this.scores));
        } catch (e) {
            console.warn('Could not save scores to localStorage');
        }
    },
    
    addScore(score, combo) {
        const entry = {
            score: score,
            combo: combo,
            date: new Date().toLocaleDateString(),
            achievement: this.getAchievement(score, combo)
        };
        
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, 10); // Keep top 10
        this.save();
        
        return this.scores.findIndex(s => s === entry) + 1;
    },
    
    getAchievement(score, combo) {
        if (score >= 2000) return "Legendary Collector";
        if (score >= 1500) return "Master Gatherer";
        if (score >= 1000) return "Expert Hunter";
        if (score >= 500) return "Skilled Seeker";
        if (combo >= 20) return "Combo Master";
        if (combo >= 10) return "Chain Builder";
        return "Brave Adventurer";
    },
    
    getRank(score) {
        let rank = 1;
        for (let entry of this.scores) {
            if (entry.score > score) rank++;
        }
        return rank;
    }
};

// Enhanced Item class with magical effects
class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.speed = 2 + Math.random() * 2;
        this.type = type;
        this.age = 0;
        this.rotation = 0;
        this.sparkles = [];
        
        if (type === 'gem') {
            this.width = 20;
            this.height = 20;
            this.color = this.getGemColor();
            // Create sparkle effects
            for (let i = 0; i < 6; i++) {
                this.sparkles.push({
                    angle: (Math.PI * 2 / 6) * i,
                    distance: 15 + Math.random() * 10,
                    speed: 0.02 + Math.random() * 0.03,
                    opacity: 0.3 + Math.random() * 0.7
                });
            }
        } else {
            this.width = 18;
            this.height = 18;
            this.rockPoints = this.generateRockShape();
        }
    }
    
    getGemColor() {
        const colors = [
            { r: 100, g: 200, b: 255 }, // Ice blue
            { r: 255, g: 100, b: 200 }, // Pink
            { r: 150, g: 255, b: 100 }, // Green
            { r: 255, g: 200, b: 100 }, // Gold
            { r: 200, g: 100, b: 255 }  // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateRockShape() {
        const points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const radius = 6 + Math.random() * 4;
            points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        return points;
    }
    
    update(deltaTime) {
        this.y += this.speed;
        this.age += deltaTime;
        this.rotation += 0.02;
        
        if (this.type === 'gem') {
            // Update sparkles
            this.sparkles.forEach(sparkle => {
                sparkle.angle += sparkle.speed;
            });
        }
    }
    
    render(ctx) {
        if (this.type === 'gem') {
            this.renderEnhancedGem(ctx);
        } else {
            this.renderEnhancedRock(ctx);
        }
    }
    
    renderEnhancedGem(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const size = 10;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        // Magical aura
        const pulseIntensity = (Math.sin(this.age * 0.005) + 1) * 0.5;
        const auraSize = 15 + pulseIntensity * 8;
        
        const auraGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, auraSize);
        auraGradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.6 + pulseIntensity * 0.4})`);
        auraGradient.addColorStop(0.5, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${0.2 + pulseIntensity * 0.3})`);
        auraGradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Gem body - enhanced diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, -size * 0.3);
        ctx.lineTo(size * 0.7, size * 0.3);
        ctx.lineTo(0, size);
        ctx.lineTo(-size * 0.7, size * 0.3);
        ctx.lineTo(-size * 0.7, -size * 0.3);
        ctx.closePath();
        
        // Multi-layered gradient
        const gemGradient = ctx.createLinearGradient(-size, -size, size, size);
        gemGradient.addColorStop(0, `rgba(${Math.min(255, this.color.r + 80)}, ${Math.min(255, this.color.g + 80)}, ${Math.min(255, this.color.b + 80)}, 0.9)`);
        gemGradient.addColorStop(0.3, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`);
        gemGradient.addColorStop(0.7, `rgba(${Math.max(0, this.color.r - 50)}, ${Math.max(0, this.color.g - 50)}, ${Math.max(0, this.color.b - 50)}, 0.9)`);
        gemGradient.addColorStop(1, `rgba(${Math.max(0, this.color.r - 80)}, ${Math.max(0, this.color.g - 80)}, ${Math.max(0, this.color.b - 80)}, 0.8)`);
        
        ctx.fillStyle = gemGradient;
        ctx.fill();
        
        // Brilliant outline
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + pulseIntensity * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Facet lines
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(0, size * 0.6);
        ctx.moveTo(-size * 0.5, 0);
        ctx.lineTo(size * 0.5, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + pulseIntensity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Orbiting sparkles
        this.sparkles.forEach(sparkle => {
            const sparkleX = Math.cos(sparkle.angle) * sparkle.distance;
            const sparkleY = Math.sin(sparkle.angle) * sparkle.distance;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkle.opacity * pulseIntensity})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    renderEnhancedRock(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation * 0.5);
        
        // Dark aura/shadow
        const shadowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        shadowGradient.addColorStop(0, 'rgba(20, 10, 5, 0.6)');
        shadowGradient.addColorStop(0.5, 'rgba(20, 10, 5, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(20, 10, 5, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Jagged rock shape
        ctx.beginPath();
        if (this.rockPoints.length > 0) {
            ctx.moveTo(this.rockPoints[0].x, this.rockPoints[0].y);
            for (let i = 1; i < this.rockPoints.length; i++) {
                ctx.lineTo(this.rockPoints[i].x, this.rockPoints[i].y);
            }
            ctx.closePath();
        }
        
        // Rock gradient - very dark and ominous
        const rockGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, 10);
        rockGradient.addColorStop(0, '#4a3d32');
        rockGradient.addColorStop(0.4, '#2d1f16');
        rockGradient.addColorStop(0.8, '#1a110b');
        rockGradient.addColorStop(1, '#0a0502');
        
        ctx.fillStyle = rockGradient;
        ctx.fill();
        
        // Heavy outline
        ctx.strokeStyle = '#0f0a07';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Texture scratches
        ctx.strokeStyle = '#3d2f24';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const startX = (Math.random() - 0.5) * 10;
            const startY = (Math.random() - 0.5) * 10;
            const endX = startX + (Math.random() - 0.5) * 4;
            const endY = startY + (Math.random() - 0.5) * 4;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
        }
        ctx.stroke();
        
        ctx.restore();
    }
    
    isOffScreen(canvasHeight) {
        return this.y > canvasHeight + 20;
    }
}

// Initialize game
function init() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Detect mobile device
    game.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                    (window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches);
    
    // Setup canvas for high DPI displays
    setupCanvas();
    
    // Load leaderboard
    leaderboard.load();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show mobile controls on mobile devices
    if (game.isMobile) {
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'flex';
        }
    }
    
    // Start game loop
    game.lastTime = performance.now();
    gameLoop();
}

// Setup canvas for responsive and high DPI displays
function setupCanvas() {
    const canvas = game.canvas;
    const ctx = game.ctx;
    const dpr = window.devicePixelRatio || 1;
    
    // Calculate scale for mobile
    const containerWidth = Math.min(window.innerWidth - 32, 800);
    const containerHeight = Math.min(window.innerHeight * 0.6, 500);
    game.screenScale = Math.min(containerWidth / 800, containerHeight / 500);
    
    // Set actual size
    canvas.width = 800 * dpr;
    canvas.height = 500 * dpr;
    
    // Set display size
    canvas.style.width = (800 * game.screenScale) + 'px';
    canvas.style.height = (500 * game.screenScale) + 'px';
    
    // Scale context for high DPI
    ctx.scale(dpr, dpr);
    
    // Adjust player position for canvas height
    player.y = 450;
}

// Event listeners
function setupEventListeners() {
    // Menu navigation
    const startBtn = document.getElementById('startBtn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const instructionsBtn = document.getElementById('instructionsBtn');
    
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (leaderboardBtn) leaderboardBtn.addEventListener('click', showLeaderboard);
    if (instructionsBtn) instructionsBtn.addEventListener('click', showInstructions);
    
    // Navigation buttons
    const backFromLeaderboard = document.getElementById('backFromLeaderboard');
    const backFromInstructions = document.getElementById('backFromInstructions');
    
    if (backFromLeaderboard) backFromLeaderboard.addEventListener('click', showMenu);
    if (backFromInstructions) backFromInstructions.addEventListener('click', startGame);
    
    // Game over buttons
    const playAgainBtn = document.getElementById('playAgainBtn');
    const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    
    if (playAgainBtn) playAgainBtn.addEventListener('click', startGame);
    if (viewLeaderboardBtn) viewLeaderboardBtn.addEventListener('click', showLeaderboard);
    if (backToMenuBtn) backToMenuBtn.addEventListener('click', showMenu);
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Mobile touch controls
    setupTouchControls();
    
    // Canvas focus for keyboard
    if (game.canvas) {
        game.canvas.addEventListener('click', () => game.canvas.focus());
        game.canvas.tabIndex = 0; // Make canvas focusable
    }
    
    // Prevent scrolling on mobile
    document.addEventListener('touchmove', (e) => {
        if (game.state === 'playing') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Window resize
    window.addEventListener('resize', setupCanvas);
}

// Mobile touch controls
function setupTouchControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    if (!leftBtn || !rightBtn) return;
    
    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touch.left = true;
    });
    
    leftBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touch.left = false;
    });
    
    leftBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touch.left = true;
    });
    
    leftBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touch.left = false;
    });
    
    leftBtn.addEventListener('mouseleave', (e) => {
        touch.left = false;
    });
    
    // Right button
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touch.right = true;
    });
    
    rightBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        touch.right = false;
    });
    
    rightBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touch.right = true;
    });
    
    rightBtn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touch.right = false;
    });
    
    rightBtn.addEventListener('mouseleave', (e) => {
        touch.right = false;
    });
    
    // Prevent context menu on long press
    [leftBtn, rightBtn].forEach(btn => {
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
}

// Input handling
function handleKeyDown(e) {
    if (game.state !== 'playing') return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            e.preventDefault();
            break;
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
    }
}

// Screen management - Fixed to properly hide/show screens
function showMenu() {
    game.state = 'menu';
    hideAllScreens();
    const menuScreen = document.getElementById('menuScreen');
    if (menuScreen) {
        menuScreen.classList.remove('hidden');
    }
}

function showLeaderboard() {
    game.state = 'leaderboard';
    hideAllScreens();
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    if (leaderboardScreen) {
        leaderboardScreen.classList.remove('hidden');
        updateLeaderboardDisplay();
    }
}

function showInstructions() {
    game.state = 'instructions';
    hideAllScreens();
    const instructionsScreen = document.getElementById('instructionsScreen');
    if (instructionsScreen) {
        instructionsScreen.classList.remove('hidden');
    }
}

function showGame() {
    game.state = 'playing';
    hideAllScreens();
    const gameScreen = document.getElementById('gameScreen');
    if (gameScreen) {
        gameScreen.classList.remove('hidden');
    }
    if (game.canvas) {
        game.canvas.focus();
    }
}

function showGameOver() {
    game.state = 'gameOver';
    const rank = leaderboard.addScore(game.score, game.maxCombo);
    
    const finalScore = document.getElementById('finalScore');
    const bestCombo = document.getElementById('bestCombo');
    const playerRank = document.getElementById('playerRank');
    const achievementMessage = document.getElementById('achievementMessage');
    
    if (finalScore) finalScore.textContent = game.score;
    if (bestCombo) bestCombo.textContent = `x${game.maxCombo}`;
    if (playerRank) playerRank.textContent = `#${rank}`;
    
    const achievement = leaderboard.getAchievement(game.score, game.maxCombo);
    if (achievementMessage) achievementMessage.textContent = achievement;
    
    hideAllScreens();
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
    }
}

function hideAllScreens() {
    const screens = [
        'menuScreen',
        'gameScreen', 
        'leaderboardScreen',
        'instructionsScreen',
        'gameOverScreen'
    ];
    
    screens.forEach(screenId => {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('hidden');
        }
    });
}

// Game state management
function startGame() {
    game.score = 0;
    game.combo = 1;
    game.maxCombo = 1;
    game.timeLeft = 60;
    game.lastSpawn = performance.now();
    items = [];
    
    // Reset player position
    player.x = 360;
    
    // Reset input states
    keys.left = false;
    keys.right = false;
    touch.left = false;
    touch.right = false;
    
    showGame();
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    const list = document.getElementById('leaderboardList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (leaderboard.scores.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--color-text-secondary);">No scores yet. Be the first!</div>';
        return;
    }
    
    leaderboard.scores.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        div.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="score">${entry.score}</span>
            <span class="achievement">${entry.achievement}</span>
        `;
        list.appendChild(div);
    });
}

// Spawning system
function spawnItem(currentTime) {
    if (currentTime - game.lastSpawn >= game.spawnInterval) {
        const x = Math.random() * (800 - 30);
        const type = Math.random() < 0.75 ? 'gem' : 'rock';
        items.push(new Item(x, -20, type));
        game.lastSpawn = currentTime;
        
        // Increase difficulty over time
        game.spawnInterval = Math.max(800, 1200 - (60 - game.timeLeft) * 8);
    }
}

// Collision detection
function checkCollisions() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        
        if (item.x < player.x + player.width &&
            item.x + item.width > player.x &&
            item.y < player.y + player.height &&
            item.y + item.height > player.y) {
            
            if (item.type === 'gem') {
                game.score += 10 * game.combo;
                game.combo = Math.min(50, game.combo + 1);
                game.maxCombo = Math.max(game.maxCombo, game.combo);
            } else {
                game.score = Math.max(0, game.score - 15);
                game.combo = 1;
            }
            
            items.splice(i, 1);
        } else if (item.isOffScreen(500)) {
            if (item.type === 'gem') {
                game.combo = 1;
            }
            items.splice(i, 1);
        }
    }
}

// Update game logic
function update(deltaTime) {
    if (game.state !== 'playing') return;
    
    // Update timer
    game.timeLeft -= deltaTime / 1000;
    if (game.timeLeft <= 0) {
        game.timeLeft = 0;
        showGameOver();
        return;
    }
    
    // Player movement - combine keyboard and touch
    const moveLeft = keys.left || touch.left;
    const moveRight = keys.right || touch.right;
    
    if (moveLeft && player.x > 0) {
        player.x = Math.max(0, player.x - player.speed);
    }
    if (moveRight && player.x < 800 - player.width) {
        player.x = Math.min(800 - player.width, player.x + player.speed);
    }
    
    // Update items
    items.forEach(item => item.update(deltaTime));
    
    // Check collisions
    checkCollisions();
    
    // Spawn new items
    spawnItem(performance.now());
    
    // Update UI
    updateGameUI();
}

function updateGameUI() {
    const scoreValue = document.getElementById('scoreValue');
    const comboValue = document.getElementById('comboValue');
    const timerValue = document.getElementById('timerValue');
    
    if (scoreValue) scoreValue.textContent = game.score;
    if (comboValue) comboValue.textContent = `x${game.combo}`;
    if (timerValue) timerValue.textContent = Math.ceil(game.timeLeft);
}

// Render game
function render() {
    const ctx = game.ctx;
    
    if (game.state !== 'playing' || !ctx) return;
    
    // Clear canvas with mystical background
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, '#1a2f1a');
    gradient.addColorStop(0.5, '#0d1f0d');
    gradient.addColorStop(1, '#1a2f1a');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);
    
    // Add subtle mystical effects
    ctx.fillStyle = 'rgba(180, 140, 60, 0.05)';
    for (let i = 0; i < 20; i++) {
        const x = (performance.now() * 0.01 + i * 40) % 820;
        const y = (Math.sin(performance.now() * 0.001 + i) + 1) * 250;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Render golden mystical basket
    renderEnhancedBasket(ctx);
    
    // Render items
    items.forEach(item => item.render(ctx));
}

function renderEnhancedBasket(ctx) {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    ctx.save();
    
    // Golden glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, player.width);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, player.width, 0, Math.PI * 2);
    ctx.fill();
    
    // Main basket body with golden gradient
    const basketGradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    basketGradient.addColorStop(0, '#ffed4e');
    basketGradient.addColorStop(0.3, '#ffd700');
    basketGradient.addColorStop(0.7, '#ffb347');
    basketGradient.addColorStop(1, '#ff8c00');
    
    ctx.fillStyle = basketGradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Basket pattern/weave
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
        const x = player.x + (player.width / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, player.y);
        ctx.lineTo(x, player.y + player.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i < 3; i++) {
        const y = player.y + (player.height / 3) * i;
        ctx.beginPath();
        ctx.moveTo(player.x, y);
        ctx.lineTo(player.x + player.width, y);
        ctx.stroke();
    }
    
    // Golden outline
    ctx.strokeStyle = '#ffed4e';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
    
    // Magical handle
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, player.width * 0.6, 0, Math.PI);
    ctx.stroke();
    
    // Handle highlights
    ctx.strokeStyle = '#ffed4e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 5, player.width * 0.45, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    ctx.restore();
}

// Game loop
function gameLoop(currentTime) {
    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;
    
    update(deltaTime);
    render();
    
    requestAnimationFrame(gameLoop);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);