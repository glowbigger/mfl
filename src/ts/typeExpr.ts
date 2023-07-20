import { Token } from './token';
import SyntaxTreeNode from './syntaxTreeNode';
import { LangType } from './langType';

export interface TypeExprVisitor {
  visitArrayTypeExpr(expr: ArrayTypeExpr): LangType;
  visitFunctionTypeExpr(expr: FunctionTypeExpr): LangType;
  visitLiteralTypeExpr(expr: LiteralTypeExpr): LangType;
}

export abstract class TypeExpr extends SyntaxTreeNode {
  abstract accept(visitor: TypeExprVisitor): LangType;
}

export class ArrayTypeExpr extends TypeExpr {
  readonly innerType: TypeExpr;

  constructor(lBracket: Token, innerType: TypeExpr, rBracket: Token) {
    super(lBracket, rBracket);
    this.innerType = innerType;
  }

  accept<R>(visitor: TypeExprVisitor): LangType {
    return visitor.visitArrayTypeExpr(this);
  }
}

export class FunctionTypeExpr extends TypeExpr {
  readonly parameterTypes: TypeExpr[];
  readonly returnType: TypeExpr;

  constructor(lParen: Token, parameterTypes: TypeExpr[], returnType: TypeExpr) {
    super(lParen, returnType.rToken);
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
  }

  accept(visitor: TypeExprVisitor): LangType {
    return visitor.visitFunctionTypeExpr(this);
  }
}

export class LiteralTypeExpr extends TypeExpr {
  readonly token: Token;

  constructor(token: Token) {
    super(token, token);
    this.token = token;
  }

  accept(visitor: TypeExprVisitor): LangType {
    return visitor.visitLiteralTypeExpr(this);
  }
}
