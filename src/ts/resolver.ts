/*
 * the resolver checks that:
 * each variable resolves to the same one, no matter where and when it is called
 * variables are used
 * variables are not defined to be their own value
 */

import { SyntaxTreeNodeError, TokenError } from "./error";
import { ArrayAccessExpr, ArrayAssignExpr, ArrayObjectExpr, AssignExpr, BinaryExpr, CallExpr, Expr, ExprVisitor, FunctionObjectExpr, GroupingExpr, LiteralExpr, LogicalExpr, UnaryExpr, VariableExpr } from "./expr";
import Interpreter from "./interpreter";
import { BlankStmt, BlockStmt, BreakStmt, DeclarationStmt, ExpressionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, WhileStmt } from "./stmt";
import { Token } from "./token";

//class Resolver implements ExprVisitor, StmtVisitor {
//  private readonly interpreter: Interpreter;
  
//  constructor(interpreter: Interpreter) {
//    this.interpreter = interpreter;
//  }

//  //======================================================================
//  // Resolving methods
//  //======================================================================

export default class Resolver implements StmtVisitor<void>, ExprVisitor<void> {
  private readonly interpreter: Interpreter;

  // each map in the stack refers to a different scope, and each value refers to
  // an identifier, with its value indicating if it has been initialized or not
  // NOTE this is to prevent cases like let a = a; and all of its variants -
  // let a = ((a)), let a = returnA(), let a = (returnA()), etc.
  private initializedVariablesScopes: Array<Map<string, boolean>>;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.initializedVariablesScopes = [];
  }

  // NOTE a redundant method for clarity purposes, you could also make
  // resolveStatements public
  resolveProgram(program: Stmt[]) {
    this.resolveStatements(program);
  }

  //======================================================================
  // Stmt Visitor
  //======================================================================

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolveStatements(stmt.statements);
    this.endScope();
  }

  visitDeclarationStmt(stmt: DeclarationStmt): void {
    let initialValue: Expr = stmt.initialValue;

    // strip any unnecessary parentheses
    while (initialValue instanceof GroupingExpr) {
      // NOTE have to work around typescript assertion system
      const value: GroupingExpr = initialValue;
      initialValue = value.expression;
    }

    if (initialValue instanceof FunctionObjectExpr) {
      // functions are handled in a different order for recursion purposes
      this.declare(stmt.identifier);
      this.define(stmt.identifier);
      this.resolveExpression(initialValue);
    } else {
      this.declare(stmt.identifier);
      this.resolveExpression(initialValue);
      this.define(stmt.identifier);
    }
  }

  // NOTE from here on out, all the visit methods are generic

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolveExpression(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolveExpression(stmt.condition);
    this.resolveStatement(stmt.thenBranch);
    if (stmt.elseBranch !== null)
      this.resolveStatement(stmt.elseBranch);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolveExpression(stmt.expression);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (stmt.value !== null)
      this.resolveExpression(stmt.value);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolveExpression(stmt.condition);
    this.resolveStatement(stmt.body);
  }

  visitBlankStmt(stmt: BlankStmt): void {
    return;
  }

  visitBreakStmt(stmt: BreakStmt): void {
    return;
  }

  //======================================================================
  // Expr Visitor
  //======================================================================

  visitVariableExpr(expr: VariableExpr): void {
    // this is just a verbose js way of peeking the scope stack
    const peekIndex: number = this.initializedVariablesScopes.length - 1;
    const innermostScope: Map<string, boolean>
      = this.initializedVariablesScopes[peekIndex];

    if (this.initializedVariablesScopes.length > 0 &&
        innermostScope.get(expr.lToken.lexeme) === false) {
      const msg = 'Can\'t read local variable in its own initializer.';
      throw new SyntaxTreeNodeError(msg, expr)
    }

    this.resolveLocalVariable(expr, expr.lToken.lexeme);
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolveExpression(expr.value);
    this.resolveLocalVariable(expr, expr.lToken.lexeme);
  }

  visitFunctionObjectExpr(expr: FunctionObjectExpr): void {
    this.resolveFunction(expr);
  }

  // NOTE from here on out, all the visit methods are generic

  visitArrayAccessExpr(expr: ArrayAccessExpr): void {
    this.resolveExpression(expr.arrayExpr);
    this.resolveExpression(expr.index);    
  }

  visitArrayAssignExpr(expr: ArrayAssignExpr): void {
    this.resolveExpression(expr.arrayAccessExpr);
    this.resolveExpression(expr.assignmentValue);
  }

  visitArrayObjectExpr(expr: ArrayObjectExpr): void {
    if (expr.capacity instanceof Expr)
      this.resolveExpression(expr.capacity);

    if (Array.isArray(expr.elements)) {
      for (const element of expr.elements)
        this.resolveExpression(element);
    } else {
      this.resolveExpression(expr.elements);
    }
  }
  
  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolveExpression(expr.leftExpr);
    this.resolveExpression(expr.rightExpr);
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolveExpression(expr.callee);
    for (const arg of expr.args)
      this.resolveExpression(arg);
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolveExpression(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): void {
    return;
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolveExpression(expr.leftExpr);
    this.resolveExpression(expr.rightExpr);
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolveExpression(expr.rightExpr);
  }

  //======================================================================
  // Helpers
  //======================================================================

  private beginScope(): void {
    // begin a new empty scope
    this.initializedVariablesScopes.push(new Map<string, boolean>());
  }

  private endScope(): void {
    // delete the innermost scope
    this.initializedVariablesScopes.pop();
  }

  private resolveStatement(statement: Stmt): void {
    statement.accept(this);
  }

  private resolveStatements(statements: Stmt[]): void {
    for (const statement of statements) {
      this.resolveStatement(statement);
    }
  }

  private resolveExpression(expression: Expr): void {
    expression.accept(this);
  }
  
  private resolveFunction(func: FunctionObjectExpr) {
    this.beginScope();
    for (const param of func.parameterTokens) {
      // declare is redundant here actually
      this.declare(param);
      this.define(param);
    }
    this.resolveStatement(func.statement);
    this.endScope();
  }

  // computes the distance in scopes between where a variable was referred to and
  // where it was defined
  private resolveLocalVariable(expr: Expr, identifier: string): void {
    const stack = this.initializedVariablesScopes;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].has(identifier)) {
        this.interpreter.resolve(expr, stack.length - 1 - i);
        return;
      }
    }
  }

  private declare(identifier: Token): void {
    // global variables are ignored
    if (this.initializedVariablesScopes.length === 0) return;

    // this is just a verbose js way of peeking the scope stack
    const peekIndex: number = this.initializedVariablesScopes.length - 1;
    const innermostScope: Map<string, boolean>
      = this.initializedVariablesScopes[peekIndex];

    // indicate that the variable of the given initializer is uninitialized
    innermostScope.set(identifier.lexeme, false);
  }

  private define(identifier: Token): void {
    // global variables are ignored
    if (this.initializedVariablesScopes.length === 0) return;

    // this is just a verbose js way of peeking the scope stack
    const peekIndex: number = this.initializedVariablesScopes.length - 1;
    const innermostScope: Map<string, boolean>
      = this.initializedVariablesScopes[peekIndex];

    // indicate that the variable of the given initializer is initialized
    innermostScope.set(identifier.lexeme, true);
  }
}
