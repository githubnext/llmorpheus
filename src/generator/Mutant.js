"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutant = void 0;
/**
 * This class captures all information associated with a mutant: source location, original
 * code, replacement, promptId, completionId, and reason.
 */
class Mutant {
    constructor(file, startLine, startColumn, endLine, endColumn, originalCode, replacement, promptId, completionId, reason) {
        this.file = file;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
        this.originalCode = originalCode;
        this.replacement = replacement;
        this.promptId = promptId;
        this.completionId = completionId;
        this.reason = reason;
    }
    toString() {
        return JSON.stringify(this);
    }
}
exports.Mutant = Mutant;
//# sourceMappingURL=Mutant.js.map