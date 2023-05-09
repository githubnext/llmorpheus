"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.CachingModel = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const perf_hooks_1 = require("perf_hooks");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const defaultPostOptions = {
    max_tokens: 100,
    temperature: 0,
    n: 5,
    stop: ['\n\n'],
    top_p: 1,
    logprobs: 1,
    logit_bias: { "50256": -100 },
};
function getEnv(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`Please set the ${name} environment variable.`);
        process.exit(1);
    }
    return value;
}
const ROOT_CACHE_DIR = path_1.default.join(__dirname, "..", ".llm-cache");
console.log(`Using cache dir: ${ROOT_CACHE_DIR}`);
class CachingModel {
    constructor(model) {
        this.cache = new Map();
        this.modelName = `Caching<${model.getModelName()}>`;
        this.model = model;
    }
    getModelName() {
        return `Cached<${this.model.getModelName()}>`;
    }
    async query(prompt, options = {}) {
        // compute hash using npm package `crypto`
        const hash = crypto_1.default
            .createHash("sha256")
            .update(JSON.stringify({
            modelName: this.model.getModelName(),
            prompt,
            options,
        }))
            .digest("hex");
        // compute path to cache file
        const cacheDir = path_1.default.join(ROOT_CACHE_DIR, hash.slice(0, 2));
        const cacheFile = path_1.default.join(cacheDir, hash);
        // if the cache file exists, return its contents
        if (fs_1.default.existsSync(cacheFile)) {
            const completionsJSON = JSON.parse(fs_1.default.readFileSync(cacheFile, "utf-8"));
            const completions = new Set();
            for (const completion of completionsJSON) {
                completions.add(completion);
            }
            return completions;
        }
        else {
            // otherwise, call the wrapped model and cache the result
            const completions = await this.model.query(prompt, options);
            fs_1.default.mkdirSync(cacheDir, { recursive: true });
            fs_1.default.writeFileSync(cacheFile, JSON.stringify([...completions]));
            return completions;
        }
    }
}
exports.CachingModel = CachingModel;
class Model {
    constructor(instanceOptions = {}) {
        this.instanceOptions = instanceOptions;
    }
    getModelName() {
        return "text-davinci-003";
    }
    /**
     * Query Model for completions with a given prompt.
     *
     * @param prompt The prompt to use for the completion.
     * @param requestPostOptions The options to use for the request.
     * @returns A promise that resolves to a set of completions.
     */
    async query(prompt, requestPostOptions = {}) {
        // const apiEndpoint = getEnv("TESTPILOT_CODEX_API_ENDPOINT");
        // const authHeaders = getEnv("TESTPILOT_CODEX_AUTH_HEADERS");
        const apiEndpoint = getEnv("MTEST_CODEX_API_ENDPOINT");
        const authHeaders = getEnv("MTEST_CODEX_AUTH_HEADERS");
        const headers = {
            "Content-Type": "application/json",
            ...JSON.parse(authHeaders),
        };
        const options = {
            ...defaultPostOptions,
            // options provided to constructor override default options
            ...this.instanceOptions,
            // options provided to this function override default and instance options
            ...requestPostOptions,
        };
        perf_hooks_1.performance.mark("codex-query-start");
        const res = await axios_1.default.post(apiEndpoint, { prompt, ...options }, { headers });
        perf_hooks_1.performance.measure(`codex-query:${JSON.stringify({
            ...options,
            promptLength: prompt.length,
        })}`, "codex-query-start");
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
exports.Model = Model;
if (require.main === module) {
    (async () => {
        const model = new Model();
        const prompt = fs_1.default.readFileSync(0, "utf8");
        const responses = await model.query(prompt, { n: 1 });
        console.log([...responses][0]);
    })().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
//# sourceMappingURL=model.js.map