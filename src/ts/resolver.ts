import { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./expr";
import { Interpreter } from "./interpreter";
import reportLangError from "./main";
import {  Block, Expression, Fun, If, Print, Return, Stmt, 
          StmtVisitor, Var, While } from "./stmt";
import { Token } from "./token";

// after parsing and before interpretation, this class will go
// through the nodes of the syntax tree and resolve all variables
// properly, ie figures out which declaration belongs to which variable
//
// the only interesting nodes are
// - block statements introduce a new scope for statements inside
// - function declarations introduce a new scope and bind the parameters
// (arguments) in that scope
// - variable declarations add new variables to the current scope
// - variable and assignment expressions need their variables resolved

// here, a scope is a map from indentifier names to booleans that
// indicate if that identifier has been initialized yet
interface scopeType { [key: string]: boolean };

enum FunctionType {
  NONE,
  FUNCTION
}

export default class Resolver implements
  StmtVisitor<void>, ExprVisitor<void> {

  private readonly interpreter: Interpreter;
  private readonly scopesStack: Array<scopeType>;
  // tracks the function type containing the current token being processed
  private currentFunction: FunctionType = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.scopesStack = [];
  }

  visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolveStatements(stmt.statements);
    this.endScope();
  }

  // NOTE yes, this should not be private
  resolveStatements(statements: Array<Stmt>): void {
    for (const statement of statements) {
      this.resolveStatement(statement);
    }
  }

  private resolveStatement(statement: Stmt): void {
    statement.accept(this);
  }

  private resolveExpression(expression: Expr): void {
    expression.accept(this);
  }

  // TODO finish commenting this after implementing resolve
  // inner scopes have higher indices than lower ones, so we start
  // at the innermost scope, searching for the identifier with the
  // name matching the given token's lexeme
  private resolveLocal(expr: Expr, name: Token): void {
    const ss = this.scopesStack;
    for (let i = ss.length - 1; i >= 0; i--) {
      if (ss[i].hasOwnProperty(name.lexeme)) {
        // the distance from the target variable scope
        // NOTE if i = 0, then the distance will be ss.length - 1,
        // which refers to the global scope
        // the distance is the distance between the current scope
        // and the scope where the variable is defined
        const distance = ss.length - 1 - i;
        this.interpreter.resolve(expr, distance);
        return;
      }
    }
  }

  resolveFunction(fun: Fun, type: FunctionType): void {
    const enclosingFunction: FunctionType = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of fun.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolveStatements(fun.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }
  
  /***********************************************************************
  * scopes helper methods
  ***********************************************************************/

  // peek the scopes stack, ie get the last element of the scopes stack
  private peekScopesStack(): scopeType {
    const ss = this.scopesStack;
    return ss[ss.length - 1];
  }

  private isScopesStackEmpty(): boolean {
    return this.scopesStack.length === 0;
  }

  private beginScope() {
    this.scopesStack.push({});
  }

  private endScope() {
    this.scopesStack.pop();
  }

  /***********************************************************************
  * declaration and definition
  ***********************************************************************/

  // declaring a variable will simply put the variable into the current
  // scope, but it will be marked as 'false' to indicate it is undefined
  private declare(name: Token): void {
    if (this.isScopesStackEmpty()) return;

    const scope: scopeType = this.peekScopesStack();
    if (scope.hasOwnProperty(name.lexeme)) {
      reportLangError(name,
          "Already a variable with this name in this scope.", false);
    }

    scope[name.lexeme] = false;
  }

  // defining a variable will simply mark the variable as defined
  // in the current scope by setting its value to 'true'
  private define(name: Token): void {
    if (this.isScopesStackEmpty()) return;

    const scope: scopeType = this.peekScopesStack();
    if (!(scope.hasOwnProperty(name.lexeme))) {
      const error_message = "(user should never get this message)\n" +
                      "in the resolver, somehow a variable was marked" + 
                      "as defined before it was declared";
      throw new Error(error_message);
    }
    scope[name.lexeme] = true;
  }

  visitVariableExpr(expr: Variable): void {
    if (!this.isScopesStackEmpty() &&
        this.peekScopesStack()[expr.name.lexeme] === false) {
      reportLangError(expr.name,
          "Can't read local variable in its own initializer.", 
          false);
    }

    this.resolveLocal(expr, expr.name);
  }

  /***********************************************************************
  * expression visitor
  ***********************************************************************/

  // TODO annotate this
  visitVarStmt(stmt: Var): void {
    this.declare(stmt.name);
    if (stmt.initializer != null) {
      this.resolveExpression(stmt.initializer);
    }
    this.define(stmt.name);
  }

  // TODO annotate this
  visitAssignExpr(expr: Assign) {
    this.resolveExpression(expr.value);
    this.resolveLocal(expr, expr.name);
    return null;
  }

  visitBinaryExpr(expr: Binary): void {
    this.resolveExpression(expr.left);
    this.resolveExpression(expr.right);
  }

  
  visitCallExpr(expr: Call): void {
    this.resolveExpression(expr.callee);

    for (const argument of expr.args) {
      this.resolveExpression(argument);
    }
  }

  visitGroupingExpr(expr: Grouping): void {
    this.resolveExpression(expr.expression);
  }

  visitLiteralExpr(expr: Literal): void { }

  visitLogicalExpr(expr: Logical): void {
    this.resolveExpression(expr.left);
    this.resolveExpression(expr.right);
  }

  visitUnaryExpr(expr: Unary): void {
    this.resolveExpression(expr.right);
  }

  /***********************************************************************
  * expression visitor
  * besides, visitFunctionStmt, the visit functions are all generic,
  * they just go through each expression/statement of each statement
  * and resolve those
  ***********************************************************************/

  visitFunctionStmt(fun: Fun): void {
    this.declare(fun.name);
    this.define(fun.name);
    this.resolveFunction(fun, FunctionType.FUNCTION);
  }

  visitExpressionStmt(stmt: Expression): void {
    this.resolveExpression(stmt.expression);
  }

  visitIfStmt(stmt: If): void {
    this.resolveExpression(stmt.condition);
    this.resolveStatement(stmt.thenBranch);
    if (stmt.elseBranch != null) { 
      this.resolveStatement(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: Print): void {
    this.resolveExpression(stmt.expression);
  }

  visitReturnStmt(stmt: Return): void {
    // a return statement must be in a function
    if (this.currentFunction == FunctionType.NONE) {
      reportLangError(stmt.keyword,
                      "Can't return from outside of a function.",
                      false);
    }

    if (stmt.value !== null) {
      this.resolveExpression(stmt.value);
    }
  }

  visitWhileStmt(stmt: While): void {
    this.resolveExpression(stmt.condition);
    this.resolveStatement(stmt.body);
  }
}
