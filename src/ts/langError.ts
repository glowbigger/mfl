import { Token } from "./token";

abstract class LangError extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  };
}

export class ScanError extends LangError {
  // need positions in the source code since there are no tokens yet
  private readonly column: number;
  private readonly line: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.column = column;
    this.line = line;
  }

  toString() {
    return 'Scanner error at: ' + 
           `line ${this.line}, ` + 
           `column ${this.column}]:\n` + 
           `${this.message}`
  }
}

export class ParseError extends LangError {
  // the tokens contain the positions of the error
  private readonly token: Token;

  constructor(message: string, token: Token) {
    super(message);
    this.token = token;
  }

  toString() {
    return  'Parser error at: ' + 
            `line ${this.token.line}, ` + 
            `column ${this.token.column}]:\n` + 
            `${this.message}`
  }
}

export class RuntimeError extends LangError { }
