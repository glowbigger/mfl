import { Token } from './token';
import { ObjectType } from './types';

/*
the visitor pattern is used here
NOTE visitor is not the best name, but it is conventional
https://en.wikipedia.org/wiki/Visitor_pattern
instead of having different Expr classes with different methods
like interpret(), print(), etc., there is only one generic method
and instead the operations are described as instantiations of a
particular interface described below...
*/

/* 
the ExprVisitor is the interface for the OPERATIONS, and therefore
they should all implement the visit methods for the various Expr types

NOTE in craftinginterpreters, this is a nested interface within the
Expr class, and that functionality cannot be mimicked by sticking
this into a namespace called Expr, but that is confusing
instead it is called ExprVisitor
*/
export interface ExprVisitor<R> {
  visitAssignExpr(expr: Assign): R;
  visitBinaryExpr(expr: Binary): R;
  visitCallExpr(expr: Call): R;
  visitGroupingExpr(expr: Grouping): R;
  visitLiteralExpr(expr: Literal): R;
  visitLogicalExpr(expr: Logical): R;
  visitUnaryExpr(expr: Unary): R;
  visitVariableExpr(expr: Variable): R;
}

// this is the actual Expr class, which has only one generic accept class
export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

/*
below are the various Expr class types, which contains different
variables, but only one generic function which passes the object
to the visitor given as an argument. 
the visitor will carry out the particular operation and so that
is why it requires the object passed to it

NOTE everything here should be completely generic and contain no
functionality of its own. the point of the visitor pattern is to
mimick functional programming in an object-oriented paradigm

NOTE explaining syntax: accept<R>(vistor:ExprVisitor<R>):R
is just a function returning a generic R, the initial <R> is just
needed to indicate that following R's are generics
*/

export class Assign extends Expr {
  readonly name: Token;
  readonly value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

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

export class Call extends Expr {
  readonly callee: Expr;
  // the right parenthesis is stored for its location, which will be
  // returned if there was a runtime error
  readonly paren: Token;
  // can't use the name "arguments" because that is reserved by js
  readonly args: Array<Expr>;

  constructor(callee: Expr, paren: Token, args: Array<Expr>) {
    super();
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitCallExpr(this);
  }
}

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

export class Logical extends Expr {
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
    return visitor.visitLogicalExpr(this);
  }
}

export class Literal extends Expr {
  readonly value: ObjectType;

  constructor(value: ObjectType) {
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

export class Variable extends Expr {
  readonly name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}
