import { GameScene } from './scene/game-scene.js';
import { setting } from './utils/utils.js';

let width = 1080;
let height = 1920;

if(window.innerWidth > window.innerHeight){
    // Landscape
    width = 1920;
    height = 1080;
    setting.isMobile = false;
}


const config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#dddddd',
    width: width,
    height: height,
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


window.addEventListener('resize', () => {
    location.reload();
});
