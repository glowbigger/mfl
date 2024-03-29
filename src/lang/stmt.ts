import { Expr } from './expr';
import { Token } from './token';
import SyntaxTreeNode from './syntaxTreeNode';
import { TypeExpr } from './typeExpr';

export interface StmtVisitor<R> {
  visitBlankStmt(stmt: BlankStmt): R;
  visitBlockStmt(stmt: BlockStmt): R;
  visitExpressionStmt(stmt: ExpressionStmt): R;
  visitIfStmt(stmt: IfStmt): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitDeclarationStmt(stmt: DeclarationStmt): R;
  visitReturnStmt(stmt: ReturnStmt): R;
  visitBreakStmt(stmt: BreakStmt): R;
  visitWhileStmt(stmt: WhileStmt): R;
}

export abstract class Stmt extends SyntaxTreeNode {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlankStmt extends Stmt {
  constructor(semicolon: Token) {
    super(semicolon, semicolon);
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlankStmt(this);
  }
}

export class BreakStmt extends Stmt {
  constructor(breakToken: Token, semicolon: Token) {
    super(breakToken, semicolon);
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBreakStmt(this);
  }
}

export class BlockStmt extends Stmt {
  readonly statements: Stmt[];

  constructor(leftBrace: Token, statements: Stmt[], rightBrace: Token) {
    super(leftBrace, rightBrace);
    this.statements = statements;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ExpressionStmt extends Stmt {
  readonly expression: Expr;

  constructor(expression: Expr, semicolon: Token) {
    super(expression.lToken, semicolon);
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class IfStmt extends Stmt {
  readonly condition: Expr;
  readonly thenBranch: Stmt;
  readonly elseBranch: Stmt | null;

  constructor(ifToken: Token,
              condition: Expr, 
              thenBranch: Stmt, 
              elseBranch: Stmt | null = null) {
    if (elseBranch !== null)
      super(ifToken, elseBranch.rToken);
    else 
      super(ifToken, thenBranch.rToken);

    this.condition  = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class PrintStmt extends Stmt {
  readonly expression: Expr;

  constructor(keyword: Token, expression: Expr, semicolon: Token) {
    super(keyword, semicolon);
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitPrintStmt(this);
  }
}

export class ReturnStmt extends Stmt {
  readonly value: Expr;

  constructor(keyword: Token, value: Expr, semicolon: Token) {
    super(keyword, semicolon);
    this.value = value;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitReturnStmt(this);
  }
}

export class DeclarationStmt extends Stmt {
  readonly identifier: Token;
  readonly type: TypeExpr | null;
  readonly initialValue: Expr;

  constructor(keyword: Token, identifier: Token,
              type: TypeExpr | null, initialValue: Expr, semicolon: Token) {
    super(keyword, semicolon);
    this.identifier = identifier;
    this.type = type;
    this.initialValue = initialValue;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitDeclarationStmt(this);
  }
}

export class WhileStmt extends Stmt {
  readonly condition: Expr;
  readonly body: Stmt;

  constructor(whileToken: Token, condition: Expr, body: Stmt) {
    super(whileToken, body.rToken);
    this.condition = condition;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitWhileStmt(this);
  }
}
