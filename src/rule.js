"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTerminals = exports.getRHSterminals = exports.getLHSterminals = void 0;
function getLHSterminals(rule) {
    const lhs = rule.substring(0, rule.indexOf("->"));
    return getTerminals(lhs);
}
exports.getLHSterminals = getLHSterminals;
function getRHSterminals(rule) {
    const rhs = rule.substring(rule.indexOf("->") + 2);
    return getTerminals(rhs);
}
exports.getRHSterminals = getRHSterminals;
function getTerminals(str) {
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
exports.getTerminals = getTerminals;
//# sourceMappingURL=rule.js.map