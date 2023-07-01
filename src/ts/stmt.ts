import { Expr } from './expr';
import { Token } from './token';
import { LangObjectType } from './types';

/*
* see expr.ts for detailed notes on this class
*/

export interface StmtVisitor<R> {
  visitBlankStmt(stmt: BlankStmt): R;
  // visitBlockStmt(stmt: Block): R;
  visitExpressionStmt(stmt: ExpressionStmt): R;
  // visitFunctionStmt(stmt: Fun): R;
  // visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: PrintStmt): R;
  visitDeclarationStmt(stmt: DeclarationStmt): R;
  // visitReturnStmt(stmt: Return): R;
  // visitWhileStmt(stmt: While): R;
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

// export class Block extends Stmt {
//   readonly statements: Array<Stmt>;

//   constructor(statements: Array<Stmt>) {
//     super();
//     this.statements = statements;
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitBlockStmt(this);
//   }
// }

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

// export class FunStmt extends Stmt {
//   readonly name: Token;
//   readonly params: Array<Token>;
//   readonly body: Array<Stmt>;

//   constructor(name: Token, params: Array<Token>, body: Array<Stmt>  ) {
//     super();
//     this.name = name;
//     this.params = params;
//     this.body = body;
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitFunctionStmt(this);
//   }
// }

// export class IfStmt extends Stmt {
//   readonly condition: Expr;
//   readonly thenBranch: Stmt;
//   readonly elseBranch: Stmt | null;

//   constructor(condition: Expr, 
//               thenBranch: Stmt, 
//               elseBranch: Stmt | null = null) {
//     super();
//     this.condition  = condition;
//     this.thenBranch = thenBranch;
//     this.elseBranch = elseBranch;
//   }

//   accept<R>(visitor: StmtVisitor<R>): R {
//     return visitor.visitIfStmt(this);
//   }
// }

export class PrintStmt extends Stmt {
  readonly expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitPrintStmt(this);
  }
}

// export class Return extends Stmt {
//   readonly keyword: Token;
//   readonly value: Expr | null;

//   constructor(keyword: Token, value: Expr | null) {
//     super();
//     this.keyword = keyword;
//     this.value = value;
//   }

//   accept<R>(visitor: StmtVisitor<R>) {
//     return visitor.visitReturnStmt(this);
//   }
// }

export class DeclarationStmt extends Stmt {
  readonly identifier: Token;
  readonly type: LangObjectType;
  readonly initialValue: Expr;

  constructor(identifier: Token, type: LangObjectType, initialValue: Expr) {
    super();
    this.identifier = identifier;
    this.type = type;
    this.initialValue = initialValue;
  }

  accept<R>(visitor: StmtVisitor<R>) {
    return visitor.visitDeclarationStmt(this);
  }
}

// export class WhileStmt extends Stmt {
//   readonly condition: Expr;
//   readonly body: Stmt;

//   constructor(condition: Expr, body: Stmt) {
//     super();
//     this.condition = condition;
//     this.body = body;
//   }

//   accept<R>(visitor: StmtVisitor<R>) {
//     return visitor.visitWhileStmt(this);
//   }
// }
