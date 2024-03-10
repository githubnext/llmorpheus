import axios from "axios";
import { performance } from "perf_hooks";
import { BenchmarkRateLimiter, FixedRateLimiter, RateLimiter } from "../util/promise-utils";
import { retry } from "../util/promise-utils";
import { IModel } from "./IModel";
import { PostOptions, defaultPostOptions } from "./IModel";
import { getEnv } from "../util/code-utils";
import { IQueryResult } from "./IQueryResult";
import { MetaInfo } from "../generator/MutantGenerator";


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

  constructor(instanceOptions: PostOptions = {}, private metaInfo: MetaInfo) {
    this.instanceOptions = instanceOptions;
    if (metaInfo.benchmark){
      console.log(`*** Using ${this.getModelName()} with benchmark rate limiter`);
      this.rateLimiter = new BenchmarkRateLimiter();
      metaInfo.nrAttempts = 3;
    } else if (metaInfo.rateLimit > 0) {
      this.rateLimiter = new FixedRateLimiter(metaInfo.rateLimit);
      console.log(`*** Using ${this.getModelName()} with rate limit: ${metaInfo.rateLimit} and ${metaInfo.nrAttempts} attempts`);
    } else {
      this.rateLimiter = new FixedRateLimiter(0);
      console.log(`*** Using ${this.getModelName()} with no rate limit and ${metaInfo.nrAttempts} attempts`);
    }
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
  ): Promise<IQueryResult> {

    const options: PostOptions = {
      ...defaultPostOptions,
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
    performance.mark("llm-query-start");
    let res;
    try {
      res = await retry(() => this.rateLimiter.next(() => axios.post(
        this.apiEndpoint,
        body,
        { headers: this.header }
      )), this.metaInfo.nrAttempts);
      // console.log(`*** completion is: ${res.data.response}`);
    } catch (e) {
      if (res?.status === 429) {
        console.error(`*** 429 error: ${e}`);
      }
      throw e;
    }

    performance.measure(
      `llm-query:${JSON.stringify({
        ...options,
        promptLength: prompt.length,
      })}`,
      "llm-query-start"
    );
    if (res.status !== 200) {
      throw new Error(
        `Request failed with status ${res.status} and message ${res.statusText}`
      );
    }
    if (!res.data) {
      throw new Error("Response data is empty");
    }

    const prompt_tokens = res.data.usage.prompt_tokens;
    const completion_tokens = res.data.usage.completion_tokens;
    const total_tokens = res.data.usage.total_tokens;
    console.log(`*** prompt tokens: ${prompt_tokens}, completion tokens: ${completion_tokens}, total tokens: ${total_tokens}`);

    const completions = new Set<string>();
    completions.add(res.data.choices[0].message.content);
    return {
      completions,
      prompt_tokens,
      completion_tokens,
      total_tokens
    };
  }
}
/**
 * Abstraction for the codellama-34b-instruct model.
 */

export class CodeLlama34bInstructModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, metaInfo: MetaInfo) {
    super(instanceOptions, metaInfo);
  }

  public getModelName(): string {
    return "codellama-34b-instruct";
  }
}

/**
 * Abstraction for the codellama-70b-instruct model.
 */

export class CodeLlama70bInstructModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, metaInfo: MetaInfo) {
    super(instanceOptions, metaInfo);
  }

  public getModelName(): string {
    return "codellama-70b-instruct";
  }
}

/**
 * Abstraction for the codellama-70b-instruct model.
 */

export class Mistral7bInstructModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, metaInfo: MetaInfo) {
    super(instanceOptions, metaInfo);
  }

  public getModelName(): string {
    return "mistral-7b-instruct";
  }
}

/**
 * Abstraction for the codellama-70b-instruct model.
 */

export class Mixtral8x7bInstructModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, metaInfo: MetaInfo) {
    super(instanceOptions, metaInfo);
  }

  public getModelName(): string {
    return "mixtral-8x7b-instruct";
  }
}

