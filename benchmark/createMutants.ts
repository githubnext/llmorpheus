import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  CachingModel,
  CodeLlama13bModel,
  CodeLlama7bModel,
  Gpt4Model,
  TextDavinci003Model,
} from "../src/model";
import { MutantGenerator } from "../src/mutantGenerator";
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
          default: "gpt4",
          description: 'name of the model to use (default: "text-davinci003")',
        },
        caching: {
          type: "boolean",
          default: true,
          description:
            "whether to cache the results of queries to the model (default: true)",
        },
        outputDir: {
          type: "string",
          default: "./test/actual",
          demandOption: false,
          description:
            "path to directory where generated files should be written",
        },
      });
    const argv = await parser.argv;

    if (argv.model !== "text-davinci003" && argv.model !== "gpt4" && argv.model !== "codellama" && argv.model !== "codellama:13b" && argv.model !== "codellam:34b") {
      console.error(`Invalid model name: ${argv.model}`);
      process.exit(1);
    }

    let baseModel, model;
    if (argv.model === "text-davinci003") {
      baseModel = new TextDavinci003Model({
        max_tokens: 500,
        stop: ["DONE"],
        temperature: 0.0,
        n: argv.numCompletions,
      });
    } else if (argv.model === "gpt4"){
      console.log("*** Using GPT4 model");
      baseModel = new Gpt4Model({
        max_tokens: 500,
        stop: ["DONE"],
        temperature: 0.0,
        n: argv.numCompletions,
      });
    } else if (argv.model === "codellama"){
      console.log("*** Using codellama:7b model");
      baseModel = new CodeLlama7bModel({
        max_tokens: 500,
        stop: ["DONE"],
        temperature: 0.0,
        n: argv.numCompletions,
      });
    } else if (argv.model === "codellama:13b"){
      console.log("*** Using codellama:13b model");
      baseModel = new CodeLlama13bModel({
        max_tokens: 500,
        stop: ["DONE"],
        temperature: 0.0,
        n: argv.numCompletions,
      });
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
