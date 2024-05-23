import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        // Preload the Game scene to ensure its assets are loaded
        this.scene.get('Game').preload();
    }

    create() {
        this.add.image(512, 384, 'background');
        this.add.image(512, 300, 'logo');

        const pressText = this.add.text(512, 460, 'Press click to play!', {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });

        let record = this.scene.get('Game').data.get('record') || 0;

        this.add.text(512, 600, 'High Score: ' + record, {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Make the press text bounce
        this.tweens.add({
            targets: pressText,
            y: 500,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}
