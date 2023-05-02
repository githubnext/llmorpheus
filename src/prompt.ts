import fs from "fs";
import * as handlebars from 'handlebars';
import { Rule } from "./rule";

export interface IPrompt {
  id: number;
  text: string;
}

/**
 * Component for creating a prompt for a given rule and original code.
 *  @param promptTemplateFileName The name of the file containing the prompt template.
 */ 
export class PromptGenerator {
  private template: string; 
  private static cnt: number = 0;
  constructor(private promptTemplateFileName: string) {
    this.template = fs.readFileSync(this.promptTemplateFileName, "utf8");
  }

  /**
   * Creates a prompt for a given rule and original code.
   * @param origCode The original code.
   * @param rule The rule.
   * @returns The prompt.
   */
  public createPrompt(origCode: string, rule: Rule) : IPrompt {  
    const compiledTemplate = handlebars.compile(this.template);
    return {
      id: PromptGenerator.cnt++,
      text: compiledTemplate({ origCode: origCode, rule: rule, symbols: [...rule.getLHSterminals()].toString() })
    };
  }
}