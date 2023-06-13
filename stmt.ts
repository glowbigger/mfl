import { Expr } from './expr';

/*
* see expr.ts for detailed notes on this class
*/

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class Expression extends Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Print extends Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R> ) {
    return visitor.visitPrintStmt(this);
  }
}
