import axios from "axios";
import fs from "fs";
import { performance } from "perf_hooks";
import path from "path";
import crypto from "crypto";
import RateLimiter from "./RateLimiter";
import { retry } from './PromiseRetry';

const defaultPostOptions = {
  max_tokens: 250, // maximum number of tokens to return
  temperature: 0, // sampling temperature; higher values increase diversity
  n: 5, // number of completions to return
  stop: ["\n\n"], // list of tokens to stop at
  top_p: 1, // no need to change this
};
export type PostOptions = Partial<typeof defaultPostOptions>;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Please set the ${name} environment variable.`);
    process.exit(1);
  }
  return value;
}

/**
 * A model that can be queried to generate a set of completions for a given prompt.
 */
export interface IModel {
  query(prompt: string, requestPostOptions?: PostOptions): Promise<Set<string>>;
  getModelName(): string;
  getTemperature(): number;
  getMaxTokens(): number;
  getN(): number;
}

/**
 * Abstraction for the text-davinci-003 model.
 */
export class TextDavinci003Model implements IModel {
  private instanceOptions: PostOptions;

  constructor(instanceOptions: PostOptions = {}) {
    this.instanceOptions = instanceOptions;
  }

  public getModelName(): string {
    return "text-davinci-003";
  }
  public getTemperature(): number {
    if (this.instanceOptions.temperature === undefined) {
      return defaultPostOptions.temperature;
    }
    return this.instanceOptions.temperature;
  }

  public getMaxTokens(): number {
    if (this.instanceOptions.max_tokens === undefined) {
      return defaultPostOptions.max_tokens;
    }
    return this.instanceOptions.max_tokens;
  }

  public getN(): number {
    if (this.instanceOptions.n === undefined) {
      return defaultPostOptions.n;
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
  public async query(
    prompt: string,
    requestPostOptions: PostOptions = {}
  ): Promise<Set<string>> {
    const apiEndpoint = getEnv("TEXTDAVINCI003_API_ENDPOINT");
    const authHeaders = getEnv("TEXTDAVINCI003_AUTH_HEADERS");
    
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

    performance.mark("codex-query-start");
    const res = await axios.post(
      apiEndpoint,
      { prompt, ...options },
      { headers }
    );
    performance.measure(
      `codex-query:${JSON.stringify({
        ...options,
        promptLength: prompt.length,
      })}`,
      "codex-query-start"
    );
    if (res.status !== 200) {
      throw new Error(
        `Request failed with status ${res.status} and message ${res.statusText}`
      );
    }
    if (!res.data) {
      throw new Error("Response data is empty");
    }
    const json = res.data;
    if (json.error) {
      throw new Error(json.error);
    }
    let numContentFiltered = 0;
    const completions = new Set<string>(
      (json.choices || [{ text: "" }]).map((c: any) => {
        if (c.finish_reason === "content_filter") {
          numContentFiltered++;
        }
        return c.text;
      })
    );
    if (numContentFiltered > 0) {
      console.warn(
        `${numContentFiltered} completions were truncated due to content filtering.`
      );
    }
    return completions;
  }
}

/**
 * Abstraction for the gpt4 model.
 */
export class Gpt4Model implements IModel {
  private instanceOptions: PostOptions;

  constructor(instanceOptions: PostOptions = {}) {
    this.instanceOptions = instanceOptions;
  }

  public getModelName(): string {
    return "gpt4";
  }

  public getTemperature(): number {
    if (this.instanceOptions.temperature === undefined) {
      return defaultPostOptions.temperature;
    }
    return this.instanceOptions.temperature;
  }

  public getMaxTokens(): number {
    if (this.instanceOptions.max_tokens === undefined) {
      return defaultPostOptions.max_tokens;
    }
    return this.instanceOptions.max_tokens;
  }

  public getN(): number {
    if (this.instanceOptions.n === undefined) {
      return defaultPostOptions.n;
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
  public async query(
    prompt: string,
    requestPostOptions: PostOptions = {}
  ): Promise<Set<string>> {
    const apiEndpoint = getEnv("GPT4_API_ENDPOINT");
    const apiKey = getEnv("GPT4_API_KEY");

    const headers = {
      "Content-Type": "application/json",
      "api-key": apiKey,
    };
    const options = {
      ...defaultPostOptions,
      // options provided to constructor override default options
      ...this.instanceOptions,
      // options provided to this function override default and instance options
      ...requestPostOptions,
    };

    performance.mark("codex-query-start");
    let res;
    try {
      res = await axios.post(
        apiEndpoint,
        { prompt, ...options },
        { headers }
      );
    } catch (e) {
      if (res?.status === 429) {
        console.error(`*** 429 error: ${e}`);
      }
      throw e;
    }

    performance.measure(
      `codex-query:${JSON.stringify({
        ...options,
        promptLength: prompt.length,
      })}`,
      "codex-query-start"
    );
    if (res.status !== 200) {
      throw new Error(
        `Request failed with status ${res.status} and message ${res.statusText}`
      );
    }
    if (!res.data) {
      throw new Error("Response data is empty");
    }
    const json = res.data;
    if (json.error) {
      throw new Error(json.error);
    }
    let numContentFiltered = 0;
    const completions = new Set<string>(
      (json.choices || [{ text: "" }]).map((c: any) => {
        if (c.finish_reason === "content_filter") {
          numContentFiltered++;
        }
        return c.text;
      })
    );
    if (numContentFiltered > 0) {
      console.warn(
        `${numContentFiltered} completions were truncated due to content filtering.`
      );
    }
    return completions;
  }
}

export abstract class PerplexityAIModel implements IModel {
  protected readonly apiEndpoint = getEnv("PERPLEXITY_AI_API_ENDPOINT");

  protected readonly header = {
    'accept': 'application/json',
    'authorization': getEnv("PERPLEXITY_AI_AUTH_HEADERS"),
    'content-type': 'application/json'
  };

  public abstract getModelName(): string;

  protected instanceOptions: PostOptions;
  protected rateLimiter: RateLimiter;

  constructor(instanceOptions: PostOptions = {}) {
    this.instanceOptions = instanceOptions;
    this.rateLimiter = new RateLimiter(2000); // at most one request every 10 seconds
  }

  public getTemperature(): number {
    if (this.instanceOptions.temperature === undefined) {
      return defaultPostOptions.temperature;
    }
    return this.instanceOptions.temperature;
  }

  public getMaxTokens(): number {
    if (this.instanceOptions.max_tokens === undefined) {
      return defaultPostOptions.max_tokens;
    }
    return this.instanceOptions.max_tokens;
  }

  public getN(): number {
    return 1; // perplexity.ai models only return one completion
  }

   /**
   * Query Model for completions with a given prompt.
   *
   * @param prompt The prompt to use for the completion.
   * @param requestPostOptions The options to use for the request.
   * @returns A promise that resolves to a set of completions.
   */
   public async query(
    prompt: string,
    requestPostOptions: PostOptions = {}
  ): Promise<Set<string>> {
    
    const options: PostOptions = {
      ...defaultPostOptions,
      // options provided to constructor override default options
      ...this.instanceOptions,
      // options provided to this function override default and instance options
      ...requestPostOptions,
    };
     // remove stop, n property from options
     delete options.stop;
     delete options.n;

    const body = {
      model: this.getModelName(),
      messages: [
        {role: 'system', content: 'You are a programming assistant. You are expected to be concise and precise and avoid any unnecessary examples, tests, and verbosity.'},
        {role: 'user', content: prompt}
      ],
      ...options
    };

    // console.log(`*** body = ${JSON.stringify(body)}`);

    performance.mark("codex-query-start");
    let res;
    try {
      res = await retry(() => this.rateLimiter.next(() => axios.post(
        this.apiEndpoint,
        body,
        { headers: this.header }
      )), 3);
      // console.log(`*** completion is: ${res.data.response}`);
    } catch (e) {
      if (res?.status === 429) {
        console.error(`*** 429 error: ${e}`);
      }
      throw e;
    }

    performance.measure(
      `codex-query:${JSON.stringify({
        ...options,
        promptLength: prompt.length,
      })}`,
      "codex-query-start"
    );
    if (res.status !== 200) {
      throw new Error(
        `Request failed with status ${res.status} and message ${res.statusText}`
      );
    }
    if (!res.data) {
      throw new Error("Response data is empty");
    }
    const completions = new Set<string>();
    completions.add(res.data.choices[0].message.content);
    return completions;
  }
}

/**
 * Abstraction for the codellama-34b-instruct model.
 */
export class CodeLlama34bInstructModel extends PerplexityAIModel {
  
  constructor(instanceOptions: PostOptions = {}) {
    super(instanceOptions);
  }

  public getModelName(): string {
    return "codellama-34b-instruct";
  }
}

/**
 * Abstraction for the llama2-70b-chat model.
 */
export class Llama2_70bModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}) {
    super(instanceOptions);
  }

  public getModelName(): string {
    return "llama-2-70b-chat";
  }
}

const ROOT_CACHE_DIR = path.join(__dirname, "..", ".llm-cache");
console.log(`Using cache dir: ${ROOT_CACHE_DIR}`);

/**
 * A model that wraps another model and caches its results.
 */
export class CachingModel implements IModel {
  private modelName: string;

  constructor(private model: IModel, private instanceOptions: PostOptions = {}) {
    this.modelName = `Caching<${model.getModelName()}>`;
  }
  getModelName(): string {
    return `${this.modelName}>`;
  }
  getTemperature(): number {
    return this.model.getTemperature();
  }
  getMaxTokens(): number {
    return this.model.getMaxTokens();
  }

  getN(): number {
    return this.model.getN();
  }

  public async query(
    prompt: string,
    requestPostOptions: PostOptions = {}
  ): Promise<Set<string>> {


    const options: PostOptions = {
      ...defaultPostOptions,
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

    const hash = crypto.createHash("sha256").update(hashKey).digest("hex");

    // compute path to cache file
    const cacheDir = path.join(
      ROOT_CACHE_DIR,
      this.model.getModelName(),
      hash.slice(0, 2)
    );
    const cacheFile = path.join(cacheDir, hash);

    // if the cache file exists, return its contents
    if (fs.existsSync(cacheFile)) {
      const completionsJSON = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      const completions = new Set<string>();
      for (const completion of completionsJSON) {
        completions.add(completion);
      }
      return completions;
    } else {
      // otherwise, call the wrapped model and cache the result
      const completions = await this.model.query(prompt, requestPostOptions);
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify([...completions]));
      return completions;
    }
  }
}

/**
 * A mock model that extracts its responses from a directory containing previously recorded cache files.
 */
export class MockModel implements IModel {
  private modelName: string;
  constructor(modelName: string, private modelDir: string) {
    this.modelName = `${modelName}`;
  }

  getModelName(): string {
    return this.modelName;
  }
  getTemperature(): number {
    return defaultPostOptions.temperature;
  }
  getMaxTokens(): number {
    return defaultPostOptions.max_tokens;
  }
  getN(): number {
    return defaultPostOptions.n;
  }

  public async query(
    prompt: string,
    options: PostOptions = {}
  ): Promise<Set<string>> {
    // compute hash using npm package `crypto`
    const hashKey = JSON.stringify({
      modelName: this.modelName,
      prompt,
      options,
    });
    const hash = crypto.createHash("sha256").update(hashKey).digest("hex");

    // compute path to cache file
    const cacheDir = path.join(this.modelDir, hash.slice(0, 2));
    const cacheFile = path.join(cacheDir, hash);
    // if the cache file exists, return its contents
    if (fs.existsSync(cacheFile)) {
      const completionsJSON = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      const completions = new Set<string>();
      for (const completion of completionsJSON) {
        completions.add(completion);
      }
      return completions;
    } else {
      throw new Error(`MockModel: cache file ${cacheFile} does not exist`);
    }
  }
}

if (require.main === module) {
  (async () => {
    const model = new TextDavinci003Model();
    const prompt = fs.readFileSync(0, "utf8");
    const responses = await model.query(prompt, { n: 1 });
    console.log([...responses][0]);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
