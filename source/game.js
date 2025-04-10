// --- Scener (DEFINIERAS FÖRST) ---

// 1. PreloadScene: Laddar alla resurser (bilder, ljud)
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("PreloadScene: Loading assets...");
        // Ladda nödvändiga bilder
        // ANMÄRKNING: Du behöver ersätta dessa med riktiga bildfiler!
        // Sökvägarna antar att du har en 'assets'-mapp bredvid din HTML/JS-fil.
        this.load.image('sky', 'assets/sky.png'); // Bakgrund
        this.load.image('player', 'assets/playerShip.png'); // Spelarens skepp
        this.load.image('enemy', 'assets/enemyShip.png'); // Fiendeskepp
        this.load.image('bullet', 'assets/bullet.png'); // Skott

        // Ladda eventuella ljudfiler (valfritt för MVP)
        // this.load.audio('shootSound', 'assets/shoot.wav');
        // this.load.audio('hitSound', 'assets/hit.wav');

        // Visa en laddningsindikator (valfritt men bra)
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        // Dynamiskt hämta bredd/höjd från config (om den redan finns, annars hårdkoda eller vänta)
        // För enkelhets skull använder vi de förväntade värdena här:
        const gameWidth = 800;
        const gameHeight = 600;
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
            this.scene.start('MainMenuScene'); // Gå till huvudmenyn när allt är laddat
        }, this);

        // Hantera laddningsfel (bra praxis)
        this.load.on('loaderror', function (file) {
            console.error('Error loading asset:', file.key, file.url);
            // Du kan visa ett felmeddelande för användaren här
            this.add.text(gameWidth / 2, gameHeight / 2 + 50, `Error loading: ${file.key}\nCheck assets folder and filenames.`, {
                fontSize: '18px', fill: '#ff0000', align: 'center'
            }).setOrigin(0.5);
        }, this);
    }
}

// 2. MainMenuScene: Visar titel och startknapp
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("MainMenuScene: Creating menu...");
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600)); // Skala bakgrunden så den täcker

        this.add.text(gameWidth / 2, gameHeight / 2 - 100, 'Multiplikations-\nRymdspelet', {
            fontSize: '48px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        const startButton = this.add.text(gameWidth / 2, gameHeight / 2 + 50, 'Starta Spel', {
            fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 },
            stroke: '#000', strokeThickness: 2, // Lägg till en liten kant för tydlighet
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true } // Skugga
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }); // Gör texten klickbar och visa handpekare

        startButton.on('pointerdown', () => {
            console.log("MainMenuScene: Starting game...");
            this.scene.start('GameScene'); // Starta huvudspelet
        });

        // Visuell feedback vid hover
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff0' }); // Byt färg
            startButton.setScale(1.05); // Gör lite större
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#0f0' });
            startButton.setScale(1.0); // Tillbaka till normal storlek
        });

        this.add.text(gameWidth / 2, gameHeight - 50, 'Piltangenter/Tryck för att styra, Mellanslag/Tryck för att skjuta.', {
            fontSize: '16px', fill: '#ccc', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
    }
}

// 3. GameScene: Huvudspelet
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        // --- Skalningskonstanter ---
        this.PLAYER_SCALE = 0.1; // Exempel: Skala spelaren till 60%
        this.ENEMY_SCALE = 0.1;  // Exempel: Skala fiender till 70%
        this.BULLET_SCALE = 0.1; // Exempel: Skala skott till 80%

        // Spelvariabler
        this.player = null;
        this.cursors = null;
        this.fireKey = null;
        this.bullets = null;
        this.enemies = null;

        this.score = 0;
        this.lives = 3;
        this.scoreText = null;
        this.livesText = null;
        this.problemText = null;

        this.currentProblem = { num1: 0, num2: 0 };
        this.correctAnswer = 0;
        this.lastFired = 0;
        this.enemySpawnTimer = null;
        this.canShoot = true; // Flagga för att hantera skjutning
        this.active = true; // Flagga för att se om scenen är aktiv (för gameOver)
    }

    create() {
        this.active = true; // Återställ vid start
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameScene: Creating game elements...");

        // Bakgrund
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600));

        // Skapa spelarens skepp
        this.player = this.physics.add.sprite(gameWidth / 2, gameHeight - 70, 'player');
        this.player.setScale(this.PLAYER_SCALE); // *** SKALA SPELAREN ***
        this.player.setCollideWorldBounds(true);
        // Justera Body Size EFTER skalning, baserat på den nya displayWidth/Height
        this.player.setBodySize(this.player.displayWidth * 0.8, this.player.displayHeight * 0.8);
        this.player.body.setOffset(this.player.width * (1 - this.PLAYER_SCALE) * 0.5 + (this.player.width * this.PLAYER_SCALE * 0.1),
                                   this.player.height * (1 - this.PLAYER_SCALE) * 0.5 + (this.player.height * this.PLAYER_SCALE * 0.1)); // Centrera hitboxen lite bättre


        // Skapa grupper för skott och fiender
        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 10,
            runChildUpdate: true
        });
        // Skicka med skalan till Bullet-klassen om den behöver den
        this.bullets.createCallback = (bullet) => {
            bullet.setScale(this.BULLET_SCALE);
             // Justera hitbox för skott om nödvändigt (kan vara overkill)
             // bullet.setBodySize(bullet.displayWidth * 0.9, bullet.displayHeight * 0.9);
        };

        this.enemies = this.physics.add.group({
            runChildUpdate: false
        });

        // Input - Tangentbord
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Input - Touch/Mus
        this.input.on('pointerdown', (pointer) => {
            if (this.canShoot && this.active) {
                 this.fireBullet(this.time.now);
            }
        });
         this.input.on('pointermove', (pointer) => {
             if (pointer.isDown && this.player && this.player.body && this.active) {
                 this.physics.moveTo(this.player, pointer.x, this.player.y, 400);
             }
         });
         this.input.on('pointerup', () => {
             if (this.player && this.player.body && this.active) {
                this.player.setVelocityX(0);
             }
         });


        // UI Text
        this.scoreText = this.add.text(16, 16, 'Poäng: 0', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 });
        this.livesText = this.add.text(gameWidth - 16, 16, 'Liv: 3', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
        this.problemText = this.add.text(gameWidth / 2, 30, 'X × Y = ?', { fontSize: '32px', fill: '#ff0', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

        // Kollisionshantering
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);

        // Starta spelet
        this.score = 0;
        this.lives = 3;
        this.canShoot = true;
        this.updateUI();
        this.generateNewProblem();

        // Timer för att skapa fiender
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2500,
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        if (!this.active || !this.player || !this.player.body) {
            return;
        }

        // Spelarens styrning (Tangentbord)
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-350);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(350);
        } else if (!this.input.activePointer.isDown) {
             this.player.setVelocityX(0);
        }

        // Skjuta med mellanslag
        if (this.fireKey.isDown && this.canShoot) {
            this.fireBullet(time);
        }

        // Fiendens logik
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active || !enemy.body) return;

            // Uppdatera textens position (använder displayHeight som nu är skalad)
            if (enemy.answerText && enemy.answerText.active) {
                enemy.answerText.setPosition(enemy.x, enemy.y + enemy.displayHeight / 2 + 10);
            }

            // Ta bort fiende om den når botten
            if (enemy.y > this.cameras.main.height + enemy.displayHeight) {
                this.enemyOutOfBounds(enemy);
            }
        });
    }

    generateNewProblem() {
        if (this.lives <= 0 || !this.active) return;

        this.currentProblem.num1 = Phaser.Math.Between(1, 10);
        this.currentProblem.num2 = Phaser.Math.Between(1, 10);
        this.correctAnswer = this.currentProblem.num1 * this.currentProblem.num2;
        this.problemText.setText(`${this.currentProblem.num1} × ${this.currentProblem.num2} = ?`);
        console.log(`New problem: ${this.currentProblem.num1}x${this.currentProblem.num2}=${this.correctAnswer}`);

        this.clearEnemies();
        this.canShoot = true;
    }

     clearEnemies() {
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                if (enemy.answerText && enemy.answerText.active) {
                    enemy.answerText.destroy();
                }
                enemy.destroy();
            }
        });
    }


    spawnEnemies() {
        if(this.lives <= 0 || !this.active) return;

        const gameWidth = this.cameras.main.width;
        const numberOfEnemies = Phaser.Math.Between(3, 5);
        const enemySpacing = gameWidth / (numberOfEnemies + 1);
        const answers = this.generateAnswers(this.correctAnswer, numberOfEnemies);
        Phaser.Utils.Array.Shuffle(answers);

        for (let i = 0; i < numberOfEnemies; i++) {
            const x = enemySpacing * (i + 1);
            const y = -50;

            const enemy = this.enemies.create(x, y, 'enemy');
            if (!enemy || !enemy.body) continue;

            enemy.setScale(this.ENEMY_SCALE); // *** SKALA FIENDEN ***
            enemy.setOrigin(0.5);
            enemy.setVelocityY(Phaser.Math.Between(80, 150));
            // Justera Body Size EFTER skalning
            enemy.setBodySize(enemy.displayWidth * 0.8, enemy.displayHeight * 0.8);
             enemy.body.setOffset(enemy.width * (1 - this.ENEMY_SCALE) * 0.5 + (enemy.width * this.ENEMY_SCALE * 0.1),
                                   enemy.height * (1 - this.ENEMY_SCALE) * 0.5 + (enemy.height * this.ENEMY_SCALE * 0.1)); // Centrera hitboxen


            // Lägg till svarstext på fienden
            const answer = answers[i];
            const style = {
                fontSize: '22px', fill: '#fff', stroke: '#000',
                strokeThickness: 3, align: 'center'
             };
            // Positionera texten under den *skalade* fienden
            const answerText = this.add.text(x, y + enemy.displayHeight / 2 + 10, answer.toString(), style).setOrigin(0.5);

            enemy.answerText = answerText;
            enemy.answerValue = answer;

            // Studs-tweening (använder nu skalad displayHeight för positionering)
            const finalY = Phaser.Math.Between(80, 120);
            this.tweens.add({
                targets: enemy,
                y: finalY,
                duration: 500,
                ease: 'Bounce.easeOut'
            });
             this.tweens.add({
                 targets: answerText,
                 // Uppdatera textens Y-position baserat på fiendens slutposition och skalade höjd
                 y: finalY + enemy.displayHeight / 2 + 10,
                 duration: 500,
                 ease: 'Bounce.easeOut'
             });
        }
        console.log("Spawned enemies with answers:", answers);
    }

    generateAnswers(correct, count) {
        const answers = new Set([correct]);
        const minRange = Math.max(1, correct - 15);
        const maxRange = correct + 15;

        while (answers.size < count) {
            let wrongAnswer;
            let attempts = 0;
            do {
                wrongAnswer = Phaser.Math.Between(minRange, maxRange);
                attempts++;
            } while (answers.has(wrongAnswer) && attempts < 50);

            if (!answers.has(wrongAnswer)) {
                 answers.add(wrongAnswer);
            } else if (attempts >= 50) {
                let fallback = correct + answers.size;
                while(answers.has(fallback)) fallback++;
                if (fallback > 0) answers.add(fallback);
            }
        }
        return Array.from(answers);
    }

    fireBullet(time) {
        if (!this.canShoot || (time && time < this.lastFired) || !this.active) { return; }

        // Hämta ett skott från poolen (createCallback sätter skalan)
        const bullet = this.bullets.get(this.player.x, this.player.y - this.player.displayHeight / 2);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            // Återställ position och fysik
            bullet.body.reset(this.player.x, this.player.y - this.player.displayHeight / 2);
            bullet.setVelocityY(-500);
            bullet.body.setAllowGravity(false);

            // this.sound.play('shootSound');
            this.lastFired = time + 300; // Cooldown

            this.canShoot = false;
            this.time.delayedCall(300, () => { this.canShoot = true; });
        }
    }

    hitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active || !this.active) {
            return;
        }
        console.log(`Hit enemy with answer: ${enemy.answerValue}. Correct is: ${this.correctAnswer}`);

        bullet.destroy(); // Förstör skottet

        if (enemy.answerValue === this.correctAnswer) {
            // Rätt svar
            this.score += 10;
            // this.sound.play('hitSound');

            // Partikeleffekt
             const particles = this.add.particles(enemy.x, enemy.y, 'bullet', {
                 speed: { min: 50, max: 150 }, angle: { min: 0, max: 360 },
                 scale: { start: this.BULLET_SCALE * 0.8, end: 0 }, // Skala partiklar också
                 lifespan: 400, blendMode: 'ADD', quantity: 15, emitting: true
             });
             this.time.delayedCall(400, () => particles.destroy());

            // Ta bort fiende och text
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
            enemy.destroy();

            this.updateUI();
            this.generateNewProblem();

        } else {
            // Fel svar
            this.lives -= 1;
            this.cameras.main.shake(150, 0.015);

            // Markera fiende
            enemy.setTint(0xff8888);
            if (enemy.answerText && enemy.answerText.active) enemy.answerText.setTint(0xff8888);

            // Ta bort efter fördröjning
             this.time.delayedCall(500, () => {
                 if (enemy.active) {
                     if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
                     enemy.destroy();
                 }
             });

            this.updateUI();
            if (this.lives <= 0) {
                this.gameOver();
            }
        }
    }

    enemyOutOfBounds(enemy) {
         if (!enemy.active || !this.active) return;

        console.log("Enemy reached bottom!");
        this.lives -= 1;
        this.cameras.main.shake(100, 0.01);
        this.updateUI();

        if (enemy.answerText && enemy.answerText.active) enemy.answerText.destroy();
        enemy.destroy();

        if (this.lives <= 0) {
            this.gameOver();
        }
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

        this.enemies.getChildren().forEach(e => {
            if (e.body) e.setVelocityY(0);
            if (e.active) e.setTint(0xaaaaaa);
        });

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene', { score: this.score });
        });
    }

     shutdown() {
         console.log("GameScene shutting down...");
         if (this.enemySpawnTimer) {
             this.enemySpawnTimer.destroy();
             this.enemySpawnTimer = null;
         }
         this.input.off('pointerdown');
         this.input.off('pointermove');
         this.input.off('pointerup');
         this.player = null;
         this.bullets = null;
         this.enemies = null;
         this.active = false; // Markera som inaktiv vid shutdown
     }
}

// Anpassad klass för skott
class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }

    // Automatisk borttagning när skottet åker utanför skärmen
    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        if (this.y <= -this.displayHeight) { // Ge lite marginal baserat på höjd
            this.setActive(false);
            this.setVisible(false);
            // this.destroy();
        }
    }
}


// 4. GameOverScene: Visar resultat och omstartknapp
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0;
    }

    init(data) {
        this.finalScore = data.score !== undefined ? data.score : 0;
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        console.log("GameOverScene: Creating game over screen...");
        this.add.image(gameWidth / 2, gameHeight / 2, 'sky').setScale(Math.max(gameWidth / 800, gameHeight / 600)).setAlpha(0.7);

        this.add.text(gameWidth / 2, gameHeight / 2 - 100, 'Spelet Slut!', {
            fontSize: '48px', fill: '#f00', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(gameWidth / 2, gameHeight / 2, `Din poäng: ${this.finalScore}`, {
             fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 3
         }).setOrigin(0.5);

        const restartButton = this.add.text(gameWidth / 2, gameHeight / 2 + 100, 'Spela Igen', {
            fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 },
            stroke: '#000', strokeThickness: 2,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        restartButton.on('pointerdown', () => {
            console.log("GameOverScene: Restarting game...");
            // Återställ GameScene när den startas om
            const gameScene = this.scene.get('GameScene');
             if (gameScene) {
                // Nollställ variabler manuellt om nödvändigt,
                // eller lita på att create() gör det.
             }
            this.scene.start('GameScene');
        });

        restartButton.on('pointerover', () => {
            restartButton.setStyle({ fill: '#ff0' });
            restartButton.setScale(1.05);
        });
        restartButton.on('pointerout', () => {
            restartButton.setStyle({ fill: '#0f0' });
            restartButton.setScale(1.0);
        });
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
        arcade: {
            gravity: { y: 0 },
            debug: false // Sätt till true för att se kollisionsramar
        }
    },
    scene: [PreloadScene, MainMenuScene, GameScene, GameOverScene]
};

// Skapa spelet när DOM är redo
window.onload = () => {
    const game = new Phaser.Game(config);
};
