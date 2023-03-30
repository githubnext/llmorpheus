"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutant = void 0;
const rule_1 = require("./rule");
class Mutant {
    constructor(ruleId, rule, originalCode, rewrittenCode, lineApplied) {
        this.ruleId = ruleId;
        this.rule = rule;
        this.originalCode = originalCode;
        this.rewrittenCode = rewrittenCode;
        this.lineApplied = lineApplied;
        this.comment = "";
    }
    isTrivialRewrite() {
        return this.rewrittenCode.trim() === this.originalCode.trim();
    }
    originalCodeMatchesLHS() {
        for (const symbol of (0, rule_1.getLHSterminals)(this.rule)) {
            if (this.originalCode.indexOf(symbol) === -1) {
                // console.log(`*** did not find ${symbol} in ${this.originalCode}`);
                return false;
            }
        }
        return true;
    }
    rewrittenCodeMatchesRHS() {
        for (const symbol of (0, rule_1.getRHSterminals)(this.rule)) {
            if (this.rewrittenCode.indexOf(symbol) === -1) {
                return false;
            }
        }
        return true;
    }
    addComment(comment) {
        if (this.comment === undefined || this.comment === "") {
            this.comment = comment;
        }
        else {
            this.comment += `\n${comment}`;
        }
    }
    getComment() {
        return this.comment;
    }
    getLineApplied() {
        return this.lineApplied;
    }
    getRuleId() {
        return this.ruleId;
    }
    adjustLocationAsNeeded(origCode) {
        const origLine = origCode.split("\n")[this.lineApplied - 1];
        if (origLine && origLine.trim().indexOf(this.originalCode.trim()) !== -1) {
            return; // found the original code on the line reported by the model, no need to adjust
        }
        else { // else, check up to WINDOW_SIZE lines before and after the line where the mutation was reported
            for (let i = 1; i <= Mutant.WINDOW_SIZE; i++) {
                const line = origCode.split("\n")[this.lineApplied - 1 - i];
                if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
                    this.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied - i}`);
                    this.lineApplied -= i;
                    return;
                }
                else {
                    const line = origCode.split("\n")[this.lineApplied - 1 + i];
                    if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
                        this.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied + i}`);
                        this.lineApplied += i;
                        return;
                    }
                }
            }
            this.lineApplied = -1; // if we get here, we couldn't find the original code anywhere in the file
        }
    }
}
exports.Mutant = Mutant;
Mutant.WINDOW_SIZE = 2;
//# sourceMappingURL=mutant.js.map