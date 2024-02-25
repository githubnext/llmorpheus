import * as parser from "@babel/parser";
import fg from "fast-glob";
import fs from "fs";
import path from "path";

import { Mutant } from "./Mutant";
import { PromptSpecGenerator } from "./PromptSpecGenerator";
import { IModel } from "../model/IModel";
import { Completion } from "../prompt/Completion";
import { Prompt } from "../prompt/Prompt";
import { hasUnbalancedParens, isDeclaration } from "../util/code-utils";

type MutationStats = { 
  nrSyntacticallyValid: number, 
  nrSyntacticallyInvalid: number,
  nrIdentical: number,
  nrDuplicate: number
};

/**
 * Suggests mutations in given files using the specified rules
 */

export class MutantGenerator {
  constructor(
    private model: IModel,
    private promptTemplateFileName: string,
    private outputDir: string,
    private projectPath: string,
    private filesToMutate: string[]
  ) {

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }

    // remove output files from previous run, if they exist
    if (!fs.existsSync(path.join(this.outputDir, this.getSubDirName()))) {
      fs.mkdirSync(path.join(this.outputDir, this.getSubDirName()));
    }
    if (fs.existsSync(path.join(this.outputDir, this.getSubDirName(), "/mutants.json"))) {
      fs.unlinkSync(path.join(this.outputDir, this.getSubDirName(), "/mutants.json"));
    }
    if (fs.existsSync(path.join(this.outputDir, this.getSubDirName(), "/log.txt"))) {
      fs.unlinkSync(path.join(this.outputDir, this.getSubDirName(), "/log.txt"));
    }
    if (fs.existsSync(path.join(this.outputDir, this.getSubDirName(), "/prompts"))) {
      fs.rmdirSync(path.join(this.outputDir, this.getSubDirName(), "/prompts"), { recursive: true });
    }
    fs.writeFileSync(path.join(this.outputDir, this.getSubDirName(), "/log.txt"), "");
    fs.mkdirSync(path.join(this.outputDir, this.getSubDirName(), "prompts"));
  }

  public getSubDirName(): string {
    const shortFileName = this.promptTemplateFileName.substring(this.promptTemplateFileName.lastIndexOf("/") + 1);
    const shortTemplateFileName = shortFileName.substring(0, shortFileName.lastIndexOf("."));
    const subDirName = shortTemplateFileName + "_" + this.model.getModelName() + "_" + this.model.getTemperature();
    return subDirName;
  }

  public getProjectPath(): string {
    return this.projectPath;
  }

  private log(msg: string): void {
    fs.appendFileSync(path.join(this.outputDir, this.getSubDirName(), "/log.txt"), msg);
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
        '**/examples',
        '**/example',
        '**/benchmark',
        '**/benchmarks',
        "**/*.spec.*",
        '**/build',
        '**/test.js',
        '**/Gruntfile.js',
        '**/design/**',
        '**/spec/**',
        '**/scripts/**',]
    });
    return files;
  }



  /** Determine situations where a candidate mutant is invalid */
  private isInvalidSubstitution(prompt: Prompt, substitution: string): boolean {

    return (
      hasUnbalancedParens(substitution) ||
      (substitution.includes(";") &&
        prompt.spec.component === "allArgs") ||
      (!isDeclaration(substitution) &&
        prompt.spec.feature === "for-of" && (prompt.spec.component === "left" || prompt.spec.component === "header"))
    );
  }

  private createCandidateMutant(prompt: Prompt, substitution: string): string {
    return prompt.spec.getCodeWithPlaceholder()
      .replace("<PLACEHOLDER>", substitution);
  }

  /**
   * Check if a mutant is a duplicate of another mutant. Note that we also need to check
   * the case where the mutants's original code is contained in another mutants's original code,
   * and where the replacements are similarly contained in each other.
   */
  private isDuplicate(mutant: Mutant, mutants: Mutant[]): boolean {
    for (const m of mutants) {
      if (m.startLine === mutant.startLine &&
        m.startColumn === mutant.startColumn &&
        m.endLine === mutant.endLine &&
        m.endColumn === mutant.endColumn &&
        m.file === mutant.file &&
        m.replacement === mutant.replacement) {
        return true;
      }

      // check containment case
      if (m.startLine <= mutant.startLine &&
        m.endLine >= mutant.endLine &&
        m.startColumn <= mutant.startColumn &&
        m.endColumn >= mutant.endColumn &&
        m.file === mutant.file &&
        m.replacement.includes(mutant.replacement)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Generate mutants.
   */
  public async generateMutants(packagePath: string): Promise<void> {
    this.printAndLog(
      `Starting generation of mutants on: ${new Date().toUTCString()}\n\n`
    );
    const files = this.filesToMutate 
     ? this.filesToMutate.map((file) => path.join(packagePath, file))
     : await this.findSourceFilesToMutate(packagePath);

    const filesWithoutProjectPath = files.map((file) => file.replace(packagePath, ""));
    this.printAndLog(
      `generating mutants for the following files: ${filesWithoutProjectPath.join(",")}\n`
    );

    const generator = new PromptSpecGenerator(
      files,
      this.promptTemplateFileName,
      packagePath,
      this.outputDir,
      this.getSubDirName()
    );
    generator.writePromptFiles();

    const mutationStats: MutationStats = { 
      nrSyntacticallyValid: 0, 
      nrSyntacticallyInvalid: 0,
      nrIdentical: 0,
      nrDuplicate : 0
    };

    const mutants = new Array<Mutant>();
    for (const prompt of generator.getPrompts()) {
      this.printAndLog(`processing prompt ${prompt.getId()}/${generator.getPrompts().length}\n`);
      await this.generateMutantsFromPrompt(prompt, mutationStats, mutants);
    }

    this.reportAndWriteResults(mutants, mutationStats);
  }

  /**
   * Generate mutants from a specific prompt.
   */
  private async generateMutantsFromPrompt(prompt: Prompt, mutationStats: MutationStats, mutants: Mutant[]) {
    try {
      const completions = await this.getCompletionsForPrompt(prompt);
      for (const completion of completions) {
        fs.writeFileSync(
          `${path.join(this.outputDir, this.getSubDirName())}/prompts/prompt${prompt.getId()}_completion_${completion.getId()}.txt`,
          completion.text
        );
        const regExp = /```\n((?:.(?!```))*)\n```/gs;
        let match;

        while ((match = regExp.exec(completion.text)) !== null) {
          const substitution = match[1];
          if (substitution === prompt.getOrig()) {
            mutationStats.nrIdentical++;
          } else if (prompt.getOrig().includes("Object.") ||
            this.isInvalidSubstitution(prompt, substitution) ||
            isDeclaration(prompt.getOrig()) && !isDeclaration(substitution)) {
            mutationStats.nrSyntacticallyInvalid++;
          } else {
            const candidateMutant = this.createCandidateMutant(prompt, substitution);
            if (prompt.spec.isExpressionPlaceholder()) {
              this.handleExpression(substitution, prompt, completion, mutants, mutationStats);
            } else if (prompt.spec.isArgListPlaceHolder() ||
              prompt.spec.isForInitializerPlaceHolder() || prompt.spec.isForLoopHeaderPlaceHolder() ||
              prompt.spec.isForInInitializerPlaceHolder() || prompt.spec.isForInLoopHeaderPlaceHolder() || prompt.spec.isForInRightPlaceHolder() ||
              prompt.spec.isForOfInitializerPlaceHolder() || prompt.spec.isForOfLoopHeaderPlaceHolder() ||
              prompt.spec.isCalleePlaceHolder()) {
              // if the placeholder corresponds to something that is not an entire AST node, expand the original code and the substitution to the parent node
              this.handleIncompleteFragment(prompt, substitution, completion, mutants, mutationStats);
            } else { // statement placeholder
              this.handleStatement(candidateMutant, prompt, substitution, completion, mutants, mutationStats);
            }
          }
        }
      }
    } catch (e) {
      console.log(`Error while processing prompt ${prompt.getId()}: ${e}`);
    }
  }

  /**
   * Report results and write results of the mutation generation to files in the output directory.
   */
  private reportAndWriteResults(mutants: Mutant[], mutationStats: MutationStats) {

    const nrCandidates = mutationStats.nrSyntacticallyValid + mutationStats.nrSyntacticallyInvalid + mutationStats.nrIdentical;
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
      `discarding ${mutationStats.nrSyntacticallyInvalid} syntactically invalid mutants\n`
    );
    this.printAndLog(
      `discarding ${mutationStats.nrIdentical} mutant candidates that are identical to the original code\n`
    );
    this.printAndLog(
      `discarding ${mutationStats.nrDuplicate} duplicate mutants\n`
    );

    const mutantsFileName = path.join(this.outputDir, this.getSubDirName(), "mutants.json");
    fs.writeFileSync(mutantsFileName, JSON.stringify(mutants, null, 2));

    // write summary of results to "results.json"
    const resultsFileName = path.join(this.outputDir, this.getSubDirName(), "summary.json");
    const nrSyntacticallyValid = mutationStats.nrSyntacticallyValid;
    const nrSyntacticallyInvalid = mutationStats.nrSyntacticallyInvalid;
    const nrIdentical = mutationStats.nrIdentical;
    const nrDuplicate = mutationStats.nrDuplicate;
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
            maxTokens: this.model.getMaxTokens()
          }
        },
        null,
        2
      )
    );
    console.log(`summary written to  ${resultsFileName}\n`);

    this.printAndLog(
      `wrote ${nrSyntacticallyValid} mutants in ${nrLocations} locations to ${mutantsFileName}\n`
    );
  }

  /**
   * Handle the case where the mutated code fragment is an expression.
   */
  private handleExpression(substitution: string, prompt: Prompt, completion: Completion, mutants: Mutant[], mutationStats: MutationStats) {
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

      if (!this.isDuplicate(mutant, mutants)) {
        mutants.push(mutant);
        mutationStats.nrSyntacticallyValid++;
      } else {
        mutationStats.nrDuplicate++;
      }
    } catch (e) {
      // console.log(`*** invalid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
      mutationStats.nrSyntacticallyInvalid++;
    }
  }

  /**
  * Handle the case where the mutated code fragment is incomplete and does not correspond
  * to a complete statement or expression. In such cases, we need to expand the original
  * code fragment and the substitution to the parent node, to ensure syntactic completeness
  * of the code fragment. This is the case for replacing a list of call arguments or the
  * header or left side (var declaration) of a for-of loop.
  */
  private handleIncompleteFragment(prompt: Prompt, substitution: string, completion: Completion, mutants: Mutant[], mutationStats: MutationStats) {
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
        expandedOrig,
        expandedSubstitution,
        prompt.getId(),
        completion.getId(),
        prompt.spec.feature + "/" + prompt.spec.component
      );
      if (!this.isDuplicate(mutant, mutants)) {
        mutants.push(mutant);
        mutationStats.nrSyntacticallyValid++;
      } else {
        mutationStats.nrDuplicate++;
      }
    } catch (e) {
      mutationStats.nrSyntacticallyInvalid++;
    }
  }

  /**
   * Handle the case where the mutated code fragment is a statement.
   */
  private handleStatement(candidateMutant: string, prompt: Prompt, substitution: string, completion: Completion, mutants: Mutant[], mutationStats: MutationStats) {
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
      if (!this.isDuplicate(mutant, mutants)) {
        mutants.push(mutant);
        mutationStats.nrSyntacticallyValid++;
      } else {
        mutationStats.nrDuplicate++;
      }
    } catch (e) {
      // console.log(`*** invalid mutant: ${substitution} replacing ${prompt.getOrig()}\n`);
      mutationStats.nrSyntacticallyInvalid++;
    }
  }

  public async getCompletionsForPrompt(prompt: Prompt): Promise<Completion[]> {
    const query = this.model.query(prompt.getText());
    const completions = [...(await query)];
    return completions.map((completionText) => new Completion(completionText, prompt.getId()));
  }
}