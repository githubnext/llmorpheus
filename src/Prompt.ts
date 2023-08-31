import { PromptSpec } from "./promptSpecGenerator";

export class Prompt {
  private static idCounter = 1;
  private id: number;
  constructor(private readonly text: string, public readonly spec: PromptSpec) {
    this.id = Prompt.idCounter++;
  }
  public getText(): string {
    return this.text;
  }
  public getId(): number {
    return this.id;
  }
  public getOrig(): string {
    return this.spec.orig;
  }
  public static resetIdCounter(): void {
    Prompt.idCounter = 1;
  }
}
