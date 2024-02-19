export class Mutant {
  constructor(
    public file: string,
    public startLine: number,
    public startColumn: number,
    public endLine: number,
    public endColumn: number,
    public originalCode: string,
    public replacement: string,
    public readonly promptId: number,
    public readonly completionId: number,
    public readonly reason: string
  ) {}

  public toString(){
    return JSON.stringify(this);
  }
}
