import { Token, TokenType } from './token';
import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, ExprVisitor, VariableExpr, AssignExpr, LogicalExpr, FunctionObjectExpr, CallExpr, ArrayObjectExpr, ArrayAccessExpr, ArrayAssignExpr } from './expr'
import { TokenError, ImplementationError, LangError, TokenRangeError } from './error';
import { ArrayLOT, ArrayLangObject, FunctionLOT, LOTequal, LangObjectType } from './types';
import { BlankStmt, BlockStmt, BreakStmt, DeclarationStmt, ExpressionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, WhileStmt } from './stmt';
import { TypeEnvironment } from './environment';

export default class TypeValidator
  implements ExprVisitor<LangObjectType>, StmtVisitor<void> {

  private program: Stmt[];

  private currentEnvironment: TypeEnvironment;

  // expected type of the function being visited, stack used for nested functions 
  private expectedTypeStack: LangObjectType[];

  private currentReturnType: unknown;

  // for type checking within control flow, knowing this is important
  private withinIf: boolean;
  private withinWhile: boolean;

  constructor(program: Stmt[]) {
    this.program = program;
    this.currentEnvironment = new TypeEnvironment(null);
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
  private validateExpression(expr: Expr): LangObjectType {
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
                                     new FunctionLOT(initialValue.parameterTypes,
                                                     initialValue.returnType));
    }

    // the left type is the hinted type, the right type is the declared one
    const leftType: LangObjectType | null = stmt.type;
    const rightType: LangObjectType = this.validateExpression(initialValue);

    // if a type hint exists, check the two types
    if (leftType !== null && !LOTequal(leftType, rightType))
        throw new TokenError('Types do not match in declaration.',
                             stmt.identifier);

    // NOTE functions are just redefined
    this.currentEnvironment.define(stmt.identifier.lexeme, rightType);
  }

  visitBlockStmt(stmt: BlockStmt): void {
    // save the outer environment to restore later
    const outerEnvironment: TypeEnvironment = this.currentEnvironment;

    // a block statement has its own environment, which is initially empty
    this.currentEnvironment = new TypeEnvironment(outerEnvironment);

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
    // if branch
    this.withinIf = true;
    const condition: LangObjectType = this.validateExpression(stmt.condition);
    if (condition !== 'BoolLOT')
      throw new TokenError('If statement condition must be a bool.',
                           stmt.ifToken);

    // then branch
    this.validateStatement(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.validateStatement(stmt.elseBranch);

    // NOTE can't put this after the if statement proper, because both branches
    // might not have return statements
    this.withinIf = false;
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.withinWhile = true;
    if (this.validateExpression(stmt.condition) !== 'BoolLOT') 
      throw new TokenError('While statement condition must be a bool.', 
                           stmt.whileToken);
    this.validateStatement(stmt.body);
    this.withinWhile = false;
  }

  visitBreakStmt(stmt: BreakStmt): void {
    if (!this.withinIf || !this.withinWhile)
      throw new TokenError('Cannot break outside of an if or while statement.',
                           stmt.breakToken);
    return;
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.expectedTypeStack.length === 0)
      throw new TokenError('Cannot return outside of function.', stmt.keyword);

    let returnType: LangObjectType;
    if (stmt.value === null) returnType = 'nullReturn';
    else returnType = this.validateExpression(stmt.value);

    // if not within if or while, set the returnType if it has not been set
    if (this.withinIf || this.withinWhile) return;

    if (this.currentReturnType === null) {
      this.currentReturnType = returnType;
    }else{
      throw new TokenError('Unexpected return statement.', stmt.keyword);
    }
  }

  //======================================================================
  // Expression Visitor
  //======================================================================

  visitBinaryExpr(expr: BinaryExpr): LangObjectType {
    const opType: TokenType = expr.operator.type;
    
    // boolean operations / relations: ==, !=
    // can be used for all types
    if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
      const leftType: LangObjectType = this.validateExpression(expr.left);
      const rightType: LangObjectType = this.validateExpression(expr.right);
      if (leftType != rightType)
        throw new TokenError('Types do not match.', expr.operator);
      return 'BoolLOT';
    }

    // number relations: <, <=, >, >=
    if (this.tokenTypeMatch(opType, 'LESS', 'LESS_EQUAL', 
                                    'GREATER', 'GREATER_EQUAL')) {
      const leftType: LangObjectType = this.validateExpression(expr.left);
      if (leftType != 'NumberLOT') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NumberLOT') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'BoolLOT';
    }

    // number operations: -, *, /
    if (this.tokenTypeMatch(opType, 'MINUS', 'STAR', 'SLASH')) {
      const leftType: LangObjectType = this.validateExpression(expr.left);
      if (leftType != 'NumberLOT') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NumberLOT') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'NumberLOT';
    }

    // + is defined for both strings and numbers
    if (this.tokenTypeMatch(opType, 'PLUS')) {
      const leftType: LangObjectType = this.validateExpression(expr.left);
      if (leftType != 'NumberLOT' && leftType != 'StringLOT') {
        throw new TokenError('Left operand is not a number or string.',
                              expr.operator);
      }

      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NumberLOT' && rightType != 'StringLOT') {
        throw new TokenError('Right operand is not a number or string.',
                              expr.operator);
      }

      // NOTE we could just as easily return leftType
      return rightType;
    }

    throw new ImplementationError('Unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: UnaryExpr): LangObjectType {
    const opType: TokenType = expr.operator.type;

    if (this.tokenTypeMatch(opType, 'MINUS')) {
      const rightType: LangObjectType = this.validateExpression(expr.right);
      if (rightType != 'NumberLOT') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'NumberLOT';
    }

    if (this.tokenTypeMatch(opType, 'BANG')) {
      const rightType: LangObjectType = this.validateExpression(expr.right);
      if (rightType != 'BoolLOT') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'BoolLOT';
    }

    throw new ImplementationError('Unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: GroupingExpr): LangObjectType {
    return this.validateExpression(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LangObjectType {
    if (typeof(expr.value) === 'number') return 'NumberLOT';
    if (typeof(expr.value) === 'string') return 'StringLOT';
    return 'BoolLOT';
  }

  visitVariableExpr(expr: VariableExpr): LangObjectType {
    const maybeType: LangObjectType | undefined
      = this.currentEnvironment.get(expr.identifier.lexeme);
    
    // NOTE must still check for undefined in case a validation error existed
    if (maybeType === undefined) {
      throw new TokenError('Undefined variable.', expr.identifier);
    }
    return maybeType;
  }

  visitAssignExpr(expr: AssignExpr): LangObjectType {
    const variableToken: Token = expr.variableIdentifier;
    const variableName: string = variableToken.lexeme;
    const variableType: LangObjectType | undefined 
      = this.currentEnvironment.get(variableName);

    // NOTE must still check for undefined in case a validation error existed
    if (variableType === undefined){
      throw new TokenError('Undefined variable.', variableToken);
    }

    const rightType: LangObjectType = this.validateExpression(expr.value);
    const leftType: LangObjectType = variableType;

    // function types are checked using their own method
    if (leftType instanceof FunctionLOT && rightType instanceof FunctionLOT) {
      if (!leftType.equals(rightType)) 
        throw new TokenError('Types do not match in assignment.', variableToken);
    } else if (leftType !== rightType) {
      throw new TokenError('Types do not match in assignment.', variableToken);
    }

    return leftType;
  }

  visitLogicalExpr(expr: LogicalExpr): LangObjectType {
    const leftType: LangObjectType = this.validateExpression(expr.left);
    if (leftType != 'BoolLOT')
      throw new TokenError('Left operand must be a bool.', expr.operator);

    const rightType: LangObjectType = this.validateExpression(expr.right);
    if (rightType != 'BoolLOT')
      throw new TokenError('Right operand must be a bool.', expr.operator);

    return 'BoolLOT';
  }

  visitFunctionObjectExpr(expr: FunctionObjectExpr): LangObjectType {
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
    const innerEnvironment = new TypeEnvironment(outerEnvironment);

    // get each parameter name and type and add it to the environment
    for (const index in expr.parameterTokens) {
      const id: string = expr.parameterTokens[index].lexeme;
      const type: LangObjectType = expr.parameterTypes[index];
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
    const expectedType: LangObjectType =
      this.expectedTypeStack.pop() as LangObjectType;
    if (!LOTequal(expectedType, this.currentReturnType as LangObjectType)) {
      // restore the outer properties
      this.withinIf = outerWithinIf;
      this.withinWhile = outerWithinWhile;
      this.currentReturnType = outerReturnType;

      const msg = `Invalid return type.`;
      throw new TokenError(msg, expr.keyword);
    } else {
      // restore the outer properties
      this.withinIf = outerWithinIf;
      this.withinWhile = outerWithinWhile;
      this.currentReturnType = outerReturnType;

      return new FunctionLOT(expr.parameterTypes, expr.returnType);
    }
  }

  visitCallExpr(expr: CallExpr): LangObjectType {
    const maybeCallable: LangObjectType = this.validateExpression(expr.callee);
    
    // check whether the primary is callable
    if (!(maybeCallable instanceof FunctionLOT))
      throw new TokenError('Expect callable object.', expr.paren);

    // get the arguments as types
    const argExprs: Expr[] = expr.args;
    let args: LangObjectType[] = [];
    for (const argExpr of argExprs) {
      args.push(this.validateExpression(argExpr));
    }

    // check whether the arity matches the number of arguments
    const params: LangObjectType[] = maybeCallable.parameters;
    if (params.length != args.length) {
      const errorMsg = 'Number of arguments does not equal number of parameters';
      throw new TokenError(errorMsg, expr.paren);
    }

    // check if the parameter types equal the argument types
    for (const i in params) {
      if (!LOTequal(params[i], args[i]))
        throw new TokenError(`Invalid argument type(s).`, expr.paren);
    }

    return ((maybeCallable.returnType == null) ? 
            'nullReturn' : maybeCallable.returnType);
  }

  visitArrayObjectExpr(expr: ArrayObjectExpr): LangObjectType {
    // make sure that the given capacity is a number
    const capacityType: LangObjectType = this.validateExpression(expr.capacity);
    if (capacityType !== 'NumberLOT')
      throw new TokenRangeError('Given capacity must be a number.',
                                expr.leftBracket, expr.rightBracket);
    
    let type: LangObjectType;

    // if the array is filled with expressions, ie [5, 6], deduce the type and
    // make sure all elements of the array have the same type
    if (Array.isArray(expr.elements)) {
      type = this.validateExpression(expr.elements[0]);

      for (const element of expr.elements) {
        const currentElementType: LangObjectType
          = this.validateExpression(element);

        if (!LOTequal(type, currentElementType))
          throw new TokenRangeError('Types must all be the same in an array',
            expr.leftBracket, expr.rightBracket);
      }
    } else {
      // otherwise elements refers to only element, so validate and return it
      type = this.validateExpression(expr.elements);
    }

    return new ArrayLOT(type);
  }

  visitArrayAccessExpr(expr: ArrayAccessExpr): LangObjectType {
    const indexType: LangObjectType = this.validateExpression(expr.index);
    if (indexType !== 'NumberLOT')
      throw new TokenRangeError('Expect index number.',
                                expr.leftBracket, expr.rightBracket);

    const arrayType: LangObjectType = this.validateExpression(expr.arrayExpr);
    if (!(arrayType instanceof ArrayLOT))
      throw new TokenRangeError('Only arrays can be accessed via [].',
                                expr.leftBracket, expr.rightBracket);

    return arrayType.innerType;
  }

  visitArrayAssignExpr(expr: ArrayAssignExpr): LangObjectType {
    const arrayType: LangObjectType
      = this.validateExpression(expr.arrayAccessExpr);
    const valueType: LangObjectType
      = this.validateExpression(expr.assignmentValue);

    if (!LOTequal(arrayType, valueType)) {
      throw new TokenError('Types around = do not match', expr.equalityToken);
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
