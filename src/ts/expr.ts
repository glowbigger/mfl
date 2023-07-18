import { Stmt } from './stmt';
import { Token, TokenValue } from './token';
import { LangType } from './langType';
import SyntaxTreeNode from './syntaxTreeNode';

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

export abstract class Expr extends SyntaxTreeNode {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class ArrayAccessExpr extends Expr {
  readonly arrayExpr: Expr;
  readonly index: Expr;

  constructor(arrayExpr: Expr, index: Expr, rightBracket: Token) {
    super(arrayExpr.lToken, rightBracket);
    this.arrayExpr = arrayExpr;
    this.index = index;
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
    super(arrayAccessExpr.lToken, assignmentValue.rToken);
    this.arrayAccessExpr = arrayAccessExpr;
    this.assignmentValue = assignmentValue;
    this.equalityToken = equalityToken;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayAssignExpr(this);
  }
}

export class ArrayObjectExpr extends Expr {
  readonly capacity: number | Expr;
  readonly elements: Expr[] | Expr;

  constructor(capacity: number | Expr, elements: Expr[] | Expr,
              leftBracket: Token, rightBracket: Token) {
    super(leftBracket, rightBracket);
    this.capacity = capacity;
    this.elements = elements;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitArrayObjectExpr(this);
  }
}

export class AssignExpr extends Expr {
  readonly value: Expr;

  constructor(variableIdentifier: Token, value: Expr) {
    super(variableIdentifier, value.rToken);
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}

export class BinaryExpr extends Expr {
  readonly leftExpr: Expr;
  readonly operator: Token;
  readonly rightExpr: Expr;

  constructor(leftExpr: Expr, operator: Token, rightExpr: Expr) {
    super(leftExpr.lToken, rightExpr.rToken);
    this.leftExpr = leftExpr;
    this.operator = operator;
    this.rightExpr = rightExpr;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  }
}

export class CallExpr extends Expr {
  readonly callee: Expr;
  readonly args: Array<Expr>;

  constructor(callee: Expr, rightParen: Token, args: Array<Expr>) {
    super(callee.lToken, rightParen);
    this.callee = callee;
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

  constructor(parameterTokens: Token[], parameterTypes: LangType[],
              returnType: LangType, statement: Stmt, keyword: Token) {
    super(keyword, statement.rToken);
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitFunctionObjectExpr(this);
  }
}

export class GroupingExpr extends Expr {
  readonly expression: Expr;

  constructor(lParen: Token, expression: Expr, rParen: Token) {
    super(lParen, rParen);
    this.expression = expression;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  }
}

export class LogicalExpr extends Expr {
  readonly leftExpr: Expr;
  readonly operator: Token;
  readonly rightExpr: Expr;

  constructor(leftExpr: Expr, operator: Token, rightExpr: Expr) {
    super(leftExpr.lToken, rightExpr.rToken);
    this.leftExpr = leftExpr;
    this.operator = operator;
    this.rightExpr = rightExpr;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLogicalExpr(this);
  }
}

export class LiteralExpr extends Expr {
  readonly value: TokenValue;

  constructor(value: TokenValue, literalToken: Token) {
    super(literalToken, literalToken);
    this.value = value;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitLiteralExpr(this);
  }
}

export class UnaryExpr extends Expr {
  readonly operator: Token;
  readonly rightExpr: Expr;

  constructor(operator: Token, rightExpr: Expr) {
    super(operator, rightExpr.rToken);
    this.operator = operator;
    this.rightExpr = rightExpr;
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitUnaryExpr(this);
  }
}

export class VariableExpr extends Expr {
  constructor(identifier: Token) {
    super(identifier, identifier);
  }

  accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}
