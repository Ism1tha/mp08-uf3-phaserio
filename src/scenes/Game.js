import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.record = 0;
    }

    preload() {
        this.load.image('island_png', 'assets/game/map/island_24x24.png');
        this.load.tilemapTiledJSON('island', 'assets/game/map/island.json');
        this.load.image('bullet', 'assets/game/other/fireball.png');
        this.load.image('health', 'assets/game/other/life.png');
        this.load.image('powerup', 'assets/game/other/powerup.png');
        this.load.image('triple_shot', 'assets/game/other/powerup_2.png');
        this.load.image('360_shooting', 'assets/game/other/powerup_3.png'); // Load 360-degree shooting power-up item
        this.load.image('enemy', 'assets/game/characters/skeleton.png');
        this.load.image('player', 'assets/game/characters/mage.png');
        this.load.audio('backgroundMusic', 'assets/music/game.mp3');
        this.load.audio('attackSound', 'assets/game/sounds/attack.mp3');
        this.load.audio('damageSound', 'assets/game/sounds/damage.mp3');
    }

    create() {

        // Game variables
        this.score = 0;
        this.livesCount = 3;
        this.enemySpawnInterval = 2000; // initial spawn interval
        this.lastEnemySpawnTime = 0;
        this.enemySpeed = 100; // initial enemy speed
        this.isInvincible = false;
        this.isTripleShotActive = false; // Track if triple shot power-up is active
        this.isShooting360Active = false; // Track if 360-degree shooting power-up is active
        this.record = this.data.get('record') || 0;

        // Music
        this.backgroundMusic = this.sound.add('backgroundMusic', { loop: true });
        this.backgroundMusic.play();

        // Sounds
        this.attackSound = this.sound.add('attackSound');
        this.damageSound = this.sound.add('damageSound');

        // Tilemap setup
        const map = this.make.tilemap({ key: 'island' });
        const tileset = map.addTilesetImage('island_24x24', 'island_png');
        var fondo = map.createLayer('Survival Island', tileset, 0, 0);
        fondo.setCollisionByProperty({ colision: true });

        // Player setup
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setScale(0.5);  // Adjust the scale as needed

        // Score and lives setup
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, { fontSize: '32px', fill: '#000' });
        this.livesText = this.add.text(16, 50, 'Lives: ' + this.livesCount, { fontSize: '32px', fill: '#000' });

        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', this.shootBullet, this);

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.healthItems = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.tripleShotPowerups = this.physics.add.group(); // Group for triple-shot power-ups
        this.shooting360Powerups = this.physics.add.group(); // Group for 360-degree shooting power-ups

        // Colliders
        this.physics.add.collider(this.player, fondo);
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.player, this.enemies, this.enemyCollision, null, this);
        this.physics.add.overlap(this.player, this.healthItems, this.collectHealth, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.player, this.tripleShotPowerups, this.collectTripleShotPowerup, null, this);
        this.physics.add.overlap(this.player, this.shooting360Powerups, this.collectShooting360Powerup, null, this);
    }

    update(time, delta) {
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-250);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(250);
        } else {
            this.player.setVelocityX(0);
        }
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-250);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(160);
        } else {
            this.player.setVelocityY(0);
        }

        // Enemy spawning
        if (time > this.lastEnemySpawnTime + this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawnTime = time;
            if (this.enemySpawnInterval > 500) { // Minimum spawn interval
                this.enemySpawnInterval -= 100; // Speed up enemy spawning
            }
            this.enemySpeed += 5; // Increase enemy speed (reduced from 10 to 5)
        }

        // Enemy movement
        this.enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, this.player, this.enemySpeed);
        });
    }

    shootBullet(pointer) {
        this.attackSound.play();
        const bulletSpeed = 300;
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        this.physics.moveTo(bullet, pointer.x, pointer.y, bulletSpeed);
    
        // Calculate the angle between the bullet and the pointer
        const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, pointer.x, pointer.y);
        // Convert the angle to degrees and set it as the initial rotation of the bullet
        bullet.rotation = Phaser.Math.RadToDeg(angle);
    
        // Add rotation tween to make the bullet spin 360 degrees
        this.tweens.add({
            targets: bullet,
            rotation: bullet.rotation + Phaser.Math.PI2, // Add 360 degrees in radians
            duration: 1000, // Adjust the duration as needed
            ease: 'Linear',
            repeat: -1 // Repeat indefinitely
        });
    }
    

    shoot360Bullet(pointer) {
        const bulletSpeed = 300;
        const numBullets = 36; // Number of bullets in a circle
        const angleIncrement = (2 * Math.PI) / numBullets;

        for (let i = 0; i < numBullets; i++) {
            const angle = i * angleIncrement;
            const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
            this.physics.moveTo(bullet, pointer.x + Math.cos(angle) * 100, pointer.y + Math.sin(angle) * 100, bulletSpeed);
        }
    }

    spawnEnemy() {
        const minDistance = 250; // Minimum distance from the player
        let x, y;
        const playerX = this.player.x;
        const playerY = this.player.y;
        
        // Ensure enemy spawns at least `minDistance` away from the player
        do {
            x = Phaser.Math.Between(0, this.game.config.width);
            y = Phaser.Math.Between(0, this.game.config.height);
        } while (Phaser.Math.Distance.Between(playerX, playerY, x, y) < minDistance);
    
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.setScale(3);
        enemy.setCollideWorldBounds(true);
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.data.set('score', this.score);
    
        // Random chance to drop a health item or power-up
        const dropChance = Phaser.Math.Between(0, 500);
        if (dropChance < 10) { // Reduce the chance for health item drop to 10%
            const health = this.healthItems.create(enemy.x, enemy.y, 'health');
            health.setScale(0.5); // Adjust scale
            health.setCollideWorldBounds(true);
        } else if (dropChance < 20) { // Reduce the chance for invincibility power-up to 10%
            const powerup = this.powerups.create(enemy.x, enemy.y, 'powerup');
            powerup.setScale(0.5); // Adjust scale
            powerup.setCollideWorldBounds(true);
        } else if (dropChance < 30) { // Reduce the chance for triple-shot power-up to 10%
            const tripleShot = this.tripleShotPowerups.create(enemy.x, enemy.y, 'triple_shot');
            tripleShot.setScale(0.5); // Adjust scale
            tripleShot.setCollideWorldBounds(true);
        } else if (dropChance < 40) { // Reduce the chance for 360-degree shooting power-up to 10%
            const shooting360 = this.shooting360Powerups.create(enemy.x, enemy.y, '360_shooting');
            shooting360.setScale(0.5); // Adjust scale
            shooting360.setCollideWorldBounds(true);
        }
    }

    enemyCollision(player, enemy) {
        if (!this.isInvincible) {
            this.physics.pause();
            player.setTint(0xff0000);
            this.livesCount -= 1;
            this.damageSound.play();
            this.livesText.setText('Lives: ' + this.livesCount);
            this.data.set('lives', this.livesCount);
            enemy.destroy();
    
            if (this.livesCount <= 0) {
                this.backgroundMusic.stop();
                const currentRecord = this.data.get('record') || 0;
                if (this.score > currentRecord) {
                    this.data.set('record', this.score);
                }
                if (this.score > currentRecord) {
                    this.scene.start('GameComplete');
                } else {
                    this.scene.start('GameOver');
                }
            } else {
                this.time.delayedCall(1000, () => {
                    this.physics.resume();
                    player.clearTint();
                });
            }
        } else {
            enemy.destroy();
        }
    }
    

    collectHealth(player, health) {
        health.destroy();
        this.livesCount += 1;
        this.livesText.setText('Lives: ' + this.livesCount);
        this.data.set('lives', this.livesCount);
    }

    collectPowerup(player, powerup) {
        powerup.destroy();
        this.isInvincible = true;
        player.setTint(0x00ff00); // Change player color to indicate invincibility
        this.time.delayedCall(10000, () => {
            this.isInvincible = false;
            player.clearTint();
        });
    }

    collectTripleShotPowerup(player, tripleShotPowerup) {
        tripleShotPowerup.destroy();
        this.isTripleShotActive = true;
        player.setTint(0x0000ff); // Change player color to indicate triple shot power-up
        this.time.delayedCall(10000, () => {
            this.isTripleShotActive = false;
            player.clearTint();
        });
    }

    collectShooting360Powerup(player, shooting360) {
        shooting360.destroy();
        this.isShooting360Active = true;
        player.setTint(0xff00ff); // Change player color to indicate 360-degree shooting power-up
        this.time.delayedCall(10000, () => {
            this.isShooting360Active = false;
            player.clearTint();
        });
    }
}
