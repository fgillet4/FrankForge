import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Semi-transparent overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65);

    this.add.text(W / 2, H * 0.32, 'PAUSED', {
      fontSize: '56px', fontFamily: 'monospace',
      color: '#ffcc00', stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.makeBtn(W / 2, H * 0.50, '▶  RESUME', '#00cc66', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });

    this.makeBtn(W / 2, H * 0.62, '⌂  MAIN MENU', '#cc4400', () => {
      this.scene.stop();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // ESC also resumes
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }

  private makeBtn(x: number, y: number, label: string, color: string, cb: () => void) {
    const btn = this.add.text(x, y, label, {
      fontSize: '22px', fontFamily: 'monospace',
      color, backgroundColor: '#0a1a2a',
      padding: { x: 28, y: 12 },
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout',  () => btn.setAlpha(1));
    btn.on('pointerdown', cb);
  }
}
