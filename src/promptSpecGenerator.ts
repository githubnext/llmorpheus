import * as fs from 'fs';
import * as path from 'path';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import * as handlebars from 'handlebars';

export class PromptSpecGenerator {
  private promptSpecs = new Array<PromptSpec>();
  private prompts = new Array<NewPrompt>();
  private promptTemplate: string = fs.readFileSync(this.promptTemplateFileName, "utf8");
  constructor(private readonly files: string[], private readonly promptTemplateFileName: string, outputDir: string) {
    this.createPromptSpecs();
    this.createPrompts(); 
    this.writePromptFiles(path.join(outputDir));
  }

  public getPromptSpecs(): PromptSpec[] {
    return this.promptSpecs;
  }

  public getPrompts(): NewPrompt[] {
    return this.prompts;
  }

  private createPrompts() {
    for (const promptSpec of this.promptSpecs) {
      const codeWithPlaceholder = promptSpec.getCodeWithPlaceholder();
      const compiledTemplate = handlebars.compile(this.promptTemplate); // promote to field?
      const prompt = compiledTemplate({ code: codeWithPlaceholder });
      this.prompts.push(new NewPrompt(prompt, promptSpec));
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
    const code = fs.readFileSync("./" + file, 'utf8'); 
    const ast = parser.parse(code, { sourceType: "module", plugins: ["typescript"]});
    console.log(`ast: ${file}:\n${ast}`);
    const outerThis = this; // TODO: is there a better way to do this?
    traverse(ast, {
      enter(path) {
        // const key = path.getPathLocation(); // representation of the path, e.g., program.body[18].declaration.properties[6].value
        // const loc = new SourceLocation(file, path.node.loc!.start.line, path.node.loc!.start.column, path.node.loc!.end.line, path.node.loc!.end.column);
  
        if (path.isIfStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForIf(file, path));
        } if (path.isSwitchStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForSwitch(file, path));
        } else if (path.isWhileStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForWhile(file, path));
        } else if (path.isDoWhileStatement()) {
          promptSpecs.push(outerThis.createPromptSpecForDoWhile(file, path));
        } else if (path.isForStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForFor(file, path));  
        } else if (path.isForInStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForForIn(file, path)); 
        } else if (path.isForOfStatement()) {
          promptSpecs.push(...outerThis.createPromptSpecsForForOf(file, path)); 
        } else if (path.isCallExpression() && path.node.loc!.start.line === path.node.loc!.end.line) { // for now, restrict to calls on a single line
          promptSpecs.push(...outerThis.createPromptSpecsForCall(file, path)); 
        }
      }
    }); 
    return promptSpecs;
  }

  private createPromptSpecForIf(file: string, path: any) : PromptSpec {
    const test = path.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "if", "test", loc, loc.getText());
  }
  
  private createPromptSpecForSwitch(file: string, path: any) {
    const discriminant = path.node.discriminant
    const loc = new SourceLocation(file, discriminant.loc!.start.line, discriminant.loc!.start.column, discriminant.loc!.end.line, discriminant.loc!.end.column);
    return new PromptSpec(file, "switch", "discriminant", loc, loc.getText());
  }
  
  private createPromptSpecForWhile(file: string, path: any) {
    const test = path.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "while", "test", loc, loc.getText());
  }
  
  private createPromptSpecForDoWhile(file: string, path: any) {
    const test = path.node.test;
    const loc = new SourceLocation(file, test.loc!.start.line, test.loc!.start.column, test.loc!.end.line, test.loc!.end.column);
    return new PromptSpec(file, "do-while", "test", loc, loc.getText());
  }
  
  private createPromptSpecsForFor(file: string, path: any) {
    const init = path.node.init;
    const test = path.node.test;
    const update = path.node.update;
    const initLoc = new SourceLocation(file, init!.loc!.start.line, init!.loc!.start.column, init!.loc!.end.line, init!.loc!.end.column);
    const testLoc = new SourceLocation(file, test!.loc!.start.line, test!.loc!.start.column, test!.loc!.end.line, test!.loc!.end.column);
    const updateLoc = new SourceLocation(file, update!.loc!.start.line, update!.loc!.start.column, update!.loc!.end.line, update!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, init!.loc!.start.line, init!.loc!.start.column, update!.loc!.end.line, update!.loc!.end.column);        
    return [new PromptSpec(file, "for", "init", initLoc, initLoc.getText()),
            new PromptSpec(file, "for", "test", testLoc, testLoc.getText()),
            new PromptSpec(file, "for", "update", updateLoc, updateLoc.getText()),
            new PromptSpec(file, "for", "header", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForForIn(file: string, path: any){
    const left = path.node.left;
    const right = path.node.right;
    const leftLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, left!.loc!.end.line, left!.loc!.end.column);
    const rightLoc = new SourceLocation(file, right!.loc!.start.line, right!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);   
    return [new PromptSpec(file, "for-in", "left", leftLoc, leftLoc.getText()),
            new PromptSpec(file, "for-in", "right", rightLoc, rightLoc.getText()),
            new PromptSpec(file, "for-in", "loopHeader", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForForOf(file: string, path: any){
    const left = path.node.left;
    const right = path.node.right;
    const leftLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, left!.loc!.end.line, left!.loc!.end.column);
    const rightLoc = new SourceLocation(file, right!.loc!.start.line, right!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);
    const loopHeaderLoc = new SourceLocation(file, left!.loc!.start.line, left!.loc!.start.column, right!.loc!.end.line, right!.loc!.end.column);   
    return [new PromptSpec(file, "for-of", "left", leftLoc, leftLoc.getText()),
            new PromptSpec(file, "for-of", "right", rightLoc, rightLoc.getText()),
            new PromptSpec(file, "for-of", "loopHeader", loopHeaderLoc, loopHeaderLoc.getText())];
  }
  
  private createPromptSpecsForCall(file: string, path: any) : Array<PromptSpec> {
    const callee = path.node.callee;
    const args = path.node.arguments;
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
      const loc = path.node.loc!;
      const allArgsLoc = new SourceLocation(file, callee.loc!.end.line, callee.loc!.end.column+1, loc.end.line, loc.end.column-1);
      prompts.push(new PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText()));
    } else if (args.length !== 1){ // skip if there is only one argument because then the same placeholder is already created for the first argument
      const firstArg = args[0];
      const lastArg = args[args.length - 1];
      const allArgsLoc = new SourceLocation(file, firstArg.loc!.start.line, firstArg.loc!.start.column, lastArg.loc!.end.line, lastArg.loc!.end.column);
      prompts.push(new PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText()));
    }
    return prompts;
  }





  // public printResults(){
  //   for (let i=0; i < this.promptSpecs.length; i++){
  //     const promptSpec = this.promptSpecs[i];
  //     console.log(`${i}: ${promptSpec.feature}/${promptSpec.component}`);
  //     console.log("***1***");
  //     const code = fs.readFileSync(path.join('.', promptSpec.file), 'utf8');
  //     console.log("***2***");
  //     const feature = promptSpec.feature;
  //     const component = promptSpec.component;
  //     const orig = promptSpec.orig;
  //     const startLine = promptSpec.location.startLine;
  //     const startColumn = promptSpec.location.startColumn;
  //     const endLine = promptSpec.location.endLine;
  //     const endColumn = promptSpec.location.endColumn;
  //     const lines = code.split('\n');
  //     const lastLine = lines.length;
  //     const endColumnOfLastLine = lines[lastLine-1].length;
  //     const before = getText(code, 1, 0, startLine, startColumn);
  //     const after = getText(code, endLine, endColumn, lastLine, endColumnOfLastLine);
  //     const ccode = insertCommentOnLineWithPlaceholder(`${before}<PLACEHOLDER>${after}`, `${feature}/${component} (orig: ${orig})`);
  //     console.log(`// PROMPT#${i} created for component ${component} on line ${startLine} in FILE ${promptSpec.file}:\n${ccode}`);    
  //   }
  // }

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
       const fileName = path.join('./prompts', `prompt${prompt.getId()}.txt`);
       console.log(`fileName: ${fileName}`);  
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
              public readonly location: SourceLocation, public readonly orig: string){}

  public getCodeWithPlaceholder() {
    const code = fs.readFileSync(path.join('.', this.file), 'utf8');
    const lines = code.split('\n');
    const lastLine = lines.length;
    const endColumnOfLastLine = lines[lastLine - 1].length;
    return getText(code, 1, 0, this.location.startLine, this.location.startColumn) +
           "<PLACEHOLDER>" +
           getText(code, this.location.endLine, this.location.endColumn, lastLine, endColumnOfLastLine);
  }
}

