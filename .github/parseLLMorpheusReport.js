const fs = require('fs');

 /* Extract the number of killed/surviving/timed-out mutants from a Stryker report.
 */
async function extractInfoFromReport(llmorpheusReportFileName) {
  const llmorpheusReport = fs.readFileSync(llmorpheusReportFileName, 'utf8');
  
  // wallclock time is on the line that starts with "real"  
  const realTimeLine = llmorpheusReport.split('\n').find(line => line.startsWith('real'));
  const realTime = realTimeLine.substring(4).trim();
  console.log("Information extracted from LLMorpheus report:");
  console.log(`  Time: ${realTime}`);

  // write as JSON
  const result = {
    time: realTime
  };
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync('LLMorpheusInfo.json', json);
}

const fileName = process.argv[2];
extractInfoFromReport(fileName);