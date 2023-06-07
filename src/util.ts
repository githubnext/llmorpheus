import * as fs from "fs";

export function getStartColumn(fileName: string, lineNr: number, originalCode: string): number {
  const lines = fs.readFileSync(fileName).toString().split("\n");
  const line = lines[lineNr-1];
  return line.indexOf(originalCode);    
}

export function getEndColumn(fileName: string, lineNr: number, originalCode: string): number {
  const lines = fs.readFileSync(fileName).toString().split("\n");
  const line = lines[lineNr-1];
  return line.indexOf(originalCode) + originalCode.length;
}