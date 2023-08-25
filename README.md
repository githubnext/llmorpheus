# llm-mutation-testing

## how to build:

npm run build


## how to run:


node benchmark/createMutants.js --path ~/tmp/TestStryker/countries-and-timezones/  --promptTemplateFileName test/input/newTemplate.hb

## running strykerJS and viewing the report

- Open terminal window 
- cd to directory for benchmark in which the custom version of Stryker has been installed (e.g., /Users/franktip/tmp/TestStryker/countries-and-timezones)
- export MUTANTS_FILE=/MUTATION_TESTING/mutants.json
- npx stryker run
- in terminal: open reports/mutation/mutation.html
