import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { Game } from './scenes/Game';
import { GameComplete } from './scenes/GameComplete';

const config = {
    type: Phaser.AUTO,
    width: 1004,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#00000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        },
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameComplete,
        GameOver
    ],
    debug: true
};

export default new Phaser.Game(config);