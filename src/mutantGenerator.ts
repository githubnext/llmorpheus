import fs from "fs";
import fg from "fast-glob";
import { IModel } from "./model";

import { PromptSpecGenerator } from "./promptSpecGenerator";
import { Mutant } from "./Mutant";
import { Completion } from "./Completion";
import { Prompt } from "./Prompt";
import * as parser from "@babel/parser";
import path from "path";
import { hasUnbalancedParens } from "./util";

/**
 * Suggests mutations in given files using the specified rules
 */
export class MutantGenerator {
  constructor(
    private model: IModel,
    private promptTemplateFileName: string,
    private outputDir: string,
    private projectPath: string
  ) {
    // remove output files from previous run, if they exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }
    if (fs.existsSync(this.outputDir + "/mutants.json")) {
      fs.unlinkSync(this.outputDir + "/mutants.json");
    }
    if (fs.existsSync(this.outputDir + "/log.txt")) {
      fs.unlinkSync(this.outputDir + "/log.txt");
    }
    if (fs.existsSync(this.outputDir + "/prompts")) {
      fs.rmdirSync(this.outputDir + "/prompts", { recursive: true });
    }
    fs.writeFileSync(this.outputDir + "/log.txt", "");
    fs.mkdirSync(this.outputDir + "/prompts");
  }

  public getProjectPath(): string {
    return this.projectPath;
  }

  private log(msg: string): void {
    fs.appendFileSync(this.outputDir + "/log.txt", msg);
  }

  private printAndLog(msg: string): void {
    console.log(msg);
    this.log(msg);
  }

  /**
   * Find the files to mutate
   * @param path the path to the project to mutate
   * @returns the files to mutate
   */
  public async findSourceFilesToMutate(path: string): Promise<Array<string>> {
    const pattern = `${path}/**/*.{js,ts,.jsx,.tsx}`; // apply to each .js/.ts/.jsx/.tsx file under src
    const files = await fg([pattern], {
      ignore: ['**/node_modules', 
               '**/dist', 
               '**/test', 
               '**/*.test.*', 
               '**/*.min.js', 
               '**/*.d.ts', 
               '**/rollup.config.js', 
               "**/esm/index.js", 
               'coverage', 
               'lcov-report', 
               `${path}/**/*test*.js`, 
               'examples',
               '**/example', 
               '**/benchmark', 
               '**/benchmarks',
               "**/*.spec.*", 
               '**/build'] 
    });
    return files;
  }

  private isDeclaration(compl: string){
    return compl.startsWith("const") || compl.startsWith("let") || compl.startsWith("var");
  }

  private isInvalidSubstitution(prompt: Prompt, substitution: string): boolean {
    
    return (
      hasUnbalancedParens(substitution) ||
      (substitution.includes(";") &&
        prompt.spec.component === "allArgs") ||
      (!this.isDeclaration(substitution) &&
        prompt.spec.feature === "for-of" && (prompt.spec.component === "left" || prompt.spec.component === "loopheader"))
    );
  }

  private createCandidateMutant(prompt: Prompt, substitution: string): string {
    return prompt.spec.getCodeWithPlaceholder()
                      .replace("<PLACEHOLDER>", substitution);
  }