export class NewPrompt {
  private static idCounter = 0;
  private id: number;
  constructor(private readonly text: string, public readonly spec: PromptSpec){
    this.id = NewPrompt.idCounter++;
  }
  public getText(): string {
    return this.text;
  }
  public getId(): number {
    return this.id;
  }
  public getOrig(): string {
    return this.spec.orig;
  }
}

class SourceLocation {
  constructor(public readonly file: string, public readonly startLine: number, public readonly startColumn: number, public readonly endLine: number, public readonly endColumn: number, private originalCode?: string) {}
  public getText() {
    const code = fs.readFileSync(path.join('.', this.file), 'utf8');
    const startIndex = toIndex(code, this.startLine, this.startColumn);
    const endIndex = toIndex(code, this.endLine, this.endColumn);
    return code.substring(startIndex, endIndex);
  }
  public toString(): string {
    return `${this.file}:<${this.startLine},${this.startColumn}>-<${this.endLine},${this.endColumn}>`;
  }
}

function insertCommentOnLineWithPlaceholder(code: string, comment: string){
  const lines = code.split('\n');
  const lineWithPlaceholder = lines.findIndex(line => line.includes('<PLACEHOLDER>'));
  if (lineWithPlaceholder === -1){
    throw new Error("No line with placeholder found");
  } else {
    const line = lines[lineWithPlaceholder];  
    const lineWithComment = line + ' // ' + comment;
    lines[lineWithPlaceholder] = lineWithComment;
    return lines.join('\n');
  }
}


/**
 * Convert [line,col] to index.
 * @param code the code
 * @param line the line
 * @param column the column
 * @returns the index
 */
function toIndex(code: string, line: number, column: number) {
  let index = 0;
  let lineCount = 1;
  let columnCount = 0;
  for (let i = 0; i <= code.length; i++) {
    if (lineCount === line && columnCount === column) {
      index = i;
      break;
    }
    if (code[i] === '\n') {
      lineCount++;
      columnCount = 0;
    } else {
      columnCount++;
    }
  }
  return index;
}

/**
 * Retrieve the code fragment from [startLine, startColumn] to [endLine, endColumn].
 * @param code the code
 * @param startLine the start line
 * @param startColumn the start column
 * @param endLine the end line
 * @param endColumn the end column
 * @returns the code fragment
 */
function getText(code: string, startLine: number, startColumn: number, endLine: number, endColumn: number) {
  const startIndex = toIndex(code, startLine, startColumn);
  const endIndex = toIndex(code, endLine, endColumn);
  return code.substring(startIndex, endIndex);
}



