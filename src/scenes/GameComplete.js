import { Scene } from 'phaser';

export class GameComplete extends Scene {
    constructor() {
        super('GameComplete');
    }

    create() {
        this.add.image(512, 384, 'background');
        this.add.text(512, 384, 'Game Complete!', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
