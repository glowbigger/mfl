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
         ArrayAssignExpr } from './expr'
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
         ReturnStmt } from './stmt';
import { LiteralTypeExpr, ArrayTypeExpr, FunctionTypeExpr, TypeExpr } from './typeExpr';

export default class Parser {
  // the tokens to be parsed
  private readonly tokens: Token[];

  // the index of the current token
  private currentIndex: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.currentIndex = 0;
  }

  // program        → statement* EOF ;
  // NOTE no need to worry about the EOF
  parse(): Stmt[] {
    const statements: Stmt[] = [];
    const errors: LangError[] = [];

    // parse all statements, catching any errors
    while (!this.isAtEnd()) {
      try {
        statements.push(this.parseStatement());
      } catch(error: unknown) {
        if (error instanceof LangError) {
          errors.push(error);

          // after an error, consume tokens until the beginning of a statement
          let syncDone = false;
          while (!this.isAtEnd() && !syncDone) {
            switch (this.peek().type) {
              case 'SEMICOLON':
                // a semicolon ends a statement, so it must get consumed
                this.consume();
                syncDone = true;
                break;

              // these keywords begin a statement, so they shouldn't get consumed
              // TODO if you add classes, you have to add the keyword here
              case 'FUNCTION':
              case 'LET':
              case 'FOR':
              case 'IF':
              case 'WHILE':
              case 'PRINT':
              case 'RETURN':
              case 'BREAK':
                syncDone = true;
                break;
            }
            if (!syncDone) this.consume();
          }
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

  //======================================================================
  // Statement Parsing Methods
  //======================================================================

  // statement           → ifStmt | blockStmt | whileStmt | forStmt |
  //                     ( ( declarationStmt | printStmt | exprStmt )? ";" ) ;
  private parseStatement(): Stmt {
    let statement: Stmt;

    switch(this.peek().type) {
      // if the initial token is a ;, then return an empty statement
      case 'SEMICOLON': 
        const semicolon: Token = this.consume();
        return new BlankStmt(semicolon);

      // a break statement is a single token
      case 'BREAK':
        const keyword: Token = this.consume();
        const breakSemicolon: Token = this.expect('SEMICOLON',
                                                  'Expect semicolon instead.');
        return new BreakStmt(keyword, breakSemicolon);

      case 'IF':
        return(this.parseIfStatement());
      case 'LEFT_BRACE':
        return(this.parseBlockStatement());
      case 'WHILE':
        return(this.parseWhileStatement());
      case 'LET':
        return(this.parseDeclarationStatement());
      case 'PRINT':
        return(this.parsePrintStatement());
      case 'RETURN':
        return(this.parseReturnStatement());

      // otherwise, parse an expression statement
      default:
        statement = this.parseExpressionStatement();
        break;
    }

    return statement;
  }

  // ifStmt              → "if" expression "then" statement ("else" statement)? ;
  private parseIfStatement(): IfStmt {
    const ifToken: Token =
      this.expect('IF', 'Expect \'if\' to start if statement.');
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
  private parseBlockStatement(): BlockStmt {
    const leftBrace: Token =
      this.expect('LEFT_BRACE', 'Expect \'{\' to begin block statement.');

    const statements: Stmt[] = [];
    while (!this.match('RIGHT_BRACE', 'EOF')) {
      statements.push(this.parseStatement());
    }

    const rightBrace: Token =
      this.expect('RIGHT_BRACE', 'Expect \'}\' to end block statement.');

    return new BlockStmt(leftBrace, statements, rightBrace);
  }

  // whileStmt           → "while" "(" condition ")" statement
  private parseWhileStatement(): WhileStmt {
    const whileToken: Token =
      this.expect('WHILE', 'Expect \'while\' to begin while statement.');

    const condition: Expr = this.parseExpression();
    this.expect('DO', 'Expect \'do\' after condition.');
    const body: Stmt = this.parseStatement();

    return new WhileStmt(whileToken, condition, body);
  }

  // NOTE exprStmt only exists to make clear that expression statements exist
  private parseExpressionStatement(): ExpressionStmt {
    const expression: Expr = this.parseExpression();
    const semicolon: Token = this.expect('SEMICOLON',
                                         'Expect semicolon instead.');

    return new ExpressionStmt(expression, semicolon);
  }
  
  // printStmt      → "print" expression ;
  private parsePrintStatement(): PrintStmt {
    const keyword: Token =
      this.expect('PRINT', 'Expect initial \'print\' for print statement.');

    const expression: Expr = this.parseExpression();
    const semicolon: Token = this.expect('SEMICOLON',
                                         'Expect semicolon instead.');

    return new PrintStmt(keyword, expression, semicolon);
  }

  // declarationStmt     → "let" IDENTIFIER ( ":" objectType )? "=" expression ;
  private parseDeclarationStatement(): DeclarationStmt {
    const keyword: Token =
      this.expect('LET', 'Expect \'let\' before variable declaration.');
    const identifier: Token = 
      this.expect('IDENTIFIER', 'Expect identifier name in declaration.');

    let type: TypeExpr | null = null;
    if (this.match('COLON')) {
      this.consume();
      type = this.parseObjectType();
    }

    this.expect('EQUAL', 'Expect an \'=\' in a declaration.');
    const initialValue: Expr = this.parseExpression();
    const semicolon: Token = this.expect('SEMICOLON',
                                         'Expect semicolon instead.');

    return new DeclarationStmt(keyword, identifier, type, initialValue,
                               semicolon);
  }

  // returnStmt        → "return" expression ;
  private parseReturnStatement(): ReturnStmt {
    const keyword: Token =
      this.expect('RETURN', 'Expect initial \'return\' for return statement.');
    const expression = this.parseExpression();
    const semicolon: Token = this.expect('SEMICOLON',
                                         'Expect semicolon instead.');

    return new ReturnStmt(keyword, expression, semicolon);
  }

  //======================================================================
  // Expression Parsing Methods
  //======================================================================

  // expression     → assignment ;
  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  // assignment          → callOrAccess "=" assignment
  //                       IDENTIFIER "=" assignment
  //                       | logic_or ;
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
        return new AssignExpr(expr.lToken, value);
      }

      if (expr instanceof ArrayAccessExpr) {
        const value: Expr = this.parseAssignment();
        return new ArrayAssignExpr(expr, value);
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
  
  // call              → "(" ( expression ( "," expression)* )? ")" ;
  // NOTE when this is called, the base has already been parsed
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
    const rightParen: Token = this.expect('RIGHT_PAREN',
                                     'Expect \')\' after arguments.');

    return new CallExpr(base, rightParen, args);
  }

  // arrayAccess       → "[" expression "]" ;
  // NOTE when this is called, the base has already been parsed
  private parseArrayAccess(base: Expr): ArrayAccessExpr {
    this.expect('LEFT_BRACKET', 'Expect \'[\' for array access.');
    const index: Expr = this.parseExpression();
    const rightBracket: Token = 
      this.expect('RIGHT_BRACKET', 'Expect \']\' for array access.');

    return new ArrayAccessExpr(base, index, rightBracket);
  }

  // primary           → NUMBER | STRING | "true" | "false" | functionObject |
  //                     arrayObject | IDENTIFIER | "(" expression ")" ;
  private parsePrimary(): Expr {
    if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE')) {
      const token = this.consume();
      return new LiteralExpr(token.value, token);
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
      const rParen = this.consume();
      const primaryExpr = this.parseExpression();
      const lParen =

        this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
      return new GroupingExpr(lParen, primaryExpr, rParen);
    }

    // if nothing can be parsed in primary, then the expression rule failed
    throw new TokenError('Expect expression.', this.peek());
  }

  // functionObject → "fn" "(" ( ( IDENTIFIER ":" objectType "," )* 
  //                  ( IDENTIFIER ":" objectType) )? ")" 
  //                  "=>" ( objectType ) statement
  private parseFunctionObject(): FunctionObjectExpr {
    const keyword: Token =
      this.expect('FUNCTION', 'Expect \'fn\' for function object.');
    this.expect('LEFT_PAREN', 'Expect \'(\' after \'fn\'.');

    let parameterTokens: Token[] = [];
    let parameterTypes: TypeExpr[] = [];

    // parameters
    let commaNeeded: boolean = false;
    while (!this.match('RIGHT_PAREN')) {
      if (commaNeeded) {
        this.expect('COMMA', 'Expect comma between parameters.');
      }

      // parse one parameter
      const id: Token = this.expect('IDENTIFIER', 'Expect identifier.');
      this.expect('COLON', 'Expect colon after identifier.');
      const type: TypeExpr = this.parseObjectType();
      parameterTokens.push(id);
      parameterTypes.push(type);

      // if a ) isn't found after the first identifier, a comma is needed
      commaNeeded = true;
    }

    // consume the )
    this.consume();

    // return type and statement
    this.expect('RIGHTARROW', 'Expect \'=>\' after parameters.');
    const returnType: TypeExpr = this.parseObjectType();

    // for error reporting, keep the current token
    const statement: Stmt = this.parseStatement();
    return new FunctionObjectExpr(parameterTokens, parameterTypes,
                                  returnType, statement, keyword);
  }

  // equality, comparison, term, factor have the same syntax, so they share code
  private parseBinary(inner: () => Expr, ...matchTypes: TokenType[]): Expr {
    let expr: Expr = inner();
    while (this.match(...matchTypes)) {
      const left: Expr = expr;
      const operator: Token = this.consume();
      const right: Expr = inner();

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
      const capacity = 1;
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
  // NOTE parses the rest of a filled array after the first expression
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

    const capacity = elements.length;
    return new ArrayObjectExpr(capacity, elements,
                               leftBracket, rightBracket,);
  }

  // lengthArray       → "[" expression "of" expression "]" ;
  // NOTE parses the rest of a length array after the first expression
  private parseLengthArray(leftBracket: Token,
                           expression: Expr): ArrayObjectExpr {
    this.expect('OF', 'Expect \'of\' after length expression.');
    const object: Expr = this.parseExpression();
    const rightBracket: Token = this.expect('RIGHT_BRACKET',
                                            'Expect right bracket.');
    return new ArrayObjectExpr(expression, object,
                               leftBracket, rightBracket);
  }

  //======================================================================
  // Type Parsing Methods
  //======================================================================

  // objectType     → "number" | "string" | "bool" | functionType | arrayType ;
  private parseObjectType(): TypeExpr {
    const peekType: TokenType = this.peek().type;
    const primitiveTypes: TokenType[] = ['NUMBER_PRIMITIVE_TYPE',
                                     'STRING_PRIMITIVE_TYPE',
                                     'BOOL_PRIMITIVE_TYPE'];

    // primitives
    if (primitiveTypes.includes(peekType))
      return new LiteralTypeExpr(this.consume());

    // arrays
    if (peekType === 'LEFT_BRACKET') {
      return this.parseArrayObjectType();
    }

    // default, try to parse a function
    return this.parseFunctionObjectType();
  }

  // functionType        → "(" ( ( objectType "," )* objectType )? ")" "=>"
  //                       ( objectType ) ;
  private parseFunctionObjectType(): FunctionTypeExpr {
    const lparen: Token =
      this.expect('LEFT_PAREN', 'Expect \'(\' for function type.');

    let parameters: TypeExpr[] = [];
    let returnType: TypeExpr;

    // parameters
    let commaNeeded: boolean = false;
    while (!this.match('RIGHT_PAREN')) {
      if (commaNeeded)
        this.expect('COMMA', 'Expect comma between parameters.');

      parameters.push(this.parseObjectType());

      // if a ) isn't found after the first identifier, a comma is needed
      commaNeeded = true;
    }

    // consume the ) and =>
    this.expect('RIGHT_PAREN', 'Expect \')\' after parameters.');
    this.expect('RIGHTARROW', 'Expect \'=>\' for function type.');

    returnType = this.parseObjectType();

    return new FunctionTypeExpr(lparen, parameters, returnType);
  }

  // arrayType         → "[" objectType "]"
  private parseArrayObjectType(): ArrayTypeExpr {
    const lBracket: Token =
      this.expect('LEFT_BRACKET', 'Expect \'[\' for array type.');
    const innerType: TypeExpr = this.parseObjectType();
    const rBracket: Token =
      this.expect('RIGHT_BRACKET', 'Expect \']\' for array type.');

    return new ArrayTypeExpr(lBracket, innerType, rBracket);
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
}
