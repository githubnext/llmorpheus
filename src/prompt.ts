import fs from "fs";
import * as handlebars from 'handlebars';
import { Rule } from "./rule";

export class Prompt {
  private id: number;
  private static cnt = 0;
  constructor(private fileName: string, private chunkNr: number, private rule: Rule, private text: string) {
    this.id = Prompt.cnt++;
  }
  public static fromJSON(json: any) : Prompt {
    return new Prompt(json.fileName, json.chunkNr, Rule.fromJSON(json.rule), json.text);
  }

  public getId() : number {
    return this.id;
  }
  public getText() : string {
    return this.text;
  }
  public getFileName() : string {
    return this.fileName;
  }
  public getChunkNr() : number {
    return this.chunkNr;
  }
  public getRule() : Rule {
    return this.rule;
  }
}

export class Completion {
  private static cnt = 0;
  private id: number;
  constructor(private prompt: Prompt, private text: string) {
    this.id = Completion.cnt++;
  }

  public getId() : number {
    return this.id;
  }
  public getText() : string {
    return this.text;
  }
}

/**
 * Component for creating a prompt for a given rule and original code.
 *  @param promptTemplateFileName The name of the file containing the prompt template.
 */ 
export class PromptGenerator {
  private template: string; 
  constructor(private promptTemplateFileName: string) {
    this.template = fs.readFileSync(this.promptTemplateFileName, "utf8");
  }

  /**
   * Creates a prompt for a given rule and original code.
   * @param origCode The original code.
   * @param rule The rule.
   * @returns The prompt.
   */
  public createPrompt(fileName: string, chunkNr: number, origCode: string, rule: Rule) : Prompt {  
    const compiledTemplate = handlebars.compile(this.template);
    const text = compiledTemplate({ origCode: origCode, rule: rule, symbols: [...rule.getLHSterminals()].toString() });
    return new Prompt(fileName, chunkNr, rule, text);
  }
}