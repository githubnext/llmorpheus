import { IRule } from "./rule";

export function createPrompt(origCode: string, rule: IRule, instructions: string){  
  return 'In this task, we will change the behavior of a program by applying mutation testing.\n' +
         'Given the following code, where line numbers have been added for ease of reference:\n' +
         `<BEGIN>\n ${origCode}\n<END>\n\n` +  
         `Identify where the following rewrite rule can be applied:\n\t${rule.rule} (${rule.description})\n${instructions} \n`;
}
