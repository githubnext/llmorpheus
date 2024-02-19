"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Llama2_70bModel = exports.CodeLlama34bInstructModel = exports.PerplexityAIModel = void 0;
const axios_1 = __importDefault(require("axios"));
const perf_hooks_1 = require("perf_hooks");
const RateLimiter_1 = __importDefault(require("../RateLimiter"));
const PromiseRetry_1 = require("../PromiseRetry");
const IModel_1 = require("./IModel");
const util_1 = require("../util");
class PerplexityAIModel {
    constructor(instanceOptions = {}, rateLimit, nrAttempts) {
        this.nrAttempts = nrAttempts;
        this.apiEndpoint = (0, util_1.getEnv)("PERPLEXITY_AI_API_ENDPOINT");
        this.header = {
            'accept': 'application/json',
            'authorization': (0, util_1.getEnv)("PERPLEXITY_AI_AUTH_HEADERS"),
            'content-type': 'application/json'
        };
        this.instanceOptions = instanceOptions;
        this.rateLimiter = new RateLimiter_1.default(rateLimit);
        console.log(`*** Using ${this.getModelName()} with rate limit ${rateLimit} and ${nrAttempts} attempts`);
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
    /**
    * Query Model for completions with a given prompt.
    *
    * @param prompt The prompt to use for the completion.
    * @param requestPostOptions The options to use for the request.
    * @returns A promise that resolves to a set of completions.
    */
    async query(prompt, requestPostOptions = {}) {
        const options = {
            ...IModel_1.defaultPostOptions,
            // options provided to constructor override default options
            ...this.instanceOptions,
            // options provided to this function override default and instance options
            ...requestPostOptions,
        };
        const body = {
            model: this.getModelName(),
            messages: [
                { role: 'system', content: 'You are a programming assistant. You are expected to be concise and precise and avoid any unnecessary examples, tests, and verbosity.' },
                { role: 'user', content: prompt }
            ],
            ...options
        };
        // console.log(`*** body = ${JSON.stringify(body)}`);
        perf_hooks_1.performance.mark("llm-query-start");
        let res;
        try {
            res = await (0, PromiseRetry_1.retry)(() => this.rateLimiter.next(() => axios_1.default.post(this.apiEndpoint, body, { headers: this.header })), this.nrAttempts);
            // console.log(`*** completion is: ${res.data.response}`);
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
        const completions = new Set();
        completions.add(res.data.choices[0].message.content);
        return completions;
    }
}
exports.PerplexityAIModel = PerplexityAIModel;
/**
 * Abstraction for the codellama-34b-instruct model.
 */
class CodeLlama34bInstructModel extends PerplexityAIModel {
    constructor(instanceOptions = {}, rateLimit = 0, nrAttempts = 1) {
        super(instanceOptions, rateLimit, nrAttempts);
    }
    getModelName() {
        return "codellama-34b-instruct";
    }
}
exports.CodeLlama34bInstructModel = CodeLlama34bInstructModel;
/**
 * Abstraction for the llama2-70b-chat model.
 */
class Llama2_70bModel extends PerplexityAIModel {
    constructor(instanceOptions = {}, rateLimit = 0, nrAttempts = 1) {
        super(instanceOptions, rateLimit, nrAttempts);
    }
    getModelName() {
        return "llama-2-70b-chat";
    }
}
exports.Llama2_70bModel = Llama2_70bModel;
//# sourceMappingURL=PerplexityAIModels.js.map