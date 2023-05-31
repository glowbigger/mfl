import { TokenType as TT } from "./tokenType"
import Token from "./token"
import * as expr from "./expr";
import { Nullable } from "./types";
import { LangError } from "./langError";

/* 
 * a recursive descent parser for the following expression grammar: 
 *
 * expression     → equality ;
 * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
 * comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
 * term           → factor ( ( "-" | "+" ) factor )* ;
 * factor         → unary ( ( "/" | "*" ) unary )* ;
 * unary          → ( "!" | "-" ) unary
 *                | primary ;
 * primary        → NUMBER | STRING | "true" | "false" | "nil"
 *                | "(" expression ")" ;
 *
 * NOTE the order of operations goes from bottom to top: so primary
 * expressions like true, nil, are evaluated first, ! and - are
 * evaluated next, etc.
 * NOTE it is called recursive descent, because it goes down the parse
 * tree / expression grammar list
 * (the last tokens to be evaluated have the highest precedence)
 * NOTE recursion corresponds to a grammar rule referring to itself
 * NOTE recursion is only found in the grammar rules for unary (directly)
 * and primary (indirectly)
 * NOTE this is a predictive parser, because it looks ahead at tokens
 * to figure out how to parse and expression (using match(), peek(), etc.)
 */

class ParseError extends Error {
}

export default class Parser {
  // nested static class are pretty much using the super class as
  // a namespace and nothing more

  // the tokens which will be read into the parser
  private readonly tokens:Token[];

  // the errors to be returned by parse()
  private errors:Array<LangError> = [];

  // the index of the current token
  private current = 0;

  constructor(tokens:Token[]) {
    this.tokens = tokens;
  }

  parse():{ expr: Nullable<expr.Expr>, errors: Array<LangError> }{
    try {
      return { expr: this.expression(), errors: this.errors };
    } catch (error:unknown) { // typescript requires error to be unknown
      // do nothing with the error for now
      return { expr: null, errors: this.errors };
    }
  }

  private expression():expr.Expr {
    return this.equality();
  }

  /***************************************************************
  * PARSING METHODS
  ***************************************************************/

  // NOTE this is left-associative: a == b == c is (a == b) == c
  // NOTE if no equality is hit, then only comparision() is parsed, this
  // is how order of operations is maintained
  // NOTE this is the framework for the following methods, equality,
  // comparison, term and factor. Therefore, they are all ideantical
  // except for the tokens that they match
  private equality():expr.Expr {
    // the corresponding rule is 
    // equality -> comparison ( ( "!=" | "==" ) comparison )* ;
    let eqExpr = this.comparison();

    // while the next unconsumed token / current token is of type
    // != or ==, consume it and set it to be the operator, then 
    // parse another comparison
    while (this.match(TT.BANG_EQUAL, TT.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      eqExpr = new expr.Binary(eqExpr, operator, right);
    }

    return eqExpr;
  }

  // comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term)* ;
  private comparison():expr.Expr {
    let compExpr = this.term();

    while (this.match(TT.GREATER, TT.GREATER_EQUAL, 
                      TT.LESS, TT.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      compExpr = new expr.Binary(compExpr, operator, right);
    }

    return compExpr;
  }

  // term -> factor ( ( "-" | "+" ) factor)* ;
  private term():expr.Expr {
    let termExpr = this.factor();

    while (this.match(TT.MINUS, TT.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      termExpr = new expr.Binary(termExpr, operator, right);
    }

    return termExpr;
  }

  // factor -> unary ( ( "-" | "+" ) unary)* ;
  private factor():expr.Expr {
    let factorExpr = this.unary();

    while (this.match(TT.SLASH, TT.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      factorExpr = new expr.Binary(factorExpr, operator, right);
    }

    return factorExpr;
  }

  // unary          -> ( "!" | "-" ) unary
  //                | primary ;
  private unary():expr.Expr {
    if (this.match(TT.BANG, TT.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new expr.Unary(operator, right);
    }

    return this.primary();
  }

  // primary        → NUMBER | STRING | "true" | "false" | "nil"
  //                | "(" expression ")" ;
  private primary():expr.Expr {
    if (this.match(TT.NUMBER, TT.STRING)) {
      return new expr.Literal(this.previous().literal);
    }
    if (this.match(TT.FALSE)) return new expr.Literal(false);
    if (this.match(TT.TRUE)) return new expr.Literal(true);
    if (this.match(TT.NIL)) return new expr.Literal(null);

    // the LEFT_PAREN is used as a trigger for the inner expression()
    // and the closing RIGHT_PAREN is expected and an error is thrown
    // if none is found
    // NOTE the parentheses are ignored and not included in a Expr object
    if (this.match(TT.LEFT_PAREN)) {
      const primaryExpr = this.expression();
      this.consume(TT.RIGHT_PAREN, "Expect ')' after expression.");
      return new expr.Grouping(primaryExpr);
    }

    // if a primary token cannot be found, then throw an error
    throw this.error(this.peek(), "Expect expression.");
  }

  /***************************************************************
  * HELPER METHODS
  ***************************************************************/

  // takes a list of Token types, and checks if one of those types
  // matches the current Token type (ie, the next unconsumed Token)
  // returns true if there was a match, false otherwise
  private match(...types:TT[]):boolean {
    for (const type of types) { 
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  // forces a consumption of the current token, it must be of the given
  // token type, and if not, it prints the given error message
  private consume(type:TT, message:string):Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  // checks if the given TokenType matches the current Token's type
  // NOTE this does not consume the token
  private check(type:TT):boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  // consumes the current character, which is equivalent to returning
  // the current character and advancing the position
  private advance():Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd():boolean {
    return this.peek().type == TT.EOF;
  }

  private peek():Token {
    return this.tokens[this.current];
  }

  // returns the most recently consume token
  private previous():Token {
    return this.tokens[this.current - 1];
  }

  // not fully implemented yet
  private error(token:Token, message:string):ParseError {
    this.errors.push(new LangError(message, '', 0));
    return new ParseError();
  }

  // not fully implemented yet, consume characters until a semicolon
  // or CLASS, FUN, etc. token is hit, in which case the statement
  // is over and the parser has been synchronized
  private synchronize():void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TT.SEMICOLON) return;

      switch (this.peek().type) {
        case TT.CLASS:
        case TT.FUN:
        case TT.VAR:
        case TT.FOR:
        case TT.IF:
        case TT.WHILE:
        case TT.PRINT:
        case TT.RETURN:
          return;
      }

      this.advance();
    }
  }
}
