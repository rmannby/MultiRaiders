// --- Re‑usable localStorage keys ---            // *** NEW (CONST)  ***
const LS_KEYS = { NAME: 'mr_playerName', SCORE: 'mr_highScore' };
// 1. Press F12 (or Cmd‑Opt‑I on macOS) to open DevTools.
// 2. Choose “Console” and run
// localStorage.removeItem('mr_highScore')
// (You can also wipe the player name with
// localStorage.removeItem('mr_playerName') or clear everything via
// localStorage.clear().)

// --- Scenes (Defined First) ---

// 1. PreloadScene: Loads all assets (images, audio)
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("PreloadScene: Loading assets...");
        // Load necessary images (assuming these are 48x48 now)
        this.load.image('sky', 'assets/sky.png');
        this.load.image('player', 'assets/playerShip.png');
        this.load.image('enemy', 'assets/enemyShip.png');
        this.load.image('bullet', 'assets/bullet.png');

        // *** NEW: Load audio files ***
        // Updated to load MP3 files
        console.log("PreloadScene: Loading audio...");
        try {
            // *** CHANGED TO .mp3 ***
            this.load.audio('shootSound', 'assets/shoot.mp3'); // Sound for player shooting
            this.load.audio('hitCorrectSound', 'assets/hitCorrect.mp3'); // Sound for correct answer
            this.load.audio('hitWrongSound', 'assets/hitWrong.mp3'); // Sound for wrong answer / losing life
            this.load.audio('gameOverSound', 'assets/gameOver.mp3'); // Sound for game over
            // this.load.audio('backgroundMusic', 'assets/music.mp3'); // Optional background music
        } catch (error) {
            console.error("Error loading audio:", error);
            // Display error if audio couldn't be loaded (browser might not support the format?)
             this.add.text(this.game.config.width / 2, this.game.config.height - 10, 'Warning: Could not load audio files.', {
                fontSize: '12px', fill: '#ffdddd'
            }).setOrigin(0.5);
        }


        // Display a loading indicator
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        const gameWidth = this.game.config.width; // Get from game config
        const gameHeight = this.game.config.height;
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(gameWidth / 2 - 160, gameHeight / 2 - 25, 320, 50);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(gameWidth / 2 - 150, gameHeight / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            console.log("PreloadScene: Assets loaded!");
            progressBar.destroy();
            progressBox.destroy();
            this.scene.start('MainMenuScene'); // Go to main menu when everything is loaded
        }, this);

        this.load.on('loaderror', function (file) {
            // Check specifically for audio errors (can happen if format isn't supported)
            if (file.type === 'audio') {
                 console.warn(`Could not load audio: ${file.key}. Format might not be supported or file missing.`);
            } else {
                console.error('Error loading asset:', file.key, file.url);
                // Try to display the error more clearly in the game
                this.add.text(gameWidth / 2, gameHeight / 2 + 50, `Error loading: ${file.key}\nCheck path/name in 'assets' folder.`, {
                    fontSize: '18px', fill: '#ff0000', align: 'center', backgroundColor: 'rgba(0,0,0,0.7)'
                }).setOrigin(0.5);
            }
        }, this);
    }
}

