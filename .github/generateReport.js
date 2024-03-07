const fs = require('fs');

function generateReport(title, dirName){
  console.log(`** title = ${title}`);
  console.log(`** dirName = ${dirName}`);

  let report = `# ${title}\n`
  report += '| Project | #Mutants | #Killed | #Survived | #Timeout | MutationScore | Time |\n';
  report += '|:--------|:---------|:--------|:----------|----------|---------------|------|\n';

  const files = fs.readdirSync(dirName);
  for (const benchmark of files) {  
    const data = fs.readFileSync(`${dirName}/${benchmark}/StrykerInfo.json`, 'utf8');
    const jsonObj = JSON.parse(data);
    const nrKilled = parseInt(jsonObj.nrKilled);
    const nrSurvived = parseInt(jsonObj.nrSurvived);
    const nrTimedOut = parseInt(jsonObj.nrTimedOut);
    const nrTotal = nrKilled + nrSurvived + nrTimedOut;
    const mutationScore = parseFloat(jsonObj.mutationScore);
    const time = jsonObj.time;
    report += `| ${benchmark} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${time} |\n`;
  }
  console.log(report);
}  

const title = process.argv[2];
const dirName = process.argv[3];
generateReport(title, dirName);