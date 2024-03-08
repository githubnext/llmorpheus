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
    report += `## Template: ${metaData.templateName}\n`;
    report += "\n";
    report += '| Project | #Prompts | #Mutants | #Killed | #Survived | #Timeout | MutationScore | Stryker Time | LLMorpheus Time |\n';
    report += '|:--------|:---------|:---------|:--------|:----------|----------|---------------|--------------|-----------------|\n';
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
      
      // read file LLMorpheusOutput.txt
      const llmOutput = fs.readFileSync(`${mutantsDirName}/${benchmark}/LLMorpheusOutput.txt`, 'utf8');
      // starting from the end of the file, find the line that starts with "real:"
      const realTimeLine = llmOutput.split('\n').reverse().find(line => line.startsWith('real:'));
      const llmorpheusTime = realTimeLine.substring(5).trim();

      report += `| ${benchmark} | ${nrPrompts} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${time} | ${llmorpheusTime} |\n`;
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
    templateName: jsonObj.metaInfo.templateName || "N/A"
  }
}

const title = process.argv[2];
const dirName = process.argv[3];
const mutantsDirName = process.argv[4];
generateReport(title, dirName, mutantsDirName);