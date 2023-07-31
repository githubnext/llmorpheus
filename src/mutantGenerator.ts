import fs from "fs";
import fg from 'fast-glob';
import path from 'path';
import { IModel } from "./model";

import { Mutant } from "./mutant";
import { Completion, Prompt, PromptGenerator } from "./prompt";
import { Rule, IRuleFilter } from "./rule";
import { mapMutantsToASTNodes } from "./astMapper";
import { NewCompletion, NewMutant, NewPrompt, PromptSpecGenerator } from "./promptSpecGenerator";
import { parse } from "yargs";
import * as parser from "@babel/parser";
import { isObject } from "util";

/**
 * Suggests mutations in given files using the specified rules
 */ 
export class MutantGenerator {

  private promptGenerator : PromptGenerator;
  private static CHUNK_SIZE = 20; // max number of LOC to include in one prompt

  constructor(private model: IModel, private promptTemplateFileName: string, private outputDir: string, private projectPath: string) {
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
      fs.rmdirSync(this.outputDir + '/prompts', { recursive: true });
    }
    fs.writeFileSync(this.outputDir + '/log.txt', '');
    fs.mkdirSync(this.outputDir + '/prompts');
  }

  public getProjectPath() : string {
    return this.projectPath;
  }

  private log(msg: string) : void {
    fs.appendFileSync(this.outputDir + '/log.txt', msg);
  }

  private printAndLog(msg: string) : void {
    console.log(msg);
    this.log(msg);
  }

  /**
   * Find the files to mutate
   * @param path the path to the project to mutate
   * @returns the files to mutate
   */
  public async findSourceFilesToMutate(path: string) : Promise<Array<string>> {
    const pattern = `${path}/**/src/*.{js,ts,.jsx,.tsx}`;  // apply to each .js/.ts/.jsx/.tsx file under src 
    const files = await fg([pattern], {ignore: ['**/node_modules']})
    const shortFileNames = files.map((file) => file.replace(`${path}/`, ""));
    this.log(`files: ${shortFileNames}`);
    return files;
  }

  public isObjectLiteral(code: string) : boolean {
    return code.startsWith('{') && code.endsWith('}');
  }

  public hasUnbalancedParens(code: string) : boolean {
    let nrOpen = 0;
    let nrClose = 0;
    for (const c of code) {
      if (c === '(') {
        nrOpen++;
      } else if (c === ')') {
        nrClose++;
      }
    }
    return nrOpen !== nrClose;
  }

  public async generateMutants(packagePath: string) : Promise<void> { 
    this.printAndLog(`Starting generation of mutants on: ${new Date().toUTCString()}\n\n`);
    const files = await this.findSourceFilesToMutate(packagePath);

    console.log(`generating mutants for the following files: ${files.join(", ")}`);

    const generator = new PromptSpecGenerator(files, this.promptTemplateFileName, this.outputDir);
    
    let nrGood = 0;
    let nrBad = 0;
    let nrSame = 0
    let nrSkip = 0; 
    const mutants = new Array<NewMutant>();
    for (const prompt of generator.getPrompts()){
      const completions = await this.getCompletionsForPrompt(prompt);
      for (const completion of completions){
        // console.log(`prompt:\n${prompt.getText()}\ncompletion:\n${completion}\n`);
        fs.writeFileSync(`${this.outputDir}/prompts/prompt${prompt.getId()}_completion_${completion.getId()}.txt`, completion.text);

        const regExp = /```\n(.*)\n```\n/g;
        let match;
        while ((match = regExp.exec(completion.text)) !== null) {
          const substitution = match[1];
          if (substitution !== prompt.getOrig() && !prompt.getOrig().includes('Object.')) {
            // console.log(`substitution: ${substitution}`);
            const candidateMutant =  prompt.spec.getCodeWithPlaceholder().replace('<PLACEHOLDER>', substitution);
            // console.log(`candidate mutant:\n${candidateMutant}\n`);
            try {
              if (this.hasUnbalancedParens(substitution)) {
                // console.log(`*** unbalanced parens: ${substitution} replacing ${prompt.getOrig()}\n`);
                nrBad++;
              } else if (prompt.spec.isExpressionPlaceholder()) {
                parser.parseExpression(substitution);
                // console.log(`*** valid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
                nrGood++;
                const mutant = new NewMutant(prompt.spec.file,
                                             prompt.spec.location.startLine,
                                             prompt.spec.location.startColumn,
                                             prompt.spec.location.endLine,
                                             prompt.spec.location.endColumn,
                                             prompt.getOrig(),
                                             substitution,
                                             prompt.getId(),
                                             completion.getId(),
                                             prompt.spec.feature + '/' + prompt.spec.component);    
                mutants.push(mutant);  
              } else if (prompt.spec.isArgListPlaceHolder()){
                nrGood++;
                const expandedOrig = prompt.spec.parentLocation!.getText();
                const expandedSubstitution = expandedOrig.replace(prompt.getOrig(), substitution);
                console.log(`*** VALID mutant: ${expandedSubstitution} replacing ${expandedOrig}\n`);

                const mutant = new NewMutant(prompt.spec.file,
                                             prompt.spec.parentLocation!.startLine,
                                             prompt.spec.parentLocation!.startColumn,
                                             prompt.spec.parentLocation!.endLine,
                                             prompt.spec.parentLocation!.endColumn,
                                             expandedOrig, // prompt.getOrig(),
                                             expandedSubstitution, // substitution,                                                                                
                                             prompt.getId(),
                                             completion.getId(),
                                             prompt.spec.feature + '/' + prompt.spec.component);    
                mutants.push(mutant);   
                  

              } else if (this.isObjectLiteral(substitution) && !this.isObjectLiteral(prompt.getOrig())) {
                parser.parse(candidateMutant, {sourceType: "module", plugins: ["typescript", "jsx"]});
                // console.log(`*** valid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
                nrGood++;
                const mutant = new NewMutant(prompt.spec.file,
                                             prompt.spec.location.startLine,
                                             prompt.spec.location.startColumn,
                                             prompt.spec.location.endLine,
                                             prompt.spec.location.endColumn,
                                             prompt.getOrig(),
                                             substitution,
                                             prompt.getId(),
                                             completion.getId(),
                                             prompt.spec.feature + '/' + prompt.spec.component);    
                mutants.push(mutant);  
              } else {
                parser.parse(candidateMutant, {sourceType: "module", plugins: ["typescript", "jsx"]});
                console.log(`*** ignoring for now: ${substitution} replacing ${prompt.getOrig()}\n (feature: ${prompt.spec.feature}, component: ${prompt.spec.component})\n`);
                nrSkip++;
              }
            } catch (e){
              console.log(`*** invalid code: ${e}\n`);
              console.log(`  *** original code: ${prompt.getOrig()}\n`);
              console.log(`  *** substitution: ${substitution}\n`);
              // console.log(`-----------------\n${candidateMutant}\n-----------------\n`);
              nrBad++;
            }

          } else {
            // console.log(`substitution equal to original code: ${prompt.getOrig()}`);
            nrSame++;
          }
        }
      }
      // break;
    }
    console.log(`total number of mutants: ${nrGood+nrBad+nrSame+nrSkip} (nrGood: ${nrGood}, nrBad: ${nrBad}, nrSame: ${nrSame}, nrSkip: ${nrSkip})`);

    // write mutants to file
    fs.writeFileSync(`${this.outputDir}/mutants.json`, JSON.stringify(mutants, null, 2));


    // next up:
    //  - prompt LLM for completions
    //  - extract mutant candidates from completions
    //  - filter mutant candidates that are identical to the original code
    //  - write mutants to file
    //  - try out mutants with StrykerJS

  }

  private completionCnt = 0;

  /**
   * Generate mutants for a given file
   */
  // private async generateMutantsForFile(fileName: string) : Promise<Array<Mutant>> {
  //   const mutants = new Array<Mutant>();
  //   this.printAndLog(`\nGenerating mutants for ${fileName}:`);
  //   const origCode = fs.readFileSync(fileName, "utf8");
  //   const rules = this.rules.filter((rule) => this.ruleFilter(rule.getRuleId())); // filter out rules that are not selected
    
  //   const prompts = this.createUsefulPrompts(fileName, origCode, rules);
  //   for (let promptNr=0; promptNr < prompts.length; promptNr++ ){
  //     const prompt = prompts[promptNr];
  //     const promptFileName = `${this.outputDir}/prompts/prompt_${prompt.getId()}.json`;
  //     const promptTextFileName = `${this.outputDir}/prompts/prompt_${prompt.getId()}.txt`;
  //     fs.writeFileSync(promptFileName, JSON.stringify(prompt)); // write prompt to file
  //     fs.writeFileSync(promptTextFileName, prompt.getText()); // write prompt text to file
  //     this.printAndLog(`    created prompt ${prompt.getId()} for ${fileName}; written to ${promptFileName}`);
  //     try {
  //       const completions = [...await this.model.query(prompt.getText())].map((completionText) => new Completion(prompt.getId(), this.completionCnt++, completionText));
  //       const candidateMutants = this.extractMutantsFromCompletions(fileName, prompt.getChunkNr(), prompt.getRule(), prompt, completions);
  //       const filteredMutants = this.filterMutants(fileName, prompt.getChunkNr(), prompt.getRule(), candidateMutants, origCode);
  //       const mappedMutants = mapMutantsToASTNodes(this.projectPath, filteredMutants);
  //       mutants.push(...mappedMutants);
  //     } catch (e) {
  //       this.printAndLog(`    error occurred while processing prompt ${prompt.getId()} for ${fileName}: ${e}\n`);
  //     }
  //   }
  //   return mutants;
  // }

  public async getCompletionsForPrompt(prompt: NewPrompt) : Promise<NewCompletion[]> {
    return [...await this.model.query(prompt.getText())].map((completionText) => new NewCompletion(completionText, prompt.getId()));
  }

  private promptCnt = 0;

  /**
   * Generate prompts for the given file and rules. Prompts are only generated for
   * chunks that contain at least one of the LHS terminals of the rule.
   * @param fileName the name of the file to generate prompts for
   * @param sourceCode the source code of the file
   * @param rules the rules to generate prompts for
   * @returns the generated prompts
   */
  public createUsefulPrompts(fileName: string, sourceCode: string, rules: Rule[]) : Prompt[] {
    const chunks = this.createChunks(sourceCode);
    const usefulPrompts = new Array<Prompt>();
    for (let chunkNr=0; chunkNr < chunks.length; chunkNr++ ){
      const chunk = chunks[chunkNr];
      for (let ruleNr=0; ruleNr < rules.length; ruleNr++ ){
        const rule = rules[ruleNr];
        if (!this.chunkContainsTerminals(chunk, rule.getLHSterminals())){
          this.printAndLog(`    skipping chunk ${chunkNr} (lines ${this.getLineRange(chunk).trim()}) because it does not contain any of the terminals ${[...rule.getLHSterminals()].toString()}`);
        } else {
          const prompt = this.promptGenerator.createPrompt(this.promptCnt++, fileName, chunkNr, chunk, rule);  
          usefulPrompts.push(prompt);
        }
      }
    }
    return usefulPrompts;
  }

  /** 
   * Extract candidate mutants from the completions by matching a RegExp
   */
  public extractMutantsFromCompletions(fileName: string, chunkNr: number, rule: Rule, prompt: Prompt, completions: Array<Completion>) : Array<Mutant> {
    // console.log(`extractMutantsFromCompletions: fileName=${fileName}, chunkNr=${chunkNr}, rule=${rule.getRuleId()}, prompt=${prompt.getId()}, completions=${completions.length}`);
    let mutants = new Array<Mutant>();
    this.printAndLog(`      received ${completions.length} completions for chunk ${chunkNr} of file ${fileName}, given rule ${rule.getRuleId()}.`);
    completions.forEach((completion) => { // write completions to files
      const completionFileName = `${this.outputDir}/prompts/prompt_${prompt.getId()}_completion_${completion.getId()}.json`;
      const completionTextFileName = `${this.outputDir}/prompts/prompt_${prompt.getId()}_completion_${completion.getId()}.txt`;
      fs.writeFileSync(completionFileName, JSON.stringify(completion));
      fs.writeFileSync(completionTextFileName, completion.getText());
      this.printAndLog(`      completion ${completion.getId()} for prompt ${prompt.getId()} written to ${completionFileName}`);
    }); 
    for (const completion of completions) {
      mutants.push(...this.extractMutantsFromCompletion(prompt, completion));
    }
    return mutants;
  }

  public extractMutantsFromCompletion(prompt: Prompt, completion: Completion): Mutant[] {
    const mutants = new Array();
    // regular expression that matches the string "CHANGE LINE #n FROM:\n```SomeLineOfCode```\nTO:\n```SomeLineOfCode```\n"
    const regExp = /CHANGE LINE #(\d+) FROM:\n```\n(.*)\n```\nTO:\n```\n(.*)\n```\n/g;
    let match;
    while ((match = regExp.exec(completion.getText())) !== null) {
      const lineNr = parseInt(match[1]);
      const originalCode = match[2];
      const replacement = match[3];
      const fileName = path.join(this.projectPath, prompt.getFileName()); 
      const startCol = this.getStartColumn(fileName, lineNr, originalCode); // note: this will not work if the line number was wrong
      const endCol = this.getEndColumn(fileName, lineNr, originalCode);
      mutants.push(new Mutant(prompt.getRule(), originalCode, replacement, prompt.getFileName(), lineNr, startCol, lineNr, endCol, prompt.getId(), completion.getId()));
    }
   return mutants;
  }

  private getStartColumn(fileName: string, lineNr: number, originalCode: string): number {
    const lines = fs.readFileSync(fileName).toString().split("\n");
    const line = lines[lineNr-1];
    return line.indexOf(originalCode);    
  }

  private getEndColumn(fileName: string, lineNr: number, originalCode: string): number {
    const lines = fs.readFileSync(fileName).toString().split("\n");
    const line = lines[lineNr-1];
    return line.indexOf(originalCode) + originalCode.length;
  }

  /**
   * Remove invalid mutants and duplicate mutants, adjust line numbers if needed, make file name relative.
   */
  public filterMutants(fileName: string, chunkNr: number, rule: Rule, mutants: Array<Mutant>, origCode: string) : Array<Mutant> {
    const nrCandidateMutants = mutants.length;
    const adjustedMutants = mutants.map(m => m.adjustLocationAsNeeded(this.projectPath, origCode));
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

    this.printAndLog(`        extracted ${nonDuplicateMutants.length} mutants for chunk ${chunkNr} of file ${fileName}, given rule ${rule.getRuleId()} (after removing ${nrInvalidMutants} invalid mutants and ${nrDuplicateMutants} duplicate mutants).`);
    return nonDuplicateMutants;
  }

  /**
   * Add line numbers to source code and break it up into chunks of at most CHUNK_SIZE lines.
   * @param origCode: the source code
   * @returns an array of strings, each of which is a chunk of the source code
   */
  public createChunks(origCode: string) : string[] {
    const chunks : string[] = [];
    const lines = this.addLineNumbers(origCode).split("\n");
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
  public chunkContainsTerminals(chunk: string, terminals: Set<string>) : boolean {
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
  public addLineNumbers(code: string) : string {
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