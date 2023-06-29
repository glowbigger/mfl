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

// a class that can print the above errors
export class LangErrorPrinter {
  // the source code and the source code lines as a string array
  private readonly lines: string[];

  constructor(source: string) {
    // split the source code into an array of strings
    this.lines = source.split(/\r?\n/);
  }

  print(error: LangError): string {
    let errorMessage: string = '';

    // check for each LangError type
    if (error instanceof CharacterError) {
      const line: number = error.line;
      const col: number = error.column;
      const msg: string = error.message;
      const char: string = this.lines[line - 1][col - 1];
      const lineString: string = this.lines[line - 1];

      errorMessage += `Error at the character '${char}' on ` +
                      `line ${line}, at column ${col}:\n` +
                      lineString + `\n${msg}`;
    } else if (error instanceof TokenError) {
      const line: number = error.token.line;
      const col: number = error.token.column;
      const msg: string = error.message;
      const lineString: string = this.lines[line - 1];

      if (error.token.type == 'EOF') {
        errorMessage += `Error at the end of the file:\n` +
                        this.lines[line - 1] + `\n${msg}`;
      } else { 
        errorMessage += `Error at the token of type ${error.token.type} on ` +
                        `line ${line}, at column ${col}:\n` +
                        lineString + `\n${msg}`;
      }
    }

    return errorMessage;
  }
}
