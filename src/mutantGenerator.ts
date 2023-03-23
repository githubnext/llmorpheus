import fs from "fs";
import { Codex } from "./codex";

import { IMutant } from "./mutant";
import { createPrompt } from "./prompt";
import { IRule, IRuleFilter } from "./rule";


function addLineNumbers(code: string) : string {
  const lines = code.split("\n");
  const maxDigits = Math.floor(Math.log10(lines.length)) + 1;
  const paddedLines = lines.map((line, i) => {
    const lineNumber : string = (i + 1).toString();
    const padding = " ".repeat(maxDigits - lineNumber.length);
    return `${padding}${lineNumber}: ${line}`;
  });
  return paddedLines.join("\n");
};

export class MutantGenerator {

  private rules: IRule[] = [];
  private mutants : IMutant[] = [];
  private instructions : string;

  constructor(private rulesFileName: string, private ruleFilter: IRuleFilter, private instructionsFileName: string, private numCompletions: number, private logFileName: string) {
    this.rules = JSON.parse(fs.readFileSync(this.rulesFileName, "utf8"));
    this.instructions = fs.readFileSync(this.instructionsFileName, "utf8");
  }

  private appendToLog(msg: string) : void {
    fs.appendFileSync(this.logFileName, msg);
  }

  private printAndLog(msg: string) : void {
    console.log(msg);
    this.appendToLog(msg);
  }

  public async generateMutants(origFileName: string, outputFileName: string) : Promise<void> { 

    // remove output file from previous run, if it exists
    if (fs.existsSync(outputFileName)) {
      fs.unlinkSync(outputFileName);
    }

    // remove log file from previous run, if it exists
    if (fs.existsSync(this.logFileName)) {
      fs.unlinkSync(this.logFileName);
    }

    this.printAndLog(`Starting generation of mutants on: ${new Date().toUTCString()}\n\n`);

    const origCode = addLineNumbers(fs.readFileSync(origFileName, "utf8"));
   
    // create mutants using each of the selected rules
    for (const rule of this.rules){      
      if (!this.ruleFilter(rule.id)){ // skip rules that are not selected
        continue;
      }
      this.printAndLog(`Applying rule ${rule.id} to ${origFileName}`);
          
      const prompt = createPrompt(origCode, rule, this.instructions);  
      const model = new Codex({ max_tokens: 750, stop: ["DONE"], temperature: 0.0, n: this.numCompletions });
      
      this.appendToLog(`using prompt:\n${prompt}\n`);
      const completions = await model.query(prompt);

      if (completions.size === 0) {
        this.printAndLog(`No completions found for rule ${rule.id}.`);
      } else {
        this.printAndLog(`\tReceived ${completions.size} completions for rule ${rule.id}.`);
        let i = 1;
        for (const completion of completions) {
          // count the number of mutants in the completion, update the log, and increment the counter
          const nrMutants = (completion.match(/CHANGE LINE/g) || []).length;
          this.printAndLog(`\tcompletion ${i} contains ${nrMutants} candidate mutants`);
          this.appendToLog(`completion ${i}:\n${completion}`);
          i++;

          // extract the mutants from the completion
          // regular expression that matches the string "CHANGE LINE #n FROM:\n```SomeLineOfCode```\nTO:\n```SomeLineOfCode```\n"
          const regExp = /CHANGE LINE #(\d+) FROM:\n```\n(.*)\n```\nTO:\n```\n(.*)\n```\n/g;
          let match;
          while ((match = regExp.exec(completion)) !== null) {
              const lineNr = parseInt(match[1]);
              const originalCode = match[2];
              const rewrittenCode = match[3];
              this.mutants.push({ ruleId: rule.id, rule: rule.rule, originalCode: originalCode, rewrittenCode: rewrittenCode, lineApplied: lineNr });
              this.appendToLog(`\tcandidate mutant: ${JSON.stringify({ ruleId: rule.id, rule: rule.rule, originalCode: originalCode, rewrittenCode: rewrittenCode, lineApplied: lineNr })}\n`);
          }
          this.appendToLog("--------------------------------------------\n");
        } 
      }
    }
    this.detectInvalidMutants(origCode);

    // write mutant info to JSON file
    fs.writeFileSync(outputFileName, JSON.stringify(this.mutants, null, 2));   
  }

  private WINDOW_SIZE = 2;

  /**
   * Detect mutants that are invalid (when the original code is not present in the source code) 
   * or trivial (when the original code is the same as the rewritten code). Accounts for situations
   * where the original code is not present on the exact line where the mutation was reported
   * by checking up to WINDOW_SIZE lines before and after the line where the mutation was reported.
   * 
   * @param origCode The original source code.
   */
  private detectInvalidMutants(origCode: string) : void {
    this.mutants.forEach((mutant) => {
      mutant.isTrivialRewrite = mutant.rewrittenCode.trim() === mutant.originalCode.trim();

      // check if the original code is present at the exact line
      const origLine = origCode.split("\n")[mutant.lineApplied - 1];
      if (origLine && origLine.trim().indexOf(mutant.originalCode.trim()) !== -1) {
        mutant.occursInSourceCode = true;
        return;
      } else { // else, check up to WINDOW_SIZE lines before and after the line where the mutation was reported
        for (let i=1; i<=this.WINDOW_SIZE; i++) {
          const line = origCode.split("\n")[mutant.lineApplied - 1 - i];
          if (line && line.trim().indexOf(mutant.originalCode.trim()) !== -1) {
            mutant.occursInSourceCode = true;
            mutant.comment = `location adjusted: model reported code on line ${mutant.lineApplied}, but found on line ${mutant.lineApplied - i}`;
            mutant.lineApplied -= i;
            return;
          } else {
            const line = origCode.split("\n")[mutant.lineApplied - 1 + i];
            if (line && line.trim().indexOf(mutant.originalCode.trim()) !== -1) {
              mutant.occursInSourceCode = true;
              mutant.comment = `location adjusted: model reported code on line ${mutant.lineApplied}, but found on line ${mutant.lineApplied + i}`;
              mutant.lineApplied += i;
              return;
            }
          }
        }
        mutant.occursInSourceCode = false;  
      }
    });
  }

  // print mutant info to console
  public printMutantInfo() : void {
    this.mutants.forEach((mutant) => {
      console.log(`rule ${mutant.ruleId} applied to line ${mutant.lineApplied}:`);
      console.log(`  rule: ${mutant.ruleId}: ${mutant.rule}`);
      console.log(`  original code: ${mutant.originalCode}`);
      console.log(`  rewritten code: ${mutant.rewrittenCode}\n`);
      console.log(`  claimed line in orig code: ${mutant.lineApplied} (occurs in source code: ${mutant.occursInSourceCode})`);
      console.log(`  is trivial rewrite: ${mutant.isTrivialRewrite}\n`);
    });
  }
}