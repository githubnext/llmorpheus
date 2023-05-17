import { expect } from "chai";
import fs from "fs";
import { IRuleFilter, Rule } from "../src/rule";
import { MutantGenerator } from "../src/mutantGenerator";
import { MockModel } from "../src/model";
import { Mutant } from "../src/mutant";
import { Prompt } from "../src/prompt";
import { findExpectedCompletions, mockModelDir, outputDir, promptTemplateFileName, rulesFileName, sourceProject, strykerRulesFileName } from "./testUtils";



describe("test mutant generation", () => {

  it("should find the source files to mutate", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    let sourceFiles = await generator.findSourceFilesToMutate(sourceProject);
    sourceFiles = sourceFiles.map((sourceFile) => sourceFile.substring(sourceProject.length + 1));

    // sourceFiles should be equal to ['src/build-country.js','src/build-timezone.js','src/index.js']
    expect(sourceFiles.length).to.equal(3);
    expect(sourceFiles).to.have.members(['src/build-country.js','src/build-timezone.js','src/index.js']);
  });

  it("should find the correct terminals in the LHS of each of the rules", async () => {
    const rules : Rule[] = JSON.parse(fs.readFileSync(rulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));
    expect(rules.length).to.equal(5);

    const rule1 = findRule("1", rules);
    expect(rule1.getRuleId()).to.equal("1");
    expect(rule1.getRule()).to.equal("<Expr> + <Expr> -> <Expr> - <Expr>");
    expect([...rule1.getLHSterminals()]).to.have.members(["+"]);

    const rule2 = findRule("2", rules);
    expect(rule2.getRuleId()).to.equal("2");
    expect(rule2.getRule()).to.equal("<Expr> === <Expr> -> <Expr> !== <Expr>");
    expect([...rule2.getLHSterminals()]).to.have.members(["==="]);

    const rule3 = findRule("3", rules);
    expect(rule3.getRuleId()).to.equal("3");
    expect(rule3.getRule()).to.equal("<Expr> !== <Expr> -> <Expr> === <Expr>");
    expect([...rule3.getLHSterminals()]).to.have.members(["!=="]);

    const rule4 = findRule("4", rules);
    expect(rule4.getRuleId()).to.equal("4");
    expect(rule4.getRule()).to.equal("<Expr> || {} -> <Expr>");
    expect([...rule4.getLHSterminals()]).to.have.members(["||", "{}"]);

    const rule5 = findRule("5", rules);
    expect(rule5.getRuleId()).to.equal("5");
    expect(rule5.getRule()).to.equal("return <Expr>; -> return !<Expr>;");
    expect([...rule5.getLHSterminals()]).to.have.members(["return", ";"]);
  });

  function findRule(ruleId: string, rules: Rule[]) : Rule {
    for (const rule of rules) {
      if (rule.getRuleId() === ruleId) {
        return rule;
      }
    }
    throw new Error(`Rule ${ruleId} not found`);
  }


  it("should find the correct terminals in the LHS of the stryker rules", async () => {
    const rules : Rule[] = JSON.parse(fs.readFileSync(strykerRulesFileName, "utf8")).map((rule: any) => new Rule(rule.id, rule.rule, rule.description));
    expect(rules.length).to.equal(98);

    const rule6 = findRule("6", rules);
    expect(rule6.getRuleId()).to.equal("6");
    expect(rule6.getRule()).to.equal("new Array(<ExprList>) -> new Array()");
    expect([...rule6.getLHSterminals()]).to.have.members(["new", "Array", "(", ")"]);
    
    const rule7 = findRule("7", rules);
    expect(rule7.getRuleId()).to.equal("7");
    expect(rule7.getRule()).to.equal("[ <ExprList> ] -> []");
    expect([...rule7.getLHSterminals()]).to.have.members(["[", "]"]);

    const rule8 = findRule("8", rules);
    expect(rule8.getRuleId()).to.equal("8");
    expect(rule8.getRule()).to.equal("<Expr> += <Expr> -> <Expr> -= <Expr>");
    expect([...rule8.getLHSterminals()]).to.have.members(["+="]);

    const rule13 = findRule("13", rules);
    expect(rule13.getRuleId()).to.equal("13");
    expect(rule13.getRule()).to.equal("<Expr> <<= <Expr> -> <Expr> >>= <Expr>");
    expect([...rule13.getLHSterminals()]).to.have.members(["<<="]);

    const rule14 = findRule("14", rules);
    expect(rule14.getRuleId()).to.equal("14");
    expect(rule14.getRule()).to.equal("<Expr> >>= <Expr> -> <Expr> <<= <Expr>");
    expect([...rule14.getLHSterminals()]).to.have.members([">>="]);

    const rule17 = findRule("17", rules);
    expect(rule17.getRuleId()).to.equal("17");
    expect(rule17.getRule()).to.equal("<Expr> ??= <Expr> -> <Expr> &&= <Expr>");
    expect([...rule17.getLHSterminals()]).to.have.members(["??="]);

    const rule18 = findRule("18", rules);
    expect(rule18.getRuleId()).to.equal("18");
    expect(rule18.getRule()).to.equal("{ <StmtList> } -> { }");
    expect([...rule18.getLHSterminals()]).to.have.members(["{", "}"]);

    const rule19 = findRule("19", rules);
    expect(rule19.getRuleId()).to.equal("19");
    expect(rule19.getRule()).to.equal("true -> false");
    expect([...rule19.getLHSterminals()]).to.have.members(["true"]);

    const rule21 = findRule("21", rules);
    expect(rule21.getRuleId()).to.equal("21");
    expect(rule21.getRule()).to.equal("!(<Expr> == <Expr>) -> <Expr> == <Expr>");
    expect([...rule21.getLHSterminals()]).to.have.members(["!", "(", ")", "=="]);

    const rule22 = findRule("22", rules);
    expect(rule22.getRuleId()).to.equal("22");
    expect(rule22.getRule()).to.equal("for (var <Var> = <Number>; <Var> < <Number>; <Var>++) { <StmtList> } -> for (var <Var> = <Number>; false; <Var>++) { <StmtList> }");
    expect([...rule22.getLHSterminals()]).to.have.members(["for", "(", "var", "=", ";", "<", "++", ")", "{", "}"]);

    const rule23 = findRule("23", rules);
    expect(rule23.getRuleId()).to.equal("23");
    expect(rule23.getRule()).to.equal("while (<Expr> > <Expr>) { <StmtList> } -> while (false) { <StmtList> }");
    expect([...rule23.getLHSterminals()]).to.have.members(["while", "(", ">", ")", "{", "}"]);

    const rule25 = findRule("25", rules);
    expect(rule25.getRuleId()).to.equal("25");
    expect(rule25.getRule()).to.equal("if (<Expr> > <Expr>) { <StmtList> } -> if (true) { <StmtList> }");
    expect([...rule25.getLHSterminals()]).to.have.members(["if", "(", ">", ")", "{", "}"]);

    const rule29 = findRule("29", rules);
    expect(rule29.getRuleId()).to.equal("29");
    expect(rule29.getRule()).to.equal("<Exp> < <Expr> -> <Exp> <= <Expr>");
    expect([...rule29.getLHSterminals()]).to.have.members(["<"]);

    const rule31 = findRule("31", rules);
    expect(rule31.getRuleId()).to.equal("31");
    expect(rule31.getRule()).to.equal("<Exp> <= <Expr> -> <Exp> < <Expr>");
    expect([...rule31.getLHSterminals()]).to.have.members(["<="]);

    const rule44 = findRule("44", rules);
    expect(rule44.getRuleId()).to.equal("44");
    expect(rule44.getRule()).to.equal("<Expr>.endsWith(<Expr>) -> <Expr>.startsWith(<Expr>)");
    expect([...rule44.getLHSterminals()]).to.have.members([".", "endsWith", "(", ")"]);

    const rule54 = findRule("54", rules);
    expect(rule54.getRuleId()).to.equal("54");
    expect(rule54.getRule()).to.equal("<Expr>.sort(<Expr>) -> <Expr>");
    expect([...rule54.getLHSterminals()]).to.have.members([".", "sort", "(", ")"]);

    const rule63 = findRule("63", rules);
    expect(rule63.getRuleId()).to.equal("63");
    expect(rule63.getRule()).to.equal("{ <VarExpPairList>, <Var> : <Expr>, <VarExpPairList> } -> { <VarExpPairList>, <VarExpPairList> }");
    expect([...rule63.getLHSterminals()]).to.have.members(["{", "}", ",", ":"]);

    const rule64 = findRule("64", rules);
    expect(rule64.getRuleId()).to.equal("64");
    expect(rule64.getRule()).to.equal("<Expr>?.<Name> -> <Expr>?.<Name>");
    expect([...rule64.getLHSterminals()]).to.have.members(["?", "."]);

    const rule66 = findRule("66", rules);
    expect(rule66.getRuleId()).to.equal("66");
    expect(rule66.getRule()).to.equal("<Expr>?.(<ExprList>) -> <Expr>.(<ExprList>)");
    expect([...rule66.getLHSterminals()]).to.have.members(["?", ".", "(", ")"]);

    const rule67 = findRule("67", rules);
    expect(rule67.getRuleId()).to.equal("67");
    expect(rule67.getRule()).to.equal("^<RegexExpr> -> <RegexExpr>");
    expect([...rule67.getLHSterminals()]).to.have.members(["^"]);

    const rule68 = findRule("68", rules);
    expect(rule68.getRuleId()).to.equal("68");
    expect(rule68.getRule()).to.equal("<RegexExpr>$ -> <RegexExpr>");
    expect([...rule68.getLHSterminals()]).to.have.members(["$"]);

    const rule69 = findRule("69", rules);
    expect(rule69.getRuleId()).to.equal("69");
    expect(rule69.getRule()).to.equal("[<RegexExpr>] -> [^<RegexExpr>]");
    expect([...rule69.getLHSterminals()]).to.have.members(["[", "]"]);

    const rule70 = findRule("70", rules);
    expect(rule70.getRuleId()).to.equal("70");
    expect(rule70.getRule()).to.equal("[^<RegexExpr>] -> [<RegexExpr>]");
    expect([...rule70.getLHSterminals()]).to.have.members(["[", "]", "^"]);

    const rule71 = findRule("71", rules);
    expect(rule71.getRuleId()).to.equal("71");
    expect(rule71.getRule()).to.equal("\\d -> \\D");
    expect([...rule71.getLHSterminals()]).to.have.members(["\\d"]);

    const rule77 = findRule("77", rules);
    expect(rule77.getRuleId()).to.equal("77");
    expect(rule77.getRule()).to.equal("<RegexExpr>? -> <RegexExpr>");
    expect([...rule77.getLHSterminals()]).to.have.members(["?"]);

    const rule78 = findRule("78", rules);
    expect(rule78.getRuleId()).to.equal("78");
    expect(rule78.getRule()).to.equal("<RegexExpr>* -> <RegexExpr>");
    expect([...rule78.getLHSterminals()]).to.have.members(["*"]);

    const rule80 = findRule("80", rules);
    expect(rule80.getRuleId()).to.equal("80");
    expect(rule80.getRule()).to.equal("<RegexExpr>{<Number>,<Number>} -> <RegexExpr>");
    expect([...rule80.getLHSterminals()]).to.have.members(["{", "}", ","]);

    const rule83 = findRule("83", rules);
    expect(rule83.getRuleId()).to.equal("83");
    expect(rule83.getRule()).to.equal("<RegexExpr>{<Number>,<Number>}? -> <RegexExpr>");
    expect([...rule83.getLHSterminals()]).to.have.members(["{", "}", ",", "?"]);

    const rule84 = findRule("84", rules);
    expect(rule84.getRuleId()).to.equal("84");
    expect(rule84.getRule()).to.equal("(?=<RegexExpr>) -> (!=<RegexExpr>)");
    expect([...rule84.getLHSterminals()]).to.have.members(["(", ")", "?", "="]);

    const rule86 = findRule("86", rules);
    expect(rule86.getRuleId()).to.equal("86");
    expect(rule86.getRule()).to.equal("(<=<RegexExpr>) -> (<!<RegexExpr>)");
    expect([...rule86.getLHSterminals()]).to.have.members(["(", ")", "<", "="]);

    const rule87 = findRule("87", rules);
    expect(rule87.getRuleId()).to.equal("87");
    expect(rule87.getRule()).to.equal("(<!<RegexExpr>) -> (<=<RegexExpr>)");
    expect([...rule87.getLHSterminals()]).to.have.members(["(", ")", "<", "!"]);

    const rule88 = findRule("88", rules);
    expect(rule88.getRuleId()).to.equal("88");
    expect(rule88.getRule()).to.equal("\\p{<UnicodeProperty>} -> \\P{<UnicodeProperty>}");
    expect([...rule88.getLHSterminals()]).to.have.members(["\\p", "{", "}"]);

    const rule90 = findRule("90", rules);
    expect(rule90.getRuleId()).to.equal("90");
    expect(rule90.getRule()).to.equal("\"<StringLiteral>\" -> \"\"");
    expect([...rule90.getLHSterminals()]).to.have.members(["\""]);

    const rule91 = findRule("91", rules);
    expect(rule91.getRuleId()).to.equal("91");
    expect(rule91.getRule()).to.equal("\"\" -> \"Stryker was here\"");
    expect([...rule91.getLHSterminals()]).to.have.members(["\"\""]);

    const rule92 = findRule("92", rules);
    expect(rule92.getRuleId()).to.equal("92");
    expect(rule92.getRule()).to.equal("`<StringLiteral>` -> ``");
    expect([...rule92.getLHSterminals()]).to.have.members(["`"]);

    const rule93 = findRule("93", rules);
    expect(rule93.getRuleId()).to.equal("93");
    expect(rule93.getRule()).to.equal("+<Expr> -> -<Expr>");
    expect([...rule93.getLHSterminals()]).to.have.members(["+"]);

    const rule96 = findRule("96", rules);
    expect(rule96.getRuleId()).to.equal("96");
    expect(rule96.getRule()).to.equal("<Expr>-- -> <Expr>++");
    expect([...rule96.getLHSterminals()]).to.have.members(["--"]);
  });

  it("should generate the expected completions for each prompt in the sample project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);

    for (let promptNr = 0; promptNr <= 16; promptNr++){
      const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
      const actualCompletions = await generator.getCompletionsForPrompt(prompt);
      const expectedCompletions = findExpectedCompletions(promptNr);
      expect(actualCompletions.length).to.equal(expectedCompletions.size);
      const actualCompletionsText = actualCompletions.map((completion) => completion.getText());
      const expectedCompletionsText = [...expectedCompletions].map((completion) => completion.getText());
      expect(actualCompletionsText).to.have.members(expectedCompletionsText);
    }
  });

  it("shouldbe able to extract mutants from completions for prompt", async () => {
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    const expectedCompletions = findExpectedCompletions(promptNr);
    expect(expectedCompletions.size).to.equal(3);
    const allMutants = [];
    for (const completion of expectedCompletions) {
      const mutants = generator.extractMutantsFromCompletion(prompt, completion);
      allMutants.push(...mutants);
    }
    expect(allMutants.length).to.equal(5);
    // fs.writeFileSync(outputDir + '/mutantsForPrompt13.json', JSON.stringify(allMutants, null, 2));
    const actualMutants = JSON.stringify(allMutants, null, 2);
    const expectedMutants = fs.readFileSync(`./test/input/mutantsForPrompt13.json`, "utf8");
    expect(actualMutants).to.equal(expectedMutants);
  });

  it("should be able to filter out useless mutants", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    let promptNr = 13;
    const prompt = Prompt.fromJSON(JSON.parse(fs.readFileSync(`./test/input/prompts/prompt_${promptNr}.json`, "utf8")));
    const expectedMutants = JSON.parse(fs.readFileSync(`./test/input/filteredMutantsForPrompt13.json`, "utf8"));
    const mutants = expectedMutants.map((jsonObj: any) => Mutant.fromJSON(jsonObj));
    const origCode = fs.readFileSync(prompt.getFileName(), "utf8");
    const filteredMutants = generator.filterMutants(prompt.getFileName(), prompt.getChunkNr(), prompt.getRule(), mutants, origCode);
    // fs.writeFileSync(outputDir + '/filteredMutantsForPrompt13.json', JSON.stringify(filteredMutants, null, 2));
    expect(JSON.stringify(filteredMutants)).to.equal(JSON.stringify(expectedMutants));
   });
    
   it("should be able to generate the expected mutants for a test project", async () => {
    const ruleFilter : IRuleFilter = (value: string) : boolean => true;
    const model = new MockModel('text-davinci-003', mockModelDir);
    const generator = new MutantGenerator(model, promptTemplateFileName, rulesFileName, ruleFilter, outputDir);
    await generator.generateMutants(sourceProject);
    const actualMutants = fs.readFileSync(outputDir + '/mutants.json', 'utf8');
    // fs.writeFileSync(outputDir + '/actual.json', actualMutants);
    const expectedMutants = fs.readFileSync('./test/input/mutants.json', 'utf8');
    expect(actualMutants.length).to.equal(expectedMutants.length);
    expect(actualMutants).to.equal(expectedMutants);
  });

});