import { Completion, Prompt } from "./prompt";
import { Rule } from "./rule";
import { getEndColumn, getStartColumn } from "./util";

/**
 * Represents a mutant
 */
export class Mutant {

  private comment: string;
  constructor(private rule: Rule, 
              private originalCode: string, 
              private replacement: string, 
              private file: string,
              private startLine: number,
              private startColumn: number,
              private endLine: number,
              private endColumn: number,
              private promptId: number,
              private completionId: number) {
     this.comment = "";
  }

  public static fromJSON(json: any) : Mutant {
    return new Mutant(
      new Rule(json.rule.ruleId, json.rule.rule, json.rule.description),
      json.originalCode,
      json.replacement,
      json.file,
      json.startLine,
      json.startColumn,
      json.endLine,
      json.endColumn,
      json.promptId,
      json.completionId
    );
  }


  public toString(){
    return "<" + "rule: " + this.rule.toString() + ", " +
      "originalCode: " + this.originalCode + ", " +
      "replacement: " + this.replacement + ", " +
      "file: " + this.file + ", " +
      "startLine: " + this.startLine + ", " +
      "startColumn: " + this.startColumn + ", " +
      "endLine: " + this.endLine + ", " +
      "endColumn: " + this.endColumn + ", " +
      "promptId: " + this.promptId + ", " +
      "completionId: " + this.completionId + ">";
  }

  getCompletionId() {
    return this.completionId;
  }

  /**
   * Returns true if the mutant is trivial, i.e., the original code and the rewritten code are identical
   * after trimming whitespace
   */
  public isTrivialRewrite() : boolean {
    return this.replacement.trim() === this.originalCode.trim();
  }
  
  /**
   * Returns true if the original code contains all the terminals on the LHS of the rule
   */
  public originalCodeMatchesLHS() : boolean {
    for (const symbol of this.rule.getLHSterminals()) {
      if (this.originalCode.indexOf(symbol) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns true if the rewritten code contains all the terminals on the RHS of the rule
   */ 
  public replacementMatchesRHS() : boolean {
    for (const symbol of this.rule.getRHSterminals()) {
      if (this.replacement.indexOf(symbol) === -1) {
        return false;
      }
    }
    return true;
  }

  /**
   * Detect mutants that are invalid (when the original code is not present in the source code) 
   * or trivial (when the original code is the same as the rewritten code). Accounts for situations
   * where the original code is not present on the exact line where the mutation was reported
   * by checking up to WINDOW_SIZE lines before and after the line where the mutation was reported. 
   */
  public isInvalid(){
    // console.log(`Checking if mutant is invalid: ${this.toString()}`);
    // console.log(`  isTrivialRewrite: ${this.isTrivialRewrite()}`);
    // console.log(`  originalCodeMatchesLHS: ${this.originalCodeMatchesLHS()}`);
    // console.log(`  replacementMatchesRHS: ${this.replacementMatchesRHS()}`);
    // console.log(`  startLine: ${this.startLine}`);
    // console.log(`  endLine: ${this.endLine}`);
    // console.log(`  fileName: ${this.file}`);
    return this.isTrivialRewrite() || !this.originalCodeMatchesLHS() || !this.replacementMatchesRHS() || this.getStartLine() === -1;
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

  public getStartLine() : number {
    return this.startLine;
  }

  public getStartColumn() : number {
    return this.startColumn;
  }

  public getEndLine() : number {
    return this.endLine;
  }

  public getEndColumn() : number {
    return this.endColumn;
  }

  public getRuleId() : string {
    return this.rule.getRuleId();
  }

  public getFileName() : string {
    return this.file;
  }

  public isDuplicateOf(other: Mutant) : boolean {
    return this.getRuleId() === other.getRuleId() && 
           this.getFileName() === other.getFileName() && 
           this.getStartLine() === other.getStartLine() &&
           this.getStartColumn() === other.getStartColumn() &&
           this.getEndLine() === other.getEndLine() &&
           this.getEndColumn() === other.getEndColumn();
  }

  private static WINDOW_SIZE = 2;

  /**
   * Adjusts the line number of the mutant if the original code is not found on the line reported by the model.
   * Checks up to WINDOW_SIZE lines before and after the line where the mutation was reported. If the line
   * is not found, the location is set to -1.
   * @param origCode the original code of the file where the mutant was applied
   * @returns void
   */
  public adjustLocationAsNeeded(origCode: string) : Mutant {
    const newMutant = new Mutant(this.rule, this.originalCode, this.replacement, this.file, this.startLine, this.startColumn, this.endLine, this.endColumn, this.promptId, this.completionId);
    const origLine = origCode.split("\n")[newMutant.startLine - 1];
    if (origLine && origLine.trim().indexOf(newMutant.originalCode.trim()) !== -1) {
      return newMutant; // found the original code on the line reported by the model, no need to adjust
    } else { // else, check up to WINDOW_SIZE lines before and after the line where the mutation was reported
      for (let i=1; i<=Mutant.WINDOW_SIZE; i++) {
        const line = origCode.split("\n")[this.startLine - 1 - i];
        if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
          newMutant.addComment(`location adjusted: model reported code on line ${this.startLine}, but found on line ${this.startLine - i}`);
          newMutant.startLine -= i;
          newMutant.endLine -= i;
          newMutant.startColumn = getStartColumn(newMutant.getFileName(), newMutant.getStartLine(), newMutant.originalCode);
          newMutant.endColumn = getEndColumn(newMutant.getFileName(), newMutant.getStartLine(), newMutant.originalCode);
          return newMutant;
        } else {
          const line = origCode.split("\n")[this.startLine - 1 + i];
          if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
            newMutant.addComment(`location adjusted: model reported code on line ${this.startLine}, but found on line ${this.startLine + i}`);
            newMutant.startLine += i;
            newMutant.endLine += i;
            newMutant.startColumn = getStartColumn(newMutant.getFileName(), newMutant.getStartLine(), newMutant.originalCode);
            newMutant.endColumn = getEndColumn(newMutant.getFileName(), newMutant.getStartLine(), newMutant.originalCode);
            return newMutant;
          }
        }
      }
      newMutant.startLine = -1; // if we get here, we couldn't find the original code anywhere in the file
    }
    return newMutant;
  } 

  public makeFileNameRelative() : Mutant {
    const newMutant = new Mutant(this.rule, this.originalCode, this.replacement, this.file, this.startLine, this.startColumn, this.endLine, this.endColumn, this.promptId, this.completionId);
    newMutant.file = newMutant.file.substring(newMutant.file.indexOf("src"));
    return newMutant;
  }
}