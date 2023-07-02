import { Token } from "./token";

export abstract class LangError extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  };
}

// an error at a single character
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

    return `(line ${lineIndex}, column ${column}) ${message}\n` +
           this.lineString + '\n' + offset + '^';
  }
}

// an error at a token
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
      const offset: string = ' '.repeat(this.token.column - 1);
      const indicator: string = '^'.repeat(this.token.lexeme.length);
      const lineIndex: number = this.token.lineIndex;
      const column: number = this.token.column;
      const message: string = this.message;

      return `(line ${lineIndex}, column ${column}) ${message}\n` +
             this.token.lineString + '\n' + offset + indicator;
    }
  }
}


// an error at a token
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
    const msg: string = this.message;

    const startLineString: string = this.tokenStart.lineString;
    const startLineIndex: number = this.tokenStart.lineIndex;
    const startCol: number = this.tokenStart.column;

    const endLineString: string = this.tokenEnd.lineString;
    const endLineIndex: number = tokenEnd.lineIndex;
    const endCol: number = tokenEnd.column;

    // validate the token ranges
    if (startLineIndex > endLineIndex || 
      (startLineIndex === endLineIndex && startCol > endCol) ||
      tokenStart === tokenEnd ||
      tokenStart.type === 'EOF') {
      throw new ImplementationError(`Bad TokenRangeError creation.`);
    }

    if (startLineIndex != endLineIndex)
      return `Error starting with ${tokenStart.lexeme} on ` +
        `line ${startLineIndex}, at column ${startCol} ` +
        `and ending with ${tokenEnd.lexeme} on ` +
        `line ${endLineIndex}, at column ${endCol}:\n` +
        `${startLineString}\n${endLineString}\n${msg}`;
    else
      return `Error starting with ${tokenStart.lexeme} on ` +
        `line ${startLineIndex}, at column ${startCol} ` +
        `and ending with ${tokenEnd.lexeme} on ` +
        `line ${endLineIndex}, at column ${endCol}:\n` +
        `${startLineString}\n${msg}`;
  }
}

// for errors in the interpreter code proper
export class ImplementationError extends Error {
  constructor(message: string) {
    super("Implementation error: " + message);
  }
}
