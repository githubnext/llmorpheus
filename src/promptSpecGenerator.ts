import * as fs from "fs";
import * as path from "path";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as handlebars from "handlebars";
import { Prompt } from "./Prompt";
import { SourceLocation } from "./SourceLocation";
import { PromptSpec } from "./PromptSpec";

/**
 * Generates a set of PromptSpecs for a given set of source files and a given prompt template.
 */
export class PromptSpecGenerator {
  private promptSpecs = new Array<PromptSpec>();
  private prompts = new Array<Prompt>();
  private promptTemplate: string = fs.readFileSync(
    this.promptTemplateFileName,
    "utf8"
  );
  constructor(
    private readonly files: string[],
    private readonly promptTemplateFileName: string,
    private readonly packagePath: string,
    private readonly outputDir: string,
    private readonly subDir: string
  ) {
    Prompt.resetIdCounter();
    this.createPromptSpecs();
    this.createPrompts();
  }

  public getPromptSpecs(): PromptSpec[] {
    return this.promptSpecs;
  }

  public getPrompts(): Prompt[] {
    return this.prompts;
  }

  public getOutputDir(): string {
    return this.outputDir;
  }

  public getSubDir(): string {
    return this.subDir;
  }

  private createPrompts() {
    for (const promptSpec of this.promptSpecs) {
      const codeWithPlaceholder = promptSpec.getCodeWithPlaceholder();
      const compiledTemplate = handlebars.compile(this.promptTemplate); // promote to field?
      const references = Array.from(promptSpec.references).join(", ");
      const orig = promptSpec.orig;
      const prompt = compiledTemplate({ code: codeWithPlaceholder, references, orig });
      this.prompts.push(new Prompt(prompt, promptSpec));
    }
  }

