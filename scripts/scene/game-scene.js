import { getHeight, getWidth } from "../utils/utils.js";

export class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
      this.currentQuestion = 0;
      this.totalQuestions = 20;
      this.score = 0;
      this.mainCircleRadius = 400;
      this.centerX = 0;
      this.centerY = 0;
      this.displayCorrections = false;
  
      this.timerDuration = 10000; // 10 seconds in ms
      this.timerElapsed = 0;

      this.canAnswer = true;

    }
  
    create() {
      this.centerX = getWidth(this) / 2;
      this.centerY = getHeight(this) / 2;
  
      // Background
      this.add.rectangle(0, 0, getWidth(this), getHeight(this), 0xdddddd).setOrigin(0);
  
      this.gameContainer = this.add.container(0, 0);
  
      this.scoreText = this.add
        .text(300, getHeight(this) - 70, `${this.score} / ${this.currentQuestion} → ${this.totalQuestions}`, {
          fontSize: "32px",
          color: "#000",
        })
        .setOrigin(1, 0.5);
  
      // Main circle
      this.mainCircle = this.add
        .circle(this.centerX, this.centerY - 100, this.mainCircleRadius, 0x000000)
        .setStrokeStyle(4, 0xffffff);
      this.gameContainer.add(this.mainCircle);
  
      // Checkbox: Display Corrections
      this.checkbox = this.add
        .rectangle(getWidth(this) / 2 - 100, getHeight(this) - 160, 30, 30, 0xffffff)
        .setStrokeStyle(2, 0x000000)
        .setInteractive();
      this.checkmark = this.add
        .text(getWidth(this) / 2 - 100, getHeight(this) - 160, "✔", { fontSize: "24px", color: "#000" })
        .setOrigin(0.5)
        .setVisible(false);
      this.checkboxLabel = this.add
        .text(getWidth(this) / 2 - 60, getHeight(this) - 160, "Display corrections", { fontSize: "28px", color: "#000" })
        .setOrigin(0, 0.5);
  
      this.checkbox.on("pointerdown", () => {
        this.displayCorrections = !this.displayCorrections;
        this.checkmark.setVisible(this.displayCorrections);
      });
  
      // Next Button
      this.nextButton = this.add
        .text(getWidth(this) - 200, getHeight(this) - 70, "Next ▶", {
          fontSize: "50px",
          backgroundColor: "#4caf50",
          color: "#fff",
          padding: { x: 20, y: 10 },
        })
        .setOrigin(0.5)
        .setInteractive()
        .setVisible(false);
      this.nextButton.on("pointerdown", () => {
        this.startQuestion();
      });
  
      // ✅ Timer bar
      this.timerBarBg = this.add.rectangle(getWidth(this) - 50, 150, 20, getHeight(this) - 300, 0x04bd4b).setOrigin(0.5, 0);
      this.timerBar = this.add.rectangle(getWidth(this) - 50, 150, 20, getHeight(this) - 300, 0xff0000).setOrigin(0.5, 0);
  
      this.startQuestion();
    }
  
    startQuestion() {
      if (this.currentQuestion >= this.totalQuestions) {
        this.showResult();
        return;
      }

      this.canAnswer = true;
  
      this.nextButton.setVisible(false);
  
      this.currentQuestion++;
  
      // Reset timer
      this.timerElapsed = 0;
      if (this.timerEvent) this.timerEvent.remove();
      this.timerEvent = this.time.addEvent({
        delay: 100, // update every 100ms
        loop: true,
        callback: () => {
          
            if(this.canAnswer){
                this.timerElapsed += 100;
                let height = Phaser.Math.Clamp((1 - this.timerElapsed / this.timerDuration) * (getHeight(this) - 300), 0, getHeight(this) - 300);
                this.timerBar.height = height;
        
                if (this.timerElapsed >= this.timerDuration) {
                  //this.startQuestion(); // auto move to next question
                  this.checkAnswer(-1);
                }
            }
        
        },
      });
  
      // Clear old circles
      if (this.circleGroup) this.circleGroup.clear(true, true);
  
      this.correctCount = Phaser.Math.Between(8, 20);
      this.circleGroup = this.add.group();
  
      for (let i = 0; i < this.correctCount; i++) {
        let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        let radius = Phaser.Math.Between(50, this.mainCircleRadius - 30);
        let x = this.centerX + Math.cos(angle) * radius;
        let y = this.centerY - 100 + Math.sin(angle) * radius;
  
        let circle = this.add.circle(0, 0, 30, 0x888888);
        let countText = this.add.text(0, 0, (i + 1).toString(), {
          fontSize: "25px",
          color: "#fff",
          fontStyle: "bold",
        }).setOrigin(0.5).setVisible(false);
  
        let ballContainer = this.add.container(x, y, [circle, countText]);
        this.gameContainer.add(ballContainer);
        this.circleGroup.add(ballContainer);
  
        this.gameContainer.x = 1400;
  
        this.tweens.add({
          targets: this.gameContainer,
          x: 0,
          duration: 1000,
          ease: "Power2",
        });
  
        this.createConstrainedMovement(ballContainer);
      }
  
      // Create answer options
      if (this.optionGroup) this.optionGroup.clear(true, true);
      this.optionGroup = this.add.group();
  
      let options = [this.correctCount];
      while (options.length < 5) {
        let fake = Phaser.Math.Between(8, 20);
        if (!options.includes(fake)) options.push(fake);
      }
  
      Phaser.Utils.Array.Shuffle(options);
  
      options.forEach((num, idx) => {
        let btn = this.add
          .text(500 + idx * 200, getHeight(this) - 100, num, {
            fontSize: "42px",
            backgroundColor: "#cccccc",
            color: "#ffffff",
            padding: { x: 20, y: 10 },
          })
          .setInteractive()
          .on("pointerdown", () => this.checkAnswer(num));
        this.optionGroup.add(btn);
      });
    }
  
    checkAnswer(num) {

        if(!this.canAnswer) return;

        this.canAnswer = false;

      if (num === this.correctCount) this.score++;
      this.scoreText.text = `${this.score} / ${this.currentQuestion} → ${this.totalQuestions}`;
  
      if (this.displayCorrections) {
        this.circleGroup.children.iterate((ballContainer) => {
          let circle = ballContainer.list[0];
          circle.setFillStyle(Phaser.Display.Color.RandomRGB().color);
          circle.setStrokeStyle(2, 0xffffff);
          let countText = ballContainer.list[1];
          countText.setVisible(true);
        });
  
        if (this.currentQuestion != this.totalQuestions) this.nextButton.setVisible(true);
  
        this.optionGroup.children.iterate((btn) => {
          if (parseInt(btn.text) === this.correctCount) {
            btn.setStyle({ backgroundColor: "#4caf50", color: "#fff" });
          }
        });
      } else {
        this.startQuestion();
      }
  
      // Reset timer after answering
      this.timerElapsed = 0;
    }
  
    createConstrainedMovement(target) {
      const moveToRandomPoint = () => {
        let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        let maxRadius = this.mainCircleRadius - 30;
        let radius = Phaser.Math.FloatBetween(30, maxRadius);
  
        let targetX = this.centerX + Math.cos(angle) * radius;
        let targetY = this.centerY - 100 + Math.sin(angle) * radius;
  
        this.tweens.add({
          targets: target,
          x: targetX,
          y: targetY,
          duration: Phaser.Math.Between(800, 1200),
          onComplete: () => moveToRandomPoint(),
        });
      };
      moveToRandomPoint();
    }
  
    update() {}
    showResult() {
      this.add
        .text(getWidth(this) / 2, 400, `Game Over!\nYour Score: ${this.score}/${this.totalQuestions}`, {
          fontSize: "64px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5);
    }
  }
  