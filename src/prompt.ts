import fs from "fs";
import * as handlebars from 'handlebars';
import { Rule } from "./rule";

export class Prompt {
  private id: number;
  private static cnt = 0;
  constructor(private text: string) {
    this.id = Prompt.cnt++;
  }

  public getId() : number {
    return this.id;
  }
  public getText() : string {
    return this.text;
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
  public createPrompt(origCode: string, rule: Rule) : Prompt {  
    const compiledTemplate = handlebars.compile(this.template);
    return new Prompt(
      compiledTemplate({ origCode: origCode, rule: rule, symbols: [...rule.getLHSterminals()].toString() })
    );
  }
}