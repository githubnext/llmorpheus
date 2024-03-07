const fs = require('fs');

function generateReport(title, dirName, mutantsDirName){
  let report;
  if (!mutantsDirName) {
    report = `# ${title}\n`
    report += '| Project | #Mutants | #Killed | #Survived | #Timeout | MutationScore | Time |\n';
    report += '|:--------|:---------|:--------|:----------|----------|---------------|------|\n';
  } else {
    const llmData = fs.readFileSync(`${mutantsDirName}/${benchmark}/summary.json`, 'utf8');
    const llmJsonObj = JSON.parse(llmData);
    const modelName = llmJsonObj.metaInfo.modelName;
    const temperature = llmJsonObj.metaInfo.temperature;
    const maxTokens = llmJsonObj.metaInfo.maxTokens;
    const templateName = llmJsonObj.metaInfo.templateName || "N/A";
    report = `# ${title}\n`
    report += `## Model: ${modelName}\n`;
    report += `## Temperature: ${temperature}\n`;
    report += `## Max Tokens: ${maxTokens}\n`;
    report += `## Template: ${templateName}\n`;
    report += '| Project | #Prompts | #Mutants | #Killed | #Survived | #Timeout | MutationScore | Time |\n';
    report += '|:--------|:---------|:---------|:--------|:----------|----------|---------------|------|\n';
  }  
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
    if (!mutantsDirName) {
      report += `| ${benchmark} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${time} |\n`;
    } else {
      const llmData = fs.readFileSync(`${mutantsDirName}/${benchmark}/summary.json`, 'utf8');
      const llmJsonObj = JSON.parse(llmData);
      const nrPrompts = parseInt(llmJsonObj.nrSyntacticallyValid);
      report += `| ${benchmark} | ${nrPrompts} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${time} |\n`;
    }
  }
  console.log(report);
}  

const title = process.argv[2];
const dirName = process.argv[3];
const mutantsDirName = process.argv[4];
generateReport(title, dirName, mutantsDirName);