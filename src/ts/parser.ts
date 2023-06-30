import { Token, TokenType } from './token';
import { Expr, Binary, Grouping, Literal, Unary } from './expr'
import { LangError, TokenError } from './error';
import { Expression, Print, Stmt } from './stmt';

export default class Parser {
  // the tokens to be parsed
  private readonly tokens: Token[];

  // the index of the current token
  private currentIndex: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.currentIndex = 0;
  }

  //======================================================================
  // Parsing Methods
  //======================================================================

  // program        → statement* EOF ;
  // NOTE no need to worry about the EOF
  parse(): Stmt[] {
    const statements: Stmt[] = [];
    const errors: LangError[] = [];

    while (!this.isAtEnd()) {
      try {
        statements.push(this.parseStatement());
      } catch(error: unknown) {
        if (error instanceof LangError) {
          errors.push(error);
          this.synchronize();
        } else {
          // errors in the implementation code will stop the program immediately
          throw error;
        }
      }
    }

    if (errors.length > 0) throw errors;
    return statements;
  }

  // statement      → exprStmt
  //                | printStmt ;
  private parseStatement(): Stmt {
    if (this.match('PRINT')) return this.parsePrintStatement();

    return this.parseExpressionStatement();
  }

  // exprStmt       → expression ";" ;
  private parseExpressionStatement(): Stmt {
    const expression: Expr = this.parseExpression();
    this.expect('SEMICOLON', 'Semicolon expected at the end of a statement.');
    return new Expression(expression);
  }
  
  // printStmt      → "print" expression ";" ;
  private parsePrintStatement(): Stmt {
    // not strictly needed now, but may be needed if the grammar changes
    if (this.match('PRINT')) {
      this.expect('PRINT', 'Expect initial \'print\' for print statement.');
    }

    const expression: Expr = this.parseExpression();
    this.expect('SEMICOLON', 'Semicolon expected at the end of a statement.');
    return new Print(expression);
  }

  // expression     → equality ;
  private parseExpression(): Expr {
    return this.parseEquality();
  }

  // equality       → comparison ( ( "!=" | "==" ) comparison )* ;
  private parseEquality(): Expr {
    return this.parseBinary(() => this.parseComparison(),
                            'BANG_EQUAL', 'EQUAL_EQUAL');
  }

  // comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  private parseComparison(): Expr {
    return this.parseBinary(() => this.parseTerm(),
                            'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL');
  }

  // term           → factor ( ( "-" | "+" ) factor )* ;
  private parseTerm(): Expr {
    return this.parseBinary(() => this.parseFactor(),
                            'MINUS', 'PLUS');
  }

  // factor         → unary ( ( "/" | "*" ) unary )* ;
  private parseFactor(): Expr {
    return this.parseBinary(() => this.parseUnary(),
                            'SLASH', 'STAR');
  }

  // unary          → ( "!" | "-" ) unary
  //                | primary ;
  private parseUnary(): Expr {
    if (this.match('BANG', 'MINUS')) {
      const operator: Token = this.consume();
      const right: Expr = this.parseUnary();
      return new Unary(operator, right);
    } else {
      return this.parsePrimary();
    }
  }

  // primary        → NUMBER | STRING | "true" | "false" | "null"
  //                | "(" expression ")" ;
  private parsePrimary(): Expr {
    if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE', 'NULL')) {
      return new Literal(this.consume().literal);
    }
    
    if (this.match('LEFT_PAREN')) {
      // skip the (
      this.consume();
      const primaryExpr = this.parseExpression();
      this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
      return new Grouping(primaryExpr);
    }

    // if nothing can be parsed in primary, then the expression rule failed
    throw new TokenError('Expect expression.', this.peek());
  }

  // equality, comparison, term, factor have the same syntax, so they share code
  private parseBinary(innerFunction: () => Expr, ...matchTypes: TokenType[]): Expr {
    let expr: Expr = innerFunction();
    while (this.match(...matchTypes)) {
      const left: Expr = expr;
      const operator: Token = this.consume();
      const right: Expr = innerFunction();
      expr = new Binary(left, operator, right);
    }
    return expr;
  }

  //======================================================================
  // Helpers
  //======================================================================

  private peek(): Token {
    return this.tokens[this.currentIndex];
  }

  private consume(): Token {
    return this.tokens[this.currentIndex++];
  }

  // conditionally advance if the current token has the given token type,
  // otherwise throws an error with the given message
  private expect(tokenType: TokenType, message: string): Token {
    if (this.peek().type === tokenType) return this.consume();

    throw new TokenError(message, this.peek());
  }

  // returns whether the current token's type matches the given token type
  private match(...types: TokenType[]): boolean {
    // NOTE better to not have the below line and find implementation errors
    // if (this.isAtEnd()) return false;

    for (const type of types) {
      if (this.peek().type === type) {
        return true;
      } 
    }

    return false;
  }
  
  // checks if there are no more tokens to consume
  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  // after an error is thrown, this function gets called; it consumes tokens
  // until the start of a new statement
  private synchronize(): void {
    while (!this.isAtEnd()) {
      switch (this.peek().type) {
        case 'SEMICOLON':
          // a semicolon ends a statement, so it must get consumed
          this.consume();
          return;

        // these keywords begin a statement, so they shouldn't get consumed
        // NOTE if one of these keywords triggers an error, but that keyword
        // is not consumed before the error call, then you get an infinite loop
        case 'FUNCTION':
        case 'VAR':
        case 'FOR':
        case 'IF':
        case 'WHILE':
        case 'PRINT':
        case 'RETURN':
        // case 'CLASS':
          return;
      }
      this.consume();
    }
  }

  // TODO change LangError and implement this
  // private addError(error: LangError): void {
  // }
}
