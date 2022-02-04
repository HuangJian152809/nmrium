export class PathBuilder {
  private array: Array<string> = [];

  public moveTo(x: number, y: number) {
    this.array.push(`M ${x} ${y}`);
  }

  public lineTo(x: number, y: number) {
    this.array.push(`L ${x} ${y}`);
  }

  public closePath() {
    this.array.push('Z');
  }

  public toString() {
    return this.array.join(' ');
  }
}