"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkRateLimiter = exports.FixedRateLimiter = exports.RateLimiter = exports.retry = void 0;
/**
 * This class provides supports for retrying the creation of a promise
 * up to a given number of times in case the promise is rejected.
 * This is useful for, e.g., retrying a request to a server that is temporarily unavailable.
 *
 */
async function retry(f, howManyTimes) {
    let i = 1;
    let promise = f(); // create the promise, but don't wait for its fulfillment yet..
    while (i <= howManyTimes) {
        try {
            if (i > 1) {
                console.log(`  retry ${i}/${howManyTimes}`);
            }
            let val = await promise; // throws an exception if the promise is rejected
            return val; // if the promise was fulfilled, return another promise that is fulfilled with the same value
        }
        catch (e) {
            i++;
            console.log(`Promise rejected with ${e}.`);
            promise = f(); // next attempt: create the promise, but don't wait for its fulfillment yet..
        }
    }
    ;
    return promise; // if the promise was rejected howManyTimes times, return the last promise
}
exports.retry = retry;
/**
 * This class provides supports for asynchronous rate limiting by
 * limiting the number of requests to the server to at most one
 * in N milliseconds. This is useful for throttling requests to
 * a server that has a limit on the number of requests per second.
 *
 */
class RateLimiter {
    constructor(howManyMilliSeconds) {
        this.howManyMilliSeconds = howManyMilliSeconds;
        /**
         * resets the timer
         * @returns a promise that is resolved after the number of milliseconds
         *         specified in the constructor have elapsed
         */
        this.resetTimer = () => new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, this.howManyMilliSeconds);
        });
        this.timer = this.resetTimer();
    }
    /**
     *  Waits until the timer has expired, then evaluate the function that
     * produces the promise
     * @param p a function that produces a promise
     * @returns returns the promise produced by the function p (after the timer has expired)
     */
    async next(p) {
        await this.timer; // wait until timer has expired
        this.timer = this.resetTimer(); // reset timer (for the next request)
        return p(); // return the promise
    }
}
exports.RateLimiter = RateLimiter;
/**
 * A rate limiter that limits the number of requests to the server to a
 * maximum of one per N milliseconds.
 *
 */
class FixedRateLimiter extends RateLimiter {
    constructor(N) {
        super(N);
    }
}
exports.FixedRateLimiter = FixedRateLimiter;
/**
 * A custom rate limiter for use during benchmark runs. It increases
 * the pace of requests after two designated thresholds have been reached.
 */
class BenchmarkRateLimiter extends RateLimiter {
    constructor() {
        console.log(`BenchmarkRateLimiter: initial pace is ${BenchmarkRateLimiter.INITIAL_PACE}`);
        super(BenchmarkRateLimiter.INITIAL_PACE);
        this.requestCount = 0;
    }
    next(p) {
        this.requestCount++;
        if (this.requestCount === 150) {
            this.howManyMilliSeconds = BenchmarkRateLimiter.PACE_AFTER_150_REQUESTS;
            console.log(`BenchmarkRateLimiter: increasing pace to ${BenchmarkRateLimiter.PACE_AFTER_150_REQUESTS}`);
        }
        else if (this.requestCount === 300) {
            this.howManyMilliSeconds = BenchmarkRateLimiter.PACE_AFTER_300_REQUESTS;
            console.log(`BenchmarkRateLimiter: increasing pace to ${BenchmarkRateLimiter.PACE_AFTER_300_REQUESTS}`);
        }
        return super.next(p);
    }
    ;
}
exports.BenchmarkRateLimiter = BenchmarkRateLimiter;
BenchmarkRateLimiter.INITIAL_PACE = 30000;
BenchmarkRateLimiter.PACE_AFTER_150_REQUESTS = 15000;
BenchmarkRateLimiter.PACE_AFTER_300_REQUESTS = 7500;
//# sourceMappingURL=promise-utils.js.map