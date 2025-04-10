// --- Grundläggande Phaser Konfiguration ---
const config = {
    type: Phaser.AUTO, // Välj bästa rendering (WebGL eller Canvas)
    scale: {
        mode: Phaser.Scale.FIT, // Anpassa till fönstret men behåll proportioner
        parent: 'phaser-example', // ID på div om vi hade en specifik (valfritt här)
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centrera canvas automatiskt
        width: 800,  // Spelets bredd i pixlar
        height: 600 // Spelets höjd i pixlar
    },
    physics: {
        default: 'arcade', // Använd enkel och snabb arkadfysik
        arcade: {
            gravity: { y: 0 }, // Ingen global gravitation nedåt
            debug: false // Sätt till true för att se kollisionsramar
        }
    },
    // Definiera spelets olika "scener" (skärmar/nivåer)
    scene: [PreloadScene, MainMenuScene, GameScene, GameOverScene]
};

// Skapa en ny Phaser-spelinstans
const game = new Phaser.Game(config);

// --- Scener ---

// 1. PreloadScene: Laddar alla resurser (bilder, ljud)
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("PreloadScene: Loading assets...");
        // Ladda nödvändiga bilder
        // ANMÄRKNING: Du behöver ersätta dessa med riktiga bildfiler!
        // Om du inte har bilder än, kan du använda platshållare:
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
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(config.width / 2 - 160, config.height / 2 - 25, 320, 50);

        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(config.width / 2 - 150, config.height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', function () {
            console.log("PreloadScene: Assets loaded!");
            progressBar.destroy();
            progressBox.destroy();
            this.scene.start('MainMenuScene'); // Gå till huvudmenyn när allt är laddat
        }, this);
    }
}

