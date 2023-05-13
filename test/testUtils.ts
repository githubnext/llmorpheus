import * as fs from 'fs';
import { Completion, Prompt } from '../src/prompt';

export const expectedPromptsDir = "./test/input/prompts"
export const sourceFileName = "./test/input/countriesandtimezones_index.js";
export const sourceProject = "/Users/franktip/sabbatical/projects/countries-and-timezones"; 
export const promptTemplateFileName = "./test/input/promptTemplate.hb";
export const rulesFileName = "./test/input/rules.json";
export const mockModelDir =  "./test/input/mockModel";
export const outputDir = "./test/temp_output";

export function setContainsPrompt(prompts: Set<Prompt>, prompt: Prompt) : boolean {
  for (const p of prompts){
    if (p.getText() === prompt.getText()){
      return true;
    }
  }
  return false;
}

export function setContainsCompletion(completions: Set<Completion>, completion: Completion) : boolean {
  for (const c of completions){
    if (c.getText() === completion.getText()){
      return true;
    }
  }
  return false;
}

export function findExpectedPrompts(promptDir: string) : Set<Prompt> {
  const expectedPrompts = new Set<Prompt>();
  const expectedPromptFiles = fs.readdirSync(promptDir);
  for (const expectedPromptFile of expectedPromptFiles) {

    // if the file matches 'prompt_*.json' then add it to the set of expected prompts
    if (expectedPromptFile.indexOf("completion") === -1) {
      const jsonObj = JSON.parse(fs.readFileSync("./test/input/prompts/" + expectedPromptFile, "utf8"));
      // console.log(`jsonObj: ${jsonObj}`);
      const prompt = Prompt.fromJSON(jsonObj);
      expectedPrompts.add(prompt);
    }

  }
  return expectedPrompts;
}

export function findExpectedCompletions(promptId: number) : Set<Completion> {
  const expectedCompletions = new Set<Completion>();
  const expectedCompletionFiles = fs.readdirSync(expectedPromptsDir);
  for (const expectedCompletionFile of expectedCompletionFiles) {
    if (expectedCompletionFile.indexOf(`prompt_${promptId}_completion`) !== -1) {
      const jsonObj = JSON.parse(fs.readFileSync("./test/input/prompts/" + expectedCompletionFile, "utf8"));
      const completion = Completion.fromJSON(jsonObj);
      expectedCompletions.add(completion);
    }
  }
  return expectedCompletions;
}