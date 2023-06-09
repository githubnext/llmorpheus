import { expect } from "chai";
import fs from "fs";
import path from "path";
import { IRuleFilter, Rule } from "../src/rule";
import { MutantGenerator } from "../src/mutantGenerator";
import { MockModel } from "../src/model";
import { Mutant } from "../src/mutant";
import { Completion, Prompt } from "../src/prompt";
import { findExpectedCompletions, mockModelDir, outputDir, promptTemplateFileName, rulesFileName, testProjectPath } from "./testUtils";

describe("test mutant generation", () => {

  it("should find the source files to mutate", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);
    let sourceFiles = await generator.findSourceFilesToMutate(testProjectPath);
    sourceFiles = sourceFiles.map((sourceFile) => sourceFile.substring(testProjectPath.length + 1));

    // sourceFiles should be equal to ['src/build-country.js','src/build-timezone.js','src/index.js']
    expect(sourceFiles.length).to.equal(3);
    expect(sourceFiles).to.have.members(['src/build-country.js','src/build-timezone.js','src/index.js']);
  });

  it("should be able to get completions from the mockModel", async () => {
    const model = new MockModel('text-davinci-003', mockModelDir);

    // for prompt_0, the model should return 1 completion, namely prompt_0_completion0.txt
    const prompt0 = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_0.json`, "utf8")));
    const completions = await model.query(prompt0.getText());
    expect(completions.size).to.equal(1);
    const actualCompletion = completions.values().next().value;
    const expectedCompletion = fs.readFileSync(`./test/input/prompts/prompt_0_completion_0.txt`, "utf8");
    expect(actualCompletion).to.equal(expectedCompletion);

    // for prompt_13, the mockModel should return prompt_3_completion18.txt and prompt_3_completion19.txt
    const prompt13 = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_13.json`, "utf8")));
    const completions13 = await model.query(prompt13.getText());
    expect(completions13.size).to.equal(2);
    const iterator = completions13.values();
    const actualCompletion1 = iterator.next().value;
    const actualCompletion2 = iterator.next().value;
    const expectedCompletion1 = fs.readFileSync(`./test/input/prompts/prompt_13_completion_18.txt`, "utf8");
    const expectedCompletion2 = fs.readFileSync(`./test/input/prompts/prompt_13_completion_19.txt`, "utf8");
    expect(actualCompletion1).to.equal(expectedCompletion1);
    expect(actualCompletion2).to.equal(expectedCompletion2);
  });

  it("should generate the expected completions for each prompt in the sample project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);

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

  it("should be able to extract mutants from completions for prompt", async () => {
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);
    const expectedCompletions = findExpectedCompletions(promptNr);
    expect(expectedCompletions.size).to.equal(2);
    const allMutants = [];
    for (const completion of expectedCompletions) {
      const mutants = generator.extractMutantsFromCompletion(prompt, completion);
      allMutants.push(...mutants);
    }
    fs.writeFileSync(outputDir + '/mutantsForPrompt13.json', JSON.stringify(allMutants, null, 2));
    expect(allMutants.length).to.equal(3);
    const actualMutants = JSON.stringify(allMutants, null, 2);
    const expectedMutants = fs.readFileSync(`./test/input/mutantsForPrompt13.json`, "utf8");
    expect(actualMutants).to.equal(expectedMutants);
  });

  it("should be able to filter out useless mutants", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));

    const expectedMutants = JSON.parse(fs.readFileSync(`./test/input/filteredMutantsForPrompt13.json`, "utf8"));
    const mutants = expectedMutants.map((jsonObj: any) => Mutant.fromJSON(jsonObj));
    const origCode = fs.readFileSync(path.join(generator.getProjectPath(), prompt.getFileName()), "utf8");
    const filteredMutants = generator.filterMutants(prompt.getFileName(), prompt.getChunkNr(), prompt.getRule(), mutants, origCode);
    // fs.writeFileSync(outputDir + '/filteredMutantsForPrompt13.json', JSON.stringify(filteredMutants, null, 2));
    expect(JSON.stringify(filteredMutants)).to.equal(JSON.stringify(expectedMutants));
  });

  it("should be able to generate the expected mutants for a test project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);
    await generator.generateMutants(testProjectPath);
    const actualMutants = fs.readFileSync(outputDir + '/mutants.json', 'utf8');
    const expectedMutants = fs.readFileSync('./test/input/mutants.json', 'utf8');
    expect(actualMutants.length).to.equal(expectedMutants.length);
    expect(actualMutants).to.equal(expectedMutants);
   });

});