// 2. MainMenuScene: Displays title, selections, and start button
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedDifficulty = 'medium'; // Default difficulty (speed etc)
        this.selectedTableRange = '1-10'; // Default table range
        this.playerName = localStorage.getItem(LS_KEYS.NAME) || 'Spelare'; // *** NEW ***
        this.highScore  = parseInt(localStorage.getItem(LS_KEYS.SCORE) || '0', 10); // *** NEW ***
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("MainMenuScene: Creating menu...");
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600)); // Scale background to cover

        // Title
        this.add.text(gameWidth / 2, gameHeight * 0.15, 'MultiRaider', {
            fontSize: '48px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        // -----------------------------------------------------------------
        // PLAYER‑NAME & HIGH‑SCORE UI                                     //
        // -----------------------------------------------------------------
        const nameStyle = { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 };
        this.nameText = this.add.text(gameWidth / 2, gameHeight * 0.22,
            `Namn: ${this.playerName} (klicka för att ändra)`,               // *** NEW ***
            nameStyle
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });            // *** NEW ***

        this.nameText.on('pointerdown', () => {                              // *** NEW ***
            const newName = window.prompt('Skriv ditt namn:', this.playerName);
            if (newName && newName.trim().length) {
                this.playerName = newName.trim();
                localStorage.setItem(LS_KEYS.NAME, this.playerName);
                this.nameText.setText(`Namn: ${this.playerName} (klicka för att ändra)`);
            }
        });

        // High‑score text under the name
        this.highScoreText = this.add.text(gameWidth / 2, gameHeight * 0.28, // *** NEW ***
            `Högsta poäng: ${this.highScore}`,
            { fontSize: '22px', fill: '#ff0', stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5);

        // --- Difficulty Selection (Speed etc) ---
        this.add.text(gameWidth / 2, gameHeight * 0.35, 'Välj Svårighetsgrad (Hastighet):', { // UI Text remains Swedish
            fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        const difficulties = ['easy', 'medium', 'hard'];
        const difficultyLabels = { easy: 'Lätt', medium: 'Medel', hard: 'Svår' }; // UI Text remains Swedish
        const difficultyButtonY = gameHeight * 0.43;
        const difficultyButtonSpacing = 150;
        let currentDifficultyX = gameWidth / 2 - difficultyButtonSpacing; // Starting position for buttons
        this.difficultyButtons = {}; // To keep track of the buttons

        difficulties.forEach(level => {
            const button = this.add.text(currentDifficultyX, difficultyButtonY, difficultyLabels[level], { fontSize: '24px', fill: '#fff', backgroundColor: '#555', padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.setData('difficulty', level); // Store the level on the button
            button.on('pointerdown', () => this.selectDifficulty(level));
            button.on('pointerover', () => { if (this.selectedDifficulty !== level) button.setStyle({ backgroundColor: '#777' }); });
            button.on('pointerout', () => { if (this.selectedDifficulty !== level) button.setStyle({ backgroundColor: '#555' }); });
            this.difficultyButtons[level] = button; // Store reference
            currentDifficultyX += difficultyButtonSpacing;
        });
        this.selectDifficulty(this.selectedDifficulty); // Visually select the default

        // --- Table Range Selection ---
         this.add.text(gameWidth / 2, gameHeight * 0.58, 'Välj Tabeller att Öva På:', { fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5); // UI Text remains Swedish

        const tableRanges = ['1-5', '5-10', '1-10']; // Define choices
        const tableLabels = { '1-5': 'Tabell 1-5', '5-10': 'Tabell 5-10', '1-10': 'Tabell 1-10' }; // UI Text remains Swedish
        const tableButtonY = gameHeight * 0.66;
        const tableButtonSpacing = 180; // A bit more space
        let currentTableX = gameWidth / 2 - tableButtonSpacing;
        this.tableButtons = {}; // To keep track of the buttons

        tableRanges.forEach(range => {
            const button = this.add.text(currentTableX, tableButtonY, tableLabels[range], { fontSize: '24px', fill: '#fff', backgroundColor: '#555', padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.setData('range', range); // Store the range on the button
            button.on('pointerdown', () => this.selectTableRange(range));
            button.on('pointerover', () => { if (this.selectedTableRange !== range) button.setStyle({ backgroundColor: '#777' }); });
            button.on('pointerout', () => { if (this.selectedTableRange !== range) button.setStyle({ backgroundColor: '#555' }); });
            this.tableButtons[range] = button; // Store reference
            currentTableX += tableButtonSpacing;
        });
        this.selectTableRange(this.selectedTableRange); // Visually select the default

        // --- Start Button ---
        const startButton = this.add.text(gameWidth / 2, gameHeight * 0.85, 'Starta Spel', { fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // UI Text remains Swedish
        startButton.on('pointerdown', () => {
            console.log(`MainMenuScene: Starting game with difficulty: ${this.selectedDifficulty} and tables: ${this.selectedTableRange}`);
            // this.sound.play('clickSound'); // Play click sound if loaded
            // Send BOTH selected difficulty AND table range to GameScene
            this.scene.start('GameScene', {
                difficulty: this.selectedDifficulty,
                tables: this.selectedTableRange
            });
        });
        startButton.on('pointerover', () => { startButton.setStyle({ fill: '#ff0' }); startButton.setScale(1.05); });
        startButton.on('pointerout', () => { startButton.setStyle({ fill: '#0f0' }); startButton.setScale(1.0); });

        // Instruction Text
        this.add.text(gameWidth / 2, gameHeight - 30, 'Piltangenter/Tryck för att styra, Mellanslag/Tryck för att skjuta.', { fontSize: '16px', fill: '#ccc', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5); // UI Text remains Swedish
    }

    // Function to handle difficulty selection (speed) and visual feedback
    selectDifficulty(level) {
        this.selectedDifficulty = level;
        console.log("Selected difficulty:", level);
        // Update button appearance
        for (const key in this.difficultyButtons) {
            const btn = this.difficultyButtons[key];
            if (key === level) btn.setStyle({ backgroundColor: '#0a0', fill: '#fff' }); // Selected button
            else btn.setStyle({ backgroundColor: '#555', fill: '#fff' }); // Unselected button
        }
    }

    // Function to handle table range selection and visual feedback
    selectTableRange(range) {
        this.selectedTableRange = range;
        console.log("Selected table range:", range);
        // Update button appearance
        for (const key in this.tableButtons) {
            const btn = this.tableButtons[key];
            if (key === range) btn.setStyle({ backgroundColor: '#0a0', fill: '#fff' }); // Selected
            else btn.setStyle({ backgroundColor: '#555', fill: '#fff' }); // Unselected
        }
    }
}

// 3. GameScene: The main game
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // --- Scaling Constants ---
        // Now that original images are 48x48, set scale to 1.0 as default
        this.PLAYER_SCALE = 1.0; // Display player at 48x48
        this.ENEMY_SCALE = 1.0;  // Display enemies at 48x48
        this.BULLET_SCALE = 1.0; // Display bullets at their (hopefully smaller) original size
                                 // (Assume bullet.png is also smaller now, e.g., 8x20)

        // --- Difficulty Settings (Speed etc) ---
        this.difficultySettings = {
            easy:   { enemySpeedMin: 30,  enemySpeedMax: 75, spawnDelay: 3500, bulletCooldown: 400 },
            medium: { enemySpeedMin: 80,  enemySpeedMax: 150, spawnDelay: 2500, bulletCooldown: 300 },
            hard:   { enemySpeedMin: 120, enemySpeedMax: 200, spawnDelay: 1800, bulletCooldown: 250 }
        };
        this.difficultyLevel = 'medium'; // Default if no data is passed

        // --- Table Settings ---
        // Interpretation: First factor is 1-10, second factor is limited by the choice.
        // Alternative interpretation: Both factors are limited (e.g., 1-5 x 1-5). Change here if needed.
        this.tableSettings = {
            '1-5':  { min1: 1, max1: 10, min2: 1, max2: 5 },
            '5-10': { min1: 1, max1: 10, min2: 5, max2: 10 },
            '1-10': { min1: 1, max1: 10, min2: 1, max2: 10 }  // Default
        };
        this.tableRange = '1-10'; // Default if no data is passed

        // Game variables (reset in create/init)
        this.player = null; this.cursors = null; this.fireKey = null;
        this.bullets = null; this.enemies = null; this.score = 0; this.lives = 3;
        this.scoreText = null; this.livesText = null; this.problemText = null;
        this.currentProblem = { num1: 0, num2: 0 }; this.correctAnswer = 0;
        this.lastFired = 0; this.enemySpawnTimer = null; this.canShoot = true; this.active = true;
        this.playerName = 'Spelare'; // *** NEW ***
    }

    // Receives data (both difficulty and table range)
    init(data) {
        console.log("GameScene init, received data:", data);
        this.difficultyLevel = data && data.difficulty ? data.difficulty : 'medium'; // Get difficulty
        this.tableRange = data && data.tables ? data.tables : '1-10'; // Get table selection
        console.log(`GameScene settings: Difficulty=${this.difficultyLevel}, Tables=${this.tableRange}`);

        // Reset game state variables
        this.score = 0; this.lives = 3; this.canShoot = true; this.active = true; this.lastFired = 0;
        // Important: Reset timer reference so it's recreated in create()
        if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
    }

    create() {
        this.active = true; // Ensure scene is active
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameScene: Creating game elements...");
        const currentDifficulty = this.difficultySettings[this.difficultyLevel]; // Get settings for selected difficulty

        // Background
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600));

        // Player ship
        this.player = this.physics.add.sprite(gameWidth / 2, gameHeight - 70, 'player');
        this.player.setScale(this.PLAYER_SCALE); // Set scale (now 1.0)
        this.player.setCollideWorldBounds(true); // Keep player on screen
        // *** HITBOX ADJUSTMENT *** Make hitbox slightly smaller than the visual size (now 48x48)
        this.player.setBodySize(this.player.displayWidth * 0.8, this.player.displayHeight * 0.8, true); // 80% of 48x48, centered

        // Bullet group
        this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 10, runChildUpdate: true });
        this.bullets.createCallback = (bullet) => {
            bullet.setScale(this.BULLET_SCALE); // Set scale (now 1.0)
             // *** HITBOX ADJUSTMENT *** Make hitbox slightly smaller than the visual size
            bullet.setBodySize(bullet.displayWidth * 0.9, bullet.displayHeight * 0.9, true); // 90%, centered
        };
        // Enemy group
        this.enemies = this.physics.add.group({ runChildUpdate: false }); // Update enemies manually

        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys(); // Arrow keys
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Spacebar
        this.input.on('pointerdown', (pointer) => { if (this.canShoot && this.active) this.fireBullet(this.time.now); }); // Touch/mouse fire
        this.input.on('pointermove', (pointer) => { if (pointer.isDown && this.player && this.player.body && this.active) this.physics.moveTo(this.player, pointer.x, this.player.y, 400); }); // Touch/mouse move
        this.input.on('pointerup', () => { if (this.player && this.player.body && this.active) this.player.setVelocityX(0); }); // Stop on release

        // UI Text elements
        this.scoreText = this.add.text(16, 16, 'Poäng: 0', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 }); // UI Text remains Swedish
        this.livesText = this.add.text(gameWidth - 16, 16, 'Liv: 3', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0); // UI Text remains Swedish
        this.problemText = this.add.text(gameWidth / 2, 30, 'X × Y = ?', { fontSize: '32px', fill: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5); // UI Text remains Swedish

        // -------------------------------------------------------------
        //  NYTT: Feedback‑text som syns kort vid fel svar
        // -------------------------------------------------------------
        this.feedbackText = this.add.text(
                gameWidth / 2, 80,                // precis under uppgiften
                '',
                { fontSize: '28px', fill: '#ff8888',
                  stroke: '#000', strokeThickness: 3 })
            .setOrigin(0.5)
            .setAlpha(0);                         // osynlig från början

        // Collision detection
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this); // Bullet hits enemy

        // Initialize game state
        this.updateUI();
        this.generateNewProblem(); // Generate first problem based on table selection

        // Timer to spawn enemies - Use spawnDelay from difficulty settings
        console.log("Setting spawn delay to:", currentDifficulty.spawnDelay);
        this.enemySpawnTimer = this.time.addEvent({ delay: currentDifficulty.spawnDelay, callback: this.spawnEnemies, callbackScope: this, loop: true });

         // Start background music if available (and not already playing)
         // if (this.sound.get('backgroundMusic') && !this.sound.get('backgroundMusic').isPlaying) {
         //     this.sound.play('backgroundMusic', { loop: true, volume: 0.3 });
         // }
    }

    update(time, delta) {
        // Guard clause if scene/player is not ready
        if (!this.active || !this.player || !this.player.body) return;

        // Player keyboard movement
        if (this.cursors.left.isDown) this.player.setVelocityX(-350);
        else if (this.cursors.right.isDown) this.player.setVelocityX(350);
        // Stop only if pointer is not also down (prevents stopping during touch drag)
        else if (!this.input.activePointer.isDown) this.player.setVelocityX(0);

        // Player keyboard shooting
        if (this.fireKey.isDown && this.canShoot) this.fireBullet(time);

        // Enemy movement and boundary check
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active || !enemy.body) return; // Skip inactive enemies
            // Update answer text position
            if (enemy.answerText && enemy.answerText.active) {
                 // Position text based on current (scaled) displayHeight
                 enemy.answerText.setPosition(enemy.x, enemy.y + enemy.displayHeight / 2 + 5);
            }
            // Check if enemy reached the bottom
            if (enemy.y > this.cameras.main.height + enemy.displayHeight) this.enemyOutOfBounds(enemy);
        });
    }

    generateNewProblem() {
        if (this.lives <= 0 || !this.active) return; // Don't generate if game over

        // Get min/max factors based on selected table range
        const currentTableSettings = this.tableSettings[this.tableRange];
        if (!currentTableSettings) {
            // Fallback to default if something is wrong
            console.error("Invalid table range selected:", this.tableRange);
             this.currentProblem.num1 = Phaser.Math.Between(1, 10);
             this.currentProblem.num2 = Phaser.Math.Between(1, 10);
        } else {
            // Generate numbers within the selected range
            this.currentProblem.num1 = Phaser.Math.Between(currentTableSettings.min1, currentTableSettings.max1);
            this.currentProblem.num2 = Phaser.Math.Between(currentTableSettings.min2, currentTableSettings.max2);
        }

        // Calculate and display the problem
        this.correctAnswer = this.currentProblem.num1 * this.currentProblem.num2;
        this.problemText.setText(`${this.currentProblem.num1} × ${this.currentProblem.num2} = ?`); // UI Text remains Swedish
        console.log(`New problem (${this.tableRange}): ${this.currentProblem.num1}x${this.currentProblem.num2}=${this.correctAnswer}`);

        // Allow shooting again
        this.canShoot = true;
    }

     clearEnemies() {
        // This function clears ALL active enemies and their text
        console.log("Clearing remaining enemies and their text...");
        // 1. Iterate and destroy associated text first
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.answerText && enemy.answerText.active) {
                enemy.answerText.destroy();
                enemy.answerText = null; // Remove reference
            }
        });
        // 2. Use the group's clear method to destroy all enemy sprites
        // First true: Destroy GameObjects (not just remove from group)
        // Second true: Remove from Scene as well
        this.enemies.clear(true, true);
        console.log("Enemies cleared using group.clear()");
    }

    spawnEnemies() {
        if(this.lives <= 0 || !this.active) return; // Don't spawn if game over

        const gameWidth = this.cameras.main.width;
        const numberOfEnemies = Phaser.Math.Between(3, 5); // Number of enemies per wave
        const enemySpacing = gameWidth / (numberOfEnemies + 1); // Space them out
        const answers = this.generateAnswers(this.correctAnswer, numberOfEnemies); // Get answer options
        Phaser.Utils.Array.Shuffle(answers); // Shuffle answers

        // Speed is still controlled by difficulty (Easy/Medium/Hard)
        const currentDifficulty = this.difficultySettings[this.difficultyLevel];
        const speedMin = currentDifficulty.enemySpeedMin;
        const speedMax = currentDifficulty.enemySpeedMax;
        // console.log(`Spawning enemies with speed between ${speedMin} and ${speedMax}`); // Maybe too much logging

        // Create each enemy
        for (let i = 0; i < numberOfEnemies; i++) {
            const x = enemySpacing * (i + 1); const y = -50; // Start above screen
            const enemy = this.enemies.create(x, y, 'enemy');
            if (!enemy || !enemy.body) continue; // Skip if creation failed

            enemy.setScale(this.ENEMY_SCALE); // Set scale (now 1.0)
            enemy.setOrigin(0.5); // Set origin to center
            enemy.setVelocityY(Phaser.Math.Between(speedMin, speedMax)); // Set speed based on difficulty
            // *** HITBOX ADJUSTMENT *** Make hitbox slightly smaller than visual size (now 48x48)
            enemy.setBodySize(enemy.displayWidth * 0.8, enemy.displayHeight * 0.8, true); // 80%, centered

            // Create and position answer text
            const answer = answers[i];
             // Font size for text on enemies (adjust if needed)
            const style = { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'center' };
            const answerText = this.add.text(x, y + enemy.displayHeight / 2 + 5, answer.toString(), style).setOrigin(0.5); // Position below enemy

            enemy.answerText = answerText; // Store reference to text on the enemy
            enemy.answerValue = answer; // Store the answer value on the enemy

            // Add bounce tween effect
            const finalY = Phaser.Math.Between(80, 120); // Random landing Y
            this.tweens.add({ targets: enemy, y: finalY, duration: 500, ease: 'Bounce.easeOut' });
            // Make text follow the bounce
            this.tweens.add({ targets: answerText, y: finalY + enemy.displayHeight / 2 + 5, duration: 500, ease: 'Bounce.easeOut' });
        }
    }

    // Generates one correct answer and fills the rest with plausible wrong answers
    generateAnswers(correct, count) {
        const answers = new Set([correct]); // Use a Set to avoid duplicates
        const minRange = Math.max(1, correct - 15); // Adjust range for wrong answers if needed
        const maxRange = correct + 15;
        while (answers.size < count) {
            let wrongAnswer; let attempts = 0;
            // Try to find a unique wrong answer within the range
            do {
                wrongAnswer = Phaser.Math.Between(minRange, maxRange);
                attempts++;
            } while (answers.has(wrongAnswer) && attempts < 50); // Limit attempts

            if (!answers.has(wrongAnswer)) {
                answers.add(wrongAnswer); // Add if unique
            } else if (attempts >= 50) {
                // If finding unique answers fails, generate simple fallback
                let fallback = correct + answers.size;
                while(answers.has(fallback)) fallback++;
                if (fallback > 0) answers.add(fallback); // Ensure positive
            }
        }
        return Array.from(answers); // Convert Set back to Array
    }

    // Fires a bullet from the player
    fireBullet(time) {
        // Cooldown is controlled by difficulty
        const currentDifficulty = this.difficultySettings[this.difficultyLevel];
        const bulletCooldown = currentDifficulty.bulletCooldown;

        // Check cooldown and if shooting is allowed
        if (!this.canShoot || (time && time < this.lastFired) || !this.active) return;

        // Get a bullet from the pool
        // Start position based on player's current (scaled) display height
        const bullet = this.bullets.get(this.player.x, this.player.y - this.player.displayHeight / 2);
        if (bullet) {
            // Scale and hitbox are set in createCallback now
            bullet.setActive(true).setVisible(true);
            bullet.body.reset(this.player.x, this.player.y - this.player.displayHeight / 2); // Reset physics body
            bullet.setVelocityY(-500); // Set upward velocity
            bullet.body.setAllowGravity(false); // Bullets ignore gravity

            this.sound.play('shootSound'); // *** PLAY SHOOT SOUND ***
            this.lastFired = time + bulletCooldown; // Update last fired time

            // Temporarily disable shooting for cooldown period
            this.canShoot = false;
            this.time.delayedCall(bulletCooldown, () => { this.canShoot = true; }); // Re-enable after cooldown
        }
    }

    // Callback function when a bullet overlaps an enemy
    hitEnemy(bullet, enemy) {
        // Ensure both objects are still active
        if (!bullet.active || !enemy.active || !this.active) return;

        bullet.destroy(); // Destroy the bullet

        if (enemy.answerValue === this.correctAnswer) {
            // --- Correct Answer ---
            this.score += 10;
            this.sound.play('hitCorrectSound'); // *** PLAY CORRECT HIT SOUND ***
            // Particle effect for explosion
             const particles = this.add.particles(enemy.x, enemy.y, 'bullet', { speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 }, scale: { start: this.BULLET_SCALE * 0.8, end: 0 }, lifespan: 400, blendMode: 'ADD', quantity: 15, emitting: true });
             this.time.delayedCall(400, () => particles.destroy()); // Clean up particles

            // Destroy the hit enemy and its text (text might also be destroyed by clearEnemies)
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
            enemy.setActive(false); // Mark inactive immediately
            enemy.destroy(); // Destroy the enemy sprite

            // *** CALL clearEnemies HERE INSTEAD ***
            // This clears all *other* remaining enemies from the screen
            this.clearEnemies();

            // Update UI and generate the next problem (which no longer clears enemies)
            this.updateUI();
            this.generateNewProblem();

        } else {
            // --- Wrong Answer ---
            this.lives -= 1;
            this.sound.play('hitWrongSound'); // *** PLAY WRONG HIT SOUND ***
            this.cameras.main.shake(150, 0.015); // Shake camera

            // ---- VISA FACIT ----
            this.showIncorrectAnswer();

            // Visual feedback for wrong hit
            enemy.setTint(0xff8888); // Tint enemy red
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.setTint(0xff8888); // Tint text red

            // Remove the wrongly hit enemy after a short delay
             this.time.delayedCall(500, () => {
                 // Double check if enemy/text still exist before destroying
                 if (enemy.active && enemy.answerText && enemy.answerText.active) { enemy.answerText.destroy(); }
                 if (enemy.active) { enemy.destroy(); }
             });

            // Update UI and check for game over
            this.updateUI();
            if (this.lives <= 0) this.gameOver();
        }
    }

    // Called when an enemy reaches the bottom of the screen
    enemyOutOfBounds(enemy) {
         // Ensure enemy is still active
         if (!enemy.active || !this.active) return;

        this.lives -= 1;
        this.sound.play('hitWrongSound'); // *** PLAY LOSE LIFE SOUND *** (Same as wrong hit?)
        this.cameras.main.shake(100, 0.01); // Shake camera
        this.updateUI();

        // ---- VISA FACIT ----
        this.showIncorrectAnswer();

        // Destroy text before enemy
        if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
        enemy.destroy(); // Destroy enemy sprite

        // Check for game over
        if (this.lives <= 0) this.gameOver();
    }

    // Updates the score and lives text display
    updateUI() {
        if (this.scoreText) this.scoreText.setText(`Poäng: ${this.score}`); // UI Text remains Swedish
        if (this.livesText) this.livesText.setText(`Liv: ${this.lives}`); // UI Text remains Swedish
    }

    // -------------------------------------------------------------
    //  NYTT: Visar korrekt svar vid fel
    // -------------------------------------------------------------
    showIncorrectAnswer() {
        if (!this.feedbackText) return;

        const msg = `Fel! ${this.currentProblem.num1} × ${this.currentProblem.num2} = ${this.correctAnswer}`;

        // Avbryt ev. pågående tween (om flera fel snabbt efter varann)
        this.tweens.killTweensOf(this.feedbackText);

        // Visa texten direkt …
        this.feedbackText.setText(msg).setAlpha(1);

        // … och tona bort den efter ~1,5 sek
        this.tweens.add({
            targets:  this.feedbackText,
            alpha:    0,
            duration: 400,
            delay:    1100,
            ease:     'Power1'
        });
    }

    // Handles the game over sequence
    gameOver() {
        if (!this.active) return; // Prevent multiple calls
        this.active = false; // Mark scene as inactive
        console.log("Game Over!");

        this.canShoot = false; // Disable shooting
        this.physics.pause(); // Stop physics simulation
        if (this.player && this.player.active) this.player.setTint(0xff0000); // Tint player red
        if (this.enemySpawnTimer) this.enemySpawnTimer.destroy(); // Stop spawning enemies

        // Stop remaining enemies and make them grey
        this.enemies.getChildren().forEach(e => { if (e.body) e.setVelocityY(0); if (e.active) e.setTint(0xaaaaaa); });

        // Stop background music if playing
        // if (this.sound.get('backgroundMusic') && this.sound.get('backgroundMusic').isPlaying) {
        //     this.sound.stopByKey('backgroundMusic');
        // }
        this.sound.play('gameOverSound'); // *** PLAY GAME OVER SOUND ***

        // Transition to GameOverScene after a delay
        this.time.delayedCall(1500, () => {
            // Send score, difficulty, AND table range to GameOverScene
            this.scene.start('GameOverScene', {
                score: this.score,
                difficulty: this.difficultyLevel,
                tables: this.tableRange // Pass the table selection
            });
        });
    }

     // Cleans up when the scene shuts down
     shutdown() {
         console.log("GameScene shutting down...");
         // Clean up timers and listeners
         if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
         this.input.off('pointerdown'); this.input.off('pointermove'); this.input.off('pointerup');
         // Nullify references
         this.player = null; this.bullets = null; this.enemies = null;
         this.scoreText = null; this.livesText = null; this.problemText = null;
         this.active = false; // Mark as inactive
         // Stop looping sounds?
         // this.sound.stopByKey('backgroundMusic');
     }
}

