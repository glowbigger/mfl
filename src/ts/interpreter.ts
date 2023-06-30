import { Expr, Binary, Grouping, Literal, Unary, ExprVisitor } from './expr'
import { TokenError, ImplementationError, LangError } from './error';
import { LangObject } from './types';
import { Expression, Print, Stmt, StmtVisitor } from './stmt';

export default class Interpreter 
  implements ExprVisitor<LangObject>, StmtVisitor<string> {

  // interprets/runs a program, ie a list of statements, returns its output
  interpret(statements: Stmt[]): string {
    const errors: LangError[] = [];
    let lines: string[] = [];

    for (const statement of statements) {
      try {
        lines.push(this.execute(statement));
      } catch(error: unknown) {
        if (error instanceof LangError)
          errors.push(error);
        else
          throw error;
      }
    }
    
    if (errors.length > 0) throw errors;
    return lines.join('\n');
  }

  evaluate(expr: Expr): LangObject {
    return(expr.accept(this));
  }

  execute(stmt: Stmt): string {
    return stmt.accept(this);
  }

  //======================================================================
  // Statement Visitor Methods
  // they string return types are the potential console outputs, which are almost
  // always ''; maybe there's a better solution, but this works for now
  // NOTE this is needed for the web interpreter
  //======================================================================

  visitPrintStmt(stmt: Print): string {
    const evaluatedExpression: LangObject = this.evaluate(stmt.expression);
    return this.stringify(evaluatedExpression);
  }

  visitExpressionStmt(stmt: Expression): string {
    // only does something if the expression is the output of a function call
    this.evaluate(stmt.expression);
    return '';
  }

  //======================================================================
  // Expression Visitor Methods
  //======================================================================

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
        if (rightValue == 0) {
          throw new TokenError('Division by 0.', expr.operator);
        }
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

  //======================================================================
  // HELPERS
  //======================================================================

  // turns an object into a string
  stringify(object: LangObject): string {
    if (object === null) return "null";

    if (typeof(object) === "number") {
      return object.toString();
    } 
    if (typeof(object) === "boolean") {
      if (object) {
        return "true";
      }
      return "false";
    } 

    // if it's a string, just return it
    return object;
  }
}
