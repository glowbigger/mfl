import {  Expr, ExprVisitor, Binary, Grouping, Literal, 
          Unary, Variable, Assign } from "./expr";
// import { LangError } from "./langError";
import { LiteralType, Nullable } from "./types";
import { TokenType as TT } from "./tokenType";
import Token from "./token";
import { Stmt, StmtVisitor, Expression, Print, Var, Block } from "./stmt";
import reportLangError from "./main";
import Environment from "./environment";

// TODO maybe move this?
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
  implements ExprVisitor<LiteralType>, StmtVisitor<void> {
  private environment: Environment = new Environment();

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
  visitLiteralExpr(expr: Literal): LiteralType {
    return expr.value;
  }

  // a value inside () is just the value
  // Some parsers don’t define tree nodes for parentheses. Instead, 
  // when parsing a parenthesized expression, they simply return the 
  // node for the inner expression. We do create a node for parentheses 
  // in Lox because we’ll need it later to correctly handle the left-hand 
  // sides of assignment expressions.
  visitGroupingExpr(expr: Grouping): LiteralType {
    return this.evaluate(expr.expression);
  }

  visitUnaryExpr(expr: Unary): LiteralType {
    const right: LiteralType = this.evaluate(expr.right);

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

  visitBinaryExpr(expr: Binary): LiteralType {
    // let is used because left and right may have their types asserted
    let left: LiteralType = this.evaluate(expr.left);
    let right: LiteralType = this.evaluate(expr.right); 

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

  // 
  visitVariableExpr(expr: Variable): LiteralType {
    return this.environment.get(expr.name);
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

  // evaluates and prints the given statement
  visitPrintStmt(printStatement: Print): void {
    const value: LiteralType = this.evaluate(printStatement.expression);
    console.log(this.stringify(value));
  }

  // NOTE the default value of an uninitialized variable is nil/null
  visitVarStmt(stmt: Var): void {
    let value: Nullable<LiteralType> = null;
    if (stmt.initializer != null) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
  }

  visitAssignExpr(expr: Assign): LiteralType {
    const value: LiteralType = this.evaluate(expr.value);
    this.environment.assign(expr.name, value);
    return value;
  }

  /***********************************************************************
  * HELPER METHODS
  ***********************************************************************/

  // evaluates a given expression in accordance with the visitor pattern,
  // so the given expression will in turn call the appropriate visit
  // method above based on its own type
  private evaluate(expr: Expr): LiteralType {
    return expr.accept(this);
  }

  // just like evaluate, express for statements
  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  // executes a given block by storing the current environment
  // temporarily, and then executing all statements within the block
  // using the given environment within the block
  private executeBlock( statements: Array<Stmt>,
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
  private isTruthy(object: LiteralType): boolean {
    if (object === null) return false;
    if (typeof(object) === "boolean") return object;
    return true;
  }

  // will use Java's equals method to handle equality
  // first check for nulls, so that you don't get a nullpointerexception
  // if the object's are of different types, then return false
  // otherwise return true if the object's have the same value
  private isEqual(a: LiteralType, b: LiteralType) {
    if (a === null && b === null) return true;
    if (a === null) return false;

    return a === b;
  }

  // turns an object into a string
  // NOTE recall that objects are nil, strings, numbers, and booleans
  private stringify(object: LiteralType): string {
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
    } 
    return object;
  }

  // returns whether the given operand is a number operand
  // NOTE the operator is only used for error reporting
  // the operator will be returned as the RuntimeError token
  private checkNumberOperand(operator: Token, operand: LiteralType) {
    if (typeof(operand) === "number") return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  // returns whether the given operands are numbers
  // NOTE the operator is only used for error reporting
  // the operator will be returned as the RuntimeError token
  private checkNumberOperands(operator: Token, 
                      left: LiteralType, 
                      right: LiteralType) {
    if (typeof(left) === "number" && typeof(right) === "number") return;
    
    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
