import { Token, TokenType } from './token';
import { Expr, Binary, Grouping, Literal, Unary, ExprVisitor } from './expr'
import { TokenError, ImplementationError } from './error';
import { ExprType } from './types';

export default class TypeChecker implements ExprVisitor<ExprType> {
  private expr: Expr;

  private errors: TokenError[];

  constructor(expr: Expr) {
    this.expr = expr;
    this.errors = [];
  }

  //======================================================================
  // Type Checking Methods
  //======================================================================

  // checks whether the types are valid in a given expression or statement, adds
  // an error if they are not, and returns the type if possible
  validate(expr: Expr): ExprType {
    // this will call the appropriate visitor method below
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary): ExprType {
    const opType: TokenType = expr.operator.type;
    
    // boolean operations / relations: ==, !=
    if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
      const leftType: ExprType = this.validate(expr.left);
      if (leftType != 'BOOLEAN') {
        throw new TokenError('Left operand is not a bool.', expr.operator);
      }
      const rightType = this.validate(expr.right);
      if (rightType != 'BOOLEAN') {
        throw new TokenError('Right operand is not a bool.', expr.operator);
      }
      return 'BOOLEAN';
    }

    // number relations: <, <=, >, >=
    if (this.tokenTypeMatch(opType, 'LESS', 'LESS_EQUAL', 
                                    'GREATER', 'GREATER_EQUAL')) {
      const leftType: ExprType = this.validate(expr.left);
      if (leftType != 'NUMBER') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validate(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'BOOLEAN';
    }

    // boolean operations: +, -, *, /
    if (this.tokenTypeMatch(opType, 'PLUS', 'MINUS', 'STAR', 'SLASH')) {
      const leftType: ExprType = this.validate(expr.left);
      if (leftType != 'NUMBER') {
        throw new TokenError('Left operand is not a number.', expr.operator);
      }
      const rightType = this.validate(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Right operand is not a number.', expr.operator);
      }
      return 'NUMBER';
    }

    throw new ImplementationError('unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: Unary): ExprType {
    const opType: TokenType = expr.operator.type;

    if (this.tokenTypeMatch(opType, 'MINUS')) {
      const rightType: ExprType = this.validate(expr.right);
      if (rightType != 'NUMBER') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'NUMBER';
    }

    if (this.tokenTypeMatch(opType, 'BANG')) {
      const rightType: ExprType = this.validate(expr.right);
      if (rightType != 'BOOLEAN') {
        throw new TokenError('Operand is not a number.', expr.operator);
      }
      return 'BOOLEAN';
    }

    throw new ImplementationError('unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: Grouping): ExprType {
    return this.validate(expr.expression);
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