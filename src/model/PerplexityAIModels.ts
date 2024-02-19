import axios from "axios";
import { performance } from "perf_hooks";
import RateLimiter from "../RateLimiter";
import { retry } from '../PromiseRetry';
import { IModel } from "./IModel";
import { PostOptions, defaultPostOptions } from "./IModel";
import { getEnv } from "../util";


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

  constructor(instanceOptions: PostOptions = {}, rateLimit: number, private nrAttempts: number) {
    this.instanceOptions = instanceOptions;
    this.rateLimiter = new RateLimiter(rateLimit);
    console.log(`*** Using ${this.getModelName()} with rate limit ${rateLimit} and ${nrAttempts} attempts`);
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
  ): Promise<Set<string>> {

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
      )), this.nrAttempts);
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
    const completions = new Set<string>();
    completions.add(res.data.choices[0].message.content);
    return completions;
  }
}
/**
 * Abstraction for the codellama-34b-instruct model.
 */

export class CodeLlama34bInstructModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, rateLimit: number = 0, nrAttempts: number = 1) {
    super(instanceOptions, rateLimit, nrAttempts);
  }

  public getModelName(): string {
    return "codellama-34b-instruct";
  }
}
/**
 * Abstraction for the llama2-70b-chat model.
 */

export class Llama2_70bModel extends PerplexityAIModel {

  constructor(instanceOptions: PostOptions = {}, rateLimit: number = 0, nrAttempts: number = 1) {
    super(instanceOptions, rateLimit, nrAttempts);
  }

  public getModelName(): string {
    return "llama-2-70b-chat";
  }
}



