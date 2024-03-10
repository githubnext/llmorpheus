import fs from "fs";
import path from "path";

import { MockModel } from "../src/model/MockModel";
import { PromptSpecGenerator } from "../src/generator/PromptSpecGenerator";
import { MetaInfo, MutantGenerator } from "../src/generator/MutantGenerator";
import { expect } from "chai";
import { assert } from "console";

const mockModelDir = "test/input/mockModel";
const testFilePath = "test/input";
const testProjectPath = "test/input/testProject/countries-and-timezones";
const promptTemplateFileName = "./templates/template1.hb";
const sourceFileName = "countriesandtimezones_index.js";
const modelName = "codellama-34b-instruct";
const subDirName = "template1_codellama-34b-instruct_0";

describe("test mutant generation", () => {
  it("should generate the expected PromptSpecs for a given source file and prompt template", async () => {
    const files = [sourceFileName];
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    fs.mkdirSync(path.join(outputDir, subDirName));
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      testFilePath,
      outputDir,
      subDirName,
    );
    const actualPromptSpecs = await promptSpecGenerator.getPromptSpecs();
    expect(actualPromptSpecs.length).to.equal(71);
    promptSpecGenerator.writePromptFiles();
    const actualPromptSpecsAsJson = fs.readFileSync(
      path.join(promptSpecGenerator.getOutputDir(), subDirName, "promptSpecs.json"),
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
    fs.mkdirSync(path.join(outputDir, subDirName));
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      "./test/input/",
      outputDir,
      subDirName
    );
    promptSpecGenerator.writePromptFiles();
    // check that actual and expected directories contain the same files
    const actualPrompts = fs.readdirSync(path.join(outputDir, subDirName, "prompts"));
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
        path.join(outputDir, subDirName, "prompts", promptFileName),
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
    const model = new MockModel(modelName, mockModelDir);
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const metaInfo : MetaInfo = {
      modelName: modelName,
      template: promptTemplateFileName,
      maxTokens: 250,
      temperature: 0,
      maxNrPrompts: 100,
      nrAttempts: 1,
      mutate: "./src/**.js",
      ignore: "",
      rateLimit: 1000,
      benchmark: false
    }
    const mutantGenerator = new MutantGenerator(
      model,
      path.join(outputDir, subDirName),
      testProjectPath,
      metaInfo
    );
    const actualSourceFiles = await mutantGenerator.findSourceFilesToMutate();
    console.log(`actualSourceFiles: ${actualSourceFiles}`);
    // strip off the testProjectPath prefix from the actual source files
    const actualSourceFilesWithoutTestProjectPath = actualSourceFiles.map(
      (sourceFile) => sourceFile.replace(testProjectPath, "")
    );
    const actualSourceFilesJson = JSON.stringify(
      actualSourceFilesWithoutTestProjectPath,
      null,
      2
    );
    fs.writeFileSync(
      path.join(outputDir, subDirName, "sourceFiles.txt"),
      actualSourceFilesJson
    );
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
    const model = new MockModel(modelName, mockModelDir);

    // use the same options that were used to generate the MockModel
    const queryResult = await model.query(prompt1);
    const completions = queryResult.completions;
    expect(completions.size).to.equal(1);
    const expectedCompletion = fs.readFileSync(
      "test/expected/prompt1_completion_0.txt",
      "utf8"
    );
    const actualCompletion = [...completions][0];
    expect(actualCompletion).to.equal(expectedCompletion);
  });

  it("should generate the expected mutants for a project", async () => {
    const model = new MockModel(modelName, mockModelDir);
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const metaInfo : MetaInfo = {
      modelName: modelName,
      template: promptTemplateFileName,
      maxTokens: 250,
      temperature: 0,
      maxNrPrompts: 100,
      nrAttempts: 1,
      mutate: "src/**.js",
      ignore: "",
      rateLimit: 1000,
      benchmark: false
    }
    const mutantGenerator = new MutantGenerator(
      model,
      outputDir,
      testProjectPath,
      metaInfo
    );
    await mutantGenerator.generateMutants();
    const actualMutantsJson = fs.readFileSync(
      path.join(outputDir, subDirName, "mutants.json"),
      "utf8"
    );
    const expectedMutantsJson = fs.readFileSync(
      "./test/expected/mutants.json",
      "utf8"
    );
    expect(actualMutantsJson).to.equal(expectedMutantsJson);
    fs.rmdirSync(outputDir, { recursive: true });
  });

  it("should produce a file summary.json containing a summary of the results", async () => {
    const model = new MockModel(modelName, mockModelDir);
    const outputDir = fs.mkdtempSync(path.join(".", "test-"));
    const metaInfo : MetaInfo = {
      modelName: modelName,
      template: promptTemplateFileName,
      maxTokens: 250,
      temperature: 0,
      maxNrPrompts: 100,
      nrAttempts: 1,
      mutate: "src/**.js",
      ignore: "",
      rateLimit: 1000,
      benchmark: false
    }
    const mutantGenerator = new MutantGenerator(
      model,
      outputDir,
      testProjectPath,
      metaInfo
    );
    await mutantGenerator.generateMutants();
    const actualSummaryJson = fs.readFileSync(
      path.join(outputDir, subDirName, "summary.json"),
      "utf8"
    );
    const expectedSummaryJson = fs.readFileSync(
      "./test/expected/summary.json",
      "utf8"
    );
    fs.writeFileSync("actualSummary.json", actualSummaryJson);
    // assert(actualSummaryJson === expectedSummaryJson);

    expect(actualSummaryJson).to.equal(expectedSummaryJson);
    fs.rmdirSync(outputDir, { recursive: true });
  });
});
