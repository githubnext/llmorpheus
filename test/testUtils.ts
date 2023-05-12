import * as fs from 'fs';

export const expectedPromptsDir = "./test/input/prompts"
export const sourceFileName = "./test/input/countriesandtimezones_index.js";
export const sourceProject = "/Users/franktip/sabbatical/projects/countries-and-timezones"; 
export const promptTemplateFileName = "./test/input/promptTemplate.hb";
export const rulesFileName = "./test/input/rules.json";
export const mockModelDir =  "./test/input/mockModel";
export const outputDir = "./test/temp_output";


export function findExpectedPrompts(promptDir: string) {
  const expectedPrompts = new Set<string>();
  const expectedPromptFiles = fs.readdirSync(promptDir);
  for (const expectedPromptFile of expectedPromptFiles) {

    // if the file matches 'prompt_*.txt' then add it to the set of expected prompts
    if (expectedPromptFile.indexOf("completion") === -1) {
      expectedPrompts.add(fs.readFileSync("./test/input/prompts/" + expectedPromptFile, "utf8"));
    }

  }
  return expectedPrompts;
}