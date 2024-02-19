"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceLocation = void 0;
const fs = __importStar(require("fs"));
const code_utils_1 = require("./code-utils");
class SourceLocation {
    constructor(file, startLine, startColumn, endLine, endColumn) {
        this.file = file;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.endLine = endLine;
        this.endColumn = endColumn;
    }
    getText() {
        const code = fs.readFileSync(this.file, "utf8");
        const startIndex = (0, code_utils_1.toIndex)(code, this.startLine, this.startColumn);
        const endIndex = (0, code_utils_1.toIndex)(code, this.endLine, this.endColumn);
        return code.substring(startIndex, endIndex);
    }
    containedIn(other) {
        if (this.file !== other.file) {
            return false;
        }
        else if (this.startLine < other.startLine) {
            return false;
        }
        else if (this.startLine === other.startLine && this.startColumn < other.startColumn) {
            return false;
        }
        else if (this.endLine > other.endLine) {
            return false;
        }
        else if (this.endLine === other.endLine && this.endColumn > other.endColumn) {
            return false;
        }
        else {
            return true;
        }
    }
    toString() {
        return `${this.file}:<${this.startLine},${this.startColumn}>-<${this.endLine},${this.endColumn}>`;
    }
}
exports.SourceLocation = SourceLocation;
//# sourceMappingURL=SourceLocation.js.map