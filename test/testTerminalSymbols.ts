import { expect } from "chai";
import fs from "fs";
import { Rule } from "../src/rule";
import { findRule, rulesFileName, strykerRulesFileName } from "./testUtils";

describe("test mutant generation", () => {

  let rules : Rule[] = [];
  let strykerRules : Rule[] = [];

  before(() => {
    rules = JSON.parse(fs.readFileSync(rulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));
    strykerRules = JSON.parse(fs.readFileSync(strykerRulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));    
  });

  it("should find the correct number of sample rules", async () => {
    expect(rules.length).to.equal(5);
  });

  it("should find the correct terminals in the LHS of the stryker rules", async () => {
    expect(strykerRules.length).to.equal(103);
  });

  it("should find the correct terminals in the LHS of rule \"<Expr> + <Expr> -> <Expr> - <Expr>\"", async () => {
    const rule1 = findRule("1", rules);
    expect(rule1.getRuleId()).to.equal("1");
    expect(rule1.getRule()).to.equal("<Expr> + <Expr> -> <Expr> - <Expr>");
    expect([...rule1.getLHSterminals()]).to.have.members(["+"]);
  });

  it("should find the correct terminals in the LHS of rule \"<Expr> === <Expr> -> <Expr> !== <Expr>\"", async () => {
    const rule2 = findRule("2", rules);
    expect(rule2.getRuleId()).to.equal("2");
    expect(rule2.getRule()).to.equal("<Expr> === <Expr> -> <Expr> !== <Expr>");
    expect([...rule2.getLHSterminals()]).to.have.members(["==="]);
  });

  it("should find the correct terminals in the LHS of rule \"<Expr> !== <Expr> -> <Expr> === <Expr>\"", async () => {
    const rule3 = findRule("3", rules);
    expect(rule3.getRuleId()).to.equal("3");
    expect(rule3.getRule()).to.equal("<Expr> !== <Expr> -> <Expr> === <Expr>");
    expect([...rule3.getLHSterminals()]).to.have.members(["!=="]);
  });

  it("should find the correct terminals in the LHS of rule \"<Expr> || {} -> <Expr>\"", async () => {
    const rule4 = findRule("4", rules);
    expect(rule4.getRuleId()).to.equal("4");
    expect(rule4.getRule()).to.equal("<Expr> || {} -> <Expr>");
    expect([...rule4.getLHSterminals()]).to.have.members(["||", "{}"]);
  });

  it("should find the correct terminals in the LHS of rule \"return <Expr>; -> return !<Expr>;\"", async () => {
    const rule5 = findRule("5", rules);
    expect(rule5.getRuleId()).to.equal("5");
    expect(rule5.getRule()).to.equal("return <Expr>; -> return !<Expr>;");
    expect([...rule5.getLHSterminals()]).to.have.members(["return", ";"]);
  });

  it("should find the correct terminals in rule \"new Array(<ExprList>) -> new Array()\"", async () => {
    const rule6 = findRule("6", strykerRules);
    expect(rule6.getRuleId()).to.equal("6");
    expect(rule6.getRule()).to.equal("new Array(<ExprList>) -> new Array()");
    expect([...rule6.getLHSterminals()]).to.have.members(["new", "Array", "(", ")"]);
  });
    
  it("should find the correct terminals in rule \"[ <ExprList> ] -> []\"", async () => {
    const rule7 = findRule("7", strykerRules);
    expect(rule7.getRuleId()).to.equal("7");
    expect(rule7.getRule()).to.equal("[ <ExprList> ] -> []");
    expect([...rule7.getLHSterminals()]).to.have.members(["[", "]"]);
  });

  it("should find the correct terminals in rule \"<Expr> += <Expr> -> <Expr> -= <Expr>\"", async () => {
    const rule8 = findRule("8", strykerRules);
    expect(rule8.getRuleId()).to.equal("8");
    expect(rule8.getRule()).to.equal("<Expr> += <Expr> -> <Expr> -= <Expr>");
    expect([...rule8.getLHSterminals()]).to.have.members(["+="]);
  });

  it("should find the correct terminals in rule \"<Expr> <<= <Expr> -> <Expr> >>= <Expr>\"", async () => {
    const rule13 = findRule("13", strykerRules);
    expect(rule13.getRuleId()).to.equal("13");
    expect(rule13.getRule()).to.equal("<Expr> <<= <Expr> -> <Expr> >>= <Expr>");
    expect([...rule13.getLHSterminals()]).to.have.members(["<<="]);
  });

  it("should find the correct terminals in rule \"<Expr> >>= <Expr> -> <Expr> <<= <Expr>\"", async () => {
    const rule14 = findRule("14", strykerRules);
    expect(rule14.getRuleId()).to.equal("14");
    expect(rule14.getRule()).to.equal("<Expr> >>= <Expr> -> <Expr> <<= <Expr>");
    expect([...rule14.getLHSterminals()]).to.have.members([">>="]);
  });

  it("should find the correct terminals in rule \"<Expr> ??= <Expr> -> <Expr> &&= <Expr>\"", async () => {
    const rule17 = findRule("17", strykerRules);
    expect(rule17.getRuleId()).to.equal("17");
    expect(rule17.getRule()).to.equal("<Expr> ??= <Expr> -> <Expr> &&= <Expr>");
    expect([...rule17.getLHSterminals()]).to.have.members(["??="]);
  });

  it("should find the correct terminals in rule \"{ <StmtList> } -> { }\"", async () => {
    const rule18 = findRule("18", strykerRules);
    expect(rule18.getRuleId()).to.equal("18");
    expect(rule18.getRule()).to.equal("{ <StmtList> } -> { }");
    expect([...rule18.getLHSterminals()]).to.have.members(["{", "}"]);
  });

  it("should find the correct terminals in rule \"true -> false\"", async () => {
    const rule19 = findRule("19", strykerRules);
    expect(rule19.getRuleId()).to.equal("19");
    expect(rule19.getRule()).to.equal("true -> false");
    expect([...rule19.getLHSterminals()]).to.have.members(["true"]);
  });

  it("should find the correct terminals in rule \"!(<Expr> == <Expr>) -> <Expr> == <Expr>\"", async () => {
    const rule21 = findRule("21", strykerRules);
    expect(rule21.getRuleId()).to.equal("21");
    expect(rule21.getRule()).to.equal("!(<Expr> == <Expr>) -> <Expr> == <Expr>");
    expect([...rule21.getLHSterminals()]).to.have.members(["!", "(", ")", "=="]);
  });

  it("should find the correct terminals in rule \"for (var <Var> = <Number>; <Var> < <Number>; <Var>++) { <StmtList> } -> for (var <Var> = <Number>; false; <Var>++) { <StmtList> }\"", async () => {
    const rule22 = findRule("22", strykerRules);
    expect(rule22.getRuleId()).to.equal("22");
    expect(rule22.getRule()).to.equal("for (var <Var> = <Number>; <Var> < <Number>; <Var>++) { <StmtList> } -> for (var <Var> = <Number>; false; <Var>++) { <StmtList> }");
    expect([...rule22.getLHSterminals()]).to.have.members(["for", "(", "var", "=", ";", "<", "++", ")", "{", "}"]);
  });

  it("should find the correct terminals in rule \"while (<Expr> > <Expr>) { <StmtList> } -> while (false) { <StmtList> }\"", async () => {
    const rule23 = findRule("23", strykerRules);
    expect(rule23.getRuleId()).to.equal("23");
    expect(rule23.getRule()).to.equal("while (<Expr> > <Expr>) { <StmtList> } -> while (false) { <StmtList> }");
    expect([...rule23.getLHSterminals()]).to.have.members(["while", "(", ">", ")", "{", "}"]);
  });

  it("should find the correct terminals in rule \"if (<Expr> > <Expr>) { <StmtList> } -> if (true) { <StmtList> }\"", async () => {
    const rule25 = findRule("25", strykerRules);
    expect(rule25.getRuleId()).to.equal("25");
    expect(rule25.getRule()).to.equal("if (<Expr> > <Expr>) { <StmtList> } -> if (true) { <StmtList> }");
    expect([...rule25.getLHSterminals()]).to.have.members(["if", "(", ">", ")", "{", "}"]);
  });

  it("should find the correct terminals in rule \"<Exp> < <Expr> -> <Exp> <= <Expr>\"", async () => {
    const rule29 = findRule("29", strykerRules);
    expect(rule29.getRuleId()).to.equal("29");
    expect(rule29.getRule()).to.equal("<Exp> < <Expr> -> <Exp> <= <Expr>");
    expect([...rule29.getLHSterminals()]).to.have.members(["<"]);
  });  

  it("should find the correct terminals in rule \"<Exp> <= <Expr> -> <Exp> < <Expr>\"", async () => {
    const rule31 = findRule("31", strykerRules);
    expect(rule31.getRuleId()).to.equal("31");
    expect(rule31.getRule()).to.equal("<Exp> <= <Expr> -> <Exp> < <Expr>");
    expect([...rule31.getLHSterminals()]).to.have.members(["<="]);
  });

  it("should find the correct terminals in rule \"<Expr>.endsWith(<Expr>) -> <Expr>.startsWith(<Expr>)\"", async () => {
    const rule44 = findRule("44", strykerRules);
    expect(rule44.getRuleId()).to.equal("44");
    expect(rule44.getRule()).to.equal("<Expr>.endsWith(<Expr>) -> <Expr>.startsWith(<Expr>)");
    expect([...rule44.getLHSterminals()]).to.have.members([".", "endsWith", "(", ")"]);
  });

  it("should find the correct terminals in rule \"<Expr>.sort(<Expr>) -> <Expr>\"", async () => {
    const rule54 = findRule("54", strykerRules);
    expect(rule54.getRuleId()).to.equal("54");
    expect(rule54.getRule()).to.equal("<Expr>.sort(<Expr>) -> <Expr>");
    expect([...rule54.getLHSterminals()]).to.have.members([".", "sort", "(", ")"]);
  });

  it("should find the correct terminals in rule \"{ <VarExpPairList>, <Var> : <Expr>, <VarExpPairList> } -> { <VarExpPairList>, <VarExpPairList> }\"", async () => {
    const rule63 = findRule("63", strykerRules);
    expect(rule63.getRuleId()).to.equal("63");
    expect(rule63.getRule()).to.equal("{ <VarExpPairList>, <Var> : <Expr>, <VarExpPairList> } -> { <VarExpPairList>, <VarExpPairList> }");
    expect([...rule63.getLHSterminals()]).to.have.members(["{", "}", ",", ":"]);
  });

  it("should find the correct terminals in rule \"<Expr>?.<Name> -> <Expr>?.<Name>\"", async () => {
    const rule64 = findRule("64", strykerRules);
    expect(rule64.getRuleId()).to.equal("64");
    expect(rule64.getRule()).to.equal("<Expr>?.<Name> -> <Expr>?.<Name>");
    expect([...rule64.getLHSterminals()]).to.have.members(["?", "."]);
  });

  it("should find the correct terminals in rule \"<Expr>?.(<ExprList>) -> <Expr>.(<ExprList>)\"", async () => {
    const rule66 = findRule("66", strykerRules);
    expect(rule66.getRuleId()).to.equal("66");
    expect(rule66.getRule()).to.equal("<Expr>?.(<ExprList>) -> <Expr>.(<ExprList>)");
    expect([...rule66.getLHSterminals()]).to.have.members(["?", ".", "(", ")"]);
  });

  it("should find the correct terminals in rule \"^<RegexExpr> -> <RegexExpr>\"", async () => {
    const rule67 = findRule("67", strykerRules);
    expect(rule67.getRuleId()).to.equal("67");
    expect(rule67.getRule()).to.equal("^<RegexExpr> -> <RegexExpr>");
    expect([...rule67.getLHSterminals()]).to.have.members(["^"]);
  });

  it("should find the correct terminals in rule \"<RegexExpr>$ -> <RegexExpr>\"", async () => {
    const rule68 = findRule("68", strykerRules);
    expect(rule68.getRuleId()).to.equal("68");
    expect(rule68.getRule()).to.equal("<RegexExpr>$ -> <RegexExpr>");
    expect([...rule68.getLHSterminals()]).to.have.members(["$"]);
  });

  it("should find the correct terminals in rule \"[<RegexExpr>] -> [^<RegexExpr>]\"", async () => {
    const rule69 = findRule("69", strykerRules);
    expect(rule69.getRuleId()).to.equal("69");
    expect(rule69.getRule()).to.equal("[<RegexExpr>] -> [^<RegexExpr>]");
    expect([...rule69.getLHSterminals()]).to.have.members(["[", "]"]);
  });  

  it("should find the correct terminals in rule \"[^<RegexExpr>] -> [<RegexExpr>]\"", async () => {
    const rule70 = findRule("70", strykerRules);
    expect(rule70.getRuleId()).to.equal("70");
    expect(rule70.getRule()).to.equal("[^<RegexExpr>] -> [<RegexExpr>]");
    expect([...rule70.getLHSterminals()]).to.have.members(["[", "]", "^"]);
  });

  it("should find the correct terminals in rule \"\\d -> \\D\"", async () => {
    const rule71 = findRule("71", strykerRules);
    expect(rule71.getRuleId()).to.equal("71");
    expect(rule71.getRule()).to.equal("\\d -> \\D");
    expect([...rule71.getLHSterminals()]).to.have.members(["\\d"]);
  });

  it("should find the correct terminals in rule \"<RegexExpr>? -> <RegexExpr>\"", async () => {
    const rule77 = findRule("77", strykerRules);
    expect(rule77.getRuleId()).to.equal("77");
    expect(rule77.getRule()).to.equal("<RegexExpr>? -> <RegexExpr>");
    expect([...rule77.getLHSterminals()]).to.have.members(["?"]);
  });

  it("should find the correct terminals in rule \"<RegexExpr>* -> <RegexExpr>\"", async () => {
    const rule78 = findRule("78", strykerRules);
    expect(rule78.getRuleId()).to.equal("78");
    expect(rule78.getRule()).to.equal("<RegexExpr>* -> <RegexExpr>");
    expect([...rule78.getLHSterminals()]).to.have.members(["*"]);
  });

  it("should find the correct terminals in rule \"<RegexExpr>{<Number>,<Number>} -> <RegexExpr>\"", async () => {
    const rule80 = findRule("80", strykerRules);
    expect(rule80.getRuleId()).to.equal("80");
    expect(rule80.getRule()).to.equal("<RegexExpr>{<Number>,<Number>} -> <RegexExpr>");
    expect([...rule80.getLHSterminals()]).to.have.members(["{", "}", ","]);
  });

  it("should find the correct terminals in rule \"<RegexExpr>{<Number>,<Number>}? -> <RegexExpr>\"", async () => {
    const rule83 = findRule("83", strykerRules);
    expect(rule83.getRuleId()).to.equal("83");
    expect(rule83.getRule()).to.equal("<RegexExpr>{<Number>,<Number>}? -> <RegexExpr>");
    expect([...rule83.getLHSterminals()]).to.have.members(["{", "}", ",", "?"]);
  });

  it("should find the correct terminals in rule \"(?=<RegexExpr>) -> (!=<RegexExpr>)\"", async () => {
    const rule84 = findRule("84", strykerRules);
    expect(rule84.getRuleId()).to.equal("84");
    expect(rule84.getRule()).to.equal("(?=<RegexExpr>) -> (!=<RegexExpr>)");
    expect([...rule84.getLHSterminals()]).to.have.members(["(", ")", "?", "="]);
  });

  it("should find the correct terminals in rule \"(<=<RegexExpr>) -> (<!<RegexExpr>)\"", async () => {
    const rule86 = findRule("86", strykerRules);
    expect(rule86.getRuleId()).to.equal("86");
    expect(rule86.getRule()).to.equal("(<=<RegexExpr>) -> (<!<RegexExpr>)");
    expect([...rule86.getLHSterminals()]).to.have.members(["(", ")", "<", "="]);
  });

  it("should find the correct terminals in rule \"(<!<RegexExpr>) -> (<=<RegexExpr>)\"", async () => {
    const rule87 = findRule("87", strykerRules);
    expect(rule87.getRuleId()).to.equal("87");
    expect(rule87.getRule()).to.equal("(<!<RegexExpr>) -> (<=<RegexExpr>)");
    expect([...rule87.getLHSterminals()]).to.have.members(["(", ")", "<", "!"]);
  });

  it("should find the correct terminals in rule \"\\p{<UnicodeProperty>} -> \\P{<UnicodeProperty>}\"", async () => {
    const rule88 = findRule("88", strykerRules);
    expect(rule88.getRuleId()).to.equal("88");
    expect(rule88.getRule()).to.equal("\\p{<UnicodeProperty>} -> \\P{<UnicodeProperty>}");
    expect([...rule88.getLHSterminals()]).to.have.members(["\\p", "{", "}"]);
  });

  it("should find the correct terminals in rule \"\"<StringLiteral>\" -> \"\"\"", async () => {
    const rule90 = findRule("90", strykerRules);
    expect(rule90.getRuleId()).to.equal("90");
    expect(rule90.getRule()).to.equal("\"<StringLiteral>\" -> \"\"");
    expect([...rule90.getLHSterminals()]).to.have.members(["\""]);
  });

  it("should find the correct terminals in rule \"\"\" -> \"Stryker was here\"\"", async () => {
    const rule91 = findRule("91", strykerRules);
    expect(rule91.getRuleId()).to.equal("91");
    expect(rule91.getRule()).to.equal("\"\" -> \"Stryker was here\"");
    expect([...rule91.getLHSterminals()]).to.have.members(["\"\""]);
  });

  it("should find the correct terminals in rule \"`<StringLiteral>` -> ``\"", async () => {
    const rule92 = findRule("92", strykerRules);
    expect(rule92.getRuleId()).to.equal("92");
    expect(rule92.getRule()).to.equal("`<StringLiteral>` -> ``");
    expect([...rule92.getLHSterminals()]).to.have.members(["`"]);
  });

  it("should find the correct terminals in rule \"+<Expr> -> -<Expr\>", async () => {
    const rule93 = findRule("93", strykerRules);
    expect(rule93.getRuleId()).to.equal("93");
    expect(rule93.getRule()).to.equal("+<Expr> -> -<Expr>");
    expect([...rule93.getLHSterminals()]).to.have.members(["+"]);
  });

  it("should find the correct terminals in rule \"<Expr>-- -> <Expr>++\"", async () => {
    const rule96 = findRule("96", strykerRules);
    expect(rule96.getRuleId()).to.equal("96");
    expect(rule96.getRule()).to.equal("<Expr>-- -> <Expr>++");
    expect([...rule96.getLHSterminals()]).to.have.members(["--"]);
  });

});