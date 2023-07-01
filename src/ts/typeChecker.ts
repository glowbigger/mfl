import { TokenType } from './token';
import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, ExprVisitor, VariableExpr } from './expr'
import { TokenError, ImplementationError, LangError } from './error';
import { LangObjectType } from './types';
import { BlankStmt, DeclarationStmt, ExpressionStmt, PrintStmt, Stmt, StmtVisitor } from './stmt';
import { TypeEnvironment } from './environment';

export default class TypeChecker
  implements ExprVisitor<LangObjectType>, StmtVisitor<void> {

  private program: Stmt[];

  private globalEnvironment: TypeEnvironment;

  constructor(program: Stmt[]) {
    this.program = program;
    this.globalEnvironment = new TypeEnvironment();
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

  private validateStatement(stmt: Stmt): void {
    stmt.accept(this);
  }

  // checks whether the types are valid in a given expression or statement, adds
  // an error if they are not, and returns the type if possible
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
    const leftType: LangObjectType = stmt.type;
    const rightType: LangObjectType = this.validateExpression(stmt.initialValue);

    if (leftType != rightType) {
      throw new TokenError('Variable declaration types do not match',
                            stmt.identifier);
    }

    this.globalEnvironment.define(stmt.identifier.lexeme, leftType);
  }

  //======================================================================
  // Expression Visitor
  //======================================================================

  visitBinaryExpr(expr: BinaryExpr): LangObjectType {
    const opType: TokenType = expr.operator.type;
    
    // boolean operations / relations: ==, !=
    if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
      const leftType: LangObjectType = this.validateExpression(expr.left);
      if (leftType != 'BoolLOT') {
        throw new TokenError('Left operand is not a bool.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'BoolLOT') {
        throw new TokenError('Right operand is not a bool.', expr.operator);
      }
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
      if (rightType != leftType) {
        throw new TokenError('Operands do not match.', expr.operator);
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
    if (typeof(expr.value) == 'number') return 'NumberLOT';
    if (typeof(expr.value) == 'string') return 'StringLOT';
    return 'BoolLOT';
  }

  visitVariableExpr(expr: VariableExpr): LangObjectType {
    const maybeType: LangObjectType | undefined 
      = this.globalEnvironment.get(expr.identifier.lexeme);
    if (maybeType === undefined) {
      throw new TokenError('Undefined identifier used.', expr.identifier);
    }
    return maybeType;
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
