/**
 * This class provides supports for asynchronous rate limiting by
 * limiting the number of requests to the server to at most one
 * in N milliseconds. This is useful for throttling requests to
 * a server that has a limit on the number of requests per second.
 * 
 */
export default class RateLimiter{
  
  /**
   * the timer is a promise that is resolved after a certain number of milliseconds
   * have elapsed. The timer is reset after each request.
   */
  private timer: Promise<void>;

  constructor(private howManyMilliSeconds: number){
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
  public async next<T>(p: () => Promise<T>): Promise<T>{
    await this.timer; // wait until timer has expired
    this.timer = this.resetTimer(); // reset timer (for the next request)
    return p(); // return the promise
  }
}