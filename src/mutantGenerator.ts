import fs from "fs";
import fg from 'fast-glob';
import { Codex } from "./codex";

import { Mutant } from "./mutant";
import { IPrompt, PromptGenerator } from "./prompt";
import { Rule, IRuleFilter } from "./rule";

/**
 * Suggests mutations in given files using the specified rules
 */ 
export class MutantGenerator {

  private rules: Rule[] = [];
  // private mutants : Mutant[] = [];
  private promptGenerator : PromptGenerator;
  private static CHUNK_SIZE = 20; // max number of LOC to include in one prompt
  private nrMutants = 0;
  private nrUsefulMutants = 0;

  constructor(promptTemplateFileName: string, private rulesFileName: string, private ruleFilter: IRuleFilter, private numCompletions: number, private outputDir: string, private removeInvalid: boolean) {
    this.rules = JSON.parse(fs.readFileSync(this.rulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));
    this.promptGenerator = new PromptGenerator(promptTemplateFileName);

    // remove output files from previous run, if they exist
    if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir);   
    } 
    if (fs.existsSync(this.outputDir + '/mutants.json')) {
      fs.unlinkSync(this.outputDir + '/mutants.json');
    }
    if (fs.existsSync(this.outputDir + '/log.txt')) {
      fs.unlinkSync(this.outputDir + '/log.txt');
    }
    if (fs.existsSync(this.outputDir + '/prompts')) {
      fs.rmdirSync(this.outputDir + '/prompts');
    }
    fs.writeFileSync(this.outputDir + '/log.txt', '');
  }

  private log(msg: string) : void {
    fs.appendFileSync(this.outputDir + '/log.txt', msg);
  }

  private printAndLog(msg: string) : void {
    console.log(msg);
    this.log(msg);
  }

  public async generateMutants(path: string) : Promise<void> { 
    this.printAndLog(`Starting generation of mutants on: ${new Date().toUTCString()}\n\n`);

    const model = new Codex({ max_tokens: 750, stop: ["DONE"], temperature: 0.0, n: this.numCompletions });

    // apply to each .js/.ts/.jsx/.tsx file under src 
    const pattern = `${path}/**/src/*.{js,ts,.jsx,.tsx}`; 
    const files = await fg([pattern], {ignore: ['**/node_modules']})
    const shortFileNames = files.map((file) => file.replace(`${path}/`, ""));
    this.log(`files: ${shortFileNames}`);

    const mutants = new Array<Mutant>();
    for (const file of files){
      mutants.push(...await this.generateMutantsForFile(model, file));
    }
    
    // write mutant info to JSON file
    fs.writeFileSync(this.outputDir + '/mutants.json', JSON.stringify(mutants, null, 2));
  }

  /**
   * Generate mutants for a given file
   */
  private async generateMutantsForFile(model: Codex, fileName: string) : Promise<Array<Mutant>> {
   
    // const mutantsForFile = new Array<Mutant>();
    // let nrMutantsForFile = 0;
    // let nrUsefulMutantsForFile = 0;
    const mutants = new Array<Mutant>();
    this.printAndLog(`\n\nGenerating mutants for ${fileName}:\n\n`);
    const origCode = this.addLineNumbers(fs.readFileSync(fileName, "utf8"));
    const rules = this.rules.filter((rule) => this.ruleFilter(rule.getRuleId())); // filter out rules that are not selected
    
    const chunks = this.createChunks(origCode);
    for (let chunkNr=0; chunkNr < chunks.length; chunkNr++ ){
      const chunk = chunks[chunkNr];
      for (const rule of rules){  
        this.printAndLog(`Applying rule \"${rule.getRuleId()}\" ${rule.getRule()} (${rule.getDescription()}) to ${fileName}\n`);
        if (!this.chunkContainsTerminals(chunk, rule.getLHSterminals())){
          this.printAndLog(`  skipping chunk ${chunkNr} (lines ${this.getLineRange(chunk).trim()}) of ${fileName} because it does not contain any of the terminals ${[...rule.getLHSterminals()].toString()}\n`);
        } else {
          this.printAndLog(`  prompting for chunk ${chunkNr} (lines ${this.getLineRange(chunk).trim()}) of ${fileName}\n`);
          const prompt = this.promptGenerator.createPrompt(chunk, rule);  
          this.log(`    prompt for chunk ${chunkNr} of ${fileName}:\n\n${prompt.text}\n\n`);
          try {
            const completions = await model.query(prompt.text);
            const candidateMutants = this.extractMutantsFromCompletions(fileName, chunkNr, rule, prompt, completions);
            const postProcessedMutants = this.postProcessMutants(fileName, chunkNr, rule, candidateMutants,origCode);
            mutants.push(...postProcessedMutants);
         } catch (err) {
           this.printAndLog(`    Error: ${err}`);
         }
        }
      }
    }
    return mutants;
  }

  /** 
   * Extract candidate mutants from the completions by matching a RegExp
   */
  private extractMutantsFromCompletions(fileName: string, chunkNr: number, rule: Rule, prompt: IPrompt, completions: Set<string>) : Array<Mutant> {
    let mutants = new Array<Mutant>();
    this.printAndLog(`    Received ${completions.size} completions for chunk ${chunkNr} of file ${fileName}, given rule ${rule.getRuleId()}.\n`);
    let completionNr = 1;
    for (const completion of completions) {
      this.log(`completion ${completionNr++}:\n${completion}`);
      // regular expression that matches the string "CHANGE LINE #n FROM:\n```SomeLineOfCode```\nTO:\n```SomeLineOfCode```\n"
      const regExp = /CHANGE LINE #(\d+) FROM:\n```\n(.*)\n```\nTO:\n```\n(.*)\n```\n/g;
      let match;
      while ((match = regExp.exec(completion)) !== null) {
        const lineNr = parseInt(match[1]);
        const originalCode = match[2];
        const rewrittenCode = match[3];
        mutants.push(new Mutant(rule, originalCode, rewrittenCode, fileName, lineNr));
      }
    }
    return mutants;
  }

  /**
   * Remove invalid mutants and duplicate mutants, and adjust line numbers if needed.
   */
  private postProcessMutants(fileName: string, chunkNr: number, rule: Rule, mutants: Array<Mutant>, origCode: string) : Array<Mutant> {
    const nrCandidateMutants = mutants.length;
    const adjustedMutants = mutants.map(m => m.adjustLocationAsNeeded(origCode)); 
    const validMutants = adjustedMutants.filter(m => !m.isInvalid());
    const nrInvalidMutants = nrCandidateMutants - validMutants.length;

    // filter duplicates
    const nonDuplicateMutants = new Array<Mutant>();
    for (const mutant of validMutants){
      const duplicatesOf = nonDuplicateMutants.filter(m => m.isDuplicateOf(mutant));
      if (duplicatesOf.length === 0){
        nonDuplicateMutants.push(mutant);
      }  
    }
    const nrDuplicateMutants = validMutants.length - nonDuplicateMutants.length;

    this.printAndLog(`    Found ${nonDuplicateMutants.length} mutants for chunk ${chunkNr} of file ${fileName}, given rule ${rule.getRuleId()} (after removing ${nrInvalidMutants} invalid mutants and ${nrDuplicateMutants} duplicate mutants).\n`);
    return nonDuplicateMutants;
  }

  /**
   * Break up the source code into chunks of at most CHUNK_SIZE lines.
   * @param origCode: the source code
   * @returns an array of strings, each of which is a chunk of the source code
   */
  private createChunks(origCode: string) : string[] {
    const chunks : string[] = [];
    const lines = origCode.split("\n");
    for (let i = 0; i < lines.length; i += MutantGenerator.CHUNK_SIZE) {
      chunks.push(lines.slice(i, i + MutantGenerator.CHUNK_SIZE).join("\n")); // do we need MAX here?
    }
    return chunks;
  }

  /**
   * Check if a chunk contains all of the terminals.
   * @param chunk: the chunk of code
   * @param terminals: the set of terminals
   * @returns true if the chunk contains all of the terminals, false otherwise
   */
  private chunkContainsTerminals(chunk: string, terminals: Set<string>) : boolean {
    return [...terminals].reduce((result, terminal) => result && chunk.includes(terminal), true);
  }

  private getLineRange(chunk: string) : string {
    const lines = chunk.split("\n");
    const firstLine = lines[0];
    const lastLine = lines[lines.length-1];
    return firstLine.substring(0, firstLine.indexOf(":")) + '-' + lastLine.substring(0, lastLine.indexOf(":"));
  }

  /** 
   * Add line numbers to the source code.
   */
  private addLineNumbers(code: string) : string {
    const lines = code.split("\n");
    const maxDigits = Math.floor(Math.log10(lines.length)) + 1;
    const paddedLines = lines.map((line, i) => {
      const lineNumber : string = (i + 1).toString();
      const padding = " ".repeat(maxDigits - lineNumber.length);
      return `${padding}${lineNumber}: ${line}`;
    });
    return paddedLines.join("\n");
  };
}