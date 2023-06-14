import { Expr } from './expr';
import Token from './token';
import { Nullable } from './types';

/*
* see expr.ts for detailed notes on this class
*/

export interface StmtVisitor<R> {
  visitExpressionStmt(stmt: Expression): R;
  visitPrintStmt(stmt: Print): R;
  visitVarStmt(stmt: Var): R;
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

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitPrintStmt(this);
  }
}

export class Var extends Stmt {
  readonly name: Token;
  readonly initializer: Nullable<Expr>;

  constructor(name: Token, initializer: Nullable<Expr>) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitVarStmt(this);
  }
}
