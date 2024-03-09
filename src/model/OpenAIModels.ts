import axios from "axios";
import { performance } from "perf_hooks";
import { IModel } from "./IModel";
import { OpenAIPostOptions, defaultPostOptions, defaultOpenAIPostoptions } from "./IModel";
import { getEnv } from "../util/code-utils";
import { IQueryResult } from "./IQueryResult";

/**
 * Interface for the OpenAI model.
 */
export interface OpenAIModel extends IModel {
  getN(): number;
}

/**
 * Abstraction for the gpt4 model.
 */

export class Gpt4Model implements OpenAIModel {
  private instanceOptions: OpenAIPostOptions;

  constructor(instanceOptions: OpenAIPostOptions = {}) {
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
      return defaultOpenAIPostoptions.n;
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
    requestPostOptions: OpenAIPostOptions = {}
  ): Promise<IQueryResult> {
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

    performance.mark("llm-query-start");
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
    return {
      completions,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };
  }
}
