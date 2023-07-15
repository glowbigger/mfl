import { Stmt } from './stmt';
import { Token, TokenValue } from './token';
import { LangType } from './langType';

export interface ExprVisitor<R> {
  visitArrayAccessExpr(expr: ArrayAccessExpr): R;
  visitArrayAssignExpr(expr: ArrayAssignExpr): R;
  visitArrayObjectExpr(expr: ArrayObjectExpr): R;
  visitAssignExpr(expr: AssignExpr): R;
  visitBinaryExpr(expr: BinaryExpr): R;
  visitCallExpr(expr: CallExpr): R;
  visitFunctionObjectExpr(expr: FunctionObjectExpr): R;
  visitGroupingExpr(expr: GroupingExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitLogicalExpr(expr: LogicalExpr): R;
  visitUnaryExpr(expr: UnaryExpr): R;
  visitVariableExpr(expr: VariableExpr): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class ArrayAccessExpr extends Expr {
  readonly arrayExpr: Expr;
  readonly index: Expr;
  readonly leftBracket: Token;
  readonly rightBracket: Token;

  constructor(arrayExpr: Expr, index: Expr, 
              leftBracket: Token, rightBracket: Token) {
    super();
    this.arrayExpr = arrayExpr;
    this.index = index;
    this.leftBracket = leftBracket;
    this.rightBracket = rightBracket;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayAccessExpr(this);
  }
}

export class ArrayAssignExpr extends Expr {
  readonly arrayAccessExpr: ArrayAccessExpr;
  readonly assignmentValue: Expr;
  readonly equalityToken: Token;

  constructor(arrayAccessExpr: ArrayAccessExpr, assignmentValue: Expr,
              equalityToken: Token) {
    super();
    this.arrayAccessExpr = arrayAccessExpr;
    this.assignmentValue = assignmentValue;
    this.equalityToken = equalityToken;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayAssignExpr(this);
  }
}

export class ArrayObjectExpr extends Expr {
  readonly capacity: Expr;
  readonly elements: Expr[] | Expr;
  readonly leftBracket: Token;
  readonly rightBracket: Token;

  constructor(capacity: Expr, elements: Expr[] | Expr,
              leftBracket: Token, rightBracket: Token) {
    super();
    this.capacity = capacity;
    this.elements = elements;
    this.leftBracket = leftBracket;
    this.rightBracket = rightBracket;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayObjectExpr(this);
  }
}

export class AssignExpr extends Expr {
  readonly variableIdentifier: Token;
  readonly value: Expr;

  constructor(variableIdentifier: Token, value: Expr) {
    super();
    this.variableIdentifier = variableIdentifier;
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

export class BinaryExpr extends Expr {
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

export class CallExpr extends Expr {
  readonly callee: Expr;
  readonly paren: Token;
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

export class FunctionObjectExpr extends Expr {
  readonly parameterTokens: Token[]; 
  readonly parameterTypes: LangType[];
  readonly returnType: LangType;
  readonly statement: Stmt;
  readonly keyword: Token;

  constructor(parameterTokens: Token[], parameterTypes: LangType[],
              returnType: LangType, statement: Stmt, keyword: Token) {
    super();
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.keyword = keyword;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitFunctionObjectExpr(this);
  }
}

export class GroupingExpr extends Expr {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LogicalExpr extends Expr {
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

export class LiteralExpr extends Expr {
  readonly value: TokenValue;

  constructor(value: TokenValue) {
    super();
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr extends Expr {
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

export class VariableExpr extends Expr {
  readonly identifier: Token;

  constructor(identifier: Token) {
    super();
    this.identifier = identifier;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}
