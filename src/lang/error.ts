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
        indicatorString(this.token.column,
                        this.token.column + this.token.lexeme.length - 1);
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
    const endCol: number = tokenEnd.column + tokenEnd.lexeme.length - 1;  

    // validate the token ranges
    if (endLineIndex < startLineIndex || 
        tokenStart.type === 'EOF' ||
        tokenEnd.type === 'EOF') {
      throw new ImplementationError('Bad ranges for TokenRangeError.');
    }

    // the error is on one line
    if (startLineIndex === endLineIndex) {
      if (endCol < startCol) {
        const msg = 'Ending column comes before starting column.';
        throw new ImplementationError(msg);
      }

      // create the message
      const indicator = indicatorString(startCol, endCol);
      let message =
        `[line ${startLineIndex}, column ${startCol} to column ${endCol}] `;
      message += `${this.message}\n${startLineString}\n${indicator}`;

      return message;
    }

    // the error is on consecutive lines
    if (endLineIndex - startLineIndex === 1) {
      // create the indicators
      const startLineIndicator =
        indicatorString(startCol, startLineString.length);
      const endLineIndicator =
        indicatorString(1, endCol);

      // create the message
      let message =
        `[line ${startLineIndex}, column ${startCol} ` +
        `to line ${endLineIndex}, column ${endCol}] `;
      message += `${this.message}\n`;
      message += `${startLineString}\n${startLineIndicator}\n`;
      message += `${endLineString}\n${endLineIndicator}`;

      return message;
    }

    // the error spans multiple lines

    // create the indicators
    const startLineIndicator =
      indicatorString(startCol, startLineString.length);
    const endLineIndicator =
      indicatorString(1, endCol);

    // create the message
    let message =
      `[line ${startLineIndex}, column ${startCol} ` +
      `to line ${endLineIndex}, column ${endCol}] `;
    message += `${this.message}\n`;
    message += `${startLineString}\n${startLineIndicator}`;
    message += `\n\n... (inner lines omitted) ...\n\n`;
    message += `${endLineString}\n${endLineIndicator}`;

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

// given two indices, create a ^^^ indicator string to be displayed below
// NOTE expects the indices to be 1-based
function indicatorString(start: number, end: number): string {
  if (end < start)
    throw new ImplementationError('Invalid indices given for offset.');

  const offset: string = ' '.repeat(start - 1);
  const indicator: string = '^'.repeat(end - start + 1);

  return offset + indicator;
}
