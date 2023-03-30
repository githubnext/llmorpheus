import { getLHSterminals, getRHSterminals } from "./rule";

export class Mutant {
  private comment: string;
  constructor(private ruleId: string, 
              private rule: string, 
              private originalCode: string, 
              private rewrittenCode: string, 
              private lineApplied: number){
     this.comment = "";
  }

  public isTrivialRewrite() : boolean {
    return this.rewrittenCode.trim() === this.originalCode.trim();
  }
  
  public originalCodeMatchesLHS() : boolean {
    for (const symbol of getLHSterminals(this.rule)) {
      if (this.originalCode.indexOf(symbol) === -1) {
        // console.log(`*** did not find ${symbol} in ${this.originalCode}`);
        return false;
      }
    }
    return true;
  }

  public rewrittenCodeMatchesRHS() : boolean {
    for (const symbol of getRHSterminals(this.rule)) {
      if (this.rewrittenCode.indexOf(symbol) === -1) {
        return false;
      }
    }
    return true;
  }

  public addComment(comment: string) {
    if (this.comment === undefined || this.comment === ""){
      this.comment = comment;
    } else {
      this.comment += `\n${comment}`;
    }
  }

  public getComment() : string {
    return this.comment;
  }

  public getLineApplied() : number {
    return this.lineApplied;
  }

  public getRuleId() : string {
    return this.ruleId;
  }

  private static WINDOW_SIZE = 2;

  public adjustLocationAsNeeded(origCode: string) : void {
    const origLine = origCode.split("\n")[this.lineApplied - 1];
    if (origLine && origLine.trim().indexOf(this.originalCode.trim()) !== -1) {
      return; // found the original code on the line reported by the model, no need to adjust
    } else { // else, check up to WINDOW_SIZE lines before and after the line where the mutation was reported
      for (let i=1; i<=Mutant.WINDOW_SIZE; i++) {
        const line = origCode.split("\n")[this.lineApplied - 1 - i];
        if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
          this.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied - i}`);
          this.lineApplied -= i;
          return;
        } else {
          const line = origCode.split("\n")[this.lineApplied - 1 + i];
          if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
            this.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied + i}`);
            this.lineApplied += i;
            return;
          }
        }
      }
      this.lineApplied = -1; // if we get here, we couldn't find the original code anywhere in the file
    }
  }

  
  
   
}