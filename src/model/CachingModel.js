"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingModel = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const IModel_1 = require("./IModel");
/**
 * A model that wraps another model and caches its results.
*/
class CachingModel {
    constructor(model, cacheDir, instanceOptions = {}) {
        this.model = model;
        this.cacheDir = cacheDir;
        this.instanceOptions = instanceOptions;
        this.modelName = `${model.getModelName()}`;
        console.log(`Using cache dir: ${cacheDir}`);
    }
    getModelName() {
        return `${this.modelName}`;
    }
    getTemperature() {
        return this.model.getTemperature();
    }
    getMaxTokens() {
        return this.model.getMaxTokens();
    }
    async query(prompt, requestPostOptions = {}) {
        const options = {
            ...IModel_1.defaultPostOptions,
            // options provided to constructor override default options
            ...this.instanceOptions,
            // options provided to this function override default and instance options
            ...requestPostOptions,
        };
        // compute hash using npm package `crypto`
        const hashKey = JSON.stringify({
            modelName: this.model.getModelName(),
            prompt,
            options
        });
        const hash = crypto_1.default.createHash("sha256").update(hashKey).digest("hex");
        // compute path to cache file
        const cacheDir = path_1.default.join(this.cacheDir, this.model.getModelName(), hash.slice(0, 2));
        const cacheFile = path_1.default.join(cacheDir, hash);
        // if the cache file exists, return its contents
        if (fs_1.default.existsSync(cacheFile)) {
            const completionsJSON = JSON.parse(fs_1.default.readFileSync(cacheFile, "utf-8"));
            const completions = new Set();
            for (const completion of completionsJSON) {
                completions.add(completion);
            }
            return {
                completions,
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0
            };
        }
        else {
            // otherwise, call the wrapped model and cache the result
            const queryResult = await this.model.query(prompt, requestPostOptions);
            const completions = queryResult.completions;
            const prompt_tokens = queryResult.prompt_tokens;
            const completion_tokens = queryResult.completion_tokens;
            const total_tokens = queryResult.total_tokens;
            fs_1.default.mkdirSync(cacheDir, { recursive: true });
            fs_1.default.writeFileSync(cacheFile, JSON.stringify([...completions]));
            return {
                completions,
                prompt_tokens,
                completion_tokens,
                total_tokens
            };
        }
    }
}
exports.CachingModel = CachingModel;
//# sourceMappingURL=CachingModel.js.map