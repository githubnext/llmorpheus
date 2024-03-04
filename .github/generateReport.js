const fs = require('fs');

function generateReport(title, dirName){
  const report = `
# ${title}
Project | # Mutants | # Killed | # Survived | # Timeout |  # Mutation Score | # Time | --:|`;
  const files = fs.readdirSync(dirName);
  const benchmarks = files.filter(file => file.endsWith('.json'));
  const reportData = benchmarks.map(benchmark => {
    const data = fs.readFileSync(`${dirName}/${StrykerInfo.json}`, 'utf8');
    const jsonObj = JSON.parse(data);
    report  += `${benchmark} | ${jsonObj.totalKilled + jsonObj.totalSurvived + jsonObj.totalTimedOut} | ${jsonObj.totalKilled} | ${jsonObj.totalSurvived} | ${jsonObj.totalTimedOut} | ${jsonObj.totalMutationScore} | ${jsonObj.totalTime} |`;
  });
  console.log(report);
}  


const dirName = process.argv[2];
generateReport("Report", dirName);