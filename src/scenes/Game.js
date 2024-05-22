import { Scene } from 'phaser';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.enemySpawnInterval = 2000; // initial spawn interval
        this.lastEnemySpawnTime = 0;
    }

    preload() {
        this.load.image('island_png', 'assets/game/map/island_24x24.png');
        this.load.tilemapTiledJSON('island', 'assets/game/map/island.json');
        this.load.image('player', 'assets/game/player.png');
        this.load.image('bullet', 'assets/game/other/fireball.png');
        this.load.image('enemy', 'assets/game/enemy.png');
    }

    create() {
        // Tilemap setup
        const map = this.make.tilemap({ key: 'island' });
        const tileset = map.addTilesetImage('island_24x24', 'island_png');
        var fondo = map.createLayer('Survival Island', tileset, 0, 0);
        fondo.setCollisionByProperty({ colision: true });

        // Player setup
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, fondo);

        // Score and lives setup
        this.score = this.data.get('score') || 0;
        this.scoreText = this.add.text(16, 16, 'Score: ' + this.score, { fontSize: '32px', fill: '#000' });

        this.livesCount = this.data.get('lives') || 3;
        this.livesText = this.add.text(16, 50, 'Lives: ' + this.livesCount, { fontSize: '32px', fill: '#000' });

        // Input setup
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', this.shootBullet, this);

        // Groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Colliders
        this.physics.add.collider(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.player, this.enemies, this.enemyCollision, null, this);
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
        }

        // Enemy movement
        this.enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, this.player, 100);
        });
    }

    shootBullet(pointer) {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        this.physics.moveTo(bullet, pointer.x, pointer.y, 300);
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(0, this.game.config.width);
        const y = Phaser.Math.Between(0, this.game.config.height);
        const enemy = this.enemies.create(x, y, 'enemy');
        enemy.setCollideWorldBounds(true);
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        this.data.set('score', this.score);
    }

    enemyCollision(player, enemy) {
        this.physics.pause();
        player.setTint(0xff0000);
        this.livesCount -= 1;
        this.livesText.setText('Lives: ' + this.livesCount);
        this.data.set('lives', this.livesCount);
        enemy.destroy();

        if (this.livesCount <= 0) {
            this.scene.start('GameOver');
        } else {
            this.time.delayedCall(1000, () => {
                this.physics.resume();
                player.clearTint();
            });
        }
    }
}
