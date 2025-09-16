import { GameScene } from './scene/game-scene.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#dddddd',
    width: 1920,
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    dom: {
        createContainer: true
    },

    scene: [GameScene]
};


var game = new Phaser.Game(config);
