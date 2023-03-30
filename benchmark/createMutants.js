"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const mutantGenerator_1 = require("../src/mutantGenerator");
if (require.main === module) {
    (async () => {
        const parser = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
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
            promptTemplateFileName: {
                type: "string",
                default: "template.hb",
                description: "name of file containing the prompt template (default: \"template.hb\")",
            },
            logFileName: {
                type: "string",
                default: "log.txt",
                description: "name of file where log will be written (default: \"log.txt\")",
            },
            rules: {
                type: "string",
                description: "list of rewriting rule(s) to apply, e.g. [1,2,3]. If omitted, all rules will be applied.",
            },
            numCompletions: {
                type: "number",
                default: 5,
                description: "number of completions to generate for each prompt (default: 5)",
            },
            removeInvalid: {
                type: "boolean",
                default: false,
                description: "whether to remove invalid mutants (default: false)",
            },
        });
        const argv = await parser.argv;
        const rules = argv.rules === undefined ? [] : argv.rules.substring(1, argv.rules.length - 1).split(",");
        // a function that determines whether a given rule should be applied
        const ruleFilter = (value) => {
            return argv.rules === undefined || rules.includes(value);
        };
        const mutantGenerator = new mutantGenerator_1.MutantGenerator(argv.promptTemplateFileName, argv.rulesFileName, ruleFilter, argv.numCompletions, argv.logFileName, argv.removeInvalid);
        mutantGenerator.generateMutants(argv.origFileName, argv.outputFileName);
    })();
}
//# sourceMappingURL=createMutants.js.map