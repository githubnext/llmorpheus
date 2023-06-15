import * as fs from "fs";
import * as path from "path";

export function getStartColumn(projectPath: string, fileName: string, lineNr: number, originalCode: string): number {
  const lines = fs.readFileSync(path.join(projectPath, fileName)).toString().split("\n");
  const line = lines[lineNr-1];
  return line.indexOf(originalCode);    
}

export function getEndColumn(projectPath: string, fileName: string, lineNr: number, originalCode: string): number {
  const lines = fs.readFileSync(path.join(projectPath, fileName)).toString().split("\n");
  const line = lines[lineNr-1];
  return line.indexOf(originalCode) + originalCode.length;
}