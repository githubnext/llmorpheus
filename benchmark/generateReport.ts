import * as fs from "fs";

// read dirName from command line
const dirName = process.argv[2];
const title = "Mutant Generation Report";

let report = `
# ${title}
Project | # NrCandidates | # NrSyntacticallyInvalid | # NrIdentical | # NrDuplicate |  # NrSyntacticallyValid | # NrLocations 
--- |  --: | --: | --: | --: | --: |`;

console.log(`dirName: ${dirName}, type: ${typeof dirName}`);
const results = fs.readdirSync(dirName);
for (const benchmarkName of results){
  if (benchmarkName.startsWith(".")) continue;
  console.log(`benchmarkName: ${benchmarkName}, type: ${typeof benchmarkName}`);
  // read summary.json file in benchmarkName/MUTATION_TESTING
  const file = fs.readFileSync(`${dirName}/${benchmarkName}/MUTATION_TESTING/summary.json`, "utf8");
  console.log(`file: ${file}, type: ${typeof file}`);
  const summary = JSON.parse(file);
  const nrCandidates = summary.nrCandidates;
  const nrSyntacticallyInvalid = summary.nrSyntacticallyInvalid;
  const nrSyntacticallyValid = summary.nrSyntacticallyValid;
  const nrIdentical = summary.nrIdentical;
  const nrDuplicate = summary.nrDuplicate;
  const nrLocations = summary.nrLocations;
  report += `
${benchmarkName} | ${nrCandidates} | ${nrSyntacticallyInvalid} | ${nrIdentical} | ${nrDuplicate} | ${nrSyntacticallyValid} | ${nrLocations}`;
  // console.log(`${benchmarkName},${nrCandidates},${nrSyntacticallyInvalid},${nrSyntacticallyValid},${nrIdentical},${nrDuplicate},${nrLocations}`);
}
console.log(report);