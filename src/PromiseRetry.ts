import { resolve } from "dns";

/**
 * This class provides supports for retrying the creation of a promise
 * a certain number of times. This is useful for, e.g., retrying a request to
 * a server that is temporarily unavailable.
 * 
 */
export async function retryPromise<T>(f: () => Promise<T>, howManyTimes: number): Promise<T>  {
  let i=0;
  let promise: Promise<T> = f(); // create the promise, but don't wait for its fulfillment yet..
  while (i < howManyTimes) {
    try {
      let val: T = await promise; // throws an exception if the promise is rejected
      return val; // if the promise was fulfilled, return another promise that is fulfilled with the same value
    } catch (e) {
      i++;
      promise = f(); // next attempt: create the promise, but don't wait for its fulfillment yet..
    }
  };
  return promise; // if the promise was rejected howManyTimes times, return the last promise
}
