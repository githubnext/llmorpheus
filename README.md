# llm-mutation-testing

## how to build:

npm run build


## how to run:


node benchmark/createMutants.js --path ~/sabbatical/mt-projects/countries-and-timezones/ --model codellama-34b-instruct --promptTemplateFileName templates/template1.hb --caching true --temperature 0.0

## running strykerJS and viewing the report

- Open terminal window 
- cd to directory for benchmark in which the custom version of Stryker has been installed (e.g., /Users/franktip/tmp/TestStryker/countries-and-timezones)
- export MUTANTS_FILE=./MUTATION_TESTING/mutants.json
- npx stryker run
- in terminal: open reports/mutation/mutation.html
