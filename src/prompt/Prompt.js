"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = void 0;
class Prompt {
    constructor(text, spec) {
        this.text = text;
        this.spec = spec;
        this.id = Prompt.idCounter++;
    }
    getText() {
        return this.text;
    }
    getId() {
        return this.id;
    }
    getOrig() {
        return this.spec.orig;
    }
    static resetIdCounter() {
        Prompt.idCounter = 1;
    }
}
exports.Prompt = Prompt;
Prompt.idCounter = 1;
//# sourceMappingURL=Prompt.js.map