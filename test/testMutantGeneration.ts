import { expect } from "chai";
import fs from "fs";
import { IRuleFilter, Rule } from "../src/rule";
import { MutantGenerator } from "../src/mutantGenerator";
import { MockModel } from "../src/model";
import { Mutant } from "../src/mutant";
import { Completion, Prompt, PromptGenerator } from "../src/prompt";
import { expectedPromptsDir, findExpectedCompletions, findExpectedPrompts, setContainsCompletion } from "./testUtils";
import { completion } from "yargs";
 
const promptTemplateFileName = "./test/input/promptTemplate.hb";
const rulesFileName = "./test/input/rules.json";
const mockModelDir =  "./test/input/mockModel";
const outputDir = "./test/temp_output";

const sourceProject = "/Users/franktip/sabbatical/projects/countries-and-timezones";
 
describe("test mutant generation", () => {

  it("should find the source files to mutate", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    let sourceFiles = await generator.findSourceFilesToMutate(sourceProject);
    sourceFiles = sourceFiles.map((sourceFile) => sourceFile.substring(sourceProject.length + 1));

    // sourceFiles should be equal to ['src/build-country.js','src/build-timezone.js','src/index.js']
    expect(sourceFiles.length).to.equal(3);
    expect(sourceFiles).to.include('src/build-country.js');
    expect(sourceFiles).to.include('src/build-timezone.js');
    expect(sourceFiles).to.include('src/index.js');
  });

  it("should generate the expected completions for each prompt in the sample project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);

    for (let promptNr = 0; promptNr <= 16; promptNr++){
      const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
      const actualCompletions = await generator.getCompletionsForPrompt(prompt);
      const expectedCompletions = findExpectedCompletions(promptNr);
      expect(actualCompletions.length).to.equal(expectedCompletions.size);
      const actualCompletionsText = actualCompletions.map((completion) => completion.getText());
      const expectedCompletionsText = [...expectedCompletions].map((completion) => completion.getText());
      expect(actualCompletionsText).to.have.members(expectedCompletionsText);
    }
  });

  it("should extract mutants from completions for prompt", async () => {
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    const expectedCompletions = findExpectedCompletions(promptNr);
    expect(expectedCompletions.size).to.equal(3);
    const allMutants = [];
    for (const completion of expectedCompletions) {
      const mutants = generator.extractMutantsFromCompletion(prompt, completion);
      allMutants.push(...mutants);
    }
    expect(allMutants.length).to.equal(5);
    // fs.writeFileSync(outputDir + '/mutantsForPrompt13.json', JSON.stringify(allMutants, null, 2));
    const actualMutants = JSON.stringify(allMutants, null, 2);
    const expectedMutants = fs.readFileSync(`./test/input/mutantsForPrompt13.json`, "utf8");
    expect(actualMutants).to.equal(expectedMutants);
  });

  it("filter useless mutants", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
    const expectedMutants = JSON.parse(fs.readFileSync(`./test/input/filteredMutantsForPrompt13.json`, "utf8"));
    const mutants = expectedMutants.map((jsonObj: any) => Mutant.fromJSON(jsonObj));
    const origCode = fs.readFileSync(prompt.getFileName(), "utf8");
    const filteredMutants = generator.postProcessMutants(prompt.getFileName(), prompt.getChunkNr(), prompt.getRule(), mutants, origCode);
    // fs.writeFileSync(outputDir + '/filteredMutantsForPrompt13.json', JSON.stringify(filteredMutants, null, 2));
    expect(JSON.stringify(filteredMutants)).to.equal(JSON.stringify(expectedMutants));
   });

  // TODO: write test for creating mutants.json file
    
  // it("should be able to generate mutants using all rules", async () => {
  //   const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    
  //   // remove outputDir if it exists
  //   if (fs.existsSync(outputDir)) {
  //     fs.rmdirSync(outputDir, { recursive: true });
  //   }

  //   const model = new MockModel('text-davinci-003', mockModelDir);
  //   const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
  //   await generator.generateMutants(sourceProject);
    
    


  //   const actualMutants = [];
  //   // const expectedMutants = JSON.parse(fs.readFileSync('./test/input/mutants.json', 'utf8')).split("\n");
  //   for (const jsonObj of JSON.parse(fs.readFileSync(outputDir + '/mutants.json', 'utf8'))) {
  //     actualMutants.push(Mutant.fromJSON(jsonObj));
  //   }

  //   const expectedMutants = [];
  //   for (const jsonObj of JSON.parse(fs.readFileSync('./test/input/mutants.json', 'utf8'))) {
  //     expectedMutants.push(Mutant.fromJSON(jsonObj));
  //   }

  //   const compare = (n1: number, n2: number) => {
  //     if (n1 < n2) {
  //       return -1;
  //     } else if (n1 > n2) {
  //       return 1;
  //     } else {
  //       return 0;
  //     }
  //   }

  //   // sort according to completionId using compare
  //   actualMutants.sort((m1, m2) => compare(m1.getCompletionId(), m2.getCompletionId()));
  //   expectedMutants.sort((m1, m2) => compare(m1.getCompletionId(), m2.getCompletionId()));
  //   expect(actualMutants.length).to.equal(expectedMutants.length);
  //   for (let i = 0; i < actualMutants.length; i++) {
  //      expect(actualMutants[i].getCompletionId()).to.equal(expectedMutants[i].getCompletionId());
  //   }

  // });
});