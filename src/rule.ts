export interface IRule {
  id: string,
  rule: string;
  description: string;
}

export interface IRuleFilter {
  (value: string) : boolean;
}

export function getLHSterminals(rule: string) : Set<string> {
  const lhs = rule.substring(0, rule.indexOf("->"));
  return getTerminals(lhs);
}

export function getRHSterminals(rule: string) : Set<string> {
  const rhs = rule.substring(rule.indexOf("->") + 2);
  return getTerminals(rhs);
}

export function getTerminals(str: string) : Set<string> {
  const terminals = new Set<string>();  
  let i = 0;
  while (i < str.length) {
    if (str[i] === "<") { // if a nonterminal is encountered, skip it
      i = str.indexOf(">", i)+1;
    } else if (str[i] === " ") { // skip whitespace
      i++;
    } else { // terminal encountered, continue scanning until whitespace or < is encountered
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