import * as fs from 'fs';
import * as path from 'path';
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import { Mutant } from './mutant';

export function mapMutantsToASTNodes(projectPath: string, mutants: Mutant[]): Mutant[] {
  const mappedMutants = [];
  for (let i=0; i < mutants.length; i++){
    const mutant = mutants[i];
    // console.log(`** mutant #${i} \"${mutant.originalCode}\" with raw location ${mutant.file}:<${mutant.startLine},${mutant.startColumn}>-<${mutant.endLine},${mutant.endColumn}}`);
    const origCode = fs.readFileSync(path.join(projectPath, mutant.file), 'utf8');  
    const origMap = buildMap(mutant.file, origCode);
    const mutatedCode = deriveMutatedCode(origCode, mutant);
    const mutatedMap = buildMap(mutant.file, mutatedCode);  
    const diffs = computeDiffs(origMap, mutatedMap);
    const smallestDiff = computeSmallestDiff(diffs);

    // console.log(`** smallest diff: ${smallestDiff}`);// => ${sourceLocationToString(origMap.get(smallestDiff)!.loc)} vs ${sourceLocationToString(mutatedMap.get(smallestDiff)!.loc)}`);
    // console.log(`  - original text: ${origMap.get(smallestDiff)!.text}`);
    // console.log(`  - mutated text: ${mutatedMap.get(smallestDiff)!.text}`);
  
    const mappedMutant = new Mutant(mutant.rule, 
                                    origMap.get(smallestDiff)!.text, 
                                    mutatedMap.get(smallestDiff)!.text,
                                    mutant.file, 
                                    origMap.get(smallestDiff)!.loc.startLine,
                                    origMap.get(smallestDiff)!.loc.startColumn,
                                    origMap.get(smallestDiff)!.loc.endLine,
                                    origMap.get(smallestDiff)!.loc.endColumn,
                                    mutant.promptId,
                                    mutant.completionId);
    mappedMutants.push(mappedMutant);  
  }
  return mappedMutants;
}

interface SourceLocation {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface ASTNodeInfo {
  text: string;
  loc: SourceLocation;
}

/**
 * Convert [line,col] to index.
 * @param code the code
 * @param line the line
 * @param column the column
 * @returns the index
 */
function toIndex(code: string, line: number, column: number) {
  let index = 0;
  let lineCount = 1;
  let columnCount = 0;
  for (let i = 0; i <= code.length; i++) {
    if (lineCount === line && columnCount === column) {
      index = i;
      break;
    }
    if (code[i] === '\n') {
      lineCount++;
      columnCount = 0;
    } else {
      columnCount++;
    }
  }
  return index;
}

/**
 * Retrieve the code fragment from [startLine, startColumn] to [endLine, endColumn].
 * @param code the code
 * @param startLine the start line
 * @param startColumn the start column
 * @param endLine the end line
 * @param endColumn the end column
 * @returns the code fragment
 */
function getText(code: string, startLine: number, startColumn: number, endLine: number, endColumn: number) {
  const startIndex = toIndex(code, startLine, startColumn);
  const endIndex = toIndex(code, endLine, endColumn);
  return code.substring(startIndex, endIndex);
}

/**
 * Derive the mutated code from the original code and the mutant.
 * @param origCode the original code
 * @param mutant the mutant
 * @returns the mutated code
 */
function deriveMutatedCode(origCode: string, mutant: any) {
  const origCodeBefore = getText(origCode, 1, 0, mutant.startLine, mutant.startColumn);
  const nrLines = origCode.split('\n').length;
  const origCodeAfter = getText(origCode, mutant.endLine, mutant.endColumn, origCode.split('\n').length, origCode.split('\n')[nrLines-1].length);
  return origCodeBefore + mutant.replacement + origCodeAfter;
}

/**
 * Builds a map from path to code fragment for a given file.
 * @param file the file
 * @param code the code
 * @returns the map
 */
function buildMap(file: string, code: string){
  const map = new Map<string, ASTNodeInfo>(); // maps from path to code fragment
  const ast = parser.parse(code, { sourceType: "module", plugins: ["typescript"]});
  traverse(ast, {
    enter(path) {
      const key = path.getPathLocation(); // representation of the path, e.g., program.body[18].declaration.properties[6].value
      const astNodeLoc = {
        file: file,
        startLine: path.node.loc!.start.line,
        startColumn: path.node.loc!.start.column,
        endLine: path.node.loc!.end.line,
        endColumn: path.node.loc!.end.column,
      };
      const text = getText(code, astNodeLoc.startLine, astNodeLoc.startColumn, astNodeLoc.endLine, astNodeLoc.endColumn);
      map.set(key, { "text" : text, "loc": astNodeLoc });
    }
  });
  return map;
}

/**
 * Determine the paths at which the original and mutated code fragments differ.
 * @param origMap the map for the original code
 * @param mutatedMap the map for the mutated code
 * @returns the paths at which the original and mutated code fragments differ
 */
function computeDiffs(origMap: Map<string, ASTNodeInfo>, mutatedMap: Map<string, ASTNodeInfo>) {
  const diffs = [];
  for (const key of origMap.keys()) {
    const origValue = origMap.get(key);
    if (mutatedMap.has(key)) {
      const mutatedValue = mutatedMap.get(key);
      if (origValue!.text !== mutatedValue!.text) {
        diffs.push(key);
      }
    } 
  }
  return diffs;
}

/**
 * compute the smallest diff, i.e., a single path that contains all the mutated code fragments
 * @param paths the diffs
 * @returns the smallest diff
 */
function computeSmallestDiff(paths: string[]){
  let smallestDiff;
  if (paths[paths.length-1].indexOf(paths[paths.length-2]) !== -1) {
    smallestDiff = paths[paths.length-1];
  } else {
    let j = paths.length - 2;
    while (j >= 0 && paths[paths.length-1].indexOf(paths[j]) === -1) {
      j--;
    }
    smallestDiff = paths[j];
  }
  return smallestDiff;
}