// game.js
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreBoard = document.getElementById('scoreBoard');
const highScoreBoard = document.getElementById('highScoreBoard');
const pauseButton = document.getElementById('pauseButton');
const buttonImage = document.getElementById('buttonImage');
const startingScreen = document.getElementById('startingScreen');

let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let enemies = [];
let powerUps = [];
let enemySpawnInterval;
let powerUpSpawnInterval;
let gameInterval;
let playerSpeed = 2.25;
let frozenEnemies = [];
let speedBoostEndTime = 0;
let isPaused = true; // Start in paused state
let isSpawningActive = false;

let enemySpeed = 0.7;
const maxEnemySpeed = enemySpeed * 2;

let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
};

highScoreBoard.innerText = `High Score: ${highScore}`;

function resetGame() {
    score = 0;
    enemies.forEach(enemy => enemy.remove());
    enemies = [];
    powerUps.forEach(powerUp => powerUp.remove());
    powerUps = [];
    updateScore();
    startSpawning();
}

function updateScore() {
    scoreBoard.innerText = `Score: ${score}`;
}

function startSpawning() {
    if (isSpawningActive) return;
    isSpawningActive = true;

    enemySpawnInterval = setInterval(() => {
        if (!isPaused) {
            spawnEnemy();
        }
    }, 5000);

    powerUpSpawnInterval = setInterval(() => {
        if (!isPaused) {
            spawnPowerUp();
        }
    }, 20000);
}

function spawnEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    const playerRect = player.getBoundingClientRect();
    let x, y, distance;

    do {
        x = Math.random() * (gameArea.clientWidth - 30);
        y = Math.random() * (gameArea.clientHeight - 30);
        const enemyRect = { left: x, top: y, width: 30, height: 30 };
        distance = Math.sqrt(
            Math.pow(playerRect.left + playerRect.width / 2 - (enemyRect.left + enemyRect.width / 2), 2) +
            Math.pow(playerRect.top + playerRect.height / 2 - (enemyRect.top + enemyRect.height / 2), 2)
        );
    } while (distance < 120);

    enemy.style.left = `${x}px`;
    enemy.style.top = `${y}px`;
    gameArea.appendChild(enemy);
    enemies.push(enemy);
}

function spawnPowerUp() {
    const powerUp = document.createElement('div');
    powerUp.classList.add('power-up');

    const x = Math.random() * (gameArea.clientWidth - 30);
    const y = Math.random() * (gameArea.clientHeight - 30);

    powerUp.style.left = `${x}px`;
    powerUp.style.top = `${y}px`;

    const type = Math.random() < 0.5 ? 1 : 2;
    powerUp.setAttribute('data-type', type);
    if (type === 1) {
        powerUp.style.backgroundImage = "url('https://imagizer.imageshack.com/v2/361x361q70/r/923/PoWJh7.png')";
    } else {
        powerUp.style.backgroundImage = "url('https://cdn4.iconfinder.com/data/icons/snow-glyph/512/Flake_snow_snowflake-512.png')";
    }

    gameArea.appendChild(powerUp);
    powerUps.push(powerUp);

    setTimeout(() => {
        if (gameArea.contains(powerUp)) {
            powerUp.remove();
            powerUps = powerUps.filter(p => p !== powerUp);
        }
    }, 80000);
}

function moveEnemies() {
    enemies.forEach((enemy) => {
        if (!frozenEnemies.includes(enemy)) {
            const enemyRect = enemy.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();
            const dx = playerRect.x - enemyRect.x;
            const dy = playerRect.y - enemyRect.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 1) {
                enemy.style.left = `${enemyRect.x + (dx / distance) * enemySpeed}px`;
                enemy.style.top = `${enemyRect.y + (dy / distance) * enemySpeed}px`;
            }
        }
    });
}

function increaseEnemySpeed() {
    if (!isPaused && frozenEnemies.length === 0) {
        if (enemySpeed < maxEnemySpeed) {
            enemySpeed *= 1.01;
            if (enemySpeed > maxEnemySpeed) {
                enemySpeed = maxEnemySpeed;
            }
        }
    }
}

function checkCollisions() {
    const playerRect = player.getBoundingClientRect();
    enemies.forEach(enemy => {
        if (!frozenEnemies.includes(enemy)) {
            const enemyRect = enemy.getBoundingClientRect();
            if (
                playerRect.x < enemyRect.x + enemyRect.width &&
                playerRect.x + playerRect.width > enemyRect.x &&
                playerRect.y < enemyRect.y + enemyRect.height &&
                playerRect.height + playerRect.y > enemyRect.y
            ) {
                endGame();
            }
        }
    });
}

function checkPowerUpCollisions() {
    const playerRect = player.getBoundingClientRect();
    powerUps.forEach(powerUp => {
        const powerUpRect = powerUp.getBoundingClientRect();
        if (
            playerRect.x < powerUpRect.x + powerUpRect.width &&
            playerRect.x + playerRect.width > powerUpRect.x &&
            playerRect.y < powerUpRect.y + powerUpRect.height &&
            playerRect.height + playerRect.y > powerUpRect.y
        ) {
            handlePowerUp(powerUp);
        }
    });
}

function createTrail(x, y) {
    const trail = document.createElement('div');
    trail.classList.add('trail');
    trail.style.left = `${x - 10}px`;
    trail.style.top = `${y - 10}px`;
    gameArea.appendChild(trail);

    setTimeout(() => {
        trail.style.opacity = '0';
        setTimeout(() => {
            trail.remove();
            if (Date.now() >= speedBoostEndTime) {
                playerSpeed = 2.25;
            }
        }, 300);
    }, 100);
}

