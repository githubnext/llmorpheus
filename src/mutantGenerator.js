"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutantGenerator = void 0;
const fs_1 = __importDefault(require("fs"));
const codex_1 = require("./codex");
const mutant_1 = require("./mutant");
const prompt_1 = require("./prompt");
function addLineNumbers(code) {
    const lines = code.split("\n");
    const maxDigits = Math.floor(Math.log10(lines.length)) + 1;
    const paddedLines = lines.map((line, i) => {
        const lineNumber = (i + 1).toString();
        const padding = " ".repeat(maxDigits - lineNumber.length);
        return `${padding}${lineNumber}: ${line}`;
    });
    return paddedLines.join("\n");
}
;
class MutantGenerator {
    constructor(promptTemplateFileName, rulesFileName, ruleFilter, numCompletions, logFileName, removeInvalid) {
        this.rulesFileName = rulesFileName;
        this.ruleFilter = ruleFilter;
        this.numCompletions = numCompletions;
        this.logFileName = logFileName;
        this.removeInvalid = removeInvalid;
        this.rules = [];
        this.mutants = [];
        this.WINDOW_SIZE = 2;
        this.rules = JSON.parse(fs_1.default.readFileSync(this.rulesFileName, "utf8"));
        this.promptGenerator = new prompt_1.PromptGenerator(promptTemplateFileName);
    }
    appendToLog(msg) {
        fs_1.default.appendFileSync(this.logFileName, msg);
    }
    printAndLog(msg) {
        console.log(msg);
        this.appendToLog(msg);
    }
    async generateMutants(origFileName, outputFileName) {
        // remove output file from previous run, if it exists
        if (fs_1.default.existsSync(outputFileName)) {
            fs_1.default.unlinkSync(outputFileName);
        }
        // remove log file from previous run, if it exists
        if (fs_1.default.existsSync(this.logFileName)) {
            fs_1.default.unlinkSync(this.logFileName);
        }
        this.printAndLog(`Starting generation of mutants on: ${new Date().toUTCString()}\n\n`);
        const origCode = addLineNumbers(fs_1.default.readFileSync(origFileName, "utf8"));
        // create mutants using each of the selected rules
        for (const rule of this.rules) {
            if (!this.ruleFilter(rule.id)) { // skip rules that are not selected
                continue;
            }
            this.printAndLog(`Applying rule \"${rule.id}\" ${rule.rule} to ${origFileName}`);
            const prompt = this.promptGenerator.createPrompt(origCode, rule);
            const model = new codex_1.Codex({ max_tokens: 750, stop: ["DONE"], temperature: 0.0, n: this.numCompletions });
            this.appendToLog(` using prompt:\n${prompt}\n`);
            let completions;
            try {
                completions = await model.query(prompt);
            }
            catch (err) {
                this.printAndLog(`\tError: ${err}`);
                continue;
            }
            if (completions.size === 0) {
                this.printAndLog(`No completions found for rule ${rule.id}.`);
            }
            else {
                this.printAndLog(`\tReceived ${completions.size} completions for rule ${rule.id}.`);
                let completionNr = 1;
                for (const completion of completions) {
                    this.appendToLog(`completion ${completionNr}:\n${completion}`);
                    // extract the mutants from the completion
                    // regular expression that matches the string "CHANGE LINE #n FROM:\n```SomeLineOfCode```\nTO:\n```SomeLineOfCode```\n"
                    const regExp = /CHANGE LINE #(\d+) FROM:\n```\n(.*)\n```\nTO:\n```\n(.*)\n```\n/g;
                    let match;
                    let nrMutants = 0;
                    let nrUsefulMutants = 0;
                    while ((match = regExp.exec(completion)) !== null) {
                        const lineNr = parseInt(match[1]);
                        const originalCode = match[2];
                        const rewrittenCode = match[3];
                        const mutant = new mutant_1.Mutant(rule.id, rule.rule, originalCode, rewrittenCode, lineNr); //{ ruleId: rule.id, rule: rule.rule, originalCode: originalCode, rewrittenCode: rewrittenCode, lineApplied: lineNr, comment: "" };
                        nrMutants++;
                        this.mutants.push(mutant);
                        const isUseful = !mutant.isTrivialRewrite() && mutant.originalCodeMatchesLHS() && mutant.rewrittenCodeMatchesRHS();
                        this.appendToLog(`\tcandidate mutant: ${JSON.stringify(mutant)} (useful: ${isUseful})\n`);
                        if (isUseful) {
                            nrUsefulMutants++;
                        }
                    }
                    this.printAndLog(`\tcompletion ${completionNr} contains  ${nrMutants} candidate mutants, of which ${nrUsefulMutants} are useful`);
                    completionNr++;
                    this.appendToLog("--------------------------------------------\n");
                }
            }
        }
        this.detectInvalidMutants(origCode);
        this.removeDuplicates();
        // write mutant info to JSON file
        fs_1.default.writeFileSync(outputFileName, JSON.stringify(this.mutants, null, 2));
    }
    /**
     * Detect mutants that are invalid (when the original code is not present in the source code)
     * or trivial (when the original code is the same as the rewritten code). Accounts for situations
     * where the original code is not present on the exact line where the mutation was reported
     * by checking up to WINDOW_SIZE lines before and after the line where the mutation was reported.
     *
     * @param origCode The original source code.
     */
    detectInvalidMutants(origCode) {
        this.mutants = this.mutants.filter((mutant) => !mutant.isTrivialRewrite()); // remove trivial rewrites
        this.mutants = this.mutants.filter((mutant) => mutant.originalCodeMatchesLHS()); // remove mutants that do not match LHS of applied rule
        this.mutants = this.mutants.filter((mutant) => mutant.rewrittenCodeMatchesRHS()); // remove mutants that do not match RHS of applied rule
        this.mutants.forEach((mutant) => mutant.adjustLocationAsNeeded(origCode)); // adjust location of mutant if needed
        this.mutants = this.mutants.filter((mutant) => mutant.getLineApplied() !== -1); // remove mutants that are not found in source code
    }
    /**
     * Detect duplicates in the list of mutants. Mutants are considered duplicates if they have the same ruleId and
     * lineApplied. Merge the notes of the duplicates into one comment.
     */
    removeDuplicates() {
        const newMutants = [];
        for (const mutant of this.mutants) {
            const existingMutant = newMutants.find((m) => m.getRuleId() === mutant.getRuleId() && m.getLineApplied() === mutant.getLineApplied());
            if (existingMutant === undefined) {
                newMutants.push(mutant);
            }
            else {
                existingMutant.addComment(mutant.getComment());
            }
        }
        this.mutants = newMutants;
    }
}
exports.MutantGenerator = MutantGenerator;
//# sourceMappingURL=mutantGenerator.js.map