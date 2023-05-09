import { expect } from "chai";
import fs from "fs";
import { Rule } from "../src/rule";
import { PromptGenerator } from "../src/prompt";
 

const sourceFileName = "./test/input/countriesandtimezones_index.js";
const promptTemplateFileName = "./test/input/promptTemplate.hb";
const rulesFileName = "./test/input/rules.json";

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
    console.log(`sourceFileName: ${sourceFileName}`);
    const promptGenerator = new PromptGenerator(promptTemplateFileName);
    const rule = rules[0];
    sourceFile = fs.readFileSync(sourceFileName, "utf8");
    const actualPrompt = promptGenerator.createPrompt(sourceFile, rule).getText();
    const expectedPrompt = fs.readFileSync("./test/output/expectedPrompt1.txt", "utf8");
    const diff = actualPrompt.split("\n").filter((line, index) => line !== expectedPrompt.split("\n")[index]);
    expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  });

  it("should be able to create prompt from given a source file, prompt template and rule 2", async () => {
    console.log(`sourceFileName: ${sourceFileName}`);
    const promptGenerator = new PromptGenerator(promptTemplateFileName);
    const rule = rules[1];
    sourceFile = fs.readFileSync(sourceFileName, "utf8");
    const actualPrompt = promptGenerator.createPrompt(sourceFile, rule).getText();
    const expectedPrompt = fs.readFileSync("./test/output/expectedPrompt2.txt", "utf8");
    const diff = actualPrompt.split("\n").filter((line, index) => line !== expectedPrompt.split("\n")[index]);
    expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  }); 
});
