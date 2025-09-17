import { getCenterX, getHeight, getWidth, setting } from "../utils/utils.js";

export class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
        this.currentQuestion = 0;
        this.totalQuestions = 45;
        this.score = 0;
        this.mainCircleRadius = 400;
        this.centerX = 0;
        this.centerY = 0;

        this.totalGameTime = 120000; // 2 minutes in ms
        this.timeLeft = this.totalGameTime;

        this.canAnswer = true;
    }

    create() {
        this.centerX = getWidth(this) / 2;
        this.centerY = getHeight(this) / 2;

        // Background
        this.add.rectangle(0, 0, getWidth(this), getHeight(this), 0xdddddd).setOrigin(0);

        this.add.rectangle(getWidth(this) - 175, 50, 160, 50, 0x007cb8).setOrigin(0.5);

        this.gameContainer = this.add.container(0, 0);

        let x = setting.isMobile ? getCenterX(this) : 300;
        let y = setting.isMobile ? getHeight(this) - 180 : getHeight(this) - 70;
        this.scoreText = this.add
            .text(x, y, `${this.score} / ${this.currentQuestion} → ${this.totalQuestions}`, {
                fontSize: setting.isMobile ? "45px" : "32px",
                color: "#000",
            })
            .setOrigin(0.5);

        // Main circle
        this.mainCircle = this.add
            .circle(this.centerX, this.centerY - 100, this.mainCircleRadius, 0x000000)
            .setStrokeStyle(4, 0xffffff);
        this.gameContainer.add(this.mainCircle);

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

        // ✅ Global timer text (top-right corner)
        this.timerText = this.add.text(getWidth(this) - 100, 50, "02:00", {
            fontSize: "48px",
            color: "#ffffff",
        }).setOrigin(1, 0.5);

        // Start countdown timer
        this.timerEvent = this.time.addEvent({
            delay: 1000, // every second
            loop: true,
            callback: () => {
                if(this.currentQuestion >= this.totalQuestions)
                    return;
                this.timeLeft -= 1000;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.showResult();
                    this.timerEvent.remove();
                }
                this.updateTimerText();
            },
        });

        this.startQuestion();
    }

    updateTimerText() {
        let seconds = Math.floor(this.timeLeft / 1000);
        let minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
    
        // always 2 digit format
        let formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        this.timerText.setText(formatted);
    }
    

    startQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.showResult();
            return;
        }

        this.canAnswer = true;
        this.nextButton.setVisible(false);
        this.currentQuestion++;

        // Clear old circles
        if (this.circleGroup) this.circleGroup.clear(true, true);

        // ✅ Dynamic difficulty scaling
        let minBalls = 3; 
        let maxBalls = 20; 
        this.correctCount = Phaser.Math.Clamp(
            Math.floor(minBalls + (this.currentQuestion / this.totalQuestions) * (maxBalls - minBalls)),
            minBalls,
            maxBalls
        );

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

        // ✅ Create answer options (always 5) - all close to correct answer
        if (this.optionGroup) this.optionGroup.clear(true, true);
        this.optionGroup = this.add.group();

        // Generate options close to the correct answer
        let options = this.generateCloseOptions(this.correctCount);

        let xOffset = setting.isMobile ? 100 : 500;

        options.forEach((num, idx) => {
            let btn = this.add
                .text(xOffset + idx * 200, getHeight(this) - 100, num, {
                    fontSize: "42px",
                    backgroundColor: "#007cb8",
                    color: "#ffffff",
                    padding: { x: 20, y: 10 },
                })
                .setInteractive()
                .on("pointerdown", () => this.checkAnswer(num));
            this.optionGroup.add(btn);
        });
    }

    // ✅ New method to generate 5 options close to the correct answer
    generateCloseOptions(correctAnswer) {
        let options = [correctAnswer]; // Start with correct answer
        
        // Define how close the options should be (adjust this for difficulty)
        let range = Math.max(2, Math.floor(correctAnswer * 0.3)); // 30% of correct answer, minimum 2
        
        // Generate 4 more options close to the correct answer
        while (options.length < 5) {
            // Generate numbers within range of correct answer
            let offset = Phaser.Math.Between(-range, range);
            let candidate = correctAnswer + offset;
            
            // Make sure the candidate is positive and not already in options
            if (candidate > 0 && !options.includes(candidate)) {
                options.push(candidate);
            }
        }
        
        // Shuffle the options so correct answer isn't always in the same position
        Phaser.Utils.Array.Shuffle(options);
        
        return options;
    }

    checkAnswer(num) {
        if (!this.canAnswer) return;
        this.canAnswer = false;

        if (num === this.correctCount) this.score++;
        this.scoreText.text = `${this.score} / ${this.currentQuestion} → ${this.totalQuestions}`;

        this.startQuestion();
    }

    createConstrainedMovement(target) {
        const moveToRandomPoint = () => {
            let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            let maxRadius = this.mainCircleRadius - 30;
            let radius = Phaser.Math.FloatBetween(30, maxRadius);

            let targetX = this.centerX + Math.cos(angle) * radius;
            let targetY = this.centerY - 100 + Math.sin(angle) * radius;

            // ✅ Speed increases as questions go up
            let baseSpeed = 1500;
            let minSpeed = 600;
            let difficultyFactor = this.currentQuestion / this.totalQuestions;
            let duration = baseSpeed - difficultyFactor * (baseSpeed - minSpeed);

            this.tweens.add({
                targets: target,
                x: targetX,
                y: targetY,
                duration: duration,
                onComplete: () => moveToRandomPoint(),
            });
        };
        moveToRandomPoint();
    }

    update() {}

    showResult() {
        this.canAnswer = false;

        // Calculate accuracy percentage
        let accuracy = this.currentQuestion > 0 ? Math.round((this.score / this.currentQuestion) * 100) : 0;
        
        // Determine performance level
        let performanceLevel = "";
        let levelColor = "#ffffff";
        
        if (this.score < 28 || accuracy < 85) {
            performanceLevel = "FAIL";
            levelColor = "#ff4444";
        } else if (this.score >= 28 && this.score <= 33 && accuracy >= 85 && accuracy < 90) {
            performanceLevel = "BASELINE / RISKY";
            levelColor = "#ffaa00";
        } else if (this.score >= 34 && this.score <= 36 && accuracy >= 90) {
            performanceLevel = "SAFE PASS";
            levelColor = "#44ff44";
        } else if (this.score >= 37 && this.score <= 40 && accuracy >= 90) {
            performanceLevel = "ELITE";
            levelColor = "#00ffff";
        } else if (this.score > 40 && accuracy >= 90) {
            performanceLevel = "LEGENDARY";
            levelColor = "#gold";
        }

        this.add
            .text(getWidth(this) / 2, 300, "Game Over!", {
                fontSize: "72px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.add
            .text(getWidth(this) / 2, 380, `Score: ${this.score}/${this.currentQuestion}`, {
                fontSize: "48px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.add
            .text(getWidth(this) / 2, 440, `Accuracy: ${accuracy}%`, {
                fontSize: "48px",
                color: "#ffffff",
                align: "center",
            })
            .setOrigin(0.5);

        this.add
            .text(getWidth(this) / 2, 520, performanceLevel, {
                fontSize: "56px",
                color: levelColor,
                align: "center",
                fontStyle: "bold",
            })
            .setOrigin(0.5);
    }
}