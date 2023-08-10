# llm-mutation-testing

## how to build:

npm run build


## how to run:


node benchmark/createMutants.js --path test/input/testProject/countries-and-timezones/ --outputDir .  --promptTemplateFileName test/input/newTemplate.hb

## running strykerJS and viewing the report

- Open VSCode window for benchmark in which the custom version of Stryker has been installed (e.g., /Users/franktip/sabbatical/projects/countries-and-timezones)
- in terminal: export MUTANTS_FILE=/Users/franktip/sabbatical/llm-mutation-testing/mutants.json
- npx stryker run
- in terminal: open reports/mutation/mutation.html
