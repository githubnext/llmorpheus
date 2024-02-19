"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gpt4Model = void 0;
const axios_1 = __importDefault(require("axios"));
const perf_hooks_1 = require("perf_hooks");
const IModel_1 = require("./IModel");
const code_utils_1 = require("../util/code-utils");
/**
 * Abstraction for the gpt4 model.
 */
class Gpt4Model {
    constructor(instanceOptions = {}) {
        this.instanceOptions = instanceOptions;
    }
    getModelName() {
        return "gpt4";
    }
    getTemperature() {
        if (this.instanceOptions.temperature === undefined) {
            return IModel_1.defaultPostOptions.temperature;
        }
        return this.instanceOptions.temperature;
    }
    getMaxTokens() {
        if (this.instanceOptions.max_tokens === undefined) {
            return IModel_1.defaultPostOptions.max_tokens;
        }
        return this.instanceOptions.max_tokens;
    }
    getN() {
        if (this.instanceOptions.n === undefined) {
            return IModel_1.defaultOpenAIPostoptions.n;
        }
        return this.instanceOptions.n;
    }
    /**
     * Query Model for completions with a given prompt.
     *
     * @param prompt The prompt to use for the completion.
     * @param requestPostOptions The options to use for the request.
     * @returns A promise that resolves to a set of completions.
     */
    async query(prompt, requestPostOptions = {}) {
        const apiEndpoint = (0, code_utils_1.getEnv)("GPT4_API_ENDPOINT");
        const apiKey = (0, code_utils_1.getEnv)("GPT4_API_KEY");
        const headers = {
            "Content-Type": "application/json",
            "api-key": apiKey,
        };
        const options = {
            ...IModel_1.defaultPostOptions,
            // options provided to constructor override default options
            ...this.instanceOptions,
            // options provided to this function override default and instance options
            ...requestPostOptions,
        };
        perf_hooks_1.performance.mark("llm-query-start");
        let res;
        try {
            res = await axios_1.default.post(apiEndpoint, { prompt, ...options }, { headers });
        }
        catch (e) {
            if ((res === null || res === void 0 ? void 0 : res.status) === 429) {
                console.error(`*** 429 error: ${e}`);
            }
            throw e;
        }
        perf_hooks_1.performance.measure(`llm-query:${JSON.stringify({
            ...options,
            promptLength: prompt.length,
        })}`, "llm-query-start");
        if (res.status !== 200) {
            throw new Error(`Request failed with status ${res.status} and message ${res.statusText}`);
        }
        if (!res.data) {
            throw new Error("Response data is empty");
        }
        const json = res.data;
        if (json.error) {
            throw new Error(json.error);
        }
        let numContentFiltered = 0;
        const completions = new Set((json.choices || [{ text: "" }]).map((c) => {
            if (c.finish_reason === "content_filter") {
                numContentFiltered++;
            }
            return c.text;
        }));
        if (numContentFiltered > 0) {
            console.warn(`${numContentFiltered} completions were truncated due to content filtering.`);
        }
        return completions;
    }
}
exports.Gpt4Model = Gpt4Model;
//# sourceMappingURL=OpenAIModels.js.map