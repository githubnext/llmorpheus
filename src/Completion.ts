
export class Completion {
  private static idCounter = 0;
  private id: number;
  constructor(public readonly text: string, public readonly promptId: number) {
    this.id = Completion.idCounter++;
  }
  public getId(): number {
    return this.id;
  }
}
