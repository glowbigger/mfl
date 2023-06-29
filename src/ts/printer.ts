import { Expr, ExprVisitor, Binary, Grouping, Literal, Unary } from './expr';

export default class Printer implements ExprVisitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  public visitBinaryExpr(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme,
                        expr.left, expr.right);
  }

  public visitGroupingExpr(expr: Grouping): string {
    return this.parenthesize('group', expr.expression);
  }

  public visitLiteralExpr(expr: Literal): string {
    if (expr.value === null) return 'null';
    return expr.value.toString();
  }

  public visitUnaryExpr(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  private parenthesize(name: string, ...exprs: Expr[]): string {
    let string = `(${name}`;

    for (const expr of exprs) {
      string += ' ';
      string += expr.accept(this);
    }
    string += ')';

    return string;
  }
}
