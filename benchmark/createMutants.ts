import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  CachingModel,
  Gpt4Model,
  CodeLlama34bInstructModel,
  Llama2_70bModel
} from "../src/Model";
import { MutantGenerator } from "../src/MutantGenerator";
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
          default: "text-davinci003",
          description: 'name of the model to use (default: "text-davinci003")',
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
        }
      });
    const argv = await parser.argv;

    if (argv.model !== "text-davinci003" && argv.model !== "gpt4" && argv.model !== "codellama" && 
        argv.model !== "codellama:13b" && argv.model !== "codellam:34b" && argv.model !== "codellama-34b-instruct" &&
        argv.model !== "llama-2-70b-chat") {
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
    } else if (argv.model === "llama-2-70b-chat"){
      baseModel = new Llama2_70bModel({
        temperature: argv.temperature,
        max_tokens: argv.maxTokens
      },
      argv.rateLimit,
      argv.nrAttempts)
    } else {
      throw new Error(`Invalid model name: ${argv.model}`);
    }
    if (argv.caching) {
      model = new CachingModel(baseModel);
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

    const mutantGenerator = new MutantGenerator(
      model,
      argv.promptTemplateFileName,
      path.join(argv.path, "MUTATION_TESTING"),
      argv.path 
    );
    mutantGenerator.generateMutants(argv.path);
  })();
}
