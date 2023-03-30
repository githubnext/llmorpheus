import fs from "fs";
import * as handlebars from 'handlebars';
import { IRule } from "./rule";

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
  public createPrompt(origCode: string, rule: IRule){  
    const compiledTemplate = handlebars.compile(this.template);
    return compiledTemplate({ origCode: origCode, rule: rule });
  }
}