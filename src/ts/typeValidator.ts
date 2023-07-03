import { Token, TokenType } from './token';
import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, ExprVisitor, VariableExpr, AssignExpr, LogicalExpr, FunctionObjectExpr } from './expr'
import { TokenError, ImplementationError, LangError } from './error';
import { FunctionLOT, FunctionLangObject, LangObjectType } from './types';
import { BlankStmt, BlockStmt, BreakStmt, DeclarationStmt, ExpressionStmt, IfStmt, PrintStmt, Stmt, StmtVisitor, WhileStmt } from './stmt';
import { TypeEnvironment } from './environment';

export default class TypeValidator
  implements ExprVisitor<LangObjectType>, StmtVisitor<void> {

  private program: Stmt[];

  private currentEnvironment: TypeEnvironment;

  constructor(program: Stmt[]) {
    this.program = program;
    this.currentEnvironment = new TypeEnvironment(null);
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
    const leftType: LangObjectType | null = stmt.type;
    const rightType: LangObjectType = this.validateExpression(stmt.initialValue);

    // if the left type has a type hint, check the two types
    if (leftType !== null) {
      // function types use their own method
      if (leftType instanceof FunctionLOT 
          && rightType instanceof FunctionLOT) {
        if (!leftType.equals(rightType)) 
          throw new TokenError('Types do not match in declaration.',
                               stmt.identifier);
      // primitive types use ===
      } else if (leftType !== rightType) {
        throw new TokenError('Types do not match in declaration.',
                             stmt.identifier);
      }
    }

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
    if (this.validateExpression(stmt.condition) !== 'BoolLOT') 
      throw new TokenError('If statement condition must be a bool.',
                           stmt.ifToken);
    this.validateStatement(stmt.thenBranch);
    if (stmt.elseBranch !== null) this.validateStatement(stmt.elseBranch);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    if (this.validateExpression(stmt.condition) !== 'BoolLOT') 
      throw new TokenError('While statement condition must be a bool.', 
                           stmt.whileToken);
    this.validateStatement(stmt.body);
  }

  visitBreakStmt(stmt: BreakStmt): void {
    return;
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
    if (maybeType === undefined) {
      throw new TokenError('Undefined identifier used.', expr.identifier);
    }
    return maybeType;
  }

  visitAssignExpr(expr: AssignExpr): LangObjectType {
    const variableToken: Token = expr.variableIdentifier;
    const variableName: string = variableToken.lexeme;
    const variableType: LangObjectType | undefined 
      = this.currentEnvironment.get(variableName);

    // TODO delete this after making the resolver, and assert variableType as
    // LangObjectType
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
    const functionObject: FunctionLangObject = expr.value;
    
    // save the outer environment
    const outerEnvironment = this.currentEnvironment;

    // create the inner environment
    const innerEnvironment = new TypeEnvironment(outerEnvironment);

    // get each parameter name and type and add it to the environment
    for (const index in functionObject.parameterTokens) {
      const id: string = functionObject.parameterTokens[index].lexeme;
      const type: LangObjectType = functionObject.parameterTypes[index];
      innerEnvironment.define(id, type);
    }

    // switch environments and evaluate the function statement
    // NOTE for a block statement, a redundant environment is created instead of
    // one environment for the block, but it is only slightly inefficient
    this.currentEnvironment = innerEnvironment;
    try {
      this.validateStatement(functionObject.statement);
    } finally {
      // restore the outer environment regardless of any errors
      this.currentEnvironment = outerEnvironment;
    }

    return functionObject.type;
  }

  visitCallExpr(): LangObjectType {
    throw new Error('not yet implemented');
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
