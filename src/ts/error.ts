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
  readonly line: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.column = column;
    this.line = line;
  }
}

// an error at a token
export class TokenError extends LangError {
  readonly token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
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
}

// a class that can print the above errors
export class LangErrorPrinter {
  // the source code and the source code lines as a string array
  private readonly lines: string[];

  constructor(source: string) {
    // split the source code into an array of strings
    this.lines = source.split(/\r?\n/);
  }

  print(error: LangError): string {
    let errorMessage: string;

    // check for each LangError type
    if (error instanceof CharacterError) {
      const line: number = error.line;
      const col: number = error.column;
      const msg: string = error.message;
      const char: string = this.lines[line - 1][col - 1];
      const lineString: string = this.lines[line - 1];

      errorMessage = `Error at '${char}' on ` +
                      `line ${line}, at column ${col}:\n` +
                      lineString + `\n${msg}`;
    } else if (error instanceof TokenError) {
      const line: number = error.token.line;
      const col: number = error.token.column;
      const msg: string = error.message;
      const lineString: string = this.lines[line - 1];

      if (error.token.type == 'EOF') {
        errorMessage = `Error at the end of the file:\n` +
                        lineString + `\n${msg}`;
      } else { 
        errorMessage = `Error at '${error.token.lexeme}' on ` +
                        `line ${line}, at column ${col}:\n` +
                        lineString + `\n${msg}`;
      }
    } else if (error instanceof TokenRangeError) {
      const tokenStart = error.tokenStart;
      const tokenEnd = error.tokenEnd;
      const startLine: number = tokenStart.line;
      const startCol: number = tokenStart.column;
      const endLine: number = tokenEnd.line;
      const endCol: number = tokenEnd.column;
      const startLineString: string = this.lines[startLine - 1];
      const endLineString: string = this.lines[endLine - 1];
      const msg: string = error.message;

      // validate the token ranges
      if (startLine > endLine || 
         (startLine == endLine && startCol > endCol) ||
         tokenStart == tokenEnd ||
         tokenStart.type == 'EOF') {
        throw new ImplementationError(`TokenRangeError was created with invalid
                                       tokens ${tokenStart} and ${tokenEnd}.`);
      }
      errorMessage = `Error starting with ${tokenStart.lexeme} on ` +
                     `line ${startLine}, at column ${startCol} ` +
                     `and ending with ${tokenEnd.lexeme} on ` +
                     `line ${endLine}, at column ${endCol}:\n` +
                     `${startLineString}\n${endLineString}\n${msg}`;
    } else {
      throw new ImplementationError('Trying to print unknown LangError.');
    }
    
    return errorMessage;
  }
}

// for errors in the interpreter code proper
export class ImplementationError extends Error {
  constructor(message: string) {
    super("Implementation error: " + message);
  }
}
