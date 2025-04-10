// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 30;
const ITEM_SIZE = 20;
const PLAYER_SPEED = 5;

// Game state
let score = 0;
let lives = 3;
let level = 1;
let timeLeft = 120;
let player;
let items = [];
let enemies = [];
let powerUps = [];
let obstacles = [];
let particles = [];
let playerInvincible = false;
let gameStarted = false;
let gamePaused = false;
let gameMode = 'classic';
let lastUpdateTime = Date.now();
let timerInterval;

// Initialize canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// High scores
let highScores = {
    classic: [],
    timeAttack: []
};

// Load high scores
function loadHighScores() {
    const savedScores = localStorage.getItem('collectorHighScores');
    if (savedScores) {
        highScores = JSON.parse(savedScores);
        updateHighScoresDisplay();
    }
}

// Save high scores
function saveHighScores() {
    localStorage.setItem('collectorHighScores', JSON.stringify(highScores));
    updateHighScoresDisplay();
}

// Show start screen
function showStartScreen() {
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome to Collector Adventure!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText('Choose a game mode to start', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
}

// Update high scores display
function updateHighScoresDisplay() {
    const classicList = document.getElementById('classicScores');
    const timeAttackList = document.getElementById('timeAttackScores');
    
    classicList.innerHTML = highScores.classic
        .map(score => `<li>${score} points</li>`)
        .join('');
    
    timeAttackList.innerHTML = highScores.timeAttack
        .map(score => `<li>${score} points</li>`)
        .join('');
}

// Add new high score
function addHighScore(mode, score) {
    highScores[mode].push(score);
    highScores[mode].sort((a, b) => b - a);
    highScores[mode] = highScores[mode].slice(0, 5);
    saveHighScores();
}

// Start game
function startGame(mode) {
    gameMode = mode;
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('timer').style.display = mode === 'timeAttack' ? 'inline' : 'none';
    
    initGame();
    gameStarted = true;
    gamePaused = false;
    
    if (mode === 'timeAttack') {
        timeLeft = 120;
        startTimer();
    }
    
    requestAnimationFrame(gameLoop);
}

// Timer functions
function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            gameOver('Time\'s up!');
        }
    }, 1000);
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Pause game
function pauseGame() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        clearInterval(timerInterval);
    } else if (gameMode === 'timeAttack') {
        startTimer();
    }
}

// Return to menu
function returnToMenu() {
    gameStarted = false;
    clearInterval(timerInterval);
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
    showStartScreen();
}

// Game initialization
function initGame() {
    player = new Player();
    items = [];
    enemies = [];
    powerUps = [];
    obstacles = [];
    particles = [];
    score = 0;
    lives = 3;
    level = 1;
    playerInvincible = false;
    
    for (let i = 0; i < 3; i++) {
        obstacles.push(new Obstacle());
    }
    
    spawnItems();
    spawnEnemies();
    updateScore();
    updateLives();
    updateLevel();
}

// Spawn game objects
function spawnItems() {
    while (items.length < 5) {
        items.push(new Item());
    }
}

function spawnEnemies() {
    const targetEnemies = gameMode === 'timeAttack' ? level + 3 : level + 2;
    while (enemies.length < targetEnemies) {
        enemies.push(new Enemy());
    }
}

function spawnPowerUp() {
    if (Math.random() < 0.1 && powerUps.length < 2) {
        powerUps.push(new PowerUp());
    }
}

// Update displays
function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function updateLives() {
    document.getElementById('lives').textContent = `Lives: ${lives}`;
}

function updateLevel() {
    document.getElementById('level').textContent = `Level: ${level}`;
}

// Check collisions
function checkCollisions() {
    // Check item collisions
    items.forEach((item, index) => {
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.size/2 + item.size/2)) {
            items.splice(index, 1);
            score += item.value;
            particles.push(new Particle(item.x, item.y, '#fff', `+${item.value}`));
            updateScore();
            spawnItems();
            
            if (score >= level * 100) {
                level++;
                updateLevel();
                spawnEnemies();
            }
        }
    });
    
    // Check enemy collisions
    if (!playerInvincible) {
        enemies.forEach(enemy => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (player.size/2 + enemy.size/2)) {
                lives--;
                updateLives();
                if (lives <= 0) {
                    gameOver('Game Over!');
                } else {
                    resetPlayerPosition();
                }
            }
        });
    }
    
    // Check power-up collisions
    powerUps.forEach((powerUp, index) => {
        const dx = player.x - powerUp.x;
        const dy = player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.size/2 + powerUp.size/2)) {
            activatePowerUp(powerUp.type);
            powerUps.splice(index, 1);
            particles.push(new Particle(powerUp.x, powerUp.y, powerUp.color, `+${powerUp.type}`));
        }
    });
}

// Reset player position
function resetPlayerPosition() {
    player.x = CANVAS_WIDTH / 2;
    player.y = CANVAS_HEIGHT / 2;
    playerInvincible = true;
    setTimeout(() => {
        playerInvincible = false;
    }, 2000);
}

// Activate power-ups
function activatePowerUp(type) {
    if (type === 'shield') {
        playerInvincible = true;
        setTimeout(() => {
            playerInvincible = false;
        }, 5000);
    } else if (type === 'speed') {
        const originalSpeed = player.speed;
        player.speed *= 1.5;
        setTimeout(() => {
            player.speed = originalSpeed;
        }, 5000);
    }
}

// Game over
function gameOver(message) {
    gameStarted = false;
    clearInterval(timerInterval);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(message, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    addHighScore(gameMode, score);
    
    setTimeout(() => {
        returnToMenu();
    }, 3000);
}

// Game update
function update() {
    if (!gamePaused && gameStarted) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        obstacles.forEach(obstacle => obstacle.draw());
        
        enemies.forEach(enemy => {
            enemy.move();
            enemy.draw();
        });
        
        items.forEach(item => item.draw());
        powerUps.forEach(powerUp => powerUp.draw());
        
        player.draw();
        
        particles = particles.filter(particle => particle.alpha > 0);
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        checkCollisions();
        
        if (Math.random() < 0.005) {
            spawnPowerUp();
        }
    }
}

// Handle input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'p') {
        pauseGame();
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);

function handleInput() {
    if (!gamePaused && gameStarted) {
        const moveSpeed = player.speed;
        if (keys['ArrowLeft'] || keys['a']) player.move(-moveSpeed, 0);
        if (keys['ArrowRight'] || keys['d']) player.move(moveSpeed, 0);
        if (keys['ArrowUp'] || keys['w']) player.move(0, -moveSpeed);
        if (keys['ArrowDown'] || keys['s']) player.move(0, moveSpeed);
    }
}

// Main game loop
function gameLoop() {
    handleInput();
    update();
    if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize the game
loadHighScores();
showStartScreen();
