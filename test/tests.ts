import fs from "fs";
import {
  mockModelDir,
  outputDir,
  promptTemplateFileName,
  sourceFileName,
  testProjectPath,
} from "./testUtils";
import { MockModel } from "../src/model";
import { PromptSpec, PromptSpecGenerator } from "../src/promptSpecGenerator";
import { MutantGenerator } from "../src/mutantGenerator";
import { expect } from "chai";
import { assert } from "console";
import path from "path";

let sourceFile = "";

before(() => {
  sourceFile = fs.readFileSync(sourceFileName, "utf8");
});

describe("test prompt crafting", () => {
  it("should generate the expected PromptSpecs for a given source file and prompt template", async () => {
    const files = [sourceFileName];
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      "./test/input/"
    );
    const actualPromptSpecs = await promptSpecGenerator.getPromptSpecs();
    expect(actualPromptSpecs.length).to.equal(71);
    promptSpecGenerator.writePromptFiles("./test/actual");
    const actualPromptSpecsAsJson = fs.readFileSync(
      "./test/actual/promptSpecs.json",
      "utf8"
    );
    const expectedPromptSpecsAsJson = fs.readFileSync(
      "./test/expected/promptSpecs/promptSpecs.json",
      "utf8"
    );
    expect(actualPromptSpecsAsJson).to.equal(expectedPromptSpecsAsJson);
  });

  it("should generate the expected prompts for a given source file and prompt template", async () => {
    const files = [sourceFileName];
    const promptSpecGenerator = new PromptSpecGenerator(
      files,
      promptTemplateFileName,
      "./test/input/"
    );
    promptSpecGenerator.writePromptFiles("./test/actual");
    // check that actual and expected directories contain the same files
    const actualPrompts = fs.readdirSync("./test/actual/prompts");
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
        `./test/actual/prompts/${promptFileName}`,
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
  });

  it("should find the source files to be mutated in a given source project", async () => {
    const model = new MockModel("text-davinci-003", mockModelDir);
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
    fs.writeFileSync("./test/actual/sourceFiles.txt", actualSourceFilesJson);
    // compare actual source files to expected source files
    const expectedSourceFiles = fs.readFileSync(
      "./test/expected/sourceFiles.txt",
      "utf8"
    );
    expect(actualSourceFilesJson).to.equal(expectedSourceFiles);
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
  });

  // it("should generate the expected prompts for a given source project", async () => {
  //   const ruleFilter : IRuleFilter = (value: string) : boolean => true;
  //   const model = new MockModel('text-davinci-003', mockModelDir);
  //   const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir, testProjectPath);
  //   const promptGenerator = new PromptGenerator(promptTemplateFileName);
  //   const sourceFileNames = await generator.findSourceFilesToMutate(testProjectPath);
  //   const actualPrompts = new Set<Prompt>();
  //   let promptCnt = 0;
  //   for (const sourceFileName of sourceFileNames){
  //     const sourceCode = fs.readFileSync(sourceFileName, "utf8");
  //     const chunks = generator.createChunks(sourceCode);
  //     for (let chunkNr=0; chunkNr < chunks.length; chunkNr++ ){
  //       const chunk = chunks[chunkNr];
  //       let ruleCnt = rules.length;
  //       for (let ruleNr=0; ruleNr < ruleCnt; ruleNr++){
  //         const rule = rules[ruleNr];
  //         if (generator.chunkContainsTerminals(chunk, rule.getLHSterminals())){
  //           const prompt = promptGenerator.createPrompt(promptCnt++, sourceFileName, chunkNr, chunk, rule);
  //           actualPrompts.add(prompt);
  //           fs.writeFileSync(`./test/temp_output/prompts/prompt_${prompt.getId()}.json`, JSON.stringify(prompt));
  //         }
  //       }
  //     }
  //   }

  //   // check that actual prompts match expected prompts
  //   const expectedPrompts = findExpectedPrompts(expectedPromptsDir);
  //   expect(actualPrompts.size).to.equal(expectedPrompts.size);
  //   const diff = [...actualPrompts].filter((prompt) => !setContainsPrompt(expectedPrompts, prompt));
  //   expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  // });
});
