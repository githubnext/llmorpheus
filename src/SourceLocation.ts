import * as fs from 'fs';
import { toIndex } from './util';

export class SourceLocation {
  constructor(public readonly file: string, public readonly startLine: number, public readonly startColumn: number, public readonly endLine: number, public readonly endColumn: number, private originalCode?: string) { }
  public getText() {
    const code = fs.readFileSync(this.file, 'utf8');
    const startIndex = toIndex(code, this.startLine, this.startColumn);
    const endIndex = toIndex(code, this.endLine, this.endColumn);
    return code.substring(startIndex, endIndex);
  }
  public toString(): string {
    return `${this.file}:<${this.startLine},${this.startColumn}>-<${this.endLine},${this.endColumn}>`;
  }
}
