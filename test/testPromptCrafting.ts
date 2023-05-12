import { expect } from "chai";
import fs from "fs";
import { IRuleFilter, Rule } from "../src/rule";
import { PromptGenerator } from "../src/prompt";
import { MutantGenerator } from "../src/mutantGenerator";
import { MockModel } from "../src/model";
 

const sourceFileName = "./test/input/countriesandtimezones_index.js";
const sourceProject = "/Users/franktip/sabbatical/projects/countries-and-timezones"; 
const promptTemplateFileName = "./test/input/promptTemplate.hb";
const rulesFileName = "./test/input/rules.json";
const mockModelDir =  "./test/input/mockModel";
const outputDir = "./test/temp_output";
const expectedPromptsDir = "./test/input/prompts"

let sourceFile = "";
let promptTemplate = "";
let rules : Rule[] = [];

before(() => {
  sourceFile = fs.readFileSync(sourceFileName, "utf8");
  promptTemplate = fs.readFileSync(promptTemplateFileName, "utf8");
  rules = JSON.parse(fs.readFileSync(rulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));
});

describe("test prompt crafting", () => {
  it("should be able to create prompt from given a source file, prompt template and rule 1", async () => {
    const promptGenerator = new PromptGenerator(promptTemplateFileName);
    const rule = rules[0];
    sourceFile = fs.readFileSync(sourceFileName, "utf8");
    const actualPrompt = promptGenerator.createPrompt(sourceFileName, 0, sourceFile, rule).getText();
    const expectedPrompt = fs.readFileSync("./test/output/expectedPrompt1.txt", "utf8");
    const diff = actualPrompt.split("\n").filter((line, index) => line !== expectedPrompt.split("\n")[index]);
    expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  });

  it("should be able to create prompt from given a source file, prompt template and rule 2", async () => {
    const promptGenerator = new PromptGenerator(promptTemplateFileName);
    const rule = rules[1];
    sourceFile = fs.readFileSync(sourceFileName, "utf8");
    const actualPrompt = promptGenerator.createPrompt(sourceFileName, 0, sourceFile, rule).getText();
    const expectedPrompt = fs.readFileSync("./test/output/expectedPrompt2.txt", "utf8");
    const diff = actualPrompt.split("\n").filter((line, index) => line !== expectedPrompt.split("\n")[index]);
    expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  }); 

  it("should generate the expected prompts for a given source project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    const promptGenerator = new PromptGenerator(promptTemplateFileName);
    const sourceFileNames = await generator.findSourceFilesToMutate(sourceProject);
    const actualPrompts = new Set<string>();
    let promptCnt = 0;
    for (const sourceFileName of sourceFileNames){
      const sourceCode = fs.readFileSync(sourceFileName, "utf8");
      const chunks = generator.createChunks(sourceCode);
      for (let chunkNr=0; chunkNr < chunks.length; chunkNr++ ){
        const chunk = chunks[chunkNr];
        let ruleCnt = rules.length;
        for (let ruleNr=0; ruleNr < ruleCnt; ruleNr++){
          const rule = rules[ruleNr];
          if (generator.chunkContainsTerminals(chunk, rule.getLHSterminals())){
            const prompt = promptGenerator.createPrompt(sourceFileName, chunkNr, chunk, rule).getText();
            actualPrompts.add(prompt);
            fs.writeFileSync(`./test/temp_output/prompts/prompt_${promptCnt++}.txt`, prompt);
          }
        }
      }
    }

    // check that actual prompts match expected prompts
    const expectedPrompts = findExpectedPrompts(expectedPromptsDir);
    expect(actualPrompts.size).to.equal(expectedPrompts.size);
    const diff = [...actualPrompts].filter((prompt) => !expectedPrompts.has(prompt));
    expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  });
});

function findExpectedPrompts(promptDir: string) {
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

