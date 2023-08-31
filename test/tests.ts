import fs from "fs";

import { MockModel } from "../src/model";
import { PromptSpecGenerator } from "../src/promptSpecGenerator";
import { MutantGenerator } from "../src/mutantGenerator";
import { expect } from "chai";
import { assert } from "console";
import path from "path";

const mockModelDir = "./test/input/mockModel";
const testProjectPath = "./test/input/testProject/countries-and-timezones";
const promptTemplateFileName = "./test/input/newTemplate.hb";
const sourceFileName = "./test/input/countriesandtimezones_index.js";
 
describe("test mutant generation", () => {
  it("should generate the expected PromptSpecs for a given source file and prompt template", async () => {
    const files = [sourceFileName];
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      "./test/input/",
      outputDir
    );
    const actualPromptSpecs = await promptSpecGenerator.getPromptSpecs();
    expect(actualPromptSpecs.length).to.equal(71);
    promptSpecGenerator.writePromptFiles();
    const actualPromptSpecsAsJson = fs.readFileSync(
      path.join(promptSpecGenerator.getOutputDir(),'promptSpecs.json'),
      "utf8"
    );
    const expectedPromptSpecsAsJson = fs.readFileSync(
      "./test/expected/promptSpecs/promptSpecs.json",
      "utf8"
    );
    expect(actualPromptSpecsAsJson).to.equal(expectedPromptSpecsAsJson);
    fs.rmdirSync(outputDir, { recursive: true });
  });

  it("should generate the expected prompts for a given source file and prompt template", async () => {
    const files = [sourceFileName];
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      "./test/input/",
      outputDir
    );
    promptSpecGenerator.writePromptFiles();
    // check that actual and expected directories contain the same files
    const actualPrompts = fs.readdirSync(path.join(outputDir, "prompts"));
    const expectedPrompts = fs.readdirSync("./test/expected/prompts");
    expect(actualPrompts.length).to.equal(expectedPrompts.length);
    const inActualButNotInExpected = actualPrompts.filter(
      (fileName) => !expectedPrompts.includes(fileName)
    );
    expect(
      inActualButNotInExpected,
      `expected ${inActualButNotInExpected.join(",")} to be empty`
    ).to.be.empty;
    const inExpectedButNotInActual = expectedPrompts.filter(
      (fileName) => !actualPrompts.includes(fileName)
    );
    expect(
      inExpectedButNotInActual,
      `expected ${inExpectedButNotInActual.join(",")} to be empty`
    ).to.be.empty;

    // check that actual prompts match expected prompts
    for (const promptFileName of actualPrompts) {
      const actualPrompt = fs.readFileSync(
        path.join(outputDir, 'prompts', promptFileName),
        "utf8"
      );
      const expectedPrompt = fs.readFileSync(
        `./test/expected/prompts/${promptFileName}`,
        "utf8"
      );
      const actualLines = actualPrompt.split("\n");
      const expectedLines = expectedPrompt.split("\n");
      expect(actualLines.length).to.equal(expectedLines.length);
      for (let i = 0; i < actualLines.length; i++) {
        expect(actualLines[i]).to.equal(
          expectedLines[i],
          `expected line ${i} in ${promptFileName} to be\n\t${expectedLines[i]}\nbut was\n\t${actualLines[i]}`
        );
      }
    }
    fs.rmdirSync(outputDir, { recursive: true });
  });

  it("should find the source files to be mutated in a given source project", async () => {
    const model = new MockModel("text-davinci-003", mockModelDir);
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const mutantGenerator = new MutantGenerator(
      model,
      promptTemplateFileName,
      outputDir,
      testProjectPath
    );
    const actualSourceFiles = await mutantGenerator.findSourceFilesToMutate(
      testProjectPath
    );
    // strip off the testProjectPath prefix from the actual source files
    const actualSourceFilesWithoutTestProjectPath = actualSourceFiles.map(
      (sourceFile) => sourceFile.replace(testProjectPath, "")
    );
    const actualSourceFilesJson = JSON.stringify(
      actualSourceFilesWithoutTestProjectPath,
      null,
      2
    );
    fs.writeFileSync(path.join(outputDir, "sourceFiles.txt"), actualSourceFilesJson);
    // compare actual source files to expected source files
    const expectedSourceFiles = fs.readFileSync(
      "./test/expected/sourceFiles.txt",
      "utf8"
    );
    expect(actualSourceFilesJson).to.equal(expectedSourceFiles);
    fs.rmdirSync(outputDir, { recursive: true });
  });

  it("mock model should generate the expected completion for a prompt", async () => {
    const prompt1 = fs.readFileSync("test/input/prompts/prompt1.txt", "utf8");
    // console.log(`prompt1:\n${prompt1}\n`);
    const model = new MockModel("text-davinci-003", mockModelDir);
    const completions = await model.query(prompt1);
    assert(completions.size === 1);
    const expectedCompletion = fs.readFileSync(
      "test/expected/prompt1_completion_0.txt",
      "utf8"
    );
    assert([...completions][0] === expectedCompletion);
  });

  it("should generate the expected mutants for a project", async () => {
    const model = new MockModel("text-davinci-003", mockModelDir);
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    // remove old mutants.json file if it exists
    const mutantsJsonFileName = path.join(
      testProjectPath,
      "MUTATION_TESTING",
      "mutants.json"
    );
    if (fs.existsSync(mutantsJsonFileName)) {
      console.log(`removing old ${mutantsJsonFileName}`);
      fs.unlinkSync(mutantsJsonFileName);
    }

    const mutantGenerator = new MutantGenerator(
      model,
      promptTemplateFileName,
      outputDir,
      testProjectPath
    );
    await mutantGenerator.generateMutants(testProjectPath);
    const actualMutantsJson = fs.readFileSync(
      path.join(testProjectPath, "MUTATION_TESTING", "mutants.json"),
      "utf8"
    );
    const expectedMutantsJson = fs.readFileSync(
      "./test/expected/mutants.json",
      "utf8"
    );
    assert(actualMutantsJson === expectedMutantsJson);
    fs.rmdirSync(outputDir, { recursive: true });
  });

  
});
