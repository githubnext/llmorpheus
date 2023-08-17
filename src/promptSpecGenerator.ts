import * as fs from 'fs';
import * as path from 'path';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as handlebars from 'handlebars';
import { Prompt } from './Prompt';
import { SourceLocation } from './SourceLocation';
import { getText } from './util';

export class PromptSpecGenerator {
  private promptSpecs = new Array<PromptSpec>();
  private prompts = new Array<Prompt>();
  private promptTemplate: string = fs.readFileSync(this.promptTemplateFileName, "utf8");
  constructor(private readonly files: string[], private readonly promptTemplateFileName: string, outputDir: string) {
    this.createPromptSpecs();
    this.createPrompts(); 
    this.writePromptFiles(outputDir);
  }

  public getPromptSpecs(): PromptSpec[] {
    return this.promptSpecs;
  }

  public getPrompts(): Prompt[] {
    return this.prompts;
  }

  private createPrompts() {
    for (const promptSpec of this.promptSpecs) {
      const codeWithPlaceholder = promptSpec.getCodeWithPlaceholder();
      const compiledTemplate = handlebars.compile(this.promptTemplate); // promote to field?
      const prompt = compiledTemplate({ code: codeWithPlaceholder });
      this.prompts.push(new Prompt(prompt, promptSpec));
    }
  }

