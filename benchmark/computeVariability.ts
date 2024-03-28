import fs from 'fs';
import path from 'path';

const projectNames = ['Complex.js', 'countries-and-timezones', 'crawler-url-parser', 'delta', 'image-downloader', 'node-dirty', 'node-geo-point', 'node-jsonfile', 'plural', 'pull-stream', 'q', 'spacl-core', 'zip-a-folder']; 

function retrieveMutants(baseDir: string, run: string, projectName: string) : Set<string> {
  const data = fs.readFileSync(path.join(baseDir, run, 'projects', projectName, 'mutants.json'), "utf8");
  return new Set(JSON.parse(data).map((x: any) => JSON.stringify(x)));
}

const runToMutants = new Map<string, Set<string>>();

function analyzeMutants(baseDir: string, runs: string[], projectName: string) : void {
  const allMutants = new Set<string>();
  for (const run of runs) {
    runToMutants.set(run, retrieveMutants(baseDir, run, projectName));
    for (const mutant of runToMutants.get(run)!) {
      allMutants.add(mutant);
    }
  }
  const allMutantsSize = allMutants.size;
  const minMutants = Math.min(...runs.map(run => runToMutants.get(run)!.size));
  const maxMutants = Math.max(...runs.map(run => runToMutants.get(run)!.size));
  
  // determine how many mutants are common to all files
  let commonMutants = new Set<string>();
  for (const mutant of allMutants) {
    let isCommon = true;
    for (const fileName of runs) {
      if (!runToMutants.get(fileName)!.has(mutant)) {
        isCommon = false;
        break;
      }
    }
    if (isCommon) {
      commonMutants.add(mutant);
    }
  }

  // print observed values for all runs like this: run1->100, run2->200, run3->300
  
  console.log(`${projectName}:`);
  let report = ''
  for (const run of runs) {
    report += `  ${run}->${runToMutants.get(run)!.size} `;
  }
  console.log(`  ${report}`);
  console.log(`  min number of mutants in any run: ${minMutants}`);
  console.log(`  max number of mutants in any run: ${maxMutants}`);
  console.log(`  total number of mutants: ${allMutantsSize}`);
  console.log(`  number of mutants common to all runs: ${commonMutants.size}`);
  const percentage = commonMutants.size / allMutantsSize;
  // print the percentage of mutants that are common to all runs, format as XX.YY% with two decimal places
  console.log(`  percentage of mutants common to all runs: ${(percentage * 100).toFixed(2)}%`);


}
 
// usage: node benchmark/computeVariability.js <baseDir> <list of subdirs

const baseDir = process.argv[2];
const runs = process.argv.slice(3);
for (const projectName of projectNames) {
  analyzeMutants(baseDir, runs, projectName);
}