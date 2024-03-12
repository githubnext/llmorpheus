# llm-mutation-testing

## Building the Project

npm run build

## Running the Tests

npm run test

## Generating mutants for an application

1. To generate mutants for an application, begin by cloning, installing, and building the application.

2. To generate mutants, you need to run the ```createMutants.js``` file that is located in the ```benchmark``` directory. 

   Required parameters are:
  - ```path``` location where the project to be mutated is located
  - ```mutate``` glob pattern specifying the files that should be mutated
  - ```model``` the LLM that should be used. Currently available options are ```codellama-34b-instruct```, ```codellama-70b-instruct```, ```mistral-7b-instruct```, and ```mixtral-8x7b-instruct```
  - ```template``` the template used for creating prompts, some examples are located in the ```templates``` directory
  
  Optional parameters are:
  - ```temperature``` temperature setting to be used for the LLM (default: 0.0)
  - ```maxNrPrompts``` place a bound on the number of prompts,  useful for quickly running a small experiment (default: 1250)
  - ```rateLimit``` minimum number of milliseconds between successive prompts, useful for rate-limited API endpoints (default: 0)
  - ```nrAttempts``` number of times a prompt should be repeated in case of 429 errors (default: 1)
  - ```maxTokens``` maximum number of tokens allowed in the completion (default: 250)
  - ```caching``` whether LLM responses should be cached locally (default: true)
  - ```cacheDir``` location for the cache if caching is enables (default: .llm-cache)
  - ```ignore``` glob pattern of files that should be excluded
  - ```benchmark``` experimental rate-limiting feature for use when running benchmarks in GitHub Actions, this will gradually decrease the time intervals between prompts

Note: to run LLMorpheus using LLMs available through Perplexity.ai, you need to set the following environment variables:
  - PERPLEXITY_AI_API_ENDPOINT
  - PERPLEXITY_AI_AUTH_HEADERS


### Example usage:
```node benchmark/createMutants.js --path ~/projects/zip-a-folder/ --mutate "lib/*.ts"   --model codellama-34b-instruct  --promptTemplateFileName templates/template1.hb  --caching false  --temperature 0```

## Inspecting the results

LLMorpheus will write its outputs in a subdirectory of a directory ```MUTATION_TESTING``` of the directory where the subject project is located. This directory will be created if it did not already exist, and if it existed, the old contents will be deleted. Inside this directory, you will find the following:
  - a subdirectory ```prompts``` containing all generated prompts and completions. Prompts are saved in files named ```promptN.txt``` and completions are in files ```promptN_completionN.txt```
  - a file ```mutants.json``` containing information about the computed mutants (file, location, original source code, mutated source code, prompt ID, completion ID, and code pattern that was used to derive the mutant). This file is what our custom version of StrykerJS refers to when it performs its mutation analysis.
  - a file ```promptSpecs.json`` recording the locations that are candidates for mutation (file, location, pattern)
  - a file ```summary.json``` containing statistics gathered for the entire project (number of prompts, number of mutants, number of tokens used for prompts, number of tokens used for completions, meta-information about the model and LLMorpheus parameters used for the experiment)
 

## Running StrykerJS and Viewing Stryker's Report

To run our custom version of Stryker, perform the following steps:

1. Clone Stryker from ```https://github.com/franktip/stryker-js``` into directory ```stryker-js```

2. ```cd stryker-js```

3. ```npm install```

4. ```npm run build```

5. Next you need to install Stryker in the subject project for which you generated mutants. The instructions below assume that the subject project is in directory ```ProjectDir``` and that Stryker was installed in ```stryker-js```
  - ```cd ProjectDir```
  - ```npm install install-local```
  - set ```STRYKER_FILES``` to a quoted comma-separated list of files that you want to be mutated.  LLMorpheus outputs this list, so you can copy and paste from there. Note: There should be no space characters in the list.
  - set the ```MUTANTS_FILE``` environment variable to point to the ```mutants.json``` file that was generated by LLMorpheus
  - ```npx stryker run --usePrecomputed  --mutate $STRYKER_FILES```   (if you leave out the ```---usePrecomputed``` option, Stryker's standard mutation operators will be applied). You may supply other options to StrykerJS, see the StrykerJS documentation.
  - the previous command will generate a directory ```reports```. You can view Stryker's report by opening ```reports/mutation/mutation.html```

## Running a benchmark using GitHub Actions

GitHub Actions are set up to run experiments using Perplexity.ai's LLMs. You can select Actions for:
  - "Run tests" running the tests
  - "Apply Stryker's Standard Mutation Operators" running Stryker's standard mutators
  - "Mutation Testing Experiment: runs LLMorpheus and then runs Stryker using the inferred mutants

When you select the last action, a dialog pops up that lets you select various setting, including what template to use, LLM settings etc. 

The latter two Actions will produce a report that contains all relevant information. All generated information is available for download.