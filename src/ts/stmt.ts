import { Expr } from './expr';
import { Token } from './token';

/*
* see expr.ts for detailed notes on this class
*/

export interface StmtVisitor<R> {
  // visitBlockStmt(stmt: Block): R;
  visitExpressionStmt(stmt: Expression): R;
  // visitFunctionStmt(stmt: Fun): R;
  // visitIfStmt(stmt: If): R;
  visitPrintStmt(stmt: Print): R;
  // visitVarStmt(stmt: Var): R;
  // visitReturnStmt(stmt: Return): R;
  // visitWhileStmt(stmt: While): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
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

// export class Fun extends Stmt {
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

// export class If extends Stmt {
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

// export class Var extends Stmt {
//   readonly name: Token;
//   readonly initializer: Expr | null;

//   constructor(name: Token, initializer: Expr | null) {
//     super();
//     this.name = name;
//     this.initializer = initializer;
//   }

//   accept<R>(visitor: StmtVisitor<R>) {
//     return visitor.visitVarStmt(this);
//   }
// }

// export class While extends Stmt {
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
