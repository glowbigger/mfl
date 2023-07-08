import { Token, TokenType } from './token';
import { Expr,
         BinaryExpr,
         GroupingExpr,
         LiteralExpr,
         UnaryExpr,
         VariableExpr,
         AssignExpr,
         LogicalExpr,
         FunctionObjectExpr,
         CallExpr,
         ArrayObjectExpr,
         ArrayAccessExpr,
         ArrayAssignExpr} from './expr'
import { LangError,
         TokenError,
         TokenRangeError } from './error';
import { Stmt,
         BlankStmt,
         ExpressionStmt,
         PrintStmt,
         DeclarationStmt,
         BlockStmt,
         IfStmt,
         WhileStmt,
         BreakStmt, 
         ReturnStmt} from './stmt';
import { ArrayLOT, FunctionLOT, FunctionLangObject, LangObjectType } from './types';

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
          case 'BREAK':
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

  // statement           → ifStmt | blockStmt | whileStmt | forStmt |
  //                     ( ( declarationStmt | printStmt | exprStmt )? ";" ) ;
  private parseStatement(): Stmt {
    let statement: Stmt;

    switch(this.peek().type) {
      // if the initial token is a ;, then return an empty statement
      case 'SEMICOLON': 
        this.consume();
        return new BlankStmt();

      // a break statement is a single token
      case 'BREAK':
        return new BreakStmt(this.consume());

      // no semicolon required for control flow statements
      case 'IF':
        return(this.parseIfStatement());
      case 'LEFT_BRACE':
        return(this.parseBlockStatement());
      case 'WHILE':
        return(this.parseWhileStatement());

      // let, print, return have their own functions
      case 'LET':
        statement = this.parseDeclarationStatement();
        break;
      case 'PRINT':
        statement = this.parsePrintStatement();
        break;
      case 'RETURN':
        statement = this.parseReturnStatement();
        break;

      default:
        statement = this.parseExpressionStatement();

        break;
    }

    this.expect('SEMICOLON', 'Semicolon expected before a new statement.');
    return statement;
  }

  // ifStmt              → "if" expression "then" statement ("else" statement)? ;
  private parseIfStatement(): Stmt {
    const ifToken: Token = this.expect('IF', 'Expect \'if\' to start if statement.');
    const condition: Expr = this.parseExpression();
    this.expect('THEN', 'Expect \'then\' after condition.');
    const thenBranch: Stmt = this.parseStatement();

    let elseBranch: Stmt | null = null;
    if (this.match('ELSE')) {
      this.consume();
      elseBranch = this.parseStatement();
    }

    return new IfStmt(ifToken, condition, thenBranch, elseBranch);
  }

  // blockStmt           → "{" statement* "}" ;
  private parseBlockStatement(): Stmt {
    this.expect('LEFT_BRACE', 'Expect \'{\' to begin block statement.');

    const statements: Stmt[] = [];
    while (!this.match('RIGHT_BRACE', 'EOF')) {
      statements.push(this.parseStatement());
    }

    this.expect('RIGHT_BRACE', 'Expect \'}\' to end block statement.');

    return new BlockStmt(statements);
  }

  // whileStmt           → "while" "(" condition ")" statement
  private parseWhileStatement(): Stmt {
    const whileToken: Token =
      this.expect('WHILE', 'Expect \'while\' to begin while statement.');
    this.expect('LEFT_PAREN', 'Expect \'(\' before condition.');
    const condition: Expr = this.parseExpression();
    this.expect('RIGHT_PAREN', 'Expect \')\' before condition.');
    const body: Stmt = this.parseStatement();

    return new WhileStmt(whileToken, condition, body);
  }

  // forStmt             → "for" "(" ( declarationStmt | exprStmt )? ";" | 
  //                                 expression? ";" |
  //                                 expression? ")" 
  //                       statement ;
  // private parseForStatement(): Stmt {
  //   this.expect 
  // }

  // NOTE exprStmt only exists to make clear that expression statements exist
  private parseExpressionStatement(): Stmt {
    const expression: Expr = this.parseExpression();
    return new ExpressionStmt(expression);
  }
  
  // printStmt      → "print" expression ;
  private parsePrintStatement(): Stmt {
    const keyword: Token =
      this.expect('PRINT', 'Expect initial \'print\' for print statement.');

    const expression: Expr = this.parseExpression();
    return new PrintStmt(keyword, expression);
  }

  // declarationStmt     → "let" IDENTIFIER ( ":" objectType )? "=" expression ;
  private parseDeclarationStatement(): Stmt {
    this.expect('LET', 'Expect \'let\' before variable declaration.');
    const identifier: Token = 
      this.expect('IDENTIFIER', 'Expect identifier name in declaration.');

    let type: LangObjectType | null = null;
    if (this.match('COLON')) {
      this.consume();
      type = this.parseObjectType();
    }

    this.expect('EQUAL', 'Expect an \'=\' in a declaration.');
    const initialValue: Expr = this.parseExpression();
    
    return new DeclarationStmt(identifier, type, initialValue);
  }

  // returnStmt        → "return" expression ;
  private parseReturnStatement(): Stmt {
    const keyword: Token =
      this.expect('RETURN', 'Expect initial \'return\' for return statement.');

    let expression: Expr | null;
    if (this.peek().type === 'SEMICOLON') {
      expression = null;
    } else {
      expression = this.parseExpression();
    }
    return new ReturnStmt(keyword, expression);
  }

  // objectType     → "number" | "string" | "bool" | functionType | arrayType ;
  private parseObjectType(): LangObjectType {
    switch(this.peek().type) {
      case 'NUMBER_PRIMITIVE_TYPE':
        this.consume();
        return 'NumberLOT';
      case 'STRING_PRIMITIVE_TYPE':
        this.consume();
        return 'StringLOT';
      case 'BOOL_PRIMITIVE_TYPE':
        this.consume();
        return 'BoolLOT';
      case 'LEFT_BRACKET':
        return this.parseArrayObjectType();
    }
    return this.parseFunctionObjectType();
  }

  // functionType        → "(" ( ( objectType "," )* objectType )? ")" "=>"
  //                       ( objectType | "void" ) ;
  private parseFunctionObjectType(): FunctionLOT {
    this.expect('LEFT_PAREN', 'Expect \'(\' for function type.');

    let parameters: LangObjectType[] = [];
    let returnType: LangObjectType | null;

    // parameters
    let commaNeeded: boolean = false;
    while (!this.match('RIGHT_PAREN')) {
      if (commaNeeded) {
        this.expect('COMMA', 'Expect comma between parameters.');
      }

      parameters.push(this.parseObjectType());

      // if a ) isn't found after the first identifier, a comma is needed
      commaNeeded = true;
    }

    // consume the ) and =>
    this.consume();
    this.expect('RIGHTARROW', 'Expect => for function type.');

    // return type
    if (this.match('VOID')) {
      this.consume();
      returnType = 'nullReturn';
    } else {
      returnType = this.parseObjectType();
    }

    return new FunctionLOT(parameters, returnType);
  }

  // expression     → assignment ;
  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  // assignment          → callOrAccess "=" assignment
  //                       IDENTIFIER "=" assignment
  //                       | logic_or ;
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
        const value: Expr = this.parseAssignment();
        return new AssignExpr(expr.identifier, value);
      }

      if (expr instanceof ArrayAccessExpr) {
        const value: Expr = this.parseAssignment();
        return new ArrayAssignExpr(expr, value, equalsSign);
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

  // unary          → ( "!" | "-" ) unary | call ;
  private parseUnary(): Expr {
    if (this.match('BANG', 'MINUS')) {
      const operator: Token = this.consume();
      const right: Expr = this.parseUnary();
      return new UnaryExpr(operator, right);
    } else {
      return this.parseCallOrAccess();
    }
  }

  // callOrAccess      → primary ( arrayAccess | call )* ;
  private parseCallOrAccess(): Expr {
    // the base, which can be built on, ie base -> base() -> base()[5] -> ...
    let base: Expr = this.parsePrimary();

    while (this.match('LEFT_PAREN', 'LEFT_BRACKET')) {
      if (this.match('LEFT_PAREN'))
        base = this.parseCall(base);
      
      if (this.match('LEFT_BRACKET'))
        base = this.parseArrayAccess(base);
    }

    return base;
  }
  
  // old:
  // call              → primary ( "(" ( expression ( "," expression )* )? ")" )* ;
  // new: 
  // call              → "(" ( expression ( "," expression)* )? ")" ;
  private parseCall(base: Expr): CallExpr {
    this.expect('LEFT_PAREN', 'Expect \'(\' for call.');

    // parse arguments
    let args: Expr[] = [];
    if (!this.match('RIGHT_PAREN')) {
      do {
        args.push(this.parseExpression());
      } while (this.matchAndConsume('COMMA'));
    }

    // rparen kept for error reporting
    const paren: Token = this.expect('RIGHT_PAREN',
                                     'Expect \')\' after arguments.');

    return new CallExpr(base, paren, args);
  }

  // arrayAccess       → "[" expression "]" ;
  private parseArrayAccess(base: Expr): ArrayAccessExpr {
    const leftBracket: Token = 
      this.expect('LEFT_BRACKET', 'Expect \'[\' for array access.');
    
    const index: Expr = this.parseExpression();

    const rightBracket: Token = 
      this.expect('RIGHT_BRACKET', 'Expect \']\' for array access.');

    return new ArrayAccessExpr(base, index, leftBracket, rightBracket);
  }

  // primary           → NUMBER | STRING | "true" | "false" | functionObject |
  //                     arrayObject | IDENTIFIER | "(" expression ")" ;
  private parsePrimary(): Expr {
    if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE')) {
      return new LiteralExpr(this.consume().value);
    }

    if (this.match('FUNCTION')) {
      return this.parseFunctionObject();
    }

    if (this.match('LEFT_BRACKET')) {
      return this.parseArrayObject();
    }

    if (this.match('IDENTIFIER')) {
      return new VariableExpr(this.consume());
    }
    
    if (this.match('LEFT_PAREN')) {
      // skip the (
      this.consume();
      const primaryExpr = this.parseExpression();
      this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
      return new GroupingExpr(primaryExpr);
    }

    // if nothing can be parsed in primary, then the expression rule failed
    throw new TokenError('Expect expression.', this.peek());
  }

  // functionObject → "fn" "(" ( ( IDENTIFIER ":" objectType "," )* 
  //                  ( IDENTIFIER ":" objectType) )? ")" 
  //                  "=>" ( objectType | "void" )statement
  // NOTE this is not a function call, it's an anonymous/unnamed function
  private parseFunctionObject(): FunctionObjectExpr {
    const keyword: Token =
      this.expect('FUNCTION', 'Expect \'fn\' for function object.');
    this.expect('LEFT_PAREN', 'Expect \'(\' after \'fn\'.');

    let parameterTokens: Token[] = [];
    let parameterTypes: LangObjectType[] = [];

    // parameters
    let commaNeeded: boolean = false;
    while (!this.match('RIGHT_PAREN')) {
      if (commaNeeded) {
        this.expect('COMMA', 'Expect comma between parameters.');
      }

      // parse one parameter
      const id: Token = this.expect('IDENTIFIER', 'Expect identifier.');
      this.expect('COLON', 'Expect colon after identifier.');
      const type: LangObjectType = this.parseObjectType();
      parameterTokens.push(id);
      parameterTypes.push(type);

      // if a ) isn't found after the first identifier, a comma is needed
      commaNeeded = true;
    }

    // consume the )
    this.consume();

    // return type and statement
    this.expect('RIGHTARROW', 'Expect \'=>\' after parameters.');
    let returnType: LangObjectType = 'nullReturn';
    if (this.match('VOID')) this.consume();
    else returnType = this.parseObjectType();

    // for error reporting, keep the current token
    const start: Token = this.peek();
    try {
      const statement: Stmt = this.parseStatement();
      return new FunctionObjectExpr(parameterTokens, parameterTypes,
                                    returnType, statement, keyword);
    } catch (error:unknown) {
      throw new TokenRangeError('Expect statement as body for function.',
                                start, this.peek());
    }
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

  // arrayObject       → filledArray | lengthArray ;
  private parseArrayObject(): ArrayObjectExpr {
    const leftBracket = this.expect('LEFT_BRACKET', 
                                    'Expect left bracket for array start.');
    if (this.match('RIGHT_BRACKET')) {
      // an empty array is not allowed because its type can't be inferred
      // NOTE they must be made like so [ 0 int ]
      const rightBracket = this.consume();
      const msg = 'An empty array cannot be made in this way.';
      throw new TokenRangeError(msg, leftBracket, rightBracket);
    }

    // parse the first expression, it is unknown at this point whether the array
    // is a list of expressions or an array with a given type and length
    const lengthOrFirstElement: Expr = this.parseExpression();

    // if the next token is ], the array has one expression, ie [ 5 ] or [ "hi" ]
    if (this.match('RIGHT_BRACKET')) {
      const rightBracket = this.consume();
      const capacity: LiteralExpr = new LiteralExpr(1);
      const expressions: Expr[] = [ lengthOrFirstElement];
      return new ArrayObjectExpr(capacity, expressions, 
                                 leftBracket, rightBracket);
    }

    // if the next token is a comma, then the array has multiple expression
    // NOTE the comma must not be consumed here
    if (this.match('COMMA')) 
      return this.parseFilledArray(leftBracket, lengthOrFirstElement);

    // otherwise try to parse an array with a given length, ie [ 4 int ]
    return this.parseLengthArray(leftBracket, lengthOrFirstElement);
  }

  // filledArray       → "[" expression (( "," expression )* )? "]"
  // NOTE this parses the rest of a filled array after the first expression
  private parseFilledArray(leftBracket: Token, 
                           firstExpression: Expr): ArrayObjectExpr {
    const elements: Expr[] = [ firstExpression ];

    while (!this.isAtEnd() && !this.match('RIGHT_BRACKET')) {
      this.expect('COMMA', 'Expect comma.');
      const currentElement = this.parseExpression();
      elements.push(currentElement);
    }

    // if the end of the file is reached, throw an error, otherwise consume the ]
    const rightBracket: Token = this.expect('RIGHT_BRACKET',
                                            'Expect right bracket.');

    const capacity = new LiteralExpr(elements.length);
    return new ArrayObjectExpr(capacity, elements,
                               leftBracket, rightBracket,);
  }

  // lengthArray       → "[" expression expression "]" ;
  // NOTE this parses the rest of a length array after the first expression
  private parseLengthArray(leftBracket: Token,
                           expression: Expr): ArrayObjectExpr {
    const object: Expr = this.parseExpression();
    const rightBracket: Token = this.expect('RIGHT_BRACKET',
                                            'Expect right bracket.');
    return new ArrayObjectExpr(expression, object,
                               leftBracket, rightBracket);
  }

  // arrayType         → "[" objectType "]"
  private parseArrayObjectType(): ArrayLOT {
    this.expect('LEFT_BRACKET', 'Expect \'[\' for array type.');
    const innerType: LangObjectType = this.parseObjectType();
    this.expect('RIGHT_BRACKET', 'Expect \']\' for array type.');

    return new ArrayLOT(innerType);
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
    for (const type of types) {
      if (this.peek().type === type) {
        return true;
      } 
    }

    return false;
  }

  // just like match(), except consumes the token if there was a match
  private matchAndConsume(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.peek().type === type) {
        this.consume();
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
