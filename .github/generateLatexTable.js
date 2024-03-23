const fs = require('fs');

function generateLatexTable(title, dirName, mutantsDirName){
  if (!mutantsDirName) {
    throw new Error("Mutants directory is required for this script");
  } else {
    generateLatexTableForLLMorpheusExperiment(title, dirName, mutantsDirName);
  }
}

// Generates a table that looks as follows:
// \begin{table*}
//  \centering
//  {\scriptsize
//  \begin{tabular}{l||r|r|r|r|r|r|r||r|r||r|r}
//    {\bf application}                & {\bf \#prompts}   & {\bf \#mutants} & {\bf \#killed} & {\bf \#survived} & {\bf \#timeout} & {\bf mutation} & \multicolumn{2}{|c|}{\bf time (sec)} & \multicolumn{3}{|c|}{\bf \#tokens}\\
//                                     &                   &                 &                &                  &                 & {\bf score}    & \ToolName & {\it StrykerJS}  & {\bf prompt} & {\bf completion} & {\bf total}\\
//    \hline
//    \textit{Complex.js}              & 490               &  1,206          &  735           &      470         &              1  & 61.03          &  3,004.38  &    516.8         & 983,678 & 100,863 & 1,084,541 \\    
//    \hline  
//    \textit{countries-and-timezones} & 106               & 225             &  199           &     26           &              0 & 88.44           & 1,070.91   &    223.75 	     &  109,326 &  22,678 &	132,004 \\              
//    \hline 
//    TOTAL                            & 596               & 1,431           & 934            & 496              & 1               & 65.29          & 4,075.29   &    740.55        & 1,093,004 & 123,541 & 1,216,545 \\  
//  \end{tabular}
//  }
//  \caption{Results obtained with LLMorpheus using the following parameters: 
//    model: \textit{codellama-34b-instruct}, 
//    temperature: 0.0, 
//    MaxTokens: 250, 
//    MaxNrPrompts: 2000,
//    template: \textit{template-full.hb},
//    rateLimit: benchmark mode,
//    nrAttempts: 3  
//  }

function generateLatexTableForLLMorpheusExperiment(title, dirName, mutantsDirName){
  let report = `\\begin{table*}\n`;
  report += ` \\centering\n`; 
  report += ` {\\scriptsize\n`;
  report += ` \\begin{tabular}{l||r|r|r|r|r|r|r||r|r||r|r}\n`;
  report += `   {\\bf application}                & {\\bf \\#prompts}   & {\\bf \\#mutants} & {\\bf \\#killed} & {\\bf \\#survived} & {\\bf \\#timeout} & {\\bf mutation} & \\multicolumn{2}{|c|}{\\bf time (sec)} & \\multicolumn{3}{|c|}{\\bf \\#tokens}\\\\\n`; 
  report += `                                    &                   &                 &                &                  &                 & {\\bf score}    & \\ToolName & {\\it StrykerJS}  & {\\bf prompt} & {\\bf completion} & {\\bf total}\\\\\n`;
  report += `   \\hline\n`;
  const files = fs.readdirSync(dirName);
  let totalPrompts = 0;
  let totalKilled = 0;
  let totalSurvived = 0;
  let totalTimedOut = 0;
  let totalMutants = 0;
  let totalTime = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTotalTokens = 0;
  for (const benchmark of files) {
    const data = fs.readFileSync(`${dirName}/${benchmark}/StrykerInfo.json`, 'utf8'); 
    const jsonObj = JSON.parse(data);
    const metaData = retrieveMetaData(`${mutantsDirName}/${benchmark}`);
    const nrPrompts = metaData.maxNrPrompts;
    const nrMutants = parseInt(jsonObj.nrKilled) + parseInt(jsonObj.nrSurvived) + parseInt(jsonObj.nrTimedOut);
    const nrKilled = parseInt(jsonObj.nrKilled);
    const nrSurvived = parseInt(jsonObj.nrSurvived);
    const nrTimedOut = parseInt(jsonObj.nrTimedOut);
    const mutationScore = parseFloat(jsonObj.mutationScore);
    const strykerTime = timeInSeconds(jsonObj.time);
    const llmorpheusTime = parseFloat(fs.readFileSync(`${dirName}/${benchmark}/time.txt`, 'utf8'));
    const nrTokensPrompt = metaData.maxTokens;
    const nrTokensCompletion = metaData.maxTokens;
    const nrTokensTotal = nrTokensPrompt + nrTokensCompletion;

    // update totals
    totalPrompts += nrPrompts;
    totalKilled += nrKilled;
    totalSurvived += nrSurvived;
    totalTimedOut += nrTimedOut;
    totalMutants += nrMutants;
    totalTime += llmorpheusTime;
    totalPromptTokens += nrTokensPrompt;
    totalCompletionTokens += nrTokensCompletion;
    totalTotalTokens += nrTokensTotal;

    report += `   \\textit{${benchmark}} & ${nrPrompts} & ${nrMutants} & ${nrKilled} & ${nrSurvived} & ${nrTimedOut} & ${mutationScore.toFixed(2)} & ${llmorpheusTime.toFixed(2)} & ${strykerTime.toFixed(2)} & ${nrTokensPrompt} & ${nrTokensCompletion} & ${nrTokensTotal} \\\\ \n`;  
    report += `   \\hline\n`;
  }
  if (files.length > 1){
    report += `   \\textit{Total} & ${totalPrompts} & ${totalMutants} & ${totalKilled} & ${totalSurvived} & ${totalTimedOut} & - & ${totalTime.toFixed(2)} & - & ${totalPromptTokens} & ${totalCompletionTokens} & ${totalTotalTokens} \\\\ \n`;
  }
  report += ` \\end{tabular}\n`;
  report += ` }\n`;
  const metaData = retrieveMetaData(mutantsDirName);
  report += ` \\caption{Results obtained with LLMorpheus using the following parameters: \n`;
  report += `   model: \\textit{${metaData.modelName}}, \n`;
  report += `   temperature: ${metaData.temperature}, \n`;
  report += `   MaxTokens: ${metaData.maxTokens}, \n`;
  report += `   MaxNrPrompts: ${metaData.maxNrPrompts}, \n`;
  report += `   template: \\textit{${metaData.template.substring(metaData.template.lastIndexOf('/')+1)}}, \n`;
  report += `   rateLimit: ${metaData.benchmark ? "benchmark mode" : metaData.rateLimit}, \n`;
  report += `   nrAttempts: ${metaData.nrAttempts}  \n`;
  report += ` }\n`;
  report += `\\end{table*}\n`;
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
    maxNrPrompts: jsonObj.metaInfo.maxNrPrompts,
    template: jsonObj.metaInfo.template,
    rateLimit: jsonObj.metaInfo.rateLimit,
    nrAttempts: jsonObj.metaInfo.nrAttempts,
    benchmark: jsonObj.metaInfo.benchmark,
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
generateLatexTable(title, dirName, mutantsDirName);