  private createPromptSpecs() {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      this.promptSpecs.push(...this.createPromptSpecsForFile(file));
    }
  }

  private createPromptSpecsForFile(file: string): Array<PromptSpec> {
    const promptSpecs = new Array<PromptSpec>();
    const code = fs.readFileSync(file, "utf8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript"],
    });
    const outerThis = this; // needed to access this in the callback function
    traverse(ast, {
      enter(path) {
        // const key = path.getPathLocation(); // representation of the path, e.g., program.body[18].declaration.properties[6].value
        // const loc = new SourceLocation(file, path.node.loc!.start.line, path.node.loc!.start.column, path.node.loc!.end.line, path.node.loc!.end.column);

        outerThis.createPromptSpecForIf(file, path);
        outerThis.createPromptSpecForSwitch(file, path);
        outerThis.createPromptSpecForWhile(file, path);
        outerThis.createPromptSpecForDoWhile(file, path); 
        outerThis.createPromptSpecsForFor(file, path);
        outerThis.createPromptSpecsForForIn(file, path);
        outerThis.createPromptSpecsForForOf(file, path);
        outerThis.createPromptSpecsForCall(file, path);
      }
    });
    return promptSpecs;
  }



  // private stripPackagePathFromFileName(fileName: string) : string {
  //   return fileName.replace(this.packagePath, '');
  // }

  private createPromptSpecForIf(file: string, path: any): void {
    if (path.isIfStatement()) {
      const test = path.node.test;
      const loc = new SourceLocation(
        file,
        test.loc!.start.line,
        test.loc!.start.column,
        test.loc!.end.line,
        test.loc!.end.column
      );
      this.promptSpecs.push(new PromptSpec(file, "if", "test", loc, loc.getText()));
    }
  }

  private createPromptSpecForSwitch(file: string, path: any) : void {
    if (path.isSwitchStatement()) {
      const discriminant = path.node.discriminant;
      const loc = new SourceLocation(
        file,
        discriminant.loc!.start.line,
        discriminant.loc!.start.column,
        discriminant.loc!.end.line,
        discriminant.loc!.end.column
      );
      this.promptSpecs.push(new PromptSpec(file, "switch", "discriminant", loc, loc.getText()));
    }
  }

  private createPromptSpecForWhile(file: string, path: any) {
    if (path.isWhileStatement()) {
      const test = path.node.test;
      const loc = new SourceLocation(
        file,
        test.loc!.start.line,
        test.loc!.start.column,
        test.loc!.end.line,
        test.loc!.end.column
      );
      this.promptSpecs.push(new PromptSpec(file, "while", "test", loc, loc.getText()));
    }
  }

  private createPromptSpecForDoWhile(file: string, path: any) {
    if (path.isDoWhileStatement()) {
      const test = path.node.test;
      const loc = new SourceLocation(
        file,
        test.loc!.start.line,
        test.loc!.start.column,
        test.loc!.end.line,
        test.loc!.end.column
      );
      this.promptSpecs.push(new PromptSpec(file, "do-while", "test", loc, loc.getText()));
    }
  }

  private createPromptSpecsForFor(file: string, path: any) {
    if (path.isForStatement()) {
      const init = path.node.init;
      const test = path.node.test;
      const update = path.node.update;
      const initLoc = new SourceLocation(
        file,
        init!.loc!.start.line,
        init!.loc!.start.column,
        init!.loc!.end.line,
        init!.loc!.end.column
      );
      const testLoc = new SourceLocation(
        file,
        test!.loc!.start.line,
        test!.loc!.start.column,
        test!.loc!.end.line,
        test!.loc!.end.column
      );
      const updateLoc = new SourceLocation(
        file,
        update!.loc!.start.line,
        update!.loc!.start.column,
        update!.loc!.end.line,
        update!.loc!.end.column
      );
      const loopHeaderLoc = new SourceLocation(
        file,
        init!.loc!.start.line,
        init!.loc!.start.column,
        update!.loc!.end.line,
        update!.loc!.end.column
      );
      const parentLoc = new SourceLocation(
        file,
        path.node.loc!.start.line,
        path.node.loc!.start.column,
        path.node.loc!.end.line,
        path.node.loc!.end.column
      );
      const newPromptSpecs = [
        new PromptSpec(file, "for", "init", initLoc, initLoc.getText(), parentLoc),
        new PromptSpec(file, "for", "test", testLoc, testLoc.getText(), parentLoc),
        new PromptSpec(file, "for", "update", updateLoc, updateLoc.getText(), parentLoc),
        new PromptSpec(
          file,
          "for",
          "header",
          loopHeaderLoc,
          loopHeaderLoc.getText(),
          parentLoc
        ),
      ];
      this.promptSpecs.push(...newPromptSpecs);
    } 
  }

  private createPromptSpecsForForIn(file: string, path: any) {
    if (path.isForInStatement()) {
      const left = path.node.left;
      const right = path.node.right;
      const leftLoc = new SourceLocation(
        file,
        left!.loc!.start.line,
        left!.loc!.start.column,
        left!.loc!.end.line,
        left!.loc!.end.column
      );
      const rightLoc = new SourceLocation(
        file,
        right!.loc!.start.line,
        right!.loc!.start.column,
        right!.loc!.end.line,
        right!.loc!.end.column
      );
      const loopHeaderLoc = new SourceLocation(
        file,
        left!.loc!.start.line,
        left!.loc!.start.column,
        right!.loc!.end.line,
        right!.loc!.end.column
      );
      const parentLoc = new SourceLocation(
        file,
        path.node.loc!.start.line,
        path.node.loc!.start.column,
        path.node.loc!.end.line,
        path.node.loc!.end.column
      );
      const newPromptSpecs = [
        new PromptSpec(file, "for-in", "left", leftLoc, leftLoc.getText(), parentLoc),
        new PromptSpec(file, "for-in", "right", rightLoc, rightLoc.getText(), parentLoc),
        new PromptSpec(
          file,
          "for-in",
          "header",
          loopHeaderLoc,
          loopHeaderLoc.getText(),
          parentLoc
        ),
      ];
      this.promptSpecs.push(...newPromptSpecs);
    }
  }

  private createPromptSpecsForForOf(file: string, path: any) {
    if (path.isForOfStatement()) {
      const left = path.node.left;
      const right = path.node.right;
      const leftLoc = new SourceLocation(
        file,
        left!.loc!.start.line,
        left!.loc!.start.column,
        left!.loc!.end.line,
        left!.loc!.end.column
      );
      const rightLoc = new SourceLocation(
        file,
        right!.loc!.start.line,
        right!.loc!.start.column,
        right!.loc!.end.line,
        right!.loc!.end.column
      );
      const loopHeaderLoc = new SourceLocation(
        file,
        left!.loc!.start.line,
        left!.loc!.start.column,
        right!.loc!.end.line,
        right!.loc!.end.column
      );
      const parentLoc = new SourceLocation(
        file,
        path.node.loc!.start.line,
        path.node.loc!.start.column,
        path.node.loc!.end.line,
        path.node.loc!.end.column
      );
      const newPromptSpecs = [
        new PromptSpec(file, "for-of", "left", leftLoc, leftLoc.getText(), parentLoc),
        new PromptSpec(file, "for-of", "right", rightLoc, rightLoc.getText()),
        new PromptSpec(
          file,
          "for-of",
          "header",
          loopHeaderLoc,
          loopHeaderLoc.getText(),
          parentLoc
        ),
      ];
      this.promptSpecs.push(...newPromptSpecs);
    } 
  }

  private createPromptSpecsForCall(file: string, path: any) {
    if (path.isCallExpression() && path.node.loc!.start.line === path.node.loc!.end.line) {
      // for now, restrict to calls on a single line
      const callee = path.node.callee;
      const args = path.node.arguments;
      const newPromptSpecs = new Array<PromptSpec>();
      const calleeLoc = new SourceLocation(
        file,
        callee.loc!.start.line,
        callee.loc!.start.column,
        callee.loc!.end.line,
        callee.loc!.end.column
      );
      if (calleeLoc.getText() !== "require"){ // don't mutate calls to require
        newPromptSpecs.push(
          new PromptSpec(file, "call", "callee", calleeLoc, calleeLoc.getText())
        );
        for (let argNr = 0; argNr < args.length; argNr++) {
          const arg = args[argNr];
          const argLoc = new SourceLocation(
            file,
            arg.loc!.start.line,
            arg.loc!.start.column,
            arg.loc!.end.line,
            arg.loc!.end.column
          );
          newPromptSpecs.push(
            new PromptSpec(file, "call", "arg" + argNr, argLoc, argLoc.getText())
          );
        }
        if (args.length === 0) {
          // find location between parentheses
          const loc = path.node.loc!;
          const allArgsLoc = new SourceLocation(
            file,
            callee.loc!.end.line,
            callee.loc!.end.column + 1,
            loc.end.line,
            loc.end.column - 1
          );
          newPromptSpecs.push(
            new PromptSpec(
              file,
              "call",
              "allArgs",
              allArgsLoc,
              allArgsLoc.getText()
            )
          );
        } else if (args.length !== 1) {
          // skip if there is only one argument because then the same placeholder is already created for the first argument
          const firstArg = args[0];
          const lastArg = args[args.length - 1];
          const allArgsLoc = new SourceLocation(
            file,
            firstArg.loc!.start.line,
            firstArg.loc!.start.column,
            lastArg.loc!.end.line,
            lastArg.loc!.end.column
          );
          const parentLoc = new SourceLocation(
            file,
            path.node.loc!.start.line,
            path.node.loc!.start.column,
            path.node.loc!.end.line,
            path.node.loc!.end.column
          );
          newPromptSpecs.push(
            new PromptSpec(
              file,
              "call",
              "allArgs",
              allArgsLoc,
              allArgsLoc.getText(),
              parentLoc
            )
          );
        }
      }
      this.promptSpecs.push(...newPromptSpecs);
    }
  }

  /**
   * Write the promptSpecs to promptSpecs.JSON and the prompts to files "prompts/prompt<NUM>.txt".
   * @param outputDir the name of directory to write the files to
   */
  public writePromptFiles() {
    const promptSpecsWithRelativePaths = this.promptSpecs.map((promptSpec) => {
      const relativePath = path.relative(this.packagePath, promptSpec.file);
      const feature = promptSpec.feature;
      const component = promptSpec.component;
      const location = promptSpec.location;
      const orig = promptSpec.orig;
      const parentLocation = promptSpec.parentLocation;
      return { 
        file: relativePath,
        feature,
        component,
        location,
        orig,
        parentLocation
      }
    });

    // write promptSpecs to JSON file
    const json = JSON.stringify(promptSpecsWithRelativePaths, null, 2);
    const fileName = path.join(this.outputDir, this.subDir, "promptSpecs.json");
    fs.writeFileSync(path.join(this.outputDir, this.subDir, "promptSpecs.json"), json);

    // write prompts to directory "prompts"
    const dir = path.join(this.outputDir, this.subDir, "prompts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    for (const prompt of this.prompts) {
      const fileName = path.join(
        this.outputDir,
        this.subDir,
        "prompts",
        `prompt${prompt.getId()}.txt`
      );
      fs.writeFileSync(fileName, prompt.getText());
    }
  }
}