  public async generateMutants(packagePath: string): Promise<void> {
    this.printAndLog(
      `Starting generation of mutants on: ${new Date().toUTCString()}\n\n`
    );
    const files = await this.findSourceFilesToMutate(packagePath);

    this.printAndLog(
      `generating mutants for the following files: ${files.join(", ")}\n`
    );

    const isDuplicate = (mutant: Mutant, mutants: Mutant[]): boolean => {
      for (const m of mutants) {
        if (m.startLine === mutant.startLine && 
            m.startColumn === mutant.startColumn && 
            m.endLine === mutant.endLine && 
            m.endColumn === mutant.endColumn && 
            m.file === mutant.file && 
            m.replacement === mutant.replacement) {
          return true;
        }
      }
      return false;
    };

    const generator = new PromptSpecGenerator(
      files,
      this.promptTemplateFileName,
      packagePath,
      this.outputDir
    );
    generator.writePromptFiles();

    let nrSyntacticallyValid = 0;
    let nrSyntacticallyInvalid = 0;
    let nrIdentical = 0;
    let nrDuplicate = 0;

    const mutants = new Array<Mutant>();
    for (const prompt of generator.getPrompts()) {
      this.printAndLog(`processing prompt ${prompt.getId()}/${generator.getPrompts().length}\n`);
      try {
        const completions = await this.getCompletionsForPrompt(prompt);
        for (const completion of completions) {
          fs.writeFileSync(
            `${
              this.outputDir
            }/prompts/prompt${prompt.getId()}_completion_${completion.getId()}.txt`,
            completion.text
          );
          const regExp = /```\n((?:.(?!```))*)\n```/gs;
          let match;
          

          while ((match = regExp.exec(completion.text)) !== null) {
            const substitution = match[1];
            if (substitution === prompt.getOrig()) {
              nrIdentical++;
            } else if (prompt.getOrig().includes("Object.")) {
              nrSyntacticallyInvalid++;
            } else if (this.isInvalidSubstitution(prompt, substitution)) {
              nrSyntacticallyInvalid++; 
            } else if (this.isDeclaration(prompt.getOrig()) && !this.isDeclaration(substitution)) {
              nrSyntacticallyInvalid++;
            } else {
              const candidateMutant = this.createCandidateMutant(prompt, substitution);
              // try {
              if (prompt.spec.isExpressionPlaceholder()) {
                try {
                  parser.parseExpression(substitution);
                  
                  const mutant = new Mutant(
                    prompt.spec.file,
                    prompt.spec.location.startLine,
                    prompt.spec.location.startColumn,
                    prompt.spec.location.endLine,
                    prompt.spec.location.endColumn,
                    prompt.getOrig(),
                    substitution,
                    prompt.getId(),
                    completion.getId(),
                    prompt.spec.feature + "/" + prompt.spec.component
                  );
                  if (!isDuplicate(mutant, mutants)) {
                    mutants.push(mutant);
                    nrSyntacticallyValid++;
                  } else {
                    nrDuplicate++;
                  }
                } catch (e) {
                    // console.log(`*** invalid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
                    nrSyntacticallyInvalid++;
                }
              } else if (prompt.spec.isArgListPlaceHolder()) {
                try {
                  const expandedOrig = prompt.spec.parentLocation!.getText();
                  const expandedSubstitution = expandedOrig.replace(
                    prompt.getOrig(),
                    substitution
                  );
                  parser.parse(expandedSubstitution, {
                    sourceType: "module",
                    plugins: ["typescript", "jsx"],
                  });
                  
                  const mutant = new Mutant(
                    prompt.spec.file,
                    prompt.spec.parentLocation!.startLine,
                    prompt.spec.parentLocation!.startColumn,
                    prompt.spec.parentLocation!.endLine,
                    prompt.spec.parentLocation!.endColumn,
                    expandedOrig, // prompt.getOrig(),
                    expandedSubstitution, // substitution,
                    prompt.getId(),
                    completion.getId(),
                    prompt.spec.feature + "/" + prompt.spec.component
                  );
                  if (!isDuplicate(mutant, mutants)) {
                    mutants.push(mutant);
                    nrSyntacticallyValid++;
                  } else {
                    nrDuplicate++;
                  }
                } catch (e) {
                  // console.log(`*** invalid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
                  nrSyntacticallyInvalid++;
                }
              } else { // statement placeholder
                try {
                  parser.parse(candidateMutant, {
                    sourceType: "module",
                    plugins: ["typescript", "jsx"],
                  });
                  
                  const mutant = new Mutant(
                    prompt.spec.file,
                    prompt.spec.location.startLine,
                    prompt.spec.location.startColumn,
                    prompt.spec.location.endLine,
                    prompt.spec.location.endColumn,
                    prompt.getOrig(),
                    substitution,
                    prompt.getId(),
                    completion.getId(),
                    prompt.spec.feature + "/" + prompt.spec.component
                  );
                  if (!isDuplicate(mutant, mutants)) {
                    mutants.push(mutant);
                    nrSyntacticallyValid++;
                  } else {
                    nrDuplicate++;
                  }
                } catch (e) {
                  // console.log(`*** invalid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
                  nrSyntacticallyInvalid++;
                }
              }
            }
          }
        }
      } catch (e) {
        console.log(`Error while processing prompt ${prompt.getId()}: ${e}`);
      } 
    }

    const nrCandidates =
      nrSyntacticallyValid + nrSyntacticallyInvalid + nrIdentical;
    this.printAndLog(`found ${nrCandidates} mutant candidates\n`);

    const locations = new Array<string>();
    for (const mutant of mutants) {
      const location = `${mutant.file}:<${mutant.startLine},${mutant.startColumn}>-${mutant.endLine},${mutant.endColumn}`;
      if (!locations.includes(location)) {
        locations.push(location);
      }
    }
    const nrLocations = locations.length;

    this.printAndLog(
      `discarding ${nrSyntacticallyInvalid} syntactically invalid mutants\n`
    );
    this.printAndLog(
      `discarding ${nrIdentical} mutant candidates that are identical to the original code\n`
    );
    this.printAndLog(
      `discarding ${nrDuplicate} duplicate mutants\n`
    );

     
    // write mutants to file
    const mutantsFileName = path.join(this.outputDir, "mutants.json");
    fs.writeFileSync(mutantsFileName, JSON.stringify(mutants, null, 2));

    // write summary of results to "results.json"
    const resultsFileName = path.join(this.outputDir, "summary.json");
    fs.writeFileSync(
      resultsFileName,
      JSON.stringify(
        {
          nrCandidates,
          nrSyntacticallyValid,
          nrSyntacticallyInvalid,
          nrIdentical,
          nrDuplicate,
          nrLocations,
          metaInfo: {
            modelName: this.model.getModelName(),
            temperature: this.model.getTemperature(),
            maxTokens: this.model.getMaxTokens(),
            n: this.model.getN()
          }
        },  
        null,
        2
      )
    );

    this.printAndLog(
      `wrote ${nrSyntacticallyValid} mutants in ${nrLocations} locations to ${mutantsFileName}\n`
    );
  }

  public async getCompletionsForPrompt(prompt: Prompt): Promise<Completion[]> {
    const query = this.model.query(prompt.getText());
    const completions = [...(await query)];
    return completions.map((completionText) => new Completion(completionText, prompt.getId()));
  }
}
