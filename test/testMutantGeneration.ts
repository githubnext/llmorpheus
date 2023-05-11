import { expect } from "chai";
import fs from "fs";
import { IRuleFilter, Rule } from "../src/rule";
import { MutantGenerator } from "../src/mutantGenerator";
import { MockModel } from "../src/model";
 
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
  

  // it("should be able to generate mutants using rule 2", async () => {
  //   const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    
  //   // remove outputDir if it exists
  //   if (fs.existsSync(outputDir)) {
  //     fs.rmdirSync(outputDir, { recursive: true });
  //   }

  //   const model = new MockModel('text-davinci-003', mockModelDir);
  //   const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
  //   await generator.generateMutants(sourceProject);
  //   const actualMutants = JSON.stringify(fs.readFileSync(outputDir + '/mutants.json', 'utf8'));
  //   const expectedMutants = JSON.stringify(fs.readFileSync('./test/output/expectedMutants.json', 'utf8'));
  //   const diff = actualMutants.split("\n").filter((line, index) => line !== expectedMutants.split("\n")[index]);
  //   expect(diff, `expected ${diff.join(',')} to be empty`).to.be.empty;
  // });
});