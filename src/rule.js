"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
class Rule {
    constructor(ruleId, rule, description) {
        this.ruleId = ruleId;
        this.rule = rule;
        this.description = description;
    }
    getRuleId() {
        return this.ruleId;
    }
    getRule() {
        return this.rule;
    }
    getDescription() {
        return this.description;
    }
    getLHSterminals() {
        const lhs = this.rule.substring(0, this.rule.indexOf("->"));
        return this.getTerminals(lhs);
    }
    getRHSterminals() {
        const rhs = this.rule.substring(this.rule.indexOf("->") + 2);
        return this.getTerminals(rhs);
    }
    getTerminals(str) {
        const terminals = new Set();
        let i = 0;
        while (i < str.length) {
            if (str[i] === "<") { // if a nonterminal is encountered, skip it
                i = str.indexOf(">", i) + 1;
            }
            else if (str[i] === " ") { // skip whitespace
                i++;
            }
            else { // terminal encountered, continue scanning until whitespace or < is encountered
                let j = i + 1;
                while (j < str.length && str[j] !== " " && str[j] !== "<") {
                    j++;
                }
                terminals.add(str.substring(i, j));
                i = j;
            }
        }
        return terminals;
    }
}
exports.Rule = Rule;
//# sourceMappingURL=rule.js.map