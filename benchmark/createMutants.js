"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const model_1 = require("../src/model");
const mutantGenerator_1 = require("../src/mutantGenerator");
if (require.main === module) {
    (async () => {
        const parser = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
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
                description: "list of rewriting rule(s) to apply, e.g. [1,2,3]. If omitted, all rules will be applied.",
            },
            numCompletions: {
                type: "number",
                default: 5,
                description: "number of completions to generate for each prompt (default: 5)",
            }
        });
        const argv = await parser.argv;
        const rules = argv.rules === undefined ? [] : argv.rules.substring(1, argv.rules.length - 1).split(",");
        // a function that determines whether a given rule should be applied
        const ruleFilter = (value) => {
            return argv.rules === undefined || rules.includes(value);
        };
        const model = new model_1.CachingModel(new model_1.Model({ max_tokens: 750, stop: ["DONE"], temperature: 0.0, n: argv.numCompletions }));
        const mutantGenerator = new mutantGenerator_1.MutantGenerator(model, argv.promptTemplateFileName, argv.rulesFileName, ruleFilter, argv.outputDir);
        mutantGenerator.generateMutants(argv.path);
    })();
}
//# sourceMappingURL=createMutants.js.map