// 2. MainMenuScene: Visar titel och startknapp
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        console.log("MainMenuScene: Creating menu...");
        this.add.image(config.width / 2, config.height / 2, 'sky').setScale(Math.max(config.width / 800, config.height / 600)); // Skala bakgrunden så den täcker

        this.add.text(config.width / 2, config.height / 2 - 100, 'Multiplikations-\nRymdspelet', {
            fontSize: '48px', fill: '#fff', align: 'center'
        }).setOrigin(0.5);

        const startButton = this.add.text(config.width / 2, config.height / 2 + 50, 'Starta Spel', {
            fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive(); // Gör texten klickbar

        startButton.on('pointerdown', () => {
            console.log("MainMenuScene: Starting game...");
            this.scene.start('GameScene'); // Starta huvudspelet
        });

        startButton.on('pointerover', () => startButton.setStyle({ fill: '#ff0' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#0f0' }));

        this.add.text(config.width / 2, config.height - 50, 'Använd piltangenter för att styra, Mellanslag för att skjuta.', {
            fontSize: '16px', fill: '#ccc'
        }).setOrigin(0.5);
    }
}

// 3. GameScene: Huvudspelet
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

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
    }

    create() {
        console.log("GameScene: Creating game elements...");
        // Bakgrund
        this.add.image(config.width / 2, config.height / 2, 'sky').setScale(Math.max(config.width / 800, config.height / 600));

        // Skapa spelarens skepp
        this.player = this.physics.add.sprite(config.width / 2, config.height - 50, 'player');
        this.player.setCollideWorldBounds(true); // Hindra spelaren från att åka utanför skärmen

        // Skapa grupper för skott och fiender
        this.bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 20 // Max antal skott på skärmen samtidigt
        });
        this.enemies = this.physics.add.group();

        // Input - Tangentbord
        this.cursors = this.input.keyboard.createCursorKeys(); // Piltangenter
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // Mellanslag

        // Input - Touch (Enkel variant för att skjuta)
        this.input.on('pointerdown', (pointer) => {
            this.fireBullet();
        });


        // UI Text (Poäng, Liv, Problem)
        this.scoreText = this.add.text(16, 16, 'Poäng: 0', { fontSize: '24px', fill: '#fff' });
        this.livesText = this.add.text(config.width - 150, 16, 'Liv: 3', { fontSize: '24px', fill: '#fff' });
        this.problemText = this.add.text(config.width / 2, 30, 'X * Y = ?', { fontSize: '32px', fill: '#ff0' }).setOrigin(0.5);

        // Kollisionshantering
        // Vad händer när ett skott träffar en fiende? Kör funktionen hitEnemy
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        // Vad händer när en fiende når botten? (Vi gör en enkel y-kontroll i update)

        // Starta spelet
        this.score = 0;
        this.lives = 3;
        this.updateUI();
        this.generateNewProblem();

        // Timer för att skapa fiender (t.ex. var 2.5 sekund)
        this.enemySpawnTimer = this.time.addEvent({
            delay: 2500, // Millisekunder
            callback: this.spawnEnemies,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        // --- Spelarens styrning ---
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Styrning med pekare/mus (flytta skeppet dit man pekar/klickar på X-axeln)
         if (this.input.activePointer.isDown) {
             const touchX = this.input.activePointer.x;
             // Ge en liten "död zon" runt skeppet för att undvika ryckighet
             if (Math.abs(touchX - this.player.x) > this.player.width / 4) {
                 this.physics.moveTo(this.player, touchX, this.player.y, 300); // Flytta mot pekaren
             } else {
                 this.player.setVelocityX(0);
             }
         }

        // Skjuta med mellanslag (med tidsbegränsning)
        if (this.fireKey.isDown && time > this.lastFired) {
            this.fireBullet(time);
        }

        // --- Fiendens logik ---
        Phaser.Actions.IncY(this.enemies.getChildren(), 100 * (delta / 1000)); // Flytta fiender nedåt (justera hastigheten)

        this.enemies.getChildren().forEach(enemy => {
            // Uppdatera textens position om den följer med skeppet
            if (enemy.answerText) {
                enemy.answerText.setPosition(enemy.x, enemy.y + enemy.displayHeight / 2 + 5); // Justera Y-offset
            }

            // Ta bort fiende och minska liv om den når botten
            if (enemy.y > config.height) {
                this.enemyOutOfBounds(enemy);
            }
        });

         // --- Skottens logik ---
         this.bullets.getChildren().forEach(bullet => {
            // Ta bort skott som åker utanför skärmen uppåt
            if (bullet.y < 0) {
                bullet.destroy(); // Eller deaktivera och återanvänd: bullet.setActive(false).setVisible(false);
            }
        });
    }

    generateNewProblem() {
        this.currentProblem.num1 = Phaser.Math.Between(1, 10);
        this.currentProblem.num2 = Phaser.Math.Between(1, 10);
        this.correctAnswer = this.currentProblem.num1 * this.currentProblem.num2;
        this.problemText.setText(`${this.currentProblem.num1} × ${this.currentProblem.num2} = ?`);
        console.log(`New problem: ${this.currentProblem.num1}x${this.currentProblem.num2}=${this.correctAnswer}`);

        // Rensa gamla fiender när ny fråga ställs? (Valfritt, kan göras här)
        // this.enemies.clear(true, true); // Tar bort alla fiender och deras text
    }

    spawnEnemies() {
        if(this.lives <= 0) return; // Spawna inte om spelet är över

        const numberOfEnemies = Phaser.Math.Between(3, 5); // Antal fiender per våg
        const enemySpacing = config.width / (numberOfEnemies + 1);
        const answers = this.generateAnswers(this.correctAnswer, numberOfEnemies);
        Phaser.Utils.Array.Shuffle(answers); // Blanda svaren

        for (let i = 0; i < numberOfEnemies; i++) {
            const x = enemySpacing * (i + 1);
            const y = Phaser.Math.Between(50, 150); // Slumpmässig start-Y
            const enemy = this.enemies.create(x, y, 'enemy');
            enemy.setOrigin(0.5);
            enemy.setVelocityY(Phaser.Math.Between(50, 150)); // Ge lite slumpmässig hastighet

            // Lägg till svarstext på fienden
            const answer = answers[i];
            const style = { fontSize: '20px', fill: (answer === this.correctAnswer) ? '#0f0' : '#f00' }; // Grön för rätt, röd för fel
            const answerText = this.add.text(x, y + enemy.displayHeight / 2 + 5, answer.toString(), style).setOrigin(0.5);

            // Spara referens till texten och svaret PÅ fiendeobjektet
            enemy.answerText = answerText;
            enemy.answerValue = answer;
        }
        console.log("Spawned enemies with answers:", answers);
    }

    generateAnswers(correct, count) {
        const answers = new Set([correct]); // Använd Set för att enkelt undvika dubbletter
        while (answers.size < count) {
            // Generera felaktiga svar (t.ex. nära det rätta, eller slumpmässigt inom rimligt intervall)
            let wrongAnswer;
            do {
                const offset = Phaser.Math.Between(1, 10) * (Phaser.Math.RND.pick([-1, 1])); // Slumpmässigt + eller -
                wrongAnswer = Math.max(1, correct + offset); // Undvik 0 eller negativa om inte det är meningen
            } while (answers.has(wrongAnswer)); // Försök igen om svaret redan finns
            answers.add(wrongAnswer);
        }
        return Array.from(answers); // Konvertera Set tillbaka till Array
    }

    fireBullet(time) {
        // Förhindra för snabb skjutning
        if (time && time < this.lastFired) { return; }

        const bullet = this.bullets.get(this.player.x, this.player.y - this.player.displayHeight/2);

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityY(-400); // Skjut uppåt
            // this.sound.play('shootSound'); // Spela skjutljud
            this.lastFired = (time || this.time.now) + 200; // Vänta 200ms innan nästa skott (justera vid behov)
        }
    }

    hitEnemy(bullet, enemy) {
        console.log(`Hit enemy with answer: ${enemy.answerValue}. Correct is: ${this.correctAnswer}`);
        // Stäng av både skott och fiende
        bullet.setActive(false).setVisible(false).setPosition(-100, -100); // Flytta undan och dölj (återanvänds)
        // bullet.destroy(); // Alternativt: ta bort permanent

        if (enemy.answerValue === this.correctAnswer) {
            // Rätt svar!
            this.score += 10;
            // this.sound.play('hitSound'); // Spela träffljud
            // Lägg till visuell effekt (t.ex. explosion) här om du vill
             const particles = this.add.particles(enemy.x, enemy.y, 'bullet', { // Använd 'bullet' eller annan liten bild som partikel
                 speed: 100,
                 lifespan: 300,
                 blendMode: 'ADD', // Ljusare effekt
                 scale: { start: 0.5, end: 0 },
                 quantity: 10
             });
             this.time.delayedCall(300, () => particles.destroy()); // Ta bort partikelemittern


            // Ta bort fienden och dess text
            if (enemy.answerText) enemy.answerText.destroy();
            enemy.destroy();

            // Generera ny fråga och nya fiender
            this.generateNewProblem();
             // Rensa kvarvarande fiender från förra frågan? (Valfritt)
            this.enemies.getChildren().forEach(remainingEnemy => {
                 if (remainingEnemy.active) {
                    if (remainingEnemy.answerText) remainingEnemy.answerText.destroy();
                    remainingEnemy.destroy();
                }
            });
            //this.spawnEnemies(); // Spawna direkt, eller låt timern sköta det

        } else {
            // Fel svar!
            this.lives -= 1;
            this.cameras.main.shake(100, 0.01); // Skaka kameran lite
            // Lägg till ljudeffekt för fel svar?

             // Gör fienden röd och låt den fortsätta (eller ta bort den)
             enemy.setTint(0xff0000); // Gör den träffade (felaktiga) röd
             if (enemy.answerText) enemy.answerText.setTint(0xff0000); // Gör texten röd också

             // Valfritt: Ta bort den felaktiga fienden efter en kort stund
             this.time.delayedCall(500, () => {
                 if (enemy.active) {
                     if (enemy.answerText) enemy.answerText.destroy();
                     enemy.destroy();
                 }
             });

             if (this.lives <= 0) {
                this.gameOver();
             }
        }

        this.updateUI();
    }

    enemyOutOfBounds(enemy) {
         if (!enemy.active) return; // Ignorera om den redan hanterats (t.ex. vid träff)

        console.log("Enemy reached bottom!");
        this.lives -= 1; // Förlora ett liv
        this.cameras.main.shake(100, 0.01); // Skaka kameran
        this.updateUI();

        // Ta bort fienden och dess text
        if (enemy.answerText) enemy.answerText.destroy();
        enemy.destroy();

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateUI() {
        this.scoreText.setText(`Poäng: ${this.score}`);
        this.livesText.setText(`Liv: ${this.lives}`);
    }

    gameOver() {
        console.log("Game Over!");
        this.physics.pause(); // Stoppa all fysik
        this.player.setTint(0xff0000); // Gör spelaren röd
        this.enemySpawnTimer.destroy(); // Stoppa fiende-spawning
        this.enemies.getChildren().forEach(e => e.setVelocityY(0)); // Stanna fiender

        // Gå till GameOverScene efter en liten fördröjning
        this.time.delayedCall(1000, () => {
             // Skicka med poängen till nästa scen
            this.scene.start('GameOverScene', { score: this.score });
        });
    }
}

// 4. GameOverScene: Visar resultat och omstartknapp
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
        this.finalScore = 0;
    }

     // Ta emot data (poäng) från GameScene
    init(data) {
        this.finalScore = data.score !== undefined ? data.score : 0; // Fånga upp poängen
    }

    create() {
        console.log("GameOverScene: Creating game over screen...");
        this.add.image(config.width / 2, config.height / 2, 'sky').setScale(Math.max(config.width / 800, config.height / 600)).setAlpha(0.7); // Lite genomskinlig bakgrund

        this.add.text(config.width / 2, config.height / 2 - 100, 'Spelet Slut!', {
            fontSize: '48px', fill: '#f00'
        }).setOrigin(0.5);

        this.add.text(config.width / 2, config.height / 2, `Din poäng: ${this.finalScore}`, {
             fontSize: '32px', fill: '#fff'
         }).setOrigin(0.5);

        const restartButton = this.add.text(config.width / 2, config.height / 2 + 100, 'Spela Igen', {
            fontSize: '32px', fill: '#0f0', backgroundColor: '#333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            console.log("GameOverScene: Restarting game...");
             // Viktigt: Använd scene.start() för att återställa GameScene korrekt
            this.scene.start('GameScene');
        });

        restartButton.on('pointerover', () => restartButton.setStyle({ fill: '#ff0' }));
        restartButton.on('pointerout', () => restartButton.setStyle({ fill: '#0f0' }));
    }
}