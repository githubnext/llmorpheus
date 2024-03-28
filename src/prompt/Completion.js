"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Completion = void 0;
/**
 * Represents a completion for a prompt.
 */
class Completion {
    constructor(text, promptId) {
        this.text = text;
        this.promptId = promptId;
        this.id = Completion.idCounter++;
    }
    getId() {
        return this.id;
    }
}
exports.Completion = Completion;
Completion.idCounter = 0;
//# sourceMappingURL=Completion.js.map