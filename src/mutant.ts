export interface IMutant {
  ruleId: string;
  rule: string;
  originalCode: string;
  rewrittenCode: string;
  lineApplied: number;
  occursInSourceCode?: boolean;
  isTrivialRewrite?: boolean;
  comment?: string;
  originalCodeMatchesLHS?: boolean;
  rewrittenCodeMatchesRHS?: boolean;
}