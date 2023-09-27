import * as fs from "fs";



function printReport(
  title: string,
  modelName: string
) {
    console.log(`
# ${title}
## ${modelName}
| Project | # NrCandidates | # NrMutants | # NrLocations |
| :------ |  ------------: | ----------: | ------------: |`);

    // console.log(`dirName: ${dirName}, type: ${typeof dirName}`);
    const results = fs.readdirSync(dirName);
    for (const benchmarkName of results){
      if (benchmarkName.startsWith(".")) continue;
      // console.log(`benchmarkName: ${benchmarkName}, type: ${typeof benchmarkName}`);
      // read summary.json file in benchmarkName/MUTATION_TESTING
      const file = fs.readFileSync(`${dirName}/${benchmarkName}/MUTATION_TESTING/summary.json`, "utf8");
      // console.log(`file: ${file}, type: ${typeof file}`);
      const summary = JSON.parse(file);
      const nrCandidates = summary.nrCandidates;
      const nrSyntacticallyInvalid = summary.nrSyntacticallyInvalid;
      const nrSyntacticallyValid = summary.nrSyntacticallyValid;
      const nrIdentical = summary.nrIdentical;
      const nrDuplicate = summary.nrDuplicate;
      const nrLocations = summary.nrLocations;
      console.log(
        `${benchmarkName} | ${nrCandidates} | ${nrSyntacticallyValid} | ${nrLocations}`);
    }
  }

const dirName = process.argv[2]; // read dirName from command line
const modelName = process.argv[3]; // read modelName from command line
printReport("Mutant Generation Report", modelName);