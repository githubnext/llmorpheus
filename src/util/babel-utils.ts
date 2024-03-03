import traverse from '@babel/traverse'; 
import { ParseResult } from '@babel/parser';

export function findReferencedIdentifiers(
  fileName: string, ast: ParseResult): Set<string> {
    const references: Set<string> = new Set<string>();
    traverse(ast, {
      enter(path) {
        if (path.isIdentifier()) {
          references.add(path.node.name);
        }
      }
    });
    return references;
}