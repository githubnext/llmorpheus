import fs from "fs";
import * as handlebars from 'handlebars';
import { Rule } from "./rule";

export class Prompt {

  constructor(private id: number, private fileName: string, private chunkNr: number, private rule: Rule, private text: string){}
  public static fromJSON(json: any) : Prompt {
    const r = new Rule(json.rule.ruleId, json.rule.rule, json.rule.description);
    return new Prompt(json.id, json.fileName, json.chunkNr, r, json.text);
  }

  public toString() : string {
    return  `prompt<id: ${this.id}, fileName: ${this.fileName}, chunkNr: ${this.chunkNr}, rule: ${this.rule}, text: ${this.text}>`;
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
  public constructor(private promptId: number, private id: number, private text: string){}
  
  public static fromJSON(json: any) {
    return new Completion(json.promptId, json.id, json.text);
  }

  public toString() : string {
    return `completion<id: ${this.id}, promptId: ${this.promptId}, text: ${this.text}>`;
  }

  public getPromptId() : number {
    return this.promptId;
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
   * @param line The line of code where the rule would be applied.
   * @returns The prompt.
   */
  public createPrompt(id: number, fileName: string, chunkNr: number, origCode: string, rule: Rule, line?: string) : Prompt {  
    const compiledTemplate = handlebars.compile(this.template);
    const text = line ? 
                 compiledTemplate({ origCode: origCode, rule: rule, line: line, symbols: [...rule.getLHSterminals()].toString() }) :
                 compiledTemplate({ origCode: origCode, rule: rule, symbols: [...rule.getLHSterminals()].toString() });
    return new Prompt(id, fileName.substring(fileName.indexOf('src')), chunkNr, rule, text);
  }
}