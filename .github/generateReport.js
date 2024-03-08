const fs = require('fs');

function generateReport(title, dirName, mutantsDirName){
  let report;
  if (!mutantsDirName) {
    report = `# ${title}\n`
    report += '| Project | #Mutants | #Killed | #Survived | #Timeout | MutationScore | Time |\n';
    report += '|:--------|:---------|:--------|:----------|----------|---------------|------|\n';
  } else {
    const metaData = retrieveMetaData(mutantsDirName);
    report = `# ${title}\n`
    report += `## Model: ${metaData.modelName}\n`;
    report += `## Temperature: ${metaData.temperature}\n`;
    report += `## Max Tokens: ${metaData.maxTokens}\n`;
    report += `## Template: ${metaData.template.substring(metaData.template.lastIndexOf('/')+1)}\n`;
    report += "\n";
    report += '| Project | #Prompts | #Mutants | #Killed | #Survived | #Timeout | MutationScore | LLMorpheus Time | Stryker Time |\n';
    report += '|:--------|:---------|:---------|:--------|:----------|----------|---------------|-----------------|--------------|\n';
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
    const strykerTime = jsonObj.time;
    if (!mutantsDirName) {
      report += `| ${benchmark} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${strykerTime} |\n`;
    } else {
      const llmData = fs.readFileSync(`${mutantsDirName}/${benchmark}/summary.json`, 'utf8');
      const llmJsonObj = JSON.parse(llmData);
      const nrPrompts = parseInt(llmJsonObj.nrPrompts);
      
      // real time appears at the second to last line of the output
      const llmOutput = fs.readFileSync(`${mutantsDirName}/${benchmark}/LLMorpheusOutput.txt`, 'utf8');
      const lines = llmOutput.split('\n');
      const llmorpheusTime = lines[lines.length-4].substring(5).trim();
      report += `| ${benchmark} | ${nrPrompts} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${llmorpheusTime} | ${strykerTime} |\n`;
    }
  }
  console.log(report);
}  

function retrieveMetaData(mutantsDirName){
  const files = fs.readdirSync(mutantsDirName);
  const benchmark = files[0];
  const data = fs.readFileSync(`${mutantsDirName}/${benchmark}/summary.json`, 'utf8');
  const jsonObj = JSON.parse(data);
  return {
    modelName: jsonObj.metaInfo.modelName,
    temperature: jsonObj.metaInfo.temperature,
    maxTokens: jsonObj.metaInfo.maxTokens,
    template: jsonObj.metaInfo.template
  }
}

const title = process.argv[2];
const dirName = process.argv[3];
const mutantsDirName = process.argv[4];
generateReport(title, dirName, mutantsDirName);