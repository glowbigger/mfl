import { Token } from './token';
import { LangObject } from './types';

export interface ExprVisitor<R> {
  // visitAssignExpr(expr: Assign): R;
  visitBinaryExpr(expr: Binary): R;
  // visitCallExpr(expr: Call): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  // visitLogicalExpr(expr: Logical): R;
  visitUnaryExpr(expr: Unary): R;
  // visitVariableExpr(expr: Variable): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

// export class Assign extends Expr {
//   readonly name: Token;
//   readonly value: Expr;

//   constructor(name: Token, value: Expr) {
//     super();
//     this.name = name;
//     this.value = value;
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitAssignExpr(this);
//   }
// }

export class Binary extends Expr {
  readonly left: Expr;
  readonly operator: Token;
  readonly right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

// export class Call extends Expr {
//   readonly callee: Expr;
//   // the right parenthesis is stored for its location, which will be
//   // returned if there was a runtime error
//   readonly paren: Token;
//   // can't use the name "arguments" because that is reserved by js
//   readonly args: Array<Expr>;

//   constructor(callee: Expr, paren: Token, args: Array<Expr>) {
//     super();
//     this.callee = callee;
//     this.paren = paren;
//     this.args = args;
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitCallExpr(this);
//   }
// }

export class Grouping extends Expr {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

// export class Logical extends Expr {
//   readonly left: Expr;
//   readonly operator: Token;
//   readonly right: Expr;

//   constructor(left: Expr, operator: Token, right: Expr) {
//     super();
//     this.left = left;
//     this.operator = operator;
//     this.right = right;
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitLogicalExpr(this);
//   }
// }

export class Literal extends Expr {
  readonly value: LangObject;

  constructor(value: LangObject) {
    super();
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class Unary extends Expr {
  readonly operator: Token;
  readonly right: Expr;

  constructor(operator: Token, right: Expr) {
    super();
    this.operator = operator;
    this.right = right;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

// export class Variable extends Expr {
//   readonly name: Token;

//   constructor(name: Token) {
//     super();
//     this.name = name;
//   }

//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitVariableExpr(this);
//   }
// }