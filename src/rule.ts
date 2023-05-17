export class Rule {
  constructor(private ruleId: string, private rule: string, private description: string) { }

  

  public toString() : string {
    return "rule<" + "ruleId: " + this.ruleId + ", " +
      "rule: " + this.rule + ", " +
      "description: " + this.description + ">";
  }

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
      if (str[i] === "(" || str[i] === ")" || str[i] === "." || str[i] === "[" || str[i] === "]" || str[i] === "}") { // create terminal for (, ), ., [, ], }
        terminals.add(str[i]);
        i++;
      } else if (str[i] === "?" && str[i+1] !== "?"){ // create terminal for ? but not if it is part of ??
        terminals.add(str[i]);
        i++;
      } else if (str[i] === "\\"){ // create terminal for \\<Char>
        terminals.add(str[i]+str[i+1]);
        i += 2;
      } else {
        if (str[i] === "<") { 
          if (str[i+1].match(/[A-Z]/)){ // if a nonterminal is encountered, skip it
            i = str.indexOf(">", i)+1;
          } else if ((str[i+1] === "=" || str[i+1] === "!") && str[i+2] === "<"){  // RegExp operator <= or <!
            terminals.add(str.substring(i, i+1));
            terminals.add(str.substring(i+1, i+2));
            i = i+2;
          } else { // found an operator like <<=, so scan to the next white space
            let j = i + 1;
            while (j < str.length && str[j] !== " ") {
              j++;
            }
            terminals.add(str.substring(i, j));
            i = j;
          }
        } else if (str[i] === " ") { // skip whitespace
          i++;
        } else { // terminal encountered, continue scanning until whitespace or < or ( or ) is encountered
          let j = i + 1;
          while (j < str.length && str[j] !== " " && str[j] !== "<" && str[j] !== "(" && str[j] !== ")") {
            j++;
          }
          terminals.add(str.substring(i, j));
          i = j;
        } 
      }
    }
    return terminals;
  }
}

export interface IRuleFilter {
  (value: string) : boolean;
}