import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { CachingModel, Gpt35TurboModel, TextDavinci003Model } from "../src/model";
import { MutantGenerator } from "../src/mutantGenerator";
import { IRuleFilter } from "../src/rule";

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
        outputDir: {
          type: "string",
          default: "./output",
          description: "path to directory where output files will be written (default: \"./output\")",
        },
        rulesFileName: {
          type: "string",
          default: "rules.json",
          description: "name of file containing the rewriting rules (default: \"rules.json\")",
        },
        promptTemplateFileName: {
          type: "string",
          default: "template.hb",
          description: "name of file containing the prompt template (default: \"template.hb\")",
        },
        rules: {
          type: "string",
          description:
            "list of rewriting rule(s) to apply, e.g. [1,2,3]. If omitted, all rules will be applied.",
        },
        numCompletions: {
          type: "number",
          default: 5,
          description: "number of completions to generate for each prompt (default: 5)",
        },
        model: {
          type: "string",
          default: "text-davinci003",
          description: "name of the model to use (default: \"text-davinci003\")",
        },
        caching: {
          type: "boolean",
          default: true,
          description: "whether to cache the results of queries to the model (default: true)",
        },
    });
    const argv = await parser.argv;
    const rules = argv.rules === undefined ? [] : argv.rules!.substring(1, argv.rules!.length-1).split(",");

    // a function that determines whether a given rule should be applied
    const ruleFilter : IRuleFilter = (value: string) : boolean => {
      return argv.rules === undefined || rules.includes(value);
    }

    if (argv.model !== "text-davinci003" && argv.model !== "gpt3.5-turbo") {
      console.error(`Invalid model name: ${argv.model}`);
      process.exit(1);
    }

    let baseModel, model;
    if (argv.model === "text-davinci003") {
      baseModel = new TextDavinci003Model({ max_tokens: 500, stop: ["DONE"], temperature: 0.0, n: argv.numCompletions });
    } else {
      baseModel = new Gpt35TurboModel({ max_tokens: 500, stop: ["DONE"], temperature: 0.0, n: argv.numCompletions });
    }
    if (argv.caching) {
      model = new CachingModel(baseModel);
    } else {
      model = baseModel;
    }

    const mutantGenerator = new MutantGenerator(model, argv.promptTemplateFileName, argv.rulesFileName, ruleFilter, argv.outputDir);
    mutantGenerator.generateMutants(argv.path);
  })();
}