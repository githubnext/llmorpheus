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
exports.PromptGenerator = exports.Completion = exports.Prompt = void 0;
const fs_1 = __importDefault(require("fs"));
const handlebars = __importStar(require("handlebars"));
const rule_1 = require("./rule");
class Prompt {
    constructor(id, fileName, chunkNr, rule, text) {
        this.id = id;
        this.fileName = fileName;
        this.chunkNr = chunkNr;
        this.rule = rule;
        this.text = text;
    }
    static fromJSON(json) {
        const r = new rule_1.Rule(json.rule.ruleId, json.rule.rule, json.rule.description);
        return new Prompt(json.id, json.fileName, json.chunkNr, r, json.text);
    }
    toString() {
        return `prompt<id: ${this.id}, fileName: ${this.fileName}, chunkNr: ${this.chunkNr}, rule: ${this.rule}, text: ${this.text}>`;
    }
    getId() {
        return this.id;
    }
    getText() {
        return this.text;
    }
    getFileName() {
        return this.fileName;
    }
    getChunkNr() {
        return this.chunkNr;
    }
    getRule() {
        return this.rule;
    }
}
exports.Prompt = Prompt;
class Completion {
    constructor(promptId, id, text) {
        this.promptId = promptId;
        this.id = id;
        this.text = text;
    }
    static fromJSON(json) {
        return new Completion(json.promptId, json.id, json.text);
    }
    toString() {
        return `completion<id: ${this.id}, promptId: ${this.promptId}, text: ${this.text}>`;
    }
    getPromptId() {
        return this.promptId;
    }
    getId() {
        return this.id;
    }
    getText() {
        return this.text;
    }
}
exports.Completion = Completion;
/**
 * Component for creating a prompt for a given rule and original code.
 *  @param promptTemplateFileName The name of the file containing the prompt template.
 */
class PromptGenerator {
    constructor(promptTemplateFileName) {
        this.promptTemplateFileName = promptTemplateFileName;
        this.template = fs_1.default.readFileSync(this.promptTemplateFileName, "utf8");
    }
    /**
     * Creates a prompt for a given rule and original code.
     * @param origCode The original code.
     * @param rule The rule.
     * @returns The prompt.
     */
    createPrompt(id, fileName, chunkNr, origCode, rule) {
        const compiledTemplate = handlebars.compile(this.template);
        const text = compiledTemplate({ origCode: origCode, rule: rule, symbols: [...rule.getLHSterminals()].toString() });
        return new Prompt(id, fileName, chunkNr, rule, text);
    }
}
exports.PromptGenerator = PromptGenerator;
//# sourceMappingURL=prompt.js.map