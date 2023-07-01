import { Token, TokenType } from './token';
import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, 
         VariableExpr, 
         AssignExpr,
         LogicalExpr} from './expr'
import { ImplementationError, LangError, TokenError, 
         TokenRangeError } from './error';
import { Stmt, BlankStmt, ExpressionStmt, PrintStmt, 
         DeclarationStmt, 
         BlockStmt,
         IfStmt} from './stmt';
import { LangObjectType } from './types';

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
    // after an error is thrown, this function gets called; it consumes tokens
    // until the start of a new statement
    // NOTE it's a nested function because it shouldn't be called elsewhere
    // NOTE uses an arrow function so that 'this' can be used within the method 
    const synchronize = (): void => {
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
          case 'LET':
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
    };

    const statements: Stmt[] = [];
    const errors: LangError[] = [];

    // parse all statements, catching any errors
    while (!this.isAtEnd()) {
      try {
        statements.push(this.parseStatement());
      } catch(error: unknown) {
        if (error instanceof LangError) {
          errors.push(error);
          synchronize();
        } else {
          // unexpected errors will stop the parser immediately
          throw error;
        }
      }
    }

    // throw the errors all at once as an array
    if (errors.length > 0) throw errors;

    return statements;
  }

  // statement           → ifStmt | blockStmt |
  //                     ((declarationStmt | printStmt | exprStmt) ";") ;
  private parseStatement(): Stmt {
    let statement: Stmt;

    switch(this.peek().type) {
      // if the initial token is a ;, then return an empty statement
      case 'SEMICOLON': 
        this.consume();
        return new BlankStmt();

      // no semicolon required for if and block statements
      case 'IF':
        return(this.parseIfStatement());
      case 'LEFT_BRACE':
        return(this.parseBlockStatement());

      case 'LET':
        statement = this.parseDeclarationStatement();
        break;

      case 'PRINT':
        statement = this.parsePrintStatement();
        break;

      default:
        /*
        * if no statement can be found, then report an error over a range of
        * tokens, starting from the current token and up until the token right 
        * BEFORE where the next statement is presumed to start
        */
        try {
          statement = this.parseExpressionStatement();
        } catch(error: unknown) {
          const start: Token = this.peek();
          let end: Token = this.peek();

          // NOTE unlike synchronize(), the semicolon should not get consumed,
          // because it will get consumed by synchronize()
          while (!this.isAtEnd() && !this.match('SEMICOLON', 'FUNCTION', 
                                               'LET', 'FOR', 'IF', 'WHILE',
                                               'PRINT', 'RETURN')) {
            end = this.consume();
          }
          if (start !== end) {
            throw new TokenRangeError('Expect statement.', start, end);
          } else {
            throw new TokenError('Expect statement.', start);
          }
        }

        break;
    }

    this.expect('SEMICOLON', 'Semicolon expected at the end of a statement.');
    return statement;
  }

  // blockStmt           → "{" statement* "}" ;
  private parseBlockStatement(): Stmt {
    this.expect('LEFT_BRACE', 'Expect \'{\' for block statement.');

    const statements: Stmt[] = [];
    while (!this.match('RIGHT_BRACE', 'EOF')) {
      statements.push(this.parseStatement());
    }

    this.expect('RIGHT_BRACE', 'Expect \'}\' after statement.');

    return new BlockStmt(statements);
  }

  // NOTE exprStmt only exists to make clear that expression statements exist
  private parseExpressionStatement(): Stmt {
    const expression: Expr = this.parseExpression();
    return new ExpressionStmt(expression);
  }
  
  // printStmt      → "print" expression ;
  private parsePrintStatement(): Stmt {
    if (this.match('PRINT')) {
      this.expect('PRINT', 'Expect initial \'print\' for print statement.');
    }

    const expression: Expr = this.parseExpression();
    return new PrintStmt(expression);
  }

  // declarationStmt     → "let" IDENTIFIER ":" objType "=" expression ;
  private parseDeclarationStatement(): Stmt {
    this.expect('LET', 'Expect \'let\' before variable declaration.');
    const identifier: Token = 
      this.expect('IDENTIFIER', 'Expect identifier name in declaration.');
    this.expect('COLON', 'Expect a colon after an identifier in a declaration.');
    const type: LangObjectType = this.parseObjectType();
    this.expect('EQUAL', 'Expect an \'=\' after a type in a declaration.');
    const initialValue: Expr = this.parseExpression();
    
    return new DeclarationStmt(identifier, type, initialValue);
  }

  // ifStmt              → "if" "(" expression ")" statement ("else" statement)? ;
  private parseIfStatement(): Stmt {
    const ifToken: Token = this.expect('IF', 'Expect \'if\' to start if statement.');
    this.expect('LEFT_PAREN', 'Expect \'(\' before expression.');
    const condition: Expr = this.parseExpression();
    this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
    const thenBranch: Stmt = this.parseStatement();

    let elseBranch: Stmt | null = null;
    if (this.match('ELSE')) {
      this.consume();
      elseBranch = this.parseStatement();
    }

    return new IfStmt(ifToken, condition, thenBranch, elseBranch);
  }

  // objectType     → "number" | "string" | "bool" ;
  private parseObjectType(): LangObjectType {
    const token: Token = 
      this.expect('PRIMITIVE', 'Expect a type after \':\' in a declaration.');
    switch(token.lexeme) {
      case 'number':
        return 'NumberLOT';
      case 'string':
        return 'StringLOT';
      case 'bool':
        return 'BoolLOT';
    }
    throw new ImplementationError('Unknown lexeme in primitive token.');
  }

  // expression     → assignment ;
  //
  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  // assignment          → IDENTIFIER "=" assignment
  //                     | logic_or ;
  // NOTE the code does not follow the grammar exactly
  // NOTE as a reminder, an assignment is not a statement: a = (b = c), but it
  // almost always gets called as apart of an expression statement
  private parseAssignment(): Expr {
    // first parse for an equality rule, which may return an identifier
    let expr: Expr = this.parseLogicOr();

    // if the next token is an =, then the assignment is valid if expr is a 
    // variable, otherwise just return the expression
    if (this.match('EQUAL')) {
      const equalsSign: Token = this.consume();

      if (expr instanceof VariableExpr) {
        // NOTE the parseAssignemnt() can go outside the if too, error reporting
        // will differ slightly, consider a statement like a + b = c;
        const value: Expr = this.parseAssignment();
        return new AssignExpr(expr.identifier, value);
      }

      throw new TokenError('Trying to assign to invalid target.', equalsSign);
    }

    return expr;
  }

  // logic_or            → logic_and ( "or" expression )* ;
  private parseLogicOr(): Expr {
    let expr: Expr = this.parseLogicAnd();

    if (this.match('OR')) {
      const left: Expr = expr;
      const operator: Token = this.consume();
      const right: Expr = this.parseExpression();

      return new LogicalExpr(left, operator, right);
    }

    return expr;
  }

  // logic_and           → equality ( "and" expression )* ;
  private parseLogicAnd(): Expr {
    let expr: Expr = this.parseEquality();

    if (this.match('AND')) {
      const left: Expr = expr;
      const operator: Token = this.consume();
      const right: Expr = this.parseExpression();

      return new LogicalExpr(left, operator, right);
    }

    return expr;
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
      return new UnaryExpr(operator, right);
    } else {
      return this.parsePrimary();
    }
  }

  // primary        → NUMBER | STRING | "true" | "false"
  //                | "(" expression ")" | IDENTIFIER ;
  private parsePrimary(): Expr {
    if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE')) {
      return new LiteralExpr(this.consume().value);
    }
    
    if (this.match('LEFT_PAREN')) {
      // skip the (
      this.consume();
      const primaryExpr = this.parseExpression();
      this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
      return new GroupingExpr(primaryExpr);
    }

    if (this.match('IDENTIFIER')) {
      return new VariableExpr(this.consume());
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
      expr = new BinaryExpr(left, operator, right);
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

  // TODO change LangError and implement this
  // private addError(error: LangError): void {
  // }
}
