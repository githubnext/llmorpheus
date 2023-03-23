import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { MutantGenerator } from "../src/mutantGenerator";
import { IRuleFilter } from "../src/rule";

if (require.main === module) {
  (async () => {
    const parser = yargs(hideBin(process.argv))
      .strict()
      .options({
        origFileName: {
          type: "string",
          demandOption: true,
          description: "name of file containing the original code",
        },
        outputFileName: {
          type: "string",
          default: "mutants.json",
          description: "name of file where output will be written (default: \"mutants.json\")",
        },
        rulesFileName: {
          type: "string",
          default: "rules.json",
          description: "name of file containing the rewriting rules (default: \"rules.json\")",
        },
        instructionsFileName: {
          type: "string",
          default: "instructions.txt",
          description: "name of file containing the instructions (default: \"instructions.txt\")",
        },
        logFileName : {
          type: "string",
          default: "log.txt",
          description: "name of file where log will be written (default: \"log.txt\")",
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
    });
    const argv = await parser.argv;
    const rules = argv.rules === undefined ? [] : argv.rules!.substring(1, argv.rules!.length-1).split(",");

    // a function that determines whether a given rule should be applied
    const ruleFilter : IRuleFilter = (value: string) : boolean => {
      return argv.rules === undefined || rules.includes(value);
    }

    const mutantGenerator = new MutantGenerator(argv.rulesFileName, ruleFilter, argv.instructionsFileName, argv.numCompletions, argv.logFileName);
    mutantGenerator.generateMutants(argv.origFileName, argv.outputFileName);
    mutantGenerator.printMutantInfo();
  })();
}