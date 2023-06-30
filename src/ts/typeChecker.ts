import { Token, TokenType } from './token';
import { Expr, Binary, Grouping, Literal, Unary, ExprVisitor } from './expr'
import { TokenError, ImplementationError, LangError } from './error';
import { ExprType } from './types';
import { Expression, Print, Stmt, StmtVisitor } from './stmt';

export default class TypeChecker
  implements ExprVisitor<ExprType>, StmtVisitor<void> {

  //======================================================================
  // Type Checking
  //======================================================================

  // validates types in a given program, ie a list of statements
  validateProgram(program: Stmt[]): void {
    const errors: LangError[] = [];
    for (const statement of program) {
      try {
        this.validateStatement(statement);
      } catch(error: unknown) {
        if (error instanceof LangError)
          errors.push(error);
        else
          throw error;
      }
    }

    if (errors.length > 0) throw errors;
  }

  validateStatement(stmt: Stmt): void {
    stmt.accept(this);
  }

  // checks whether the types are valid in a given expression or statement, adds
  // an error if they are not, and returns the type if possible
  validateExpression(expr: Expr): ExprType {
    return expr.accept(this);
  }

  //======================================================================
  // Statement Visitor
  //======================================================================

  visitPrintStmt(stmt: Print): void {
    this.validateExpression(stmt.expression);
  }

  visitExpressionStmt(stmt: Expression): void {
    this.validateExpression(stmt.expression);
  }

  //======================================================================
  // Expression Visitor
  //======================================================================

  visitBinaryExpr(expr: Binary): ExprType {
    const opType: TokenType = expr.operator.type;
    
    // boolean operations / relations: ==, !=
    if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
      const leftType: ExprType = this.validateExpression(expr.left);
      if (leftType != 'BOOLEAN') {
        throw new TokenError('Left operand is not a bool.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'BOOLEAN') {
        throw new TokenError('Right operand is not a bool.', expr.operator);
      }
      return 'BOOLEAN';
    }

    // number relations: <, <=, >, >=
    if (this.tokenTypeMatch(opType, 'LESS', 'LESS_EQUAL', 
                                    'GREATER', 'GREATER_EQUAL')) {
      const leftType: ExprType = this.validateExpression(expr.left);
      if (leftType != 'NUMBER') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'BOOLEAN';
    }

    // number operations: -, *, /
    if (this.tokenTypeMatch(opType, 'MINUS', 'STAR', 'SLASH')) {
      const leftType: ExprType = this.validateExpression(expr.left);
      if (leftType != 'NUMBER') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'NUMBER';
    }

    // + is defined for both strings and numbers
    if (this.tokenTypeMatch(opType, 'PLUS')) {
      const leftType: ExprType = this.validateExpression(expr.left);
      if (leftType != 'NUMBER' && leftType != 'STRING') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validateExpression(expr.right);
      if (rightType != 'NUMBER' && rightType != 'STRING') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      if (rightType != leftType) {
        throw new TokenError('Operands do not match.', expr.operator);
      }
      // NOTE we could just as easily return leftType
      return rightType;
    }

    throw new ImplementationError('Unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: Unary): ExprType {
    const opType: TokenType = expr.operator.type;

    if (this.tokenTypeMatch(opType, 'MINUS')) {
      const rightType: ExprType = this.validateExpression(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'NUMBER';
    }

    if (this.tokenTypeMatch(opType, 'BANG')) {
      const rightType: ExprType = this.validateExpression(expr.right);
      if (rightType != 'BOOLEAN') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'BOOLEAN';
    }

    throw new ImplementationError('Unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: Grouping): ExprType {
    return this.validateExpression(expr.expression);
  }

  visitLiteralExpr(expr: Literal): ExprType {
    if (typeof(expr.value) == 'number') return 'NUMBER';
    if (typeof(expr.value) == 'string') return 'STRING';
    if (typeof(expr.value) == 'boolean') return 'BOOLEAN';
    return 'NULL'
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
