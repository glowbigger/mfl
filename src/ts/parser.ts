import { Token, TokenType } from './token';
import { Expr, Binary, Grouping, Literal, Unary } from './expr'
import { TokenError } from './langError';

export default class Parser {
  // the tokens to be parsed
  private readonly tokens: Token[];

  // the index of the current token
  private currentIndex: number;

  private errors: TokenError[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.currentIndex = 0;
    this.errors = [];
  }

  //======================================================================
  // Parsing Methods
  //======================================================================

  parse(): Expr | null {
    // NOTE null is returned if and only if there are no tokens to parse
    let expr: Expr | null = null;
    while (!this.isAtEnd()) {
      expr = this.parseExpression();
    }

    // if (this.errors.length > 0) throw this.errors;
    return expr;
  }

  // expression     → equality ;
  parseExpression(): Expr {
    return this.parseEquality();
  }

  // equality       → comparison ( ( "!=" | "==" ) comparison )* ;
  parseEquality(): Expr {
    return this.parseBinary(() => this.parseComparison(),
                            'BANG_EQUAL', 'EQUAL_EQUAL');
  }

  // comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  parseComparison(): Expr {
    return this.parseBinary(() => this.parseTerm(),
                            'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL');
  }

  // term           → factor ( ( "-" | "+" ) factor )* ;
  parseTerm(): Expr {
    return this.parseBinary(() => this.parseFactor(),
                            'MINUS', 'PLUS');
  }

  // factor         → unary ( ( "/" | "*" ) unary )* ;
  parseFactor(): Expr {
    return this.parseBinary(() => this.parseUnary(),
                            'SLASH', 'STAR');
  }

  // unary          → ( "!" | "-" ) unary
  //                | primary ;
  parseUnary(): Expr {
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
  parsePrimary(): Expr {
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
  parseBinary(innerFunction: () => Expr, ...matchTypes: TokenType[]): Expr {
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

    throw new TokenError('Expect closing \')\'.', this.peek());
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

  // TODO change LangError and implement this
  // private addError(error: LangError): void {
  // }
}
