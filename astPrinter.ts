import * as expr from "./expr";
import { Nullable } from "./types";

export default class AstPrinter implements expr.ExprVisitor<string> {
  // will be called on each Expr, which will in turn call
  // one of the below methods based on their type
  // NOTE this method is not needed, you can alternatively pass
  // a particular AstPrinter object to an Expr object
  print(expr: Nullable<expr.Expr>): string {
    if (expr !== null) {
      return expr.accept(this);
    }
    return "AstPrinter received a null";
  }

  visitBinaryExpr(expr: expr.Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: expr.Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: expr.Literal): string {
    if (expr.value == null) return "nil";
    return expr.value.toString();
  }

  visitUnaryExpr(expr: expr.Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  // wraps ( ) around a name and a list of subexpressions
  private parenthesize(name: string, ...exprs: expr.Expr[]): string {
    let outputString = "";

    outputString += "(" + name; 

    for (const expr of exprs) {
      // the book uses
      // builder.append(expr.accept(this));
      // but its more readable to write
      outputString += " " + this.print(expr);
    }
    outputString += ")";

    return outputString;
  }
}
