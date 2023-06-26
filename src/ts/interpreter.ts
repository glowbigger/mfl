import {  Expr, ExprVisitor, Binary, Grouping, Literal, 
          Unary, Variable, Assign, Logical, Call } from "./expr";
import { ObjectType, Nullable, isCallable } from "./types";
import { Token, TokenType as TT } from './token';
import { Stmt, StmtVisitor, Expression, Print,
         Var, Block, If, While, Fun, Return } from "./stmt";
import reportLangError from "./main";
import Environment from "./environment";
import Callable from "./callable";
import LangFunction from "./langFunction";
import ReturnIndicator from "./returnIndicator";

// TODO move this into its own file maybe?
export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

// NOTE since StmtVisitor is called with the generic void, the methods
// that must be implemented will have be voids, i.e. return nothing
export class Interpreter 
  implements ExprVisitor<ObjectType>, StmtVisitor<void> {
  // a global environment which can be accessed outside the interpreter
  readonly globalEnvironment: Environment = new Environment();
  private environment: Environment = this.globalEnvironment;
  // for local variables only (global variables are handled differently),
  // the number of scopes between the scope it was declared and the
  // scope it was defined in
  // these values are calculated and set by the resolver before
  // interpret() is called
  // NOTE a map is used so that these values can be easily discarded
  // as opposed to storing these values in the expressions themselves
  private readonly localDistances: Map<Expr, number> =
                                                new Map<Expr, number>()

  // for now, the global environment has a native function called
  // clock() which simply allows access to js's Date.now() function
  constructor() {
    const clockFunction: Callable = {
      arity(): number { return 0; },
      call( interpreter: Interpreter, 
            args: Array<ObjectType>): ObjectType {
        return Date.now();
      },
      toString(): string { return "<native fn>"; }
    }
    this.globalEnvironment.define("clock", clockFunction);
  }

  // tries to interpret the given statements, and returns any errors
  interpret(statements: Array<Stmt>): void { 
    // let errors: Array<RuntimeError> = [];
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        reportLangError(error.token.line, error.message, true);
      } else {
        // this should not ever happen, but just in case
        console.log("(you shouldn't ever get this, something went wrong)");
        console.log("There was a native error thrown during runtime: ");
        console.log(error);
        process.exit(1);
      }
    }
  }

  /***********************************************************************
  * EXPRVISITOR INTERFACE METHODS
  * NOTE these are pseudo-private methods, they should not be called
  * except in a roundabout way from interpret()
  ***********************************************************************/
  
  // a literal is a value that is evaluated at scan time
  // the evaluation is usually going to be very simple, like
  // "asdf" -> asdf or 123 -> 123
  // in other words, you can always find the value of a literal
  // in the user's source code, it is never computed
  visitLiteralExpr(expr: Literal): ObjectType {
    return expr.value;
  }

  // NOTE we return the actual values of expressions
  // for example: 
  // print "hi" or nil
  // will print "hi" and not true
  // also, 
  // nil and ...
  // returns nil without evaluating ...
  visitLogicalExpr(expr: Logical): ObjectType {
    const left: ObjectType = this.evaluate(expr.left);

    if (expr.operator.type == TT.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      // AND statement
      // example: 
      // nil and unevaluated and ...
      // will return nil without evaluating unevaluated
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  // a value inside () is just the value
  // Some parsers don’t define tree nodes for parentheses. Instead, 
  // when parsing a parenthesized expression, they simply return the 
  // node for the inner expression. We do create a node for parentheses 
  // in Lox because we’ll need it later to correctly handle the left-hand 
  // sides of assignment expressions.
  visitGroupingExpr(expr: Grouping): ObjectType {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: Unary): ObjectType {
    const right: ObjectType = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TT.MINUS:
        this.checkNumberOperand(expr.operator, right);
        const r = right as number;
        return -r;
      case TT.BANG:
        return !this.isTruthy(right);
    }

    // Unreachable.
    return null;
  }

  visitBinaryExpr(expr: Binary): ObjectType {
    // let is used because left and right may have their types asserted
    let left: ObjectType = this.evaluate(expr.left);
    let right: ObjectType = this.evaluate(expr.right); 

    switch (expr.operator.type) {
      case TT.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left - right;

      // + can be applied to strings and numbers
      // NOTE the + operator must determine types of the operands
      // to determine the operator behvavior, concatenation or addition,
      // so it doesn't to call a check method
      case TT.PLUS:
        if (typeof(left) === "number" && typeof(right) === "number") {
          return left + right;
        } 

        if (typeof(left) === "string" && typeof(right) === "string") {
          return left + right;
        }
        throw new RuntimeError(expr.operator,
            "Operands must be two numbers or two strings.");

      // binary operators on numbers
      case TT.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left / right;
      case TT.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left * right;
      case TT.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left > right;
      case TT.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left >= right;
      case TT.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left < right;
      case TT.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        left = left as number;
        right = right as number;
        return left <= right;

      // binary operations on bools
      case TT.BANG_EQUAL: return !this.isEqual(left, right);
      case TT.EQUAL_EQUAL: return this.isEqual(left, right);
    }

    // Unreachable.
    return null;
  }

  visitCallExpr(expr: Call): ObjectType {
    const callee: ObjectType = this.evaluate(expr.callee);
    const args: Array<ObjectType> = [];
    for (const arg of expr.args) { 
      args.push(this.evaluate(arg));
    }

    if (!isCallable(callee)) {
      throw new RuntimeError(expr.paren,
          "Can only call functions and classes.");
    }
    const func: Callable = callee as Callable;

    if (args.length != func.arity()) {
      throw new RuntimeError(expr.paren, "Expected " +
          func.arity() + " arguments but got " +
          args.length + ".");
    }

    return func.call(this, args);
  }

  visitVariableExpr(expr: Variable): ObjectType {
    return this.lookUpVariable(expr.name, expr);
  }

  private lookUpVariable(name: Token, expr: Expr): ObjectType {
    const distance: number | undefined = this.localDistances.get(expr);
    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      // if the token is not in the map, then it must be global
      return this.globalEnvironment.get(name);
    }
  }

  /*********************************************************************** 
  * STMTVISITOR INTERFACE METHODS
  * NOTE these are pseudo-private methods, they should not be called
  * except in a roundabout way from interpret()
  ***********************************************************************/

  visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  // NOTE this doesn't actual do anything, because there is nothing
  // to execute for an expression, we could modify the compiler to simply
  // discard these by commenting the this.evaluate
  visitExpressionStmt(expressionStatement: Expression): void {
    this.evaluate(expressionStatement.expression);
  }

  visitFunctionStmt(stmt: Fun): void {
    const func: LangFunction = new LangFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitPrintStmt(printStatement: Print): void {
    const value: ObjectType = this.evaluate(printStatement.expression);
    console.log(this.stringify(value));
  }

  visitReturnStmt(stmt: Return): void {
    let value: Nullable<ObjectType> = null;
    if (stmt.value != null) value = this.evaluate(stmt.value);

    throw new ReturnIndicator(value);
  }

  visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  // NOTE the default value of an uninitialized variable is nil/null
  visitVarStmt(stmt: Var): void {
    let value: Nullable<ObjectType> = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
  }

  // similar to lookUpVariable, except with assignment
  visitAssignExpr(expr: Assign): ObjectType {
    const value: ObjectType = this.evaluate(expr.value);

    const distance: number | undefined = this.localDistances.get(expr);
    if (distance !== undefined) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      // if the token is not in the map, then it must be global
      this.globalEnvironment.assign(expr.name, value);
    }

    return value;
  }

  /***********************************************************************
  * HELPER METHODS
  ***********************************************************************/

  // evaluates a given expression in accordance with the visitor pattern,
  // so the given expression will in turn call the appropriate visit
  // method above based on its own type
  private evaluate(expr: Expr): ObjectType {
    return expr.accept(this);
  }

  // just like evaluate, express for statements
  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  resolve(expr: Expr, depth: number): void {
    this.localDistances.set(expr, depth);
  }

  // executes a given block by storing the current environment
  // temporarily, and then executing all statements within the block
  // using the given environment within the block
  executeBlock( statements: Array<Stmt>,
                        blockEnvironment: Environment): void {
    const outerEnvironment: Environment = this.environment;
    try {
      this.environment = blockEnvironment;

      for (const statement of statements) {
        this.execute(statement);
      }
    } finally {
      this.environment = outerEnvironment;
    }
  }

  // false and nil are falsey, everything else is truthy
  private isTruthy(object: ObjectType): boolean {
    if (object === null) return false;
    if (typeof(object) === "boolean") return object;
    return true;
  }

  // will use Java's equals method to handle equality
  // first check for nulls, so that you don't get a nullpointerexception
  // if the object's are of different types, then return false
  // otherwise return true if the object's have the same value
  private isEqual(a: ObjectType, b: ObjectType) {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  // turns an object into a string
  // NOTE recall that objects are nil, strings, numbers, and booleans
  private stringify(object: ObjectType): string {
    if (object === null) return "nil";

    if (typeof(object) === "number") {
      // TODO chop off the .0 if you have to
      // let text: string = object.toString();
      // if (text.endsWith(".0")) {
      //   text = text.substring(0, text.length - 2);
      // }
      return object.toString();
    } else if (typeof(object) === "boolean") {
      if (object) {
        return "true";
      }
      return "false";
    } else if (isCallable(object)) {
      return object.toString();
    }
    // if it's a string, just return it
    return object;
  }

  // returns whether the given operand is a number operand
  // NOTE the operator is only used for error reporting
  // the operator will be returned as the RuntimeError token
  private checkNumberOperand(operator: Token, operand: ObjectType) {
    if (typeof(operand) === "number") return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  // returns whether the given operands are numbers
  // NOTE the operator is only used for error reporting
  // the operator will be returned as the RuntimeError token
  private checkNumberOperands(operator: Token, 
                      left: ObjectType, 
                      right: ObjectType) {
    if (typeof(left) === "number" && typeof(right) === "number") return;
    
    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
