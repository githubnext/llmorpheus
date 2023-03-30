export class Rule {
  constructor(private ruleId: string, private rule: string, private description: string) { }

  public getRuleId() : string {
    return this.ruleId;
  }

  public getRule() : string {
    return this.rule;
  }

  public getDescription() : string {
    return this.description;
  }

  public getLHSterminals() : Set<string> {
    const lhs = this.rule.substring(0, this.rule.indexOf("->"));
    return this.getTerminals(lhs);
  }

  public getRHSterminals() : Set<string> {
    const rhs = this.rule.substring(this.rule.indexOf("->") + 2);
    return this.getTerminals(rhs);
  }

  private getTerminals(str: string) : Set<string> {
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
}

export interface IRuleFilter {
  (value: string) : boolean;
}