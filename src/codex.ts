import axios from "axios";
import fs from "fs";
import { performance } from "perf_hooks";

const defaultPostOptions = {
  max_tokens: 100, // maximum number of tokens to return
  temperature: 0, // sampling temperature; higher values increase diversity
  n: 5, // number of completions to return
  stop: ['\n\n'],   // list of tokens to stop at
  top_p: 1, // no need to change this
  logprobs: 1, // no need to change this
  logit_bias: { "50256": -100 },
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

export class Codex {
  private instanceOptions: PostOptions;

  constructor(instanceOptions: PostOptions = {}) {
    this.instanceOptions = instanceOptions;
  }

  /**
   * Query Codex for completions with a given prompt.
   *
   * @param prompt The prompt to use for the completion.
   * @param requestPostOptions The options to use for the request.
   * @returns A promise that resolves to a set of completions.
   */
  public async query(
    prompt: string,
    requestPostOptions: PostOptions = {}
  ): Promise<Set<string>> {
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

if (require.main === module) {
  (async () => {
    const codex = new Codex();
    const prompt = fs.readFileSync(0, "utf8");
    const responses = await codex.query(prompt, { n: 1 });
    console.log([...responses][0]);
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