function movePlayer() {
    if (isPaused) return;

    const rect = player.getBoundingClientRect();

    if (keys.w && rect.top > 0) {
        player.style.top = `${rect.top - playerSpeed}px`;
    } else if (keys.s && rect.bottom < window.innerHeight) {
        player.style.top = `${rect.top + playerSpeed}px`;
    } else if (keys.a && rect.left > 0) {
        player.style.left = `${rect.left - playerSpeed}px`;
    } else if (keys.d && rect.right < window.innerWidth) {
        player.style.left = `${rect.left + playerSpeed}px`;
    }

    if (Date.now() < speedBoostEndTime) {
        createTrail(rect.left + 15, rect.top + 15);
    }

    moveEnemies();
    checkCollisions();
    checkPowerUpCollisions();
}

function handlePowerUp(powerUp) {
    const type = powerUp.getAttribute('data-type');

    if (type == 1) {
        const now = Date.now();
        if (now < speedBoostEndTime) {
            speedBoostEndTime += 10000; // Extend time
        } else {
            playerSpeed = 5; // Speed boost
            speedBoostEndTime = now + 10000; // Set new end time
        }
    } else if (type == 2) {
        frozenEnemies = [...enemies];
        frozenEnemies.forEach(enemy => {
            enemy.style.backgroundColor = 'cyan';
        });

        setTimeout(() => {
            frozenEnemies.forEach(enemy => {
                enemy.style.backgroundColor = 'red';
            });
            frozenEnemies = [];
        }, 5000);
    }

    powerUp.remove();
    powerUps = powerUps.filter(p => p !== powerUp);
}

function endGame() {
    clearInterval(enemySpawnInterval);
    clearInterval(powerUpSpawnInterval);
    isSpawningActive = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreBoard.innerText = `High Score: ${highScore}`;
    }

    createExplosion();
    resetGame();
}

function createExplosion() {
    const playerRect = player.getBoundingClientRect();
    const explosionCount = 30;

    for (let i = 0; i < explosionCount; i++) {
        const pixel = document.createElement('div');
        pixel.classList.add('pixel');
        pixel.style.left = `${playerRect.left + 10}px`;
        pixel.style.top = `${playerRect.top + 10}px`;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 30 + 20;
        const translateX = Math.cos(angle) * distance;
        const translateY = Math.sin(angle) * distance;
        pixel.style.transform = `translate(${translateX}px, ${translateY}px)`;
        pixel.style.opacity = '0';
        gameArea.appendChild(pixel);
        setTimeout(() => {
            pixel.remove();
        }, 500);
    }
}

function startGame() {
    resetGame();
    gameInterval = setInterval(() => {
        if (!isPaused) {
            score++;
            updateScore();
            movePlayer();
        }
    }, 1000 / 60);

    setInterval(increaseEnemySpeed, 5000);
    startSpawning();
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js') // Ensure this path is correct
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.error('Service Worker registration failed:', error);
        });
} else {
    console.warn('Service workers are not supported in this browser.');
}

// Pause functionality
pauseButton.addEventListener('click', function () {
    isPaused = !isPaused;
    buttonImage.src = isPaused
        ? 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdRyxOH6cg2DlA-GPCASXmYlVia1Kt5U8fTw&s'
        : 'https://imagizer.imageshack.com/v2/361x361q70/r/924/sAFgKF.png';

    if (isPaused) {
        // Show the starting screen and change text
        startingScreen.style.display = 'flex'; // Display the starting screen
        document.getElementById('startingText').innerText = 'The game is paused. Use WASD to unpause'; // Change text
    } else {
        startingScreen.style.display = 'none'; // Hide starting screen
    }
});

// Add event listeners for key state changes
document.addEventListener('keydown', function (event) {
    // Unpause the game when any of the WASD keys are pressed
    if (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd') {
        if (isPaused) {
            isPaused = false; // Unpause the game
            buttonImage.src = 'https://imagizer.imageshack.com/v2/361x361q70/r/924/sAFgKF.png'; // Update pause button image
            startingScreen.style.display = 'none'; // Hide starting screen
        }
    }

    // Allow only one key to move at a time
    if (event.key === 'w') { keys.w = true; keys.s = false; keys.a = false; keys.d = false; }
    if (event.key === 'a') { keys.w = false; keys.s = false; keys.a = true; keys.d = false; }
    if (event.key === 's') { keys.w = false; keys.s = true; keys.a = false; keys.d = false; }
    if (event.key === 'd') { keys.w = false; keys.s = false; keys.a = false; keys.d = true; }
});

document.addEventListener('keyup', function (event) {
    chrome.action.onClicked.addListener((tab) => {
        chrome.windows.create({
          url: chrome.runtime.getURL("cuberun.html"),
          type: "popup",
          width: Math.floor(screen.width * 0.6), // 60% of screen width
          height: Math.floor(screen.height * 0.6), // 60% of screen height
        });
      });
    if (event.key === 'w') keys.w = false;
    if (event.key === 'a') keys.a = false;
    if (event.key === 's') keys.s = false;
    if (event.key === 'd') keys.d = false;
});

// Event listener for tab visibility
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        // If the document is no longer visible
        isPaused = true;
        buttonImage.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdRyxOH6cg2DlA-GPCASXmYlVia1Kt5U8fTw&s';
        startingScreen.style.display = 'flex'; // Show starting screen
        document.getElementById('startingText').innerText = 'The game is paused. Use WASD to unpause';
    }
});

startGame(); // Start the game
