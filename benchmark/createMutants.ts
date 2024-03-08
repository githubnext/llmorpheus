import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { CodeLlama34bInstructModel, CodeLlama70bInstructModel, Mistral7bInstructModel, Mistral8x7bInstructModel } from "../src/model/PerplexityAIModels";
import { CachingModel } from "../src/model/CachingModel";
import { Gpt4Model } from "../src/model/OpenAIModels";
import { MutantGenerator, MetaInfo } from "../src/generator/MutantGenerator";
import path from "path";

if (require.main === module) {
  (async () => {
    const parser = yargs(hideBin(process.argv))
      .strict()
      .options({
        path: {
          type: "string",
          demandOption: true,
          description: "path to file/directory containing the original code",
        },
        promptTemplateFileName: {
          type: "string",
          default: "template.hb",
          description:
            'name of file containing the prompt template (default: "template.hb")',
        },
        numCompletions: {
          type: "number",
          default: 1,
          description:
            "number of completions to generate for each prompt (default: 5)",
        },
        model: {
          type: "string",
          default: "codellama-34b-instruct",
          description: 'name of the model to use (default: "codellama-34b-instruct")',
        },
        caching: {
          type: "boolean",
          default: true,
          description:
            "whether to cache the results of queries to the model (default: true)",
        },
        temperature: {
          type: "number",
          default: 0.0,
          description:
            "temperature to use when generating completions (default: 0.0)"
        },
        outputDir: {
          type: "string",
          default: "./test/actual",
          demandOption: false,
          description:
            "path to directory where generated files should be written",
        },
        nrAttempts: {
          type: "number",
          default: 1,
          demandOption: false,
          description: "number of attempts to generate a completion",
        },
        rateLimit: {
          type: "number",
          default: 0,
          demandOption: false,
          description: "number of milliseconds between requests to the model (0 is no rate limit)",
        },
        maxTokens: {
          type: "number",
          default: 250,
          demandOption: false,
          description: "maximum number of tokens in a completion",
        },
        cacheDir: {
          type: "string",
          default: path.join(__dirname, "..", ".llm-cache"),
          demandOption: false,
          description: "path to directory where cache files are located",
        },
        mutate: {
          type: "string",
          default: "**/*.{js,ts}",
          demandOption: false,
          description: "glob specifying files to mutate",
        },
        ignore: {
          type: "string",
          default: "",
          demandOption: false,
          description: "glob specifying files to ignore",
        },
        maxNrPrompts: {
          type: "number",
          default: 1250,
          demandOption: false,
          description: "maximum number of prompts to generate",
        },
      });

    const argv = await parser.argv;

    if (argv.model !== "codellama-34b-instruct" &&
        argv.model !== "codellama-70b-instruct" &&
        argv.model !== "mistral-7b-instruct" &&
        argv.model !== "mistral-8x7b-instruct" &&
        argv.model !== "gpt4") {
      console.error(`Invalid model name: ${argv.model}`);
      process.exit(1);
    }

    let baseModel, model;
    if (argv.model === "gpt4"){
      console.log("*** Using GPT4 model");
      baseModel = new Gpt4Model({
        max_tokens: 500,
        stop: ["DONE"],
        temperature: 0.0,
        n: argv.numCompletions,
      });
    } if (argv.model === "codellama-34b-instruct"){
      baseModel = new CodeLlama34bInstructModel({
        temperature: argv.temperature,
        max_tokens: argv.maxTokens 
      },
      argv.rateLimit,
      argv.nrAttempts
      );
    } else if (argv.model === "codellama-70b-instruct"){
      baseModel = new CodeLlama70bInstructModel({
        temperature: argv.temperature,
        max_tokens: argv.maxTokens
      },
      argv.rateLimit,
      argv.nrAttempts)
    } else if (argv.model === "mistral-7b-instruct"){
      baseModel = new Mistral7bInstructModel({
        temperature: argv.temperature,
        max_tokens: argv.maxTokens
      },
      argv.rateLimit,
      argv.nrAttempts)
    } else if (argv.model === "mistral-8x7b-instruct"){
      baseModel = new Mistral8x7bInstructModel({
        temperature: argv.temperature,
        max_tokens: argv.maxTokens
      },
      argv.rateLimit,
      argv.nrAttempts)
    } else {
      throw new Error(`Invalid model name: ${argv.model}`);
    }
    if (argv.caching) {
      model = new CachingModel(baseModel, argv.cacheDir);
    } else {
      model = baseModel;
    }

    function getEnv(name: string): string {
      const value = process.env[name];
      if (!value) {
        console.error(`Please set the ${name} environment variable.`);
        process.exit(1);
      }
      return value;
    }

    const packagePath = argv.path.endsWith("/") ? argv.path : path.join(argv.path, "/");
    console.log(`*** Generating mutants for ${argv.mutate} in ${packagePath}`);

    const metaInfo : MetaInfo = {
      modelName: model.getModelName(),
      temperature: model.getTemperature(),
      maxTokens: model.getMaxTokens(),
      maxNrPrompts: argv.maxNrPrompts,
      rateLimit: argv.rateLimit,
      nrAttempts: argv.nrAttempts,
      template: argv.promptTemplateFileName,
      mutate: argv.mutate,
      ignore: argv.ignore
    }



    const mutantGenerator = new MutantGenerator(
      model,
      path.join(argv.path, "MUTATION_TESTING"),
      packagePath,
      metaInfo
    );
    mutantGenerator.generateMutants();
  })();
}
