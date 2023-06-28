abstract class langError extends Error {
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  };
}

// scan errors happen during, so they need positions in the source code
export class scanError extends langError {
  private readonly column: number;
  private readonly line: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.column = column;
    this.line = line;
  }

  toString() {
    const string =  `[line ${this.line}, column ${this.column}] ` + 
                    `Scanner Error: ${this.message}`
    return string;
  }
}

export class parseError extends langError { }
export class runtimeError extends langError { }
