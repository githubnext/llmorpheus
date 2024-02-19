"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptSpecGenerator = void 0;
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const fs = __importStar(require("fs"));
const handlebars = __importStar(require("handlebars"));
const path = __importStar(require("path"));
const Prompt_1 = require("../prompt/Prompt");
const PromptSpec_1 = require("../prompt/PromptSpec");
const SourceLocation_1 = require("../util/SourceLocation");
const code_utils_1 = require("../util/code-utils");
/**
 * Generates a set of PromptSpecs for a given set of source files and a given prompt template.
 */
class PromptSpecGenerator {
    constructor(files, promptTemplateFileName, packagePath, outputDir, subDir) {
        this.files = files;
        this.promptTemplateFileName = promptTemplateFileName;
        this.packagePath = packagePath;
        this.outputDir = outputDir;
        this.subDir = subDir;
        this.promptSpecs = new Array();
        this.prompts = new Array();
        this.promptTemplate = fs.readFileSync(this.promptTemplateFileName, "utf8");
        Prompt_1.Prompt.resetIdCounter();
        this.createPromptSpecs();
        this.createPrompts();
    }
    getPromptSpecs() {
        return this.promptSpecs;
    }
    getPrompts() {
        return this.prompts;
    }
    getOutputDir() {
        return this.outputDir;
    }
    getSubDir() {
        return this.subDir;
    }
    createPrompts() {
        for (const promptSpec of this.promptSpecs) {
            const codeWithPlaceholder = promptSpec.getCodeWithPlaceholder();
            const compiledTemplate = handlebars.compile(this.promptTemplate); // promote to field?
            const references = Array.from(promptSpec.references).join(", ");
            const orig = promptSpec.orig;
            const prompt = compiledTemplate({ code: codeWithPlaceholder, references, orig });
            this.prompts.push(new Prompt_1.Prompt(prompt, promptSpec));
        }
    }
    createPromptSpecs() {
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            this.promptSpecs.push(...this.createPromptSpecsForFile(file));
        }
    }
    createPromptSpecsForFile(file) {
        const promptSpecs = new Array();
        const code = fs.readFileSync(file, "utf8");
        const ast = parser.parse(code, {
            sourceType: "module",
            plugins: ["typescript"],
        });
        const outerThis = this; // needed to access this in the callback function
        (0, traverse_1.default)(ast, {
            enter(path) {
                // const key = path.getPathLocation(); // representation of the path, e.g., program.body[18].declaration.properties[6].value
                // const loc = new SourceLocation(file, path.node.loc!.start.line, path.node.loc!.start.column, path.node.loc!.end.line, path.node.loc!.end.column);
                outerThis.createPromptSpecForIf(file, path);
                outerThis.createPromptSpecForSwitch(file, path);
                outerThis.createPromptSpecForWhile(file, path);
                outerThis.createPromptSpecForDoWhile(file, path);
                outerThis.createPromptSpecsForFor(file, path);
                outerThis.createPromptSpecsForForIn(file, path);
                outerThis.createPromptSpecsForForOf(file, path);
                outerThis.createPromptSpecsForCall(file, path);
            }
        });
        return promptSpecs;
    }
    createPromptSpecForIf(file, path) {
        if (path.isIfStatement()) {
            const test = path.node.test;
            const loc = new SourceLocation_1.SourceLocation(file, test.loc.start.line, test.loc.start.column, test.loc.end.line, test.loc.end.column);
            this.promptSpecs.push(new PromptSpec_1.PromptSpec(file, "if", "test", loc, loc.getText()));
        }
    }
    createPromptSpecForSwitch(file, path) {
        if (path.isSwitchStatement()) {
            const discriminant = path.node.discriminant;
            const loc = new SourceLocation_1.SourceLocation(file, discriminant.loc.start.line, discriminant.loc.start.column, discriminant.loc.end.line, discriminant.loc.end.column);
            this.promptSpecs.push(new PromptSpec_1.PromptSpec(file, "switch", "discriminant", loc, loc.getText()));
        }
    }
    createPromptSpecForWhile(file, path) {
        if (path.isWhileStatement()) {
            const test = path.node.test;
            const loc = new SourceLocation_1.SourceLocation(file, test.loc.start.line, test.loc.start.column, test.loc.end.line, test.loc.end.column);
            this.promptSpecs.push(new PromptSpec_1.PromptSpec(file, "while", "test", loc, loc.getText()));
        }
    }
    createPromptSpecForDoWhile(file, path) {
        if (path.isDoWhileStatement()) {
            const test = path.node.test;
            const loc = new SourceLocation_1.SourceLocation(file, test.loc.start.line, test.loc.start.column, test.loc.end.line, test.loc.end.column);
            this.promptSpecs.push(new PromptSpec_1.PromptSpec(file, "do-while", "test", loc, loc.getText()));
        }
    }
    createPromptSpecsForFor(file, path) {
        if (path.isForStatement()) {
            const init = path.node.init;
            const test = path.node.test;
            const update = path.node.update;
            const initLoc = new SourceLocation_1.SourceLocation(file, init.loc.start.line, init.loc.start.column, init.loc.end.line, init.loc.end.column);
            const testLoc = new SourceLocation_1.SourceLocation(file, test.loc.start.line, test.loc.start.column, test.loc.end.line, test.loc.end.column);
            let updateLoc;
            let loopHeaderLoc;
            if (update) {
                updateLoc = new SourceLocation_1.SourceLocation(file, update.loc.start.line, update.loc.start.column, update.loc.end.line, update.loc.end.column);
                loopHeaderLoc = new SourceLocation_1.SourceLocation(file, init.loc.start.line, init.loc.start.column, update.loc.end.line, update.loc.end.column);
            }
            else {
                // if there is no update, then scan the source code until we find the semicolon
                // following the test, and use that as the start of the updater; likewise, scan
                // onwards until we see a close parenthesis, and use that as the end of the updater
                const code = fs.readFileSync(file, "utf8");
                let updateStartLine = test.loc.end.line;
                let updateStartColumn = test.loc.end.column;
                // the loop's updater starts at the position of the first non-newline character after the test
                while ((0, code_utils_1.charAtPosition)(code, updateStartLine, updateStartColumn) !== ";") {
                    const next = (0, code_utils_1.nextPosition)(code, updateStartLine, updateStartColumn);
                    updateStartLine = next.line;
                    updateStartColumn = next.column;
                }
                // the loop's updater ends at the position before a close parenthesis (the end of the loop header)
                let updateEndLine = updateStartLine;
                let updateEndColumn = updateStartColumn;
                while ((0, code_utils_1.charAtPosition)(code, updateEndLine, updateEndColumn) !== ")") {
                    const next = (0, code_utils_1.nextPosition)(code, updateEndLine, updateEndColumn);
                    updateEndLine = next.line;
                    updateEndColumn = next.column;
                }
                updateLoc = new SourceLocation_1.SourceLocation(file, updateStartLine, updateStartColumn, updateEndLine, updateEndColumn);
                loopHeaderLoc = new SourceLocation_1.SourceLocation(file, init.loc.start.line, init.loc.start.column, updateEndLine, updateEndColumn);
            }
            const parentLoc = new SourceLocation_1.SourceLocation(file, path.node.loc.start.line, path.node.loc.start.column, path.node.loc.end.line, path.node.loc.end.column);
            const newPromptSpecs = [
                new PromptSpec_1.PromptSpec(file, "for", "init", initLoc, initLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for", "test", testLoc, testLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for", "update", updateLoc, updateLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for", "header", loopHeaderLoc, loopHeaderLoc.getText(), parentLoc),
            ];
            this.promptSpecs.push(...newPromptSpecs);
        }
    }
    createPromptSpecsForForIn(file, path) {
        if (path.isForInStatement()) {
            const left = path.node.left;
            const right = path.node.right;
            const leftLoc = new SourceLocation_1.SourceLocation(file, left.loc.start.line, left.loc.start.column, left.loc.end.line, left.loc.end.column);
            const rightLoc = new SourceLocation_1.SourceLocation(file, right.loc.start.line, right.loc.start.column, right.loc.end.line, right.loc.end.column);
            const loopHeaderLoc = new SourceLocation_1.SourceLocation(file, left.loc.start.line, left.loc.start.column, right.loc.end.line, right.loc.end.column);
            const parentLoc = new SourceLocation_1.SourceLocation(file, path.node.loc.start.line, path.node.loc.start.column, path.node.loc.end.line, path.node.loc.end.column);
            const newPromptSpecs = [
                new PromptSpec_1.PromptSpec(file, "for-in", "left", leftLoc, leftLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for-in", "right", rightLoc, rightLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for-in", "header", loopHeaderLoc, loopHeaderLoc.getText(), parentLoc),
            ];
            this.promptSpecs.push(...newPromptSpecs);
        }
    }
    createPromptSpecsForForOf(file, path) {
        if (path.isForOfStatement()) {
            const left = path.node.left;
            const right = path.node.right;
            const leftLoc = new SourceLocation_1.SourceLocation(file, left.loc.start.line, left.loc.start.column, left.loc.end.line, left.loc.end.column);
            const rightLoc = new SourceLocation_1.SourceLocation(file, right.loc.start.line, right.loc.start.column, right.loc.end.line, right.loc.end.column);
            const loopHeaderLoc = new SourceLocation_1.SourceLocation(file, left.loc.start.line, left.loc.start.column, right.loc.end.line, right.loc.end.column);
            const parentLoc = new SourceLocation_1.SourceLocation(file, path.node.loc.start.line, path.node.loc.start.column, path.node.loc.end.line, path.node.loc.end.column);
            const newPromptSpecs = [
                new PromptSpec_1.PromptSpec(file, "for-of", "left", leftLoc, leftLoc.getText(), parentLoc),
                new PromptSpec_1.PromptSpec(file, "for-of", "right", rightLoc, rightLoc.getText()),
                new PromptSpec_1.PromptSpec(file, "for-of", "header", loopHeaderLoc, loopHeaderLoc.getText(), parentLoc),
            ];
            this.promptSpecs.push(...newPromptSpecs);
        }
    }
    createPromptSpecsForCall(file, path) {
        if (path.isCallExpression() && path.node.loc.start.line === path.node.loc.end.line) {
            // for now, restrict to calls on a single line
            const callee = path.node.callee;
            const args = path.node.arguments;
            const newPromptSpecs = new Array();
            const calleeLoc = new SourceLocation_1.SourceLocation(file, callee.loc.start.line, callee.loc.start.column, callee.loc.end.line, callee.loc.end.column);
            if (calleeLoc.getText() !== "require") { // don't mutate calls to require
                newPromptSpecs.push(new PromptSpec_1.PromptSpec(file, "call", "callee", calleeLoc, calleeLoc.getText()));
                for (let argNr = 0; argNr < args.length; argNr++) {
                    const arg = args[argNr];
                    const argLoc = new SourceLocation_1.SourceLocation(file, arg.loc.start.line, arg.loc.start.column, arg.loc.end.line, arg.loc.end.column);
                    newPromptSpecs.push(new PromptSpec_1.PromptSpec(file, "call", "arg" + argNr, argLoc, argLoc.getText()));
                }
                if (args.length === 0) {
                    // find location between parentheses
                    const loc = path.node.loc;
                    const allArgsLoc = new SourceLocation_1.SourceLocation(file, callee.loc.end.line, callee.loc.end.column + 1, loc.end.line, loc.end.column - 1);
                    newPromptSpecs.push(new PromptSpec_1.PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText()));
                }
                else if (args.length !== 1) {
                    // skip if there is only one argument because then the same placeholder is already created for the first argument
                    const firstArg = args[0];
                    const lastArg = args[args.length - 1];
                    const allArgsLoc = new SourceLocation_1.SourceLocation(file, firstArg.loc.start.line, firstArg.loc.start.column, lastArg.loc.end.line, lastArg.loc.end.column);
                    const parentLoc = new SourceLocation_1.SourceLocation(file, path.node.loc.start.line, path.node.loc.start.column, path.node.loc.end.line, path.node.loc.end.column);
                    newPromptSpecs.push(new PromptSpec_1.PromptSpec(file, "call", "allArgs", allArgsLoc, allArgsLoc.getText(), parentLoc));
                }
            }
            this.promptSpecs.push(...newPromptSpecs);
        }
    }
    /**
     * Write the promptSpecs to promptSpecs.JSON and the prompts to files "prompts/prompt<NUM>.txt".
     * @param outputDir the name of directory to write the files to
     */
    writePromptFiles() {
        const promptSpecsWithRelativePaths = this.promptSpecs.map((promptSpec) => {
            const relativePath = path.relative(this.packagePath, promptSpec.file);
            const feature = promptSpec.feature;
            const component = promptSpec.component;
            const location = promptSpec.location;
            const orig = promptSpec.orig;
            const parentLocation = promptSpec.parentLocation;
            return {
                file: relativePath,
                feature,
                component,
                location,
                orig,
                parentLocation
            };
        });
        // write promptSpecs to JSON file
        const json = JSON.stringify(promptSpecsWithRelativePaths, null, 2);
        const fileName = path.join(this.outputDir, this.subDir, "promptSpecs.json");
        fs.writeFileSync(path.join(this.outputDir, this.subDir, "promptSpecs.json"), json);
        // write prompts to directory "prompts"
        const dir = path.join(this.outputDir, this.subDir, "prompts");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        for (const prompt of this.prompts) {
            const fileName = path.join(this.outputDir, this.subDir, "prompts", `prompt${prompt.getId()}.txt`);
            fs.writeFileSync(fileName, prompt.getText());
        }
    }
}
exports.PromptSpecGenerator = PromptSpecGenerator;
//# sourceMappingURL=PromptSpecGenerator.js.map