"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutant = void 0;
/**
 * Represents a mutant
 */
class Mutant {
    constructor(rule, originalCode, rewrittenCode, fileName, lineApplied) {
        this.rule = rule;
        this.originalCode = originalCode;
        this.rewrittenCode = rewrittenCode;
        this.fileName = fileName;
        this.lineApplied = lineApplied;
        this.comment = "";
    }
    /**
     * Returns true if the mutant is trivial, i.e., the original code and the rewritten code are identical
     * after trimming whitespace
     */
    isTrivialRewrite() {
        return this.rewrittenCode.trim() === this.originalCode.trim();
    }
    /**
     * Returns true if the original code contains all the terminals on the LHS of the rule
     */
    originalCodeMatchesLHS() {
        for (const symbol of this.rule.getLHSterminals()) {
            if (this.originalCode.indexOf(symbol) === -1) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns true if the rewritten code contains all the terminals on the RHS of the rule
     */
    rewrittenCodeMatchesRHS() {
        for (const symbol of this.rule.getRHSterminals()) {
            if (this.rewrittenCode.indexOf(symbol) === -1) {
                return false;
            }
        }
        return true;
    }
    /**
     * Detect mutants that are invalid (when the original code is not present in the source code)
     * or trivial (when the original code is the same as the rewritten code). Accounts for situations
     * where the original code is not present on the exact line where the mutation was reported
     * by checking up to WINDOW_SIZE lines before and after the line where the mutation was reported.
     */
    isInvalid() {
        return this.isTrivialRewrite() || !this.originalCodeMatchesLHS() || !this.rewrittenCodeMatchesRHS() || this.getLineApplied() === -1;
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
        return this.rule.getRuleId();
    }
    getFileName() {
        return this.fileName;
    }
    isDuplicateOf(other) {
        return this.getRuleId() === other.getRuleId() &&
            this.getFileName() === other.getFileName() &&
            this.getLineApplied() === other.getLineApplied();
    }
    /**
     * Adjusts the line number of the mutant if the original code is not found on the line reported by the model.
     * Checks up to WINDOW_SIZE lines before and after the line where the mutation was reported. If the line
     * is not found, the location is set to -1.
     * @param origCode the original code of the file where the mutant was applied
     * @returns void
     */
    adjustLocationAsNeeded(origCode) {
        const newMutant = new Mutant(this.rule, this.originalCode, this.rewrittenCode, this.fileName, this.lineApplied);
        const origLine = origCode.split("\n")[newMutant.lineApplied - 1];
        if (origLine && origLine.trim().indexOf(newMutant.originalCode.trim()) !== -1) {
            return newMutant; // found the original code on the line reported by the model, no need to adjust
        }
        else { // else, check up to WINDOW_SIZE lines before and after the line where the mutation was reported
            for (let i = 1; i <= Mutant.WINDOW_SIZE; i++) {
                const line = origCode.split("\n")[this.lineApplied - 1 - i];
                if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
                    newMutant.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied - i}`);
                    newMutant.lineApplied -= i;
                    return newMutant;
                }
                else {
                    const line = origCode.split("\n")[this.lineApplied - 1 + i];
                    if (line && line.trim().indexOf(this.originalCode.trim()) !== -1) {
                        newMutant.addComment(`location adjusted: model reported code on line ${this.lineApplied}, but found on line ${this.lineApplied + i}`);
                        newMutant.lineApplied += i;
                        return newMutant;
                    }
                }
            }
            newMutant.lineApplied = -1; // if we get here, we couldn't find the original code anywhere in the file
        }
        return newMutant;
    }
}
exports.Mutant = Mutant;
Mutant.WINDOW_SIZE = 2;
//# sourceMappingURL=mutant.js.map