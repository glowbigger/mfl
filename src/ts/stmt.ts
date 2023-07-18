import { Expr } from './expr';
import { Token } from './token';
import { LangType } from './langType';

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

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class BlankStmt extends Stmt {
  constructor() {
    super();
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlankStmt(this);
  }
}

export class BreakStmt extends Stmt {
  breakToken: Token;

  constructor(breakToken: Token) {
    super();
    this.breakToken = breakToken;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBreakStmt(this);
  }
}

export class BlockStmt extends Stmt {
  readonly statements: Stmt[];

  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class ExpressionStmt extends Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class IfStmt extends Stmt {
  readonly ifToken: Token;
  readonly condition: Expr;
  readonly thenBranch: Stmt;
  readonly elseBranch: Stmt | null;

  constructor(ifToken: Token,
              condition: Expr, 
              thenBranch: Stmt, 
              elseBranch: Stmt | null = null) {
    super();
    this.ifToken = ifToken;
    this.condition  = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class PrintStmt extends Stmt {
  readonly keyword: Token;
  readonly expression: Expr;

  constructor(keyword: Token, expression: Expr,) {
    super();
    this.keyword = keyword;
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitPrintStmt(this);
  }
}

export class ReturnStmt extends Stmt {
  readonly keyword: Token;
  readonly value: Expr | null;

  constructor(keyword: Token, value: Expr | null) {
    super();
    this.keyword = keyword;
    this.value = value;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitReturnStmt(this);
  }
}

export class DeclarationStmt extends Stmt {
  readonly identifier: Token;
  readonly type: LangType | null;
  readonly initialValue: Expr;

  constructor(identifier: Token, type: LangType | null, initialValue: Expr) {
    super();
    this.identifier = identifier;
    this.type = type;
    this.initialValue = initialValue;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitDeclarationStmt(this);
  }
}

export class WhileStmt extends Stmt {
  readonly whileToken: Token;
  readonly condition: Expr;
  readonly body: Stmt;

  constructor(whileToken: Token, condition: Expr, body: Stmt) {
    super();
    this.whileToken = whileToken;
    this.condition = condition;
    this.body = body;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitWhileStmt(this);
  }
}
