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
    report += `## Max Nr of Prompts: ${metaData.maxNrPrompts}\n`;
    report += `## Template: ${metaData.template.substring(metaData.template.lastIndexOf('/')+1)}\n`;
    report += `## Rate Limit: ${metaData.rateLimit}\n`;
    report += `## Number of Attempts: ${metaData.nrAttempts}\n`;
    report += `## Files to Mutate: ${metaData.mutate}\n`;
    report += `## Files to Ignore: ${metaData.ignore}\n`;
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
    const strykerTime = timeInSeconds(jsonObj.time);
    if (!mutantsDirName) {
      report += `| ${benchmark} | ${nrTotal} | ${nrKilled} | ${nrSurvived} | ${nrTimedOut} | ${mutationScore} | ${strykerTime} |\n`;
    } else {
      const llmData = fs.readFileSync(`${mutantsDirName}/${benchmark}/summary.json`, 'utf8');
      const llmJsonObj = JSON.parse(llmData);
      const nrPrompts = parseInt(llmJsonObj.nrPrompts);
      
      // real time appears at the second to last line of the output
      const llmOutput = fs.readFileSync(`${mutantsDirName}/${benchmark}/LLMorpheusOutput.txt`, 'utf8');
      const lines = llmOutput.split('\n');
      const llmorpheusTime = timeInSeconds(lines[lines.length-4].substring(5).trim());
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
    template: jsonObj.metaInfo.template,
    rateLimit: jsonObj.metaInfo.rateLimit,
    nrAttempts: jsonObj.metaInfo.nrAttempts,
    mutate: jsonObj.metaInfo.mutate,
    ignore: jsonObj.metaInfo.ignore
  }
}

/** 
 * Converts a string that was produced by the Unix time command (e.g, "2m0.390s")
 * to seconds. Output the number using up to two decimal places (e.g., 0.2342 -> 0.23)
 * @param {string} time - the time string
 * @returns {number} - the time in seconds
 */
function timeInSeconds(time){
  const minutes = parseInt(time.substring(0, time.indexOf('m')));
  const seconds = parseFloat(time.substring(time.indexOf('m')+1, time.indexOf('s')));
  return parseFloat((minutes*60 + seconds).toFixed(2));
}

const title = process.argv[2];
const dirName = process.argv[3];
const mutantsDirName = process.argv[4];
generateReport(title, dirName, mutantsDirName);