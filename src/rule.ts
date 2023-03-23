export interface IRule {
  id: string,
  rule: string;
  description: string;
}

export interface IRuleFilter {
  (value: string) : boolean;
}