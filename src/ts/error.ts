import SyntaxTreeNode from "./syntaxTreeNode";
import { Token } from "./token";

export abstract class LangError extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  };
}

export class CharacterError extends LangError {
  readonly column: number;
  readonly lineString: string;
  readonly lineIndex: number;

  constructor(message: string, lineString: string,
              lineIndex: number, column: number) {
    super(message);
    this.lineString = lineString;
    this.lineIndex = lineIndex;
    this.column = column;
  }

  toString() {
    const offset: string = ' '.repeat(this.column - 1);
    const lineIndex: number = this.lineIndex;
    const column: number = this.column;
    const message: string = this.message;

    return `[line ${lineIndex}, column ${column}] ${message}\n` +
           this.lineString + '\n' + offset + '^';
  }
}

export class TokenError extends LangError {
  readonly token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }

  toString() {
    if (this.token.type === 'EOF') {
      return `(at the end of the file) ${this.message}`;
    } else { 
      const indicator: string =
        indicatorString(this.token.column - 1,
                        this.token.column - 1 + this.token.lexeme.length);
      const lineIndex: number = this.token.lineIndex;
      const column: number = this.token.column;
      const message: string = this.message;

      return `[line ${lineIndex}, column ${column}] ${message}\n` +
             this.token.lineString + '\n' + indicator;
    }
  }
}

export class TokenRangeError extends LangError {
  readonly tokenStart: Token;
  readonly tokenEnd: Token;

  constructor(message: string, tokenStart: Token, tokenEnd: Token) {
    super(message);
    this.tokenStart = tokenStart;
    this.tokenEnd = tokenEnd;
  }

  toString() {
    const tokenStart = this.tokenStart;
    const tokenEnd = this.tokenEnd;

    // NOTE reminder that the indices follow 1-based indexing
    const startLineString: string = this.tokenStart.lineString;
    const startLineIndex: number = this.tokenStart.lineIndex;
    const endLineString: string = this.tokenEnd.lineString;
    const endLineIndex: number = tokenEnd.lineIndex;
    const startCol: number = tokenStart.column;
    const endCol: number = tokenEnd.column;

    // validate the token ranges
    if (startLineIndex > endLineIndex || 
      (startLineIndex === endLineIndex && startCol > endCol) ||
      tokenStart.type === 'EOF') {
      throw new ImplementationError(`Bad TokenRangeError creation.`);
    }

    // create the error message
    let message = '';
    if (startLineIndex === endLineIndex) {
      const indicator = indicatorString(startCol - 1, endCol);
      message +=
        `[line ${startLineIndex}, from column ${startCol} to column ${endCol}]`;
      message += ` ${this.message}\n${startLineString}\n${indicator}`;
    } else {
      message = `Error starting with ${tokenStart.lexeme} on ` +
                `line ${startLineIndex}, at column ${startCol} ` +
                `and ending with ${tokenEnd.lexeme} on ` +
                `line ${endLineIndex}, at column ${endCol}:\n` +
                `${startLineString}\n${endLineString}\n${this.message}`;
    }

    return message;
  }
}

export class SyntaxTreeNodeError extends TokenRangeError {
  constructor(message: string, treeNode: SyntaxTreeNode) {
    super(message, treeNode.lToken, treeNode.rToken);
  }

  toString(): string {
    return super.toString();
  }
}

// for errors in the interpreter code proper and not the source code to be ran 
export class ImplementationError extends Error {
  constructor(message: string) {
    super("Implementation error: " + message);
  }
}

// given two indices, create a ^^^ indicator string to be displayed below text
function indicatorString(start: number, end: number): string {
  if (end < start)
    throw new ImplementationError('Invalid indices given for offset.');

  const offset: string = ' '.repeat(start);
  const indicator: string = '^'.repeat(end - start);

  return offset + indicator;
}
