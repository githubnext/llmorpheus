import axios from 'axios';
import * as fs from 'fs';

async function getCompletion(filePath: string) : Promise<string> {
  // console.log('*** 1 ***');
  const prompt = fs.readFileSync(filePath, 'utf8');
  const url = 'https://api.perplexity.ai/chat/completions';
  const header = {
    'accept': 'application/json',
    'authorization': 'Bearer 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',
    'content-type': 'application/json'
  };

  const body = {
    model: 'codellama-34b-instruct',
    messages: [
      {role: 'system', content: 'You are a programming assistant. You are expected to be concise and precise and avoid any unnecessary examples, tests, and verbosity.'},
      {role: 'user', content: prompt}
    ]
  };
  const response: any = await axios.post(url, body, {headers: header});
  return response.data.choices[0].message.content;
}

async function process() : Promise<void> {
  // record the time in milliseconds
  const start = Date.now();
  const completion = await getCompletion('/Users/franktip/sabbatical/mt-projects/countries-and-timezones/MUTATION_TESTING/prompts/prompt3.txt');
  const end = Date.now();
  const elapsed = end - start;
  console.log(`completion (received in ${elapsed} milliseconds) = ${completion}`);
}

process();