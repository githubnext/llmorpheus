import axios from "axios";
import fs from "fs";
import { performance } from "perf_hooks";
import path from "path";
import crypto from "crypto";

const defaultPostOptions = {
  max_tokens: 100, // maximum number of tokens to return
  temperature: 0, // sampling temperature; higher values increase diversity
  n: 5, // number of completions to return
  stop: ['\n\n'],   // list of tokens to stop at
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

  /**
   * Query Model for completions with a given prompt.
   *
   * @param prompt The prompt to use for the completion.
   * @param requestPostOptions The options to use for the request.
   * @returns A promise that resolves to a set of completions.
   */
  public async query(prompt: string, requestPostOptions: PostOptions = {}): Promise<Set<string>> {
   
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
 * Abstraction for the gpt3.5-turbo model.
 */
export class Gpt35TurboModel implements IModel {
  private instanceOptions: PostOptions;

  constructor(instanceOptions: PostOptions = {}) {
    this.instanceOptions = instanceOptions;
  }

  public getModelName(): string {
    return "gpt3.5-turbo";
  }

  /**
   * Query Model for completions with a given prompt.
   *
   * @param prompt The prompt to use for the completion.
   * @param requestPostOptions The options to use for the request.
   * @returns A promise that resolves to a set of completions.
   */
  public async query(prompt: string, requestPostOptions: PostOptions = {}): Promise<Set<string>> {
   
    const apiEndpoint = getEnv("GPT35_API_ENDPOINT"); 
    const apiKey = getEnv("GPT35_API_KEY"); 

    const headers = {
      "Content-Type": "application/json",
      "api-key": apiKey
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

const ROOT_CACHE_DIR = path.join(__dirname, "..", ".llm-cache");
console.log(`Using cache dir: ${ROOT_CACHE_DIR}`);

/**
 * A model that wraps another model and caches its results.
 */
export class CachingModel implements IModel {
  private model: IModel;
  private modelName: string;

  constructor(model: IModel) {
    this.modelName = `Caching<${model.getModelName()}>`;
    this.model = model;
  }
  getModelName(): string {
    return `${this.modelName}>`;
  }

  public async query(prompt: string, options: PostOptions = {}): Promise<Set<string>> {
    // compute hash using npm package `crypto`
    const hashKey = JSON.stringify({
      modelName: this.model.getModelName(),
      prompt,
      options,
    });
    const hash = crypto
    .createHash("sha256")
    .update(hashKey)
    .digest("hex");
  
    // compute path to cache file
    const cacheDir = path.join(ROOT_CACHE_DIR, this.model.getModelName(), hash.slice(0, 2));
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
      const completions = await this.model.query(prompt, options);
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

  public async query(prompt: string, options: PostOptions = {}): Promise<Set<string>> {
    // compute hash using npm package `crypto`
    const hashKey = JSON.stringify({
      modelName: this.modelName, 
      prompt,
      options,
    });
    const hash = crypto
    .createHash("sha256")
    .update(hashKey)
    .digest("hex");
  
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
