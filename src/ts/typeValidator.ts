import { Token, TokenType } from './token';
import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, ExprVisitor, VariableExpr, AssignExpr, LogicalExpr, FunctionObjectExpr, CallExpr, ArrayObjectExpr, ArrayAccessExpr, ArrayAssignExpr } from './expr'
import { TokenError, ImplementationError, LangError, TokenRangeError, SyntaxTreeNodeError } from './error';
import { ArrayLangType, FunctionLangType, LangTypeEqual, LangType, ComplexLangType } from './langType';
import { BlankStmt, BlockStmt, BreakStmt, DeclarationStmt, ExpressionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, WhileStmt } from './stmt';
import Environment from './environment';

export default class TypeValidator
  implements ExprVisitor<LangType>, StmtVisitor<void> {

  private program: Stmt[];

  private currentEnvironment: Environment<LangType>;

  // expected type of the function being visited, stack used for nested functions 
  private expectedTypeStack: LangType[];

  private currentReturnType: unknown;

  // for type checking within control flow, knowing this is important
  private withinIf: boolean;
  private withinWhile: boolean;

  constructor(program: Stmt[]) {
    this.program = program;
    this.currentEnvironment = new Environment<LangType>(null);
    this.expectedTypeStack = [];
    this.withinIf = false;
    this.withinWhile = false;
    this.currentReturnType = null;
  }

  //======================================================================
  // Type Checking
  //======================================================================

  // validates types in a given program, ie a list of statements
  validateProgram(): void {
    const errors: LangError[] = [];
    for (const statement of this.program) {
      try {
        this.validateStatement(statement);
      } catch(error: unknown) {
        if (error instanceof LangError) {
          errors.push(error);
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) throw errors;
  }

  // checks whether the types of the variables are valid in a given statement
  // an inner environment can be passed in
  private validateStatement(stmt: Stmt): void {
    stmt.accept(this);
  }

  // checks whether the types of the variables are valid in a given expression
  // and if so, returns the type of the expression
  private validateExpression(expr: Expr): LangType {
    return expr.accept(this);
  }

  //======================================================================
  // Statement Visitor
  //======================================================================

  visitPrintStmt(stmt: PrintStmt): void {
    this.validateExpression(stmt.expression);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.validateExpression(stmt.expression);
  }

  visitBlankStmt(stmt: BlankStmt): void {
    return;
  }

  visitDeclarationStmt(stmt: DeclarationStmt): void {
    let initialValue: Expr = stmt.initialValue;

    // strip any unnecessary parentheses
    while (initialValue instanceof GroupingExpr) {
      // NOTE have to work around typescript assertion system
      const value: GroupingExpr = initialValue;
      initialValue = value.expression;
    }

    // check if the initial value is a function
    if (initialValue instanceof FunctionObjectExpr) {
      this.currentEnvironment.define(stmt.identifier.lexeme,
                                     new FunctionLangType(initialValue.parameterTypes,
                                                     initialValue.returnType));
    }

    // the left type is the hinted type, the right type is the declared one
    const leftType: LangType | null = stmt.type;
    const rightType: LangType = this.validateExpression(initialValue);

    // if a type hint exists, check the two types
    if (leftType !== null && !LangTypeEqual(leftType, rightType))
        throw new SyntaxTreeNodeError('Types do not match in declaration.',
                                      stmt);

    // NOTE functions are just redefined
    this.currentEnvironment.define(stmt.identifier.lexeme, rightType);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    // save the outer environment to restore later
    const outerEnvironment: Environment<LangType> = this.currentEnvironment;

    // a block statement has its own environment, which is initially empty
    this.currentEnvironment = new Environment<LangType>(outerEnvironment);

    try {
      for (const statement of stmt.statements) {
        // NOTE passing a new environment here would make each individual
        // statement have its own environment, which is incorrect
        this.validateStatement(statement);
      }
    } finally {
      // restore the outer environment regardless of any errors
      this.currentEnvironment = outerEnvironment;
    }
  }

  visitIfStmt(stmt: IfStmt): void {
    // remember whether the outer scope was within an if statement
    const outerWithinIf = this.withinIf;
    this.withinIf = true;

    // if branch
    const condition: LangType = this.validateExpression(stmt.condition);
    if (condition !== 'Bool')
      throw new TokenError('If statement condition must be a bool.',
                           stmt.lToken);

    // then branch
    this.validateStatement(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.validateStatement(stmt.elseBranch);

    // revert the current within if state to what was remembered
    // NOTE can't put this after the if branch proper, because both branches
    // might not have return statements
    this.withinIf = outerWithinIf;
  }

  visitWhileStmt(stmt: WhileStmt): void {
    // remember whether the outer scope was within a while statement
    const outerWithinWhile = this.withinWhile;
    this.withinWhile = true;

    if (this.validateExpression(stmt.condition) !== 'Bool') 
      throw new SyntaxTreeNodeError('Condition must be a bool.', 
                                    stmt.condition);
    this.validateStatement(stmt.body);

    // revert the current within while state to what was remembered
    this.withinWhile = outerWithinWhile;
  }

  visitBreakStmt(stmt: BreakStmt): void {
    if (!this.withinIf || !this.withinWhile)
      throw new TokenError('Cannot break outside of an if or while statement.',
                           stmt.lToken);
    return;
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.expectedTypeStack.length === 0)
      throw new SyntaxTreeNodeError('Cannot return outside of function.',
                                    stmt);

    let returnType: LangType;
    if (stmt.value === null) returnType = 'nullReturn';
    else returnType = this.validateExpression(stmt.value);

    // if not within if or while, set the returnType if it has not been set
    if (this.withinIf || this.withinWhile) return;

    if (this.currentReturnType === null) {
      this.currentReturnType = returnType;
    }else{
      throw new SyntaxTreeNodeError('Unexpected return statement.',
                                    stmt);
    }
  }

  //======================================================================
  // Expression Visitor
  //======================================================================

  visitBinaryExpr(expr: BinaryExpr): LangType {
    const opType: TokenType = expr.operator.type;
    
    // boolean operations / relations: ==, !=
    // can be used for all types
    if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
      const leftType: LangType = this.validateExpression(expr.leftExpr);
      const rightType: LangType = this.validateExpression(expr.rightExpr);

      if (leftType instanceof ComplexLangType) {
        const message = 'Left expression type must be num, str, or bool';
        throw new SyntaxTreeNodeError(message, expr.leftExpr);
      }
      if (rightType instanceof ComplexLangType) {
        const message = 'Right expression type must be num, str, or bool';
        throw new SyntaxTreeNodeError(message, expr.rightExpr);
      }

      if (leftType !== rightType)
        throw new TokenError('Types do not match.', expr.operator);
      return 'Bool';
    }

    // number relations: <, <=, >, >=
    if (this.tokenTypeMatch(opType, 'LESS', 'LESS_EQUAL', 
                                    'GREATER', 'GREATER_EQUAL')) {
      const leftType: LangType = this.validateExpression(expr.leftExpr);
      if (leftType !== 'Num') {
        throw new SyntaxTreeNodeError('Left operand is not a number.',
                                      expr.leftExpr);
      }
      const rightType = this.validateExpression(expr.rightExpr);
      if (rightType !== 'Num') {
        throw new SyntaxTreeNodeError('Right operand is not a number.',
                                      expr.rightExpr);
      }
      return 'Bool';
    }

    // number operations: -, *, /
    if (this.tokenTypeMatch(opType, 'MINUS', 'STAR', 'SLASH')) {
      const leftType: LangType = this.validateExpression(expr.leftExpr);
      if (leftType !== 'Num') {
        throw new SyntaxTreeNodeError('Left operand is not a number.',
                                      expr.leftExpr);
      }
      const rightType = this.validateExpression(expr.rightExpr);
      if (rightType !== 'Num') {
        throw new SyntaxTreeNodeError('Right operand is not a number.',
                                      expr.rightExpr);
      }
      return 'Num';
    }

    // + is defined for both strings and numbers
    if (this.tokenTypeMatch(opType, 'PLUS')) {
      const leftType: LangType = this.validateExpression(expr.leftExpr);
      if (leftType !== 'Num' && leftType !== 'Str') {
        throw new SyntaxTreeNodeError('Left operand is not a number or string.',
                                      expr.leftExpr);
      }

      const rightType = this.validateExpression(expr.rightExpr);
      if (rightType !== 'Num' && rightType !== 'Str') {
        throw new SyntaxTreeNodeError('Right operand is not a number or string.',
                                      expr.rightExpr);
      }

      // NOTE we could just as easily return leftType
      return rightType;
    }

    throw new ImplementationError('Unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: UnaryExpr): LangType {
    const opType: TokenType = expr.operator.type;

    if (this.tokenTypeMatch(opType, 'MINUS')) {
      const rightType: LangType = this.validateExpression(expr.rightExpr);
      if (rightType != 'Num') {
        throw new SyntaxTreeNodeError('Operand is not a number.',
                                      expr.rightExpr);
      }
      return 'Num';
    }

    if (this.tokenTypeMatch(opType, 'BANG')) {
      const rightType: LangType = this.validateExpression(expr.rightExpr);
      if (rightType != 'Bool') {
        throw new SyntaxTreeNodeError('Operand is not a number.',
                                      expr.rightExpr);
      }
      return 'Bool';
    }

    throw new ImplementationError('Unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: GroupingExpr): LangType {
    return this.validateExpression(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LangType {
    if (typeof(expr.value) === 'number') return 'Num';
    if (typeof(expr.value) === 'string') return 'Str';
    return 'Bool';
  }

  visitVariableExpr(expr: VariableExpr): LangType {
    const maybeType: LangType | undefined
      = this.currentEnvironment.get(expr.lToken.lexeme);
    
    // NOTE must still check for undefined in case a validation error existed
    if (maybeType === undefined) {
      throw new TokenError('Undefined variable.', expr.lToken);
    }
    return maybeType;
  }

  visitAssignExpr(expr: AssignExpr): LangType {
    const variableToken: Token = expr.lToken;
    const variableName: string = variableToken.lexeme;
    const variableType: LangType | undefined 
      = this.currentEnvironment.get(variableName);

    // NOTE must still check for undefined in case a validation error existed
    if (variableType === undefined){
      throw new TokenError('Undefined variable.', variableToken);
    }

    const rightType: LangType = this.validateExpression(expr.value);
    const leftType: LangType = variableType;

    if (!LangTypeEqual(leftType, rightType)) {
      throw new SyntaxTreeNodeError('Types do not match in assignment.',
                                    expr);
    }

    return leftType;
  }

  visitLogicalExpr(expr: LogicalExpr): LangType {
    const leftType: LangType = this.validateExpression(expr.leftExpr);
    if (leftType != 'Bool')
      throw new SyntaxTreeNodeError('Left operand must be a bool.',
                                    expr.leftExpr);

    const rightType: LangType = this.validateExpression(expr.rightExpr);
    if (rightType != 'Bool')
      throw new SyntaxTreeNodeError('Right operand must be a bool.',
                                    expr.rightExpr);

    return 'Bool';
  }

  visitFunctionObjectExpr(expr: FunctionObjectExpr): LangType {
    // save outer properties
    const outerEnvironment = this.currentEnvironment;
    const outerWithinIf = this.withinIf;
    const outerWithinWhile = this.withinWhile;
    const outerReturnType = this.currentReturnType;

    // reset properties
    this.withinIf = false;
    this.withinWhile = false;
    this.currentReturnType = null;

    // set the expect type before evaluating the statements
    this.expectedTypeStack.push(expr.returnType === null ?
                                'nullReturn' : expr.returnType);

    // create the inner environment
    const innerEnvironment = new Environment<LangType>(outerEnvironment);

    // get each parameter name and type and add it to the environment
    for (const index in expr.parameterTokens) {
      const id: string = expr.parameterTokens[index].lexeme;
      const type: LangType = expr.parameterTypes[index];
      innerEnvironment.define(id, type);
    }

    // switch environments and evaluate the function statement
    // NOTE for a block statement, a redundant environment is created instead of
    // one environment for the block, but it is only slightly inefficient
    this.currentEnvironment = innerEnvironment;

    try {
      this.validateStatement(expr.statement);
    } finally {
      // restore the outer environment regardless of any errors
      this.currentEnvironment = outerEnvironment;
    }

    // if the return type has not been set yet, then set it be void
    if (this.currentReturnType === null) {
      this.currentReturnType = 'nullReturn';
    }

    // check if the two types are the same
    const expectedType: LangType =
      this.expectedTypeStack.pop() as LangType;
    if (!LangTypeEqual(expectedType, this.currentReturnType as LangType)) {
      // restore the outer properties
      this.withinIf = outerWithinIf;
      this.withinWhile = outerWithinWhile;
      this.currentReturnType = outerReturnType;

      throw new SyntaxTreeNodeError('Invalid return type', expr);
    } else {
      // restore the outer properties
      this.withinIf = outerWithinIf;
      this.withinWhile = outerWithinWhile;
      this.currentReturnType = outerReturnType;

      return new FunctionLangType(expr.parameterTypes, expr.returnType);
    }
  }

  visitCallExpr(expr: CallExpr): LangType {
    const maybeCallable: LangType = this.validateExpression(expr.callee);
    
    // check whether the primary is callable
    if (!(maybeCallable instanceof FunctionLangType))
      throw new TokenError('Expect callable object.', expr.rToken);

    // get the arguments as types
    const argExprs: Expr[] = expr.args;
    let args: LangType[] = [];
    for (const argExpr of argExprs) {
      args.push(this.validateExpression(argExpr));
    }

    // check whether the arity matches the number of arguments
    const params: LangType[] = maybeCallable.parameters;
    if (params.length != args.length) {
      const errorMsg = 'Number of arguments does not equal number of parameters';
      throw new TokenError(errorMsg, expr.rToken);
    }

    // check if the parameter types equal the argument types
    for (const i in params) {
      if (!LangTypeEqual(params[i], args[i]))
        throw new TokenError(`Invalid argument type(s).`, expr.rToken);
    }

    return ((maybeCallable.returnType == null) ? 
            'nullReturn' : maybeCallable.returnType);
  }

  visitArrayObjectExpr(expr: ArrayObjectExpr): LangType {
    // if the given capacity is an expression, the expression should be a number
    if (expr.capacity instanceof Expr) {
      const capacityType: LangType = this.validateExpression(expr.capacity);
      if (capacityType !== 'Num')
        throw new SyntaxTreeNodeError('Given capacity must be a number.',
                                      expr.capacity);
    }

    let type: LangType;

    // if the array is filled with expressions, ie [5, 6], deduce the type and
    // make sure all elements of the array have the same type
    if (Array.isArray(expr.elements)) {
      type = this.validateExpression(expr.elements[0]);

      for (const element of expr.elements) {
        const currentElementType: LangType
          = this.validateExpression(element);

        if (!LangTypeEqual(type, currentElementType))
          throw new SyntaxTreeNodeError('Types must all be the same in an array',
                                        expr);
      }
    } else {
      // otherwise elements refers to only element, so validate and return it
      type = this.validateExpression(expr.elements);
    }

    return new ArrayLangType(type);
  }

  visitArrayAccessExpr(expr: ArrayAccessExpr): LangType {
    const indexType: LangType = this.validateExpression(expr.index);
    if (indexType !== 'Num')
      throw new SyntaxTreeNodeError('Expect index number.', expr);

    const arrayType: LangType = this.validateExpression(expr.arrayExpr);
    if (!(arrayType instanceof ArrayLangType))
      throw new SyntaxTreeNodeError('Only arrays can be accessed via [].',
                                    expr);

    return arrayType.innerType;
  }

  visitArrayAssignExpr(expr: ArrayAssignExpr): LangType {
    const arrayType: LangType
      = this.validateExpression(expr.arrayAccessExpr);
    const valueType: LangType
      = this.validateExpression(expr.assignmentValue);

    if (!LangTypeEqual(arrayType, valueType)) {
      throw new SyntaxTreeNodeError('Types do not match in assignment',
                                    expr);
    }

    return valueType;
  }

  //======================================================================
  // Helpers
  //======================================================================

  // returns whether a given type matches a spread of given types
  private tokenTypeMatch(type: TokenType, ...targets: TokenType[]) {
    for (const target of targets) {
      if (target == type) {
        return true;
      }
    }
    return false;
  }
}
