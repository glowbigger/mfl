import { TokenType } from './token';
import { Expr, Binary, Grouping, Literal, Unary, ExprVisitor } from './expr'
import { TokenError, ImplementationError } from './error';
import { LangObject } from './types';

export default class Interpreter implements ExprVisitor<LangObject> {
  private expr: Expr;
  private errors: TokenError[];

  constructor(expr: Expr) {
    this.expr = expr;
    this.errors = [];
  }

  interpret() {
  }

  evaluate(expr: Expr): LangObject {
    return(expr.accept(this));
  }

  visitBinaryExpr(expr: Binary): LangObject {
    let leftValue: LangObject; let rightValue: LangObject;

    switch(expr.operator.type) {
      case 'EQUAL_EQUAL':
        leftValue = this.evaluate(expr.left) as boolean;
        rightValue = this.evaluate(expr.right) as boolean;
        // TODO overload this, probably want to use === instead of ==
        return leftValue === rightValue;

      case 'BANG_EQUAL':
        leftValue = this.evaluate(expr.left) as boolean;
        rightValue = this.evaluate(expr.right) as boolean;
        return leftValue != rightValue;

      case 'LESS':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue < rightValue;

      case 'LESS_EQUAL':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue <= rightValue;

      case 'GREATER':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue > rightValue;

      case 'GREATER_EQUAL':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue >= rightValue;

      case 'PLUS':
        // + can add numbers or concatenate strings
        leftValue = this.evaluate(expr.left);
        rightValue = this.evaluate(expr.right);
        
        // left or right shouldn't matter here
        const type: LangObject = typeof(leftValue);

        if (type == 'number') {
          leftValue = leftValue as number;
          rightValue = rightValue as number;
          return leftValue + rightValue;
        } else if (type == 'string') {
          leftValue = leftValue as string;
          rightValue = rightValue as string;
          return leftValue + rightValue;
        } else {
          const message = 'Plus operator typechecking must have failed.';
          throw new ImplementationError(message);
        }

      case 'MINUS':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue - rightValue;

      case 'STAR':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue * rightValue;

      case 'SLASH':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue / rightValue;
    }

    throw new ImplementationError('Unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: Unary): LangObject {
    let rightValue: LangObject;

    switch(expr.operator.type) {
      case 'MINUS':
        rightValue = this.evaluate(expr.right) as number;
        return - rightValue;

      case 'BANG':
        rightValue = this.evaluate(expr.right) as boolean;
        return rightValue;
    }

    throw new ImplementationError('Unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: Grouping): LangObject {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: Literal): LangObject {
    return expr.value;
  }
}
