
/**
 * This class provides supports for retrying the creation of a promise
 * up to a given number of times in case the promise is rejected.
 * This is useful for, e.g., retrying a request to a server that is temporarily unavailable.
 *
 */
export async function retry<T>(f: () => Promise<T>, howManyTimes: number): Promise<T> {
  let i = 1;
  let promise: Promise<T> = f(); // create the promise, but don't wait for its fulfillment yet..
  while (i <= howManyTimes) {
    try {
      if (i > 1) {
        console.log(`  retry ${i}/${howManyTimes}`);
      }
      let val: T = await promise; // throws an exception if the promise is rejected
      return val; // if the promise was fulfilled, return another promise that is fulfilled with the same value
    } catch (e) {
      i++;
      console.log(`Promise rejected with ${e}.`);
      promise = f(); // next attempt: create the promise, but don't wait for its fulfillment yet..
    }
  };
  return promise; // if the promise was rejected howManyTimes times, return the last promise
}/**
 * This class provides supports for asynchronous rate limiting by
 * limiting the number of requests to the server to at most one
 * in N milliseconds. This is useful for throttling requests to
 * a server that has a limit on the number of requests per second.
 *
 */
export default class RateLimiter {

  /**
   * the timer is a promise that is resolved after a certain number of milliseconds
   * have elapsed. The timer is reset after each request.
   */
  private timer: Promise<void>;

  constructor(private howManyMilliSeconds: number) {
    this.timer = this.resetTimer();
  }

  /**
   * resets the timer
   * @returns a promise that is resolved after the number of milliseconds
   *         specified in the constructor have elapsed
   */
  private resetTimer = () => new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, this.howManyMilliSeconds);
  });

  /**
   *  Waits until the timer has expired, then evaluate the function that
   * produces the promise
   * @param p a function that produces a promise
   * @returns returns the promise produced by the function p (after the timer has expired)
   */
  public async next<T>(p: () => Promise<T>): Promise<T> {
    await this.timer; // wait until timer has expired
    this.timer = this.resetTimer(); // reset timer (for the next request)
    return p(); // return the promise
  }
}