  private createPromptSpecs() {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      this.promptSpecs.push(...this.createPromptSpecsForFile(file));
    }
  }

  private createPromptSpecsForFile(file: string) : Array<PromptSpec> {
    const promptSpecs = new Array<PromptSpec>();
    const code = fs.readFileSync(file, 'utf8'); 
    const ast = parser.parse(code, { sourceType: "module", plugins: ["typescript"]});
    const outerThis = this; // TODO: is there a better way to do this?
    traverse(ast, {
      enter(nodePath) {
        // const key = path.getPathLocation(); // representation of the path, e.g., program.body[18].declaration.properties[6].value
        // const loc = new SourceLocation(file, path.node.loc!.start.line, path.node.loc!.start.column, path.node.loc!.end.line, path.node.loc!.end.column);
  
        if (nodePath.isIfStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForIf(file, nodePath));
        } if (nodePath.isSwitchStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForSwitch(file, nodePath));
        } else if (nodePath.isWhileStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForWhile(file, nodePath));
        } else if (nodePath.isDoWhileStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForDoWhile(file, nodePath));
        } else if (nodePath.isForStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForFor(file, nodePath));  
        } else if (nodePath.isForInStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForForIn(file, nodePath)); 
        } else if (nodePath.isForOfStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForForOf(file, nodePath)); 
        } else if (nodePath.isCallExpression() && nodePath.node.loc!.start.line === nodePath.node.loc!.end.line) { // for now, restrict to calls on a single line
          promptSpecs.push(...outerThis.createPromptSpecsForCall(file, nodePath)); 
        }
      }
    }); 
    return promptSpecs;
  }

  private createPromptSpecForIf(file: string, nodePath: any) : PromptSpec {
    const test = nodePath.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "if", "test", loc, loc.getText());
  }
  
  private createPromptSpecForSwitch(file: string, nodePath: any) {
    const discriminant = nodePath.node.discriminant
    const loc = new SourceLocation(file, discriminant.loc!.start.line, discriminant.loc!.start.column, discriminant.loc!.end.line, discriminant.loc!.end.column);
    return new PromptSpec(file, "switch", "discriminant", loc, loc.getText());
  }
  
  private createPromptSpecForWhile(file: string, nodePath: any) {
    const test = nodePath.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "while", "test", loc, loc.getText());
  }
  
  private createPromptSpecForDoWhile(file: string, nodePath: any) {
    const test = nodePath.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "do-while", "test", loc, loc.getText());
  }
  
  private createPromptSpecsForFor(file: string, nodePath: any) {
    const init = nodePath.node.init;
    const test = nodePath.node.test;
    const update = nodePath.node.update;
    const initLoc = new SourceLocation(file, init!.loc!.start.line, init!.loc!.start.column, init!.loc!.end.line, init!.loc!.end.column);
    const testLoc = new SourceLocation(file, test!.loc!.start.line, test!.loc!.start.column, test!.loc!.end.line, test!.loc!.end.column);
    const updateLoc = new SourceLocation(file, update!.loc!.start.line, update!.loc!.start.column, update!.loc!.end.line, update!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, init!.loc!.start.line, init!.loc!.start.column, update!.loc!.end.line, update!.loc!.end.column);        
    return [new PromptSpec(file, "for", "init", initLoc, initLoc.getText()),
            new PromptSpec(file, "for", "test", testLoc, testLoc.getText()),
            new PromptSpec(file, "for", "update", updateLoc, updateLoc.getText()),
            new PromptSpec(file, "for", "header", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForForIn(file: string, nodePath: any){
    const left = nodePath.node.left;
    const right = nodePath.node.right;
    const leftLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, left!.loc!.end.line, left!.loc!.end.column);
    const rightLoc = new SourceLocation(file, right!.loc!.start.line, right!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);   
    return [new PromptSpec(file, "for-in", "left", leftLoc, leftLoc.getText()),
            new PromptSpec(file, "for-in", "right", rightLoc, rightLoc.getText()),
            new PromptSpec(file, "for-in", "loopHeader", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForForOf(file: string, nodePath: any){
    const left = nodePath.node.left;
    const right = nodePath.node.right;
    const leftLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, left!.loc!.end.line, left!.loc!.end.column);
    const rightLoc = new SourceLocation(file, right!.loc!.start.line, right!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);   
    return [new PromptSpec(file, "for-of", "left", leftLoc, leftLoc.getText()),
            new PromptSpec(file, "for-of", "right", rightLoc, rightLoc.getText()),
            new PromptSpec(file, "for-of", "loopHeader", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForCall(file: string, nodePath: any) : Array<PromptSpec> {
    const callee = nodePath.node.callee;
    const args = nodePath.node.arguments;
    const prompts = new Array<PromptSpec>();
    const calleeLoc = new SourceLocation(file, callee.loc!.start.line, callee.loc!.start.column, callee.loc!.end.line, callee.loc!.end.column);   
    prompts.push(new PromptSpec(file, "call", "callee", calleeLoc, calleeLoc.getText())); 
    for (let argNr=0; argNr < args.length; argNr++){
      const arg = args[argNr];
      const argLoc = new SourceLocation(file, arg.loc!.start.line, arg.loc!.start.column, arg.loc!.end.line, arg.loc!.end.column);
      prompts.push(new PromptSpec(file, "call", "arg" + argNr, argLoc, argLoc.getText()));
    }
    if (args.length === 0){
      // find location between parentheses
      const loc = nodePath.node.loc!;
      const allArgsLoc = new SourceLocation(file, callee.loc!.end.line, callee.loc!.end.column+1, loc.end.line, loc.end.column-1);
      prompts.push(new PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText()));
    } else if (args.length !== 1){ // skip if there is only one argument because then the same placeholder is already created for the first argument
      const firstArg = args[0];
      const lastArg = args[args.length - 1];
      const allArgsLoc = new SourceLocation(file, firstArg.loc!.start.line, firstArg.loc!.start.column, lastArg.loc!.end.line, lastArg.loc!.end.column);
      const parentLoc = new SourceLocation(file, nodePath.node.loc!.start.line, nodePath.node.loc!.start.column, nodePath.node.loc!.end.line, nodePath.node.loc!.end.column);
      prompts.push(new PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText(), parentLoc));
    }
    return prompts;
  }

  /**
   * Write the promptSpecs to promptSpecs.JSON and the prompts to files "prompts/prompt<NUM>.txt".
   * @param outputDir the name of directory to write the files to
   */
  private writePromptFiles(outputDir: string){
    // write promptSpecs to JSON file
    const json = JSON.stringify(this.promptSpecs, null, 2);
    fs.writeFileSync(path.join(outputDir, 'promptSpecs.json'), json);

    // write prompts to directory "prompts"
    const dir = path.join(outputDir, 'prompts');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    for (const prompt of this.prompts){
       const fileName = path.join(outputDir, 'prompts', `prompt${prompt.getId()}.txt`);
      fs.writeFileSync(fileName, prompt.getText());
    }
  }
}


/**
 * Specifies all information needed to create a prompt.
 *   file: the file name
 *   feature: the type of the language construct (if/switch/while/do-while/for/for-in/for-of/call)
 *   component: the part of the language construct that is to be changed (test/discriminant/update)
 *   location: the location of the component in the source code
 *   orig: the original contents of the placeholder
 */
export class PromptSpec {
  constructor(public readonly file: string, public readonly feature: string, public readonly component: string, 
              public readonly location: SourceLocation, public readonly orig: string,
              public readonly parentLocation? : SourceLocation){}

  public getCodeWithPlaceholder() {
    const code = fs.readFileSync(this.file, 'utf8');
    const lines = code.split('\n');
    const lastLine = lines.length;
    const endColumnOfLastLine = lines[lastLine - 1].length;
    return getText(code, 1, 0, this.location.startLine, this.location.startColumn) +
           "<PLACEHOLDER>" +
           getText(code, this.location.endLine, this.location.endColumn, lastLine, endColumnOfLastLine);
  }

  public isExpressionPlaceholder(): boolean {
    return this.feature === "if" && this.component === "test" ||
           this.feature === "switch" && this.component === "discriminant" ||
           this.feature === "while" && this.component === "test" ||
           this.feature === "do-while" && this.component === "test" ||
           this.feature === "for" && this.component === "test" ||
           this.feature === "for-in" && this.component === "right" ||  
           this.feature === "for-of" && this.component === "right" ||
           this.feature === "call" && this.component.startsWith("arg") ||
           this.feature === "call" && this.component === "callee";
  }

  public isArgListPlaceHolder(): boolean {
    return this.feature === "call" && this.component === "allArgs";
  }
}