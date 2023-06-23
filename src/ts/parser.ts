import reportLangError from "./main";
import { Token, TokenType as TT } from './token';
import { Stmt, Print, Expression, Var, Block, If, While, Fun, Return } from "./stmt";

import {  Expr, Binary, Grouping, Literal, 
          Unary, Variable, Assign, Logical, Call } from "./expr";

import { Nullable } from "./types";

/* 
 * a recursive descent parser for the following expression grammar: 
 *
 * statement      → exprStmt
 *                | printStmt
 *                | block ;
 * block          → "{" declaration* "}" ;
 *
 * expression     -> assignment ;
 * assignment     -> IDENTIFIER "=" assignment
                  | equality ;
 * equality       -> comparison ( ( "!=" | "==" ) comparison )* ;
 * comparison     -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
 * term           -> factor ( ( "-" | "+" ) factor )* ;
 * factor         -> unary ( ( "/" | "*" ) unary )* ;
 * unary          -> ( "!" | "-" ) unary
 *                | primary ;
 * primary        -> NUMBER | STRING | "true" | "false" | "nil"
 *                | "(" expression ")" | IDENTIFIER ;
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
  // the tokens which will be read into the parser
  private readonly tokens: Token[];

  // the index of the current token
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  // will return an array of statements
  // the caller should also check the list of errors (defined above)
  // and print those messages
  parse(): Array<Stmt> {
    let statements: Array<Stmt> = [];

    while (!this.isAtEnd()) {
      const statement: Nullable<Stmt> = this.declaration();
      // the statement will be null if there was an error
      if (statement !== null) {
        statements.push(statement);
      }
    }

    return statements; 
  }

  /***********************************************************************
  * PARSING METHODS
  ***********************************************************************/

  // parses an expression
  // grammar:
  // expression     -> assignment ;
  private expression(): Expr {
    return this.assignment();
  }

  // parses a statement
  // statement      → exprStmt
  //                | ifStmt
  //                | printStmt
  //                | block ;
  private statement(): Stmt {
    if (this.match(TT.FOR)) return this.forStatement();
    if (this.match(TT.IF)) return this.ifStatement();
    if (this.match(TT.PRINT)) return this.printStatement();
    if (this.match(TT.RETURN)) return this.returnStatement();
    if (this.match(TT.WHILE)) return this.whileStatement();
    if (this.match(TT.LEFT_BRACE)) return new Block(this.block());

    return this.expressionStatement();
  }

  // forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
  //                  expression? ";"
  //                  expression? ")" statement ;
  // NOTE this uses desugaring into while loops:
  // the for loops are translated into a while loop which is returned
  // rather than a custom For() statement, in this way the interpreter
  // code does not need to be modified at all
  // NOTE therefore for loops are all just syntactic sugar
  private forStatement(): Stmt {
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'for'.");

    let initializer: Nullable<Stmt>;
    if (this.match(TT.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TT.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Nullable<Expr> = null;
    if (!this.check(TT.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TT.SEMICOLON, "Expect ';' after loop condition.");

    let increment: Nullable<Expr> = null;
    if (!this.check(TT.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TT.RIGHT_PAREN, "Expect ')' after for clauses.");

    // the body of the loop
    let body: Stmt = this.statement();

    // if an increment exists, make the body a block with the increment
    // statement at the end
    if (increment !== null) {
      body = new Block([ body, new Expression(increment) ]);
    }

    // an ommitted terminating condition results in a forever loop
    if (condition === null) condition = new Literal(true);

    let loop: Stmt = new While(condition, body);

    // the loop should have the initializer run once before the 
    // rest of the loop does, so combine them into a block statement
    if (initializer != null) {
      loop = new Block([ initializer, loop ]);
    }

    return loop;
  }

  // ifStmt         → "if" "(" expression ")" statement
  //                ( "else" statement )? ;
  // NOTE a dangling else is bound to the nearest if
  private ifStatement(): Stmt {
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'if'.");
    const condition: Expr = this.expression();
    this.consume(TT.RIGHT_PAREN, "Expect ')' after if condition."); 
    const thenBranch: Stmt = this.statement();

    // option else
    if (this.match(TT.ELSE)) {
      const elseBranch = this.statement();
      return new If(condition, thenBranch, elseBranch);
    }

    return new If(condition, thenBranch);
  }

  // printStmt      -> "print" expression ";" ;
  private printStatement(): Stmt {
    const value = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after value.");
    return new Print(value);
  }

  private returnStatement(): Stmt {
    // keyword, the return token, is kept only for error reporting
    const keyword: Token = this.previous();
    let value: Nullable<Expr> = null;

    // if "return" is not followed by a ;, then a value is being returned
    if (!this.check(TT.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TT.SEMICOLON, "Expect ';' after return value.");
    return new Return(keyword, value);
  }

  private whileStatement(): Stmt {
    this.consume(TT.LEFT_PAREN, "Expect '(' after 'while'.");
    const condition: Expr = this.expression();
    this.consume(TT.RIGHT_PAREN, "Expect ')' after condition.");
    const body: Stmt = this.statement();

    return new While(condition, body);
  }

  // grammar:
  // exprStmt       -> expression ";" ;
  private expressionStatement(): Stmt {
    const value = this.expression();
    this.consume(TT.SEMICOLON, "Expect ';' after value.");
    return new Expression(value);
  }

  // grammar:
  // funDecl        -> "fun" function ;
  // (funDecl is done in delcaration())
  // function       -> IDENTIFIER "(" parameters? ")" block ;
  private function(kind: string): Fun {
    const name: Token = this.consume( TT.IDENTIFIER, 
                                      "Expect " + kind + " name.");
    this.consume(TT.LEFT_PAREN, "Expect '(' after " + kind + " name.");
    const parameters: Array<Token> = [];
    if (!this.check(TT.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 255) {
          this.error(this.peek(), "Can't have more than 255 parameters.");
        }

        parameters.push(
            this.consume(TT.IDENTIFIER, "Expect parameter name."));
      } while (this.match(TT.COMMA));
    }
    this.consume(TT.RIGHT_PAREN, "Expect ')' after parameters.");

    this.consume(TT.LEFT_BRACE, "Expect '{' before " + kind + " body.");
    const body: Array<Stmt> = this.block();
    return new Fun(name, parameters, body);
  }

  // grammar:
  // block          -> "{" declaration* "}";
  // (assumes that the { has already been matched)
  private block(): Array<Stmt> {
    const statements: Array<Stmt> = [];

    // NOTE we must also check that EOF is reached, in case the
    // user enters a hanging {
    while (!this.check(TT.RIGHT_BRACE) && !this.isAtEnd()) {
      const declaration = this.declaration();
      if (declaration !== null) {
        statements.push(declaration);
      }
    }

    this.consume(TT.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  // declaration    -> varDecl
  //                | statement ;
  private declaration(): Nullable<Stmt> {
    try {
      if (this.match(TT.FUN)) return this.function("function");
      if (this.match(TT.VAR)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      if (error instanceof ParseError) {
        // reportLangError(error.token.line, error.message, true);
        this.synchronize();
        return null;
      } else {
        // this should not ever happen, but just in case
        console.log("There was a native error thrown during parsing:");
        console.log(error);
        process.exit(1);
      }
    }
  }

  // varDecl        -> "var" IDENTIFIER ( "=" expression )? ";" ;
  private varDeclaration(): Stmt {
    const name: Token = 
      this.consume(TT.IDENTIFIER, "Expect variable name.");

    let initializer: Nullable<Expr> = null;
    if (this.match(TT.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TT.SEMICOLON, "Expect ';' after variable declaration.");
    return new Var(name, initializer);
  }

  // grammar:
  // assignment     -> IDENTIFIER "=" assignment
  //                | logic_or ;
  // TODO comment this, does not match the grammar at all
  private assignment(): Expr {
    const expr: Expr = this.or();

    if (this.match(TT.EQUAL)) {
      const equals: Token = this.previous();
      // recursively calls assignemnt to support statements like
      // a = b = c
      const value: Expr = this.assignment();

      if (expr instanceof Variable) {
        const name: Token = expr.name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignment target."); 
    }

    return expr;
  }

  private or(): Expr {
    let expr: Expr = this.and();

    while (this.match(TT.OR)) {
      const operator: Token = this.previous();
      const right: Expr = this.and();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr: Expr = this.equality();

    while (this.match(TT.AND)) {
      const operator: Token = this.previous();
      const right: Expr = this.equality();
      expr = new Logical(expr, operator, right);
    }

    return expr;
  }

  // equality       -> comparison ( ( "!=" | "==" ) comparison )* ;
  //
  // NOTE this is left-associative: a == b == c is (a == b) == c
  // NOTE if no equality is hit, then only comparision() is parsed, this
  // is how order of operations is maintained
  // NOTE this is the framework for the following methods, equality,
  // comparison, term and factor. Therefore, they are all ideantical
  // except for the tokens that they match
  private equality(): Expr {
    let eqExpr = this.comparison();

    // while the next unconsumed token / current token is of type
    // != or ==, consume it and set it to be the operator, then 
    // parse another comparison
    while (this.match(TT.BANG_EQUAL, TT.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      eqExpr = new Binary(eqExpr, operator, right);
    }

    return eqExpr;
  }

  // comparison -> term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  private comparison(): Expr {
    let compExpr = this.term();

    while (this.match(TT.GREATER, TT.GREATER_EQUAL, 
                      TT.LESS, TT.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      compExpr = new Binary(compExpr, operator, right);
    }

    return compExpr;
  }

  // term -> factor ( ( "-" | "+" ) factor )* ;
  private term(): Expr {
    let termExpr = this.factor();

    while (this.match(TT.MINUS, TT.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      termExpr = new Binary(termExpr, operator, right);
    }

    return termExpr;
  }

  // factor -> unary ( ( "-" | "+" ) unary )* ;
  private factor(): Expr {
    let factorExpr = this.unary();

    while (this.match(TT.SLASH, TT.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      factorExpr = new Binary(factorExpr, operator, right);
    }

    return factorExpr;
  }

  // unary          -> ( "!" | "-" ) unary
  //                | primary ;
  private unary(): Expr {
    if (this.match(TT.BANG, TT.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.call();
  }

  // arguments      -> expression ( "," expression )* ;
  // parses the inner arguments of a function call
  // NOTE this returns a call, and finishes the call() function below
  private callArguments(callee: Expr): Expr {
    const args: Array<Expr> = []; 
    if (!this.check(TT.RIGHT_PAREN)) {
      do {
        if (args.length >= 255) {
          // NOTE no error is thrown, an error is only reported
          this.error(this.peek(), "Can't have more than 255 arguments.");
        }
        args.push(this.expression());
      } while (this.match(TT.COMMA));
    }

    // the right parenthesis is only stored for its location, which
    // will be reported in runtime errors
    const paren: Token = this.consume(TT.RIGHT_PAREN,
                          "Expect ')' after arguments.");

    return new Call(callee, paren, args);
  }

  // call           -> primary ( "(" callArguments? ")" )* ;
  // after a primary is hit, look for parentheses
  // TODO why isn't an error throw if expr is not an identifier?
  // ^ this is thrown at runtime for some reason
  private call(): Expr {
    let expr: Expr = this.primary();

    while (true) { 
      if (this.match(TT.LEFT_PAREN)) {
        expr = this.callArguments(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  // primary      -> "true" | "false" | "nil"
  //              | NUMBER | STRING
  //              | "(" expression ")"
  //              | IDENTIFIER ;
  private primary(): Expr {
    if (this.match(TT.NUMBER, TT.STRING)) {
      return new Literal(this.previous().literal);
    }
    if (this.match(TT.FALSE)) return new Literal(false);
    if (this.match(TT.TRUE)) return new Literal(true);
    if (this.match(TT.NIL)) return new Literal(null);

    if (this.match(TT.IDENTIFIER)) {
      return new Variable(this.previous());
    }

    // the LEFT_PAREN is used as a trigger for the inner expression()
    // and the closing RIGHT_PAREN is expected and an error is thrown
    // if none is found
    // NOTE the parentheses are ignored and not included in a Expr object
    if (this.match(TT.LEFT_PAREN)) {
      const primaryExpr = this.expression();
      this.consume(TT.RIGHT_PAREN, "Expect ')' after expression.");
      return new Grouping(primaryExpr);
    }

    // if a primary token cannot be found, then throw an error
    throw this.error(this.peek(), "Expect expression.");
  }

  /***********************************************************************
  * HELPER METHODS
  ***********************************************************************/

  // takes a list of Token types, and checks if one of those types
  // matches the current Token type (ie, the next unconsumed Token)
  // returns true if there was a match, false otherwise
  private match(...types: TT[]): boolean {
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
  private consume(type: TT, message: string): Token {
    if (this.check(type)) return this.advance();

    throw this.error(this.peek(), message);
  }

  // checks if the given TokenType matches the current Token's type
  // NOTE this does not consume the token
  private check(type: TT): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type == type;
  }

  // consumes the current character, which is equivalent to returning
  // the current character and advancing the position
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type == TT.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  // returns the most recently consume token
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  // not fully implemented yet
  private error(token: Token, message: string): ParseError {
    reportLangError(token.line, message, false);
    return new ParseError();
  }

  // consume characters until a semicolon
  // or CLASS, FUN, etc. token is hit, in which case the statement
  // is over and the parser has been synchronized
  private synchronize(): void {
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