// Custom Bullet class (optional, but good for organizing bullet logic)
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet'); // Use 'bullet' texture
    }

    // Automatically deactivate/destroy bullets when they go off-screen
    preUpdate(time, delta) {
        super.preUpdate(time, delta); // Important to call parent's preUpdate

        // Check if bullet is above the top edge
        if (this.y <= -this.displayHeight) { // Give some margin based on height
            this.setActive(false); // Deactivate for pooling
            this.setVisible(false); // Hide it
            // Alternatively, destroy completely: this.destroy();
        }
    }
}

// 4. GameOverScene: Displays results and restart button
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0;
        this.difficultyLevel = 'medium';
        this.tableRange = '1-10'; // Default if none passed
        this.playerName = 'Spelare'; // *** NEW ***
        this.restartKey = null; // Reference to the Spacebar key
    }

    // Receive data (score, difficulty, table range) from GameScene
    init(data) {
        console.log("GameOverScene init, received data:", data);
        this.finalScore = data && data.score !== undefined ? data.score : 0;
        this.difficultyLevel = data && data.difficulty ? data.difficulty : 'medium';
        this.tableRange = data && data.tables ? data.tables : '1-10'; // Store the table range
        this.playerName = (data && data.playerName) ?? (localStorage.getItem(LS_KEYS.NAME) || 'Spelare'); // *** NEW ***
    }
    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameOverScene: Creating game over screen...");
        // Semi-transparent background
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky')
        .setScale(Math.max(gameWidth / 800, gameHeight / 600))
        .setAlpha(0.7);

        // ------------------------------------------------------------------
        // "Spelet Slut!"
        // ------------------------------------------------------------------
        const title = this.add.text(
                gameWidth / 2, gameHeight / 2 - 120,
                'Spelet Slut!',
                { fontSize: '48px', fill: '#f00',
                  stroke: '#000', strokeThickness: 4 }
        ).setOrigin(0.5);

        let cy = title.getBottomCenter().y + 30;               // cursor

        // ------------------------------------------------------------------
        // Score line  (player name + score)
        // ------------------------------------------------------------------
        const scoreLine = this.add.text(
                gameWidth / 2, cy,
                `${this.playerName} fick ${this.finalScore} poäng`,
                { fontSize: '32px', fill: '#fff',
                  stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5);

        cy += scoreLine.height + 8;

        // ------------------------------------------------------------------
        // Settings (difficulty / tables)
        // ------------------------------------------------------------------
        const settingsLine = this.add.text(
                gameWidth / 2, cy,
                `(Nivå: ${this.difficultyLevel}, Tabell: ${this.tableRange})`,
                { fontSize: '18px', fill: '#ccc',
                  stroke: '#000', strokeThickness: 2 }
        ).setOrigin(0.5);

        cy += settingsLine.height + 12;

        // ------------------------------------------------------------------
        // High‑score + “NYTT REKORD!” (if applicable)
        // ------------------------------------------------------------------
        const storedHigh = parseInt(localStorage.getItem(LS_KEYS.SCORE) || '0', 10);
        const isNewHigh  = this.finalScore > storedHigh;
        if (isNewHigh) localStorage.setItem(LS_KEYS.SCORE, this.finalScore.toString());

        this.add.text(
                gameWidth / 2, cy,
                `Högsta poäng: ${Math.max(storedHigh, this.finalScore)}`,
                { fontSize: '24px', fill: '#ff0',
                  stroke: '#000', strokeThickness: 3 }
        ).setOrigin(0.5);

        if (isNewHigh) {
            cy += 28;
            this.add.text(
                    gameWidth / 2, cy,
                    'NYTT REKORD!',
                    { fontSize: '26px', fill: '#0f0',
                      stroke: '#000', strokeThickness: 3 }
            ).setOrigin(0.5);
            cy += 6;
        }

        cy += 40;                                              // gap before buttons

        // ------------------------------------------------------------------
        // Restart & Main‑Menu buttons
        // ------------------------------------------------------------------
        // Restart button
        const restartButton = this.add.text(
                gameWidth / 2, cy,
                'Spela Igen',
                { fontSize: '32px', fill: '#0f0', backgroundColor: '#333',
                  padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 2,
                  shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // >>> add the three listeners that were in the original version
        restartButton.on('pointerdown', () => { this.restartGame(); });
        restartButton.on('pointerover', () => { restartButton.setStyle({ fill: '#ff0' }); restartButton.setScale(1.05); });
        restartButton.on('pointerout',  () => { restartButton.setStyle({ fill: '#0f0' }); restartButton.setScale(1.0); });

        cy += restartButton.height + 20;

        // Main‑menu button
        const menuButton = this.add.text(
                gameWidth / 2, cy,
                'Huvudmeny',
                { fontSize: '24px', fill: '#fff', backgroundColor: '#444',
                  padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 1 }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // >>> same here – re‑attach the listeners
        menuButton.on('pointerdown', () => {
            console.log("GameOverScene: Returning to Main Menu…");
            this.scene.start('MainMenuScene');
        });
        menuButton.on('pointerover', () => { menuButton.setStyle({ backgroundColor: '#666' }); });
        menuButton.on('pointerout',  () => { menuButton.setStyle({ backgroundColor: '#444' }); });

        // *** NEW: Listen for Spacebar to restart ***
        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.restartKey.on('down', this.restartGame, this); // Call common function when key is pressed

        // Add text indicating Spacebar can be used (optional)
        this.add.text(gameWidth / 2, gameHeight - 30, 'Tryck MELLANSLAG för att spela igen', { fontSize: '16px', fill: '#aaa', stroke: '#000', strokeThickness: 1 }).setOrigin(0.5); // UI Text remains Swedish
    }

    // *** NEW: Common function to restart the game ***
    restartGame() {
        // Prevent multiple restarts if key is held down or clicked rapidly
        if (!this.scene.isActive()) return; // Check if the scene is still active

        console.log(`GameOverScene: Restarting game with difficulty: ${this.difficultyLevel} and tables: ${this.tableRange}`);
        // Remove the key listener before switching scenes (good practice)
        if (this.restartKey) {
            this.restartKey.off('down', this.restartGame, this);
        }
        // Start GameScene, passing back BOTH difficulty AND table range
        this.scene.start('GameScene', {
             difficulty: this.difficultyLevel,
             tables: this.tableRange
        });
    }

    // *** NEW: Clean up listener when scene shuts down ***
    shutdown() {
        console.log("GameOverScene shutting down...");
        // Remove the key listener
        if (this.restartKey) {
            this.restartKey.off('down', this.restartGame, this);
            this.restartKey = null;
        }
    }
}


// --- Basic Phaser Configuration (Defined AFTER Classes) ---
const config = {
    type: Phaser.AUTO, // Choose best renderer (WebGL or Canvas)
    scale: {
        mode: Phaser.Scale.FIT, // Fit to window while maintaining aspect ratio
        parent: 'phaser-game-container', // ID of the div to contain the game (optional)
        autoCenter: Phaser.Scale.CENTER_BOTH, // Center the canvas automatically
        width: 800,  // Logical game width
        height: 600 // Logical game height
    },
    physics: {
        default: 'arcade', // Use simple and fast Arcade Physics
        arcade: {
            gravity: { y: 0 }, // No global downward gravity
            debug: false // Set to true to see physics bodies and velocity vectors
        }
    },
     // *** NEW: Add audio configuration ***
    audio: {
        disableWebAudio: false // Use Web Audio API if available (better performance/features)
        // noAudio: false // Set to true to completely disable audio (for testing)
    },
    // Define the game's different scenes
    scene: [PreloadScene, MainMenuScene, GameScene, GameOverScene]
};

// Create the Phaser game instance when the DOM is ready
window.onload = () => {
    const game = new Phaser.Game(config);
};