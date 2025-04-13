// --- Scener (DEFINIERAS FÖRST) ---

// 1. PreloadScene: Laddar alla resurser (bilder, ljud)
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("PreloadScene: Loading assets...");
        // Load necessary images (assuming 48x48)
        this.load.image('sky', 'assets/sky.png');
        this.load.image('player', 'assets/playerShip.png');
        this.load.image('enemy', 'assets/enemyShip.png');
        this.load.image('bullet', 'assets/bullet.png');

        // *** NEW: Load audio files ***
        // Replace these with your actual audio files in the assets folder!
        // Supported formats are e.g. .mp3, .ogg, .wav
        console.log("PreloadScene: Loading audio...");
        try {
            this.load.audio('shootSound', 'assets/shoot.mp3'); // Sound for when player shoots
            this.load.audio('hitCorrectSound', 'assets/hitCorrect.mp3'); // Sound for correct answer
            this.load.audio('hitWrongSound', 'assets/hitWrong.mp3'); // Sound for wrong answer / lost life
            this.load.audio('gameOverSound', 'assets/gameOver.mp3'); // Sound for game over
            // this.load.audio('backgroundMusic', 'assets/music.mp3'); // Optional background music
        } catch (error) {
            console.error("Error loading audio:", error);
            // Show error if audio couldn't be loaded (browser might not support the format?)
             this.add.text(this.game.config.width / 2, this.game.config.height - 10, 'Warning: Could not load audio files.', {
                fontSize: '12px', fill: '#ffdddd'
            }).setOrigin(0.5);
        }


        // Show a loading indicator
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        const gameWidth = this.game.config.width;
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
            this.scene.start('MainMenuScene');
        }, this);

        this.load.on('loaderror', function (file) {
            // Specifically check if it's an audio error (can happen if format is not supported)
            if (file.type === 'audio') {
                 console.warn(`Could not load audio: ${file.key}. Format might not be supported or file missing.`);
            } else {
                console.error('Error loading asset:', file.key, file.url);
                this.add.text(gameWidth / 2, gameHeight / 2 + 50, `Error loading: ${file.key}\nCheck path/name in 'assets' folder.`, {
                    fontSize: '18px', fill: '#ff0000', align: 'center', backgroundColor: 'rgba(0,0,0,0.7)'
                }).setOrigin(0.5);
            }
        }, this);
    }}

// 2. MainMenuScene: Visar titel, val och startknapp
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedDifficulty = 'medium';
        this.selectedTableRange = '1-10';
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("MainMenuScene: Creating menu...");
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600));

        this.add.text(gameWidth / 2, gameHeight * 0.15, 'Multiplikations-\nRymdspelet', {
            fontSize: '48px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(gameWidth / 2, gameHeight * 0.35, 'Välj Svårighetsgrad (Hastighet):', {
            fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        const difficulties = ['easy', 'medium', 'hard'];
        const difficultyLabels = { easy: 'Lätt', medium: 'Medel', hard: 'Svår' };
        const difficultyButtonY = gameHeight * 0.43;
        const difficultyButtonSpacing = 150;
        let currentDifficultyX = gameWidth / 2 - difficultyButtonSpacing;
        this.difficultyButtons = {};
        difficulties.forEach(level => {
            const button = this.add.text(currentDifficultyX, difficultyButtonY, difficultyLabels[level], { fontSize: '24px', fill: '#fff', backgroundColor: '#555', padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.setData('difficulty', level);
            button.on('pointerdown', () => this.selectDifficulty(level));
            button.on('pointerover', () => { if (this.selectedDifficulty !== level) button.setStyle({ backgroundColor: '#777' }); });
            button.on('pointerout', () => { if (this.selectedDifficulty !== level) button.setStyle({ backgroundColor: '#555' }); });
            this.difficultyButtons[level] = button;
            currentDifficultyX += difficultyButtonSpacing;
        });
        this.selectDifficulty(this.selectedDifficulty);

         this.add.text(gameWidth / 2, gameHeight * 0.58, 'Välj Tabeller att Öva På:', { fontSize: '22px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        const tableRanges = ['1-5', '5-10', '1-10'];
        const tableLabels = { '1-5': 'Tabell 1-5', '5-10': 'Tabell 5-10', '1-10': 'Tabell 1-10' };
        const tableButtonY = gameHeight * 0.66;
        const tableButtonSpacing = 180;
        let currentTableX = gameWidth / 2 - tableButtonSpacing;
        this.tableButtons = {};
        tableRanges.forEach(range => {
            const button = this.add.text(currentTableX, tableButtonY, tableLabels[range], { fontSize: '24px', fill: '#fff', backgroundColor: '#555', padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            button.setData('range', range);
            button.on('pointerdown', () => this.selectTableRange(range));
            button.on('pointerover', () => { if (this.selectedTableRange !== range) button.setStyle({ backgroundColor: '#777' }); });
            button.on('pointerout', () => { if (this.selectedTableRange !== range) button.setStyle({ backgroundColor: '#555' }); });
            this.tableButtons[range] = button;
            currentTableX += tableButtonSpacing;
        });
        this.selectTableRange(this.selectedTableRange);

        const startButton = this.add.text(gameWidth / 2, gameHeight * 0.85, 'Starta Spel', { fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        startButton.on('pointerdown', () => {
            console.log(`MainMenuScene: Starting game with difficulty: ${this.selectedDifficulty} and tables: ${this.selectedTableRange}`);
            // this.sound.play('clickSound'); // Spela klickljud om du laddat det
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty, tables: this.selectedTableRange });
        });
        startButton.on('pointerover', () => { startButton.setStyle({ fill: '#ff0' }); startButton.setScale(1.05); });
        startButton.on('pointerout', () => { startButton.setStyle({ fill: '#0f0' }); startButton.setScale(1.0); });

        this.add.text(gameWidth / 2, gameHeight - 30, 'Piltangenter/Tryck för att styra, Mellanslag/Tryck för att skjuta.', { fontSize: '16px', fill: '#ccc', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
    }

    selectDifficulty(level) {
        this.selectedDifficulty = level;
        console.log("Selected difficulty:", level);
        for (const key in this.difficultyButtons) {
            const btn = this.difficultyButtons[key];
            if (key === level) btn.setStyle({ backgroundColor: '#0a0', fill: '#fff' });
            else btn.setStyle({ backgroundColor: '#555', fill: '#fff' });
        }
    }

    selectTableRange(range) {
        this.selectedTableRange = range;
        console.log("Selected table range:", range);
        for (const key in this.tableButtons) {
            const btn = this.tableButtons[key];
            if (key === range) btn.setStyle({ backgroundColor: '#0a0', fill: '#fff' });
            else btn.setStyle({ backgroundColor: '#555', fill: '#fff' });
        }
    }
}

// 3. GameScene: Huvudspelet
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.PLAYER_SCALE = 1.0; this.ENEMY_SCALE = 1.0; this.BULLET_SCALE = 1.0;
        this.difficultySettings = { easy:   { enemySpeedMin: 50,  enemySpeedMax: 100, spawnDelay: 3500, bulletCooldown: 400 }, medium: { enemySpeedMin: 80,  enemySpeedMax: 150, spawnDelay: 2500, bulletCooldown: 300 }, hard:   { enemySpeedMin: 120, enemySpeedMax: 200, spawnDelay: 1800, bulletCooldown: 250 } };
        this.difficultyLevel = 'medium';
        this.tableSettings = { '1-5':  { min1: 1, max1: 10, min2: 1, max2: 5 }, '5-10': { min1: 1, max1: 10, min2: 5, max2: 10 }, '1-10': { min1: 1, max1: 10, min2: 1, max2: 10 } };
        this.tableRange = '1-10';
        this.player = null; this.cursors = null; this.fireKey = null; this.bullets = null; this.enemies = null; this.score = 0; this.lives = 3; this.scoreText = null; this.livesText = null; this.problemText = null; this.currentProblem = { num1: 0, num2: 0 }; this.correctAnswer = 0; this.lastFired = 0; this.enemySpawnTimer = null; this.canShoot = true; this.active = true;
    }

    init(data) {
        console.log("GameScene init, received data:", data);
        this.difficultyLevel = data && data.difficulty ? data.difficulty : 'medium';
        this.tableRange = data && data.tables ? data.tables : '1-10';
        console.log(`GameScene settings: Difficulty=${this.difficultyLevel}, Tables=${this.tableRange}`);
        this.score = 0; this.lives = 3; this.canShoot = true; this.active = true; this.lastFired = 0;
        if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
    }

    create() {
        this.active = true;
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameScene: Creating game elements...");
        const currentDifficulty = this.difficultySettings[this.difficultyLevel];

        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600));

        this.player = this.physics.add.sprite(gameWidth / 2, gameHeight - 70, 'player');
        this.player.setScale(this.PLAYER_SCALE);
        this.player.setCollideWorldBounds(true);
        this.player.setBodySize(this.player.displayWidth * 0.8, this.player.displayHeight * 0.8, true);

        this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 10, runChildUpdate: true });
        this.bullets.createCallback = (bullet) => {
            bullet.setScale(this.BULLET_SCALE);
            bullet.setBodySize(bullet.displayWidth * 0.9, bullet.displayHeight * 0.9, true);
        };
        this.enemies = this.physics.add.group({ runChildUpdate: false });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on('pointerdown', (pointer) => { if (this.canShoot && this.active) this.fireBullet(this.time.now); });
        this.input.on('pointermove', (pointer) => { if (pointer.isDown && this.player && this.player.body && this.active) this.physics.moveTo(this.player, pointer.x, this.player.y, 400); });
        this.input.on('pointerup', () => { if (this.player && this.player.body && this.active) this.player.setVelocityX(0); });

        this.scoreText = this.add.text(16, 16, 'Poäng: 0', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 });
        this.livesText = this.add.text(gameWidth - 16, 16, 'Liv: 3', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
        this.problemText = this.add.text(gameWidth / 2, 30, 'X × Y = ?', { fontSize: '32px', fill: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);

        this.updateUI();
        this.generateNewProblem();

        console.log("Setting spawn delay to:", currentDifficulty.spawnDelay);
        this.enemySpawnTimer = this.time.addEvent({ delay: currentDifficulty.spawnDelay, callback: this.spawnEnemies, callbackScope: this, loop: true });

         // Starta bakgrundsmusik om den finns (och inte redan spelar)
         // if (this.sound.get('backgroundMusic') && !this.sound.get('backgroundMusic').isPlaying) {
         //     this.sound.play('backgroundMusic', { loop: true, volume: 0.3 });
         // }
    }

    update(time, delta) {
        if (!this.active || !this.player || !this.player.body) return;

        if (this.cursors.left.isDown) this.player.setVelocityX(-350);
        else if (this.cursors.right.isDown) this.player.setVelocityX(350);
        else if (!this.input.activePointer.isDown) this.player.setVelocityX(0);

        if (this.fireKey.isDown && this.canShoot) this.fireBullet(time);

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active || !enemy.body) return;
            if (enemy.answerText && enemy.answerText.active) {
                 enemy.answerText.setPosition(enemy.x, enemy.y + enemy.displayHeight / 2 + 5);
            }
            if (enemy.y > this.cameras.main.height + enemy.displayHeight) this.enemyOutOfBounds(enemy);
        });
    }

    generateNewProblem() {
        if (this.lives <= 0 || !this.active) return;
        const currentTableSettings = this.tableSettings[this.tableRange];
        if (!currentTableSettings) {
            console.error("Invalid table range selected:", this.tableRange);
             this.currentProblem.num1 = Phaser.Math.Between(1, 10); this.currentProblem.num2 = Phaser.Math.Between(1, 10);
        } else {
            this.currentProblem.num1 = Phaser.Math.Between(currentTableSettings.min1, currentTableSettings.max1);
            this.currentProblem.num2 = Phaser.Math.Between(currentTableSettings.min2, currentTableSettings.max2);
        }
        this.correctAnswer = this.currentProblem.num1 * this.currentProblem.num2;
        this.problemText.setText(`${this.currentProblem.num1} × ${this.currentProblem.num2} = ?`);
        console.log(`New problem (${this.tableRange}): ${this.currentProblem.num1}x${this.currentProblem.num2}=${this.correctAnswer}`);
        this.canShoot = true;
    }

     clearEnemies() {
        console.log("Clearing remaining enemies and their text...");
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.answerText && enemy.answerText.active) {
                enemy.answerText.destroy();
                enemy.answerText = null;
            }
        });
        this.enemies.clear(true, true);
        console.log("Enemies cleared using group.clear()");
    }

    spawnEnemies() {
        if(this.lives <= 0 || !this.active) return;
        const gameWidth = this.cameras.main.width;
        const numberOfEnemies = Phaser.Math.Between(3, 5);
        const enemySpacing = gameWidth / (numberOfEnemies + 1);
        const answers = this.generateAnswers(this.correctAnswer, numberOfEnemies);
        Phaser.Utils.Array.Shuffle(answers);
        const currentDifficulty = this.difficultySettings[this.difficultyLevel];
        const speedMin = currentDifficulty.enemySpeedMin;
        const speedMax = currentDifficulty.enemySpeedMax;

        for (let i = 0; i < numberOfEnemies; i++) {
            const x = enemySpacing * (i + 1); const y = -50;
            const enemy = this.enemies.create(x, y, 'enemy');
            if (!enemy || !enemy.body) continue;
            enemy.setScale(this.ENEMY_SCALE); enemy.setOrigin(0.5);
            enemy.setVelocityY(Phaser.Math.Between(speedMin, speedMax));
            enemy.setBodySize(enemy.displayWidth * 0.8, enemy.displayHeight * 0.8, true);
            const answer = answers[i];
            const style = { fontSize: '18px', fill: '#fff', stroke: '#000', strokeThickness: 2, align: 'center' };
            const answerText = this.add.text(x, y + enemy.displayHeight / 2 + 5, answer.toString(), style).setOrigin(0.5);
            enemy.answerText = answerText; enemy.answerValue = answer;
            const finalY = Phaser.Math.Between(80, 120);
            this.tweens.add({ targets: enemy, y: finalY, duration: 500, ease: 'Bounce.easeOut' });
            this.tweens.add({ targets: answerText, y: finalY + enemy.displayHeight / 2 + 5, duration: 500, ease: 'Bounce.easeOut' });
        }
    }

    generateAnswers(correct, count) {
        const answers = new Set([correct]);
        const minRange = Math.max(1, correct - 15); const maxRange = correct + 15;
        while (answers.size < count) {
            let wrongAnswer; let attempts = 0;
            do { wrongAnswer = Phaser.Math.Between(minRange, maxRange); attempts++; } while (answers.has(wrongAnswer) && attempts < 50);
            if (!answers.has(wrongAnswer)) answers.add(wrongAnswer);
            else if (attempts >= 50) { let fallback = correct + answers.size; while(answers.has(fallback)) fallback++; if (fallback > 0) answers.add(fallback); }
        }
        return Array.from(answers);
    }

    fireBullet(time) {
        const currentDifficulty = this.difficultySettings[this.difficultyLevel];
        const bulletCooldown = currentDifficulty.bulletCooldown;
        if (!this.canShoot || (time && time < this.lastFired) || !this.active) return;
        const bullet = this.bullets.get(this.player.x, this.player.y - this.player.displayHeight / 2);
        if (bullet) {
            bullet.setActive(true).setVisible(true);
            bullet.body.reset(this.player.x, this.player.y - this.player.displayHeight / 2);
            bullet.setVelocityY(-500); bullet.body.setAllowGravity(false);
            this.sound.play('shootSound'); // *** SPELA SKJUTLJUD ***
            this.lastFired = time + bulletCooldown;
            this.canShoot = false;
            this.time.delayedCall(bulletCooldown, () => { this.canShoot = true; });
        }
    }

    hitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active || !this.active) return;
        bullet.destroy();

        if (enemy.answerValue === this.correctAnswer) {
            // Rätt svar
            this.score += 10;
            this.sound.play('hitCorrectSound'); // *** SPELA LJUD FÖR RÄTT TRÄFF ***
             const particles = this.add.particles(enemy.x, enemy.y, 'bullet', { speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 }, scale: { start: this.BULLET_SCALE * 0.8, end: 0 }, lifespan: 400, blendMode: 'ADD', quantity: 15, emitting: true });
             this.time.delayedCall(400, () => particles.destroy());
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
            enemy.setActive(false); enemy.destroy();
            this.clearEnemies(); this.updateUI(); this.generateNewProblem();
        } else {
            // Fel svar
            this.lives -= 1;
            this.sound.play('hitWrongSound'); // *** SPELA LJUD FÖR FEL TRÄFF ***
            this.cameras.main.shake(150, 0.015);
            enemy.setTint(0xff8888);
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.setTint(0xff8888);
             this.time.delayedCall(500, () => {
                 if (enemy.active && enemy.answerText && enemy.answerText.active) { enemy.answerText.destroy(); }
                 if (enemy.active) { enemy.destroy(); }
             });
            this.updateUI();
            if (this.lives <= 0) this.gameOver();
        }
    }

    enemyOutOfBounds(enemy) {
         if (!enemy.active || !this.active) return;
        this.lives -= 1;
        this.sound.play('hitWrongSound'); // *** SPELA LJUD FÖR FÖRLORAT LIV *** (Samma som fel träff?)
        this.cameras.main.shake(100, 0.01);
        this.updateUI();
        if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
        enemy.destroy();
        if (this.lives <= 0) this.gameOver();
    }

    updateUI() {
        if (this.scoreText) this.scoreText.setText(`Poäng: ${this.score}`);
        if (this.livesText) this.livesText.setText(`Liv: ${this.lives}`);
    }

    gameOver() {
        if (!this.active) return;
        this.active = false;
        console.log("Game Over!");
        this.canShoot = false;
        this.physics.pause();
        if (this.player && this.player.active) this.player.setTint(0xff0000);
        if (this.enemySpawnTimer) this.enemySpawnTimer.destroy();
        this.enemies.getChildren().forEach(e => { if (e.body) e.setVelocityY(0); if (e.active) e.setTint(0xaaaaaa); });

        // Stoppa ev bakgrundsmusik
        // if (this.sound.get('backgroundMusic') && this.sound.get('backgroundMusic').isPlaying) {
        //     this.sound.stopByKey('backgroundMusic');
        // }
        this.sound.play('gameOverSound'); // *** SPELA GAME OVER-LJUD ***

        this.time.delayedCall(1500, () => { this.scene.start('GameOverScene', { score: this.score, difficulty: this.difficultyLevel, tables: this.tableRange }); });
    }

     shutdown() {
         console.log("GameScene shutting down...");
         if (this.enemySpawnTimer) { this.enemySpawnTimer.destroy(); this.enemySpawnTimer = null; }
         this.input.off('pointerdown'); this.input.off('pointermove'); this.input.off('pointerup');
         this.player = null; this.bullets = null; this.enemies = null; this.scoreText = null; this.livesText = null; this.problemText = null; this.active = false;
         // Stoppa ljud som kanske loopar? (om man går till huvudmenyn t.ex.)
         // this.sound.stopByKey('backgroundMusic');
     }
}

// Anpassad klass för skott
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.y <= -this.displayHeight) { this.setActive(false); this.setVisible(false); }
    }
}

// 4. GameOverScene: Visar resultat och omstartknapp
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0; this.difficultyLevel = 'medium'; this.tableRange = '1-10'; this.restartKey = null;
    }

    init(data) {
        console.log("GameOverScene init, received data:", data);
        this.finalScore = data && data.score !== undefined ? data.score : 0;
        this.difficultyLevel = data && data.difficulty ? data.difficulty : 'medium';
        this.tableRange = data && data.tables ? data.tables : '1-10';
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameOverScene: Creating game over screen...");
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600)).setAlpha(0.7);

        this.add.text(gameWidth / 2, gameHeight / 2 - 100, 'Spelet Slut!', { fontSize: '48px', fill: '#f00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(gameWidth / 2, gameHeight / 2, `Din poäng: ${this.finalScore}`, { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        const settingsText = `(Nivå: ${this.difficultyLevel}, Tabell: ${this.tableRange})`;
        this.add.text(gameWidth / 2, gameHeight / 2 + 40, settingsText, { fontSize: '18px', fill: '#ccc', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

        const restartButton = this.add.text(gameWidth / 2, gameHeight / 2 + 100, 'Spela Igen', { fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 }, stroke: '#000', strokeThickness: 2, shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        restartButton.on('pointerdown', () => { this.restartGame(); });
        restartButton.on('pointerover', () => { restartButton.setStyle({ fill: '#ff0' }); restartButton.setScale(1.05); });
        restartButton.on('pointerout', () => { restartButton.setStyle({ fill: '#0f0' }); restartButton.setScale(1.0); });

        const menuButton = this.add.text(gameWidth / 2, gameHeight / 2 + 160, 'Huvudmeny', { fontSize: '24px', fill: '#fff', backgroundColor: '#444', padding: { x: 15, y: 8 }, stroke: '#000', strokeThickness: 1 }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        menuButton.on('pointerdown', () => { console.log("GameOverScene: Returning to Main Menu..."); this.scene.start('MainMenuScene'); });
        menuButton.on('pointerover', () => { menuButton.setStyle({ backgroundColor: '#666' }); });
        menuButton.on('pointerout', () => { menuButton.setStyle({ backgroundColor: '#444' }); });

        this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.restartKey.on('down', this.restartGame, this);
        this.add.text(gameWidth / 2, gameHeight - 30, 'Tryck MELLANSLAG för att spela igen', { fontSize: '16px', fill: '#aaa', stroke: '#000', strokeThickness: 1 }).setOrigin(0.5);
    }

    restartGame() {
        if (!this.scene.isActive()) return;
        console.log(`GameOverScene: Restarting game with difficulty: ${this.difficultyLevel} and tables: ${this.tableRange}`);
        if (this.restartKey) { this.restartKey.off('down', this.restartGame, this); }
        this.scene.start('GameScene', { difficulty: this.difficultyLevel, tables: this.tableRange });
    }

    shutdown() {
        console.log("GameOverScene shutting down...");
        if (this.restartKey) { this.restartKey.off('down', this.restartGame, this); this.restartKey = null; }
    }
}


// --- Grundläggande Phaser Konfiguration (DEFINIERAS EFTER KLASSERNA) ---
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
     // *** NYTT: Lägg till audio-konfiguration ***
    audio: {
        disableWebAudio: false // Använd Web Audio API om möjligt (bättre prestanda/funktioner)
        // noAudio: false // Sätt till true för att helt stänga av ljud (för testning)
    },
    scene: [PreloadScene, MainMenuScene, GameScene, GameOverScene]
};

// Skapa spelet när DOM är redo
window.onload = () => {
    const game = new Phaser.Game(config);
};