import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, 
          ExprVisitor, VariableExpr, AssignExpr } from './expr'
import { TokenError, ImplementationError, LangError } from './error';
import { LangObject } from './types';
import { Stmt, ExpressionStmt, PrintStmt, BlankStmt, StmtVisitor,
        DeclarationStmt,
        BlockStmt} from './stmt';
import { LOEnvironment } from './environment';

export default class Interpreter 
  implements ExprVisitor<LangObject>, StmtVisitor<void> {

  // the lines printed by the program given
  private printedLines: string[];

  // the program is defined as a list of statements
  private program: Stmt[];

  // the environment of current scope / block statement being interpreted
  // NOTE the alternative is to have each visit statement method take an
  // environment as a parameter which is the environment for that statement
  private currentEnvironment: LOEnvironment;
  
  constructor(program: Stmt[]) {
    this.program = program;
    this.printedLines = [];
    this.currentEnvironment = new LOEnvironment(null);
  }

  // interprets the program and returns the possible printed output
  interpret(): string {
    // NOTE a single error will end interpretation
    for (const statement of this.program) {
      this.execute(statement);
    }
    
    return this.printedLines.join('\n');
  }

  private evaluate(expr: Expr): LangObject {
    return(expr.accept(this));
  }

  private execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  private executeBlockStatement(stmt: BlockStmt, blockEnvironment: LOEnvironment): void {
    // we save the outer environment to restore it later
    const outerEnvironment: LOEnvironment = this.currentEnvironment;

    for (const statement of stmt.statements) {
      this.currentEnvironment = blockEnvironment;
      try {
        this.execute(statement);
      } finally {
        // NOTE we only need the finally here to restore the outer environment
        // regardless of whether there was an error or not
        this.currentEnvironment = outerEnvironment;
      }
    }
  }

  //======================================================================
  // Statement Visitor Methods
  // they string return types are the potential console outputs, which are almost
  // always ''; maybe there's a better solution, but this works for now
  // NOTE this is needed for the web interpreter
  //======================================================================

  visitBlankStmt(stmt: BlankStmt): void {
    // do nothing
    return;
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const evaluatedExpression: LangObject = this.evaluate(stmt.expression);
    this.printedLines.push(this.stringify(evaluatedExpression));
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    // only does something if the expression is the output of a function call
    // or an assignment expression
    this.evaluate(stmt.expression);
  }

  visitDeclarationStmt(stmt: DeclarationStmt): void {
    const value: LangObject = this.evaluate(stmt.initialValue);
    const id: string = stmt.identifier.lexeme;

    try {
      this.currentEnvironment.define(id, value);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TokenError(error.message, stmt.identifier);
      }
      throw new ImplementationError('Unable to define variable.');
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    // send a copy of the current environment to be the inner environment of the
    // block; the inner block might get different variables declared inside
    this.executeBlockStatement(stmt, new LOEnvironment(this.currentEnvironment));
  }

  //======================================================================
  // Expression Visitor Methods
  //======================================================================

  visitBinaryExpr(expr: BinaryExpr): LangObject {
    let leftValue: LangObject; let rightValue: LangObject;

    switch(expr.operator.type) {
      case 'EQUAL_EQUAL':
        leftValue = this.evaluate(expr.left) as boolean;
        rightValue = this.evaluate(expr.right) as boolean;
        // TODO overload this, probably want to use === instead of ==
        return leftValue === rightValue;

      case 'BANG_EQUAL':
        leftValue = this.evaluate(expr.left) as boolean;
        rightValue = this.evaluate(expr.right) as boolean;
        return leftValue != rightValue;

      case 'LESS':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue < rightValue;

      case 'LESS_EQUAL':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue <= rightValue;

      case 'GREATER':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue > rightValue;

      case 'GREATER_EQUAL':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue >= rightValue;

      case 'PLUS':
        // + can add numbers or concatenate strings
        leftValue = this.evaluate(expr.left);
        rightValue = this.evaluate(expr.right);
        
        // left or right shouldn't matter here
        const type: LangObject = typeof(leftValue);

        if (type == 'number') {
          leftValue = leftValue as number;
          rightValue = rightValue as number;
          return leftValue + rightValue;
        } else if (type == 'string') {
          leftValue = leftValue as string;
          rightValue = rightValue as string;
          return leftValue + rightValue;
        } else {
          const message = 'Plus operator typechecking must have failed.';
          throw new ImplementationError(message);
        }

      case 'MINUS':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue - rightValue;

      case 'STAR':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        return leftValue * rightValue;

      case 'SLASH':
        leftValue = this.evaluate(expr.left) as number;
        rightValue = this.evaluate(expr.right) as number;
        if (rightValue == 0) {
          throw new TokenError('Division by 0.', expr.operator);
        }
        return leftValue / rightValue;
    }

    throw new ImplementationError('Unknown operator in binary expression.');
  }

  visitUnaryExpr(expr: UnaryExpr): LangObject {
    let rightValue: LangObject;

    switch(expr.operator.type) {
      case 'MINUS':
        rightValue = this.evaluate(expr.right) as number;
        return - rightValue;

      case 'BANG':
        rightValue = this.evaluate(expr.right) as boolean;
        return rightValue;
    }

    throw new ImplementationError('Unknown operator in unary expression.');
  }

  visitGroupingExpr(expr: GroupingExpr): LangObject {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): LangObject {
    // literals must have number, string, or boolean types
    // NOTE the below is more clear than asserting as LangObject
    return expr.value as (number | string | boolean);
  }

  visitVariableExpr(expr: VariableExpr): LangObject {
    const value: LangObject | undefined
      = this.currentEnvironment.get(expr.identifier.lexeme);
    if (value === undefined) {
      throw new TokenError('Undefined variable.', expr.identifier);
    }
    return value;
  }

  visitAssignExpr(expr: AssignExpr): LangObject {
    const variable: string = expr.variableIdentifier.lexeme;
    const value: LangObject = this.evaluate(expr.value);
    try {
      this.currentEnvironment.assign(variable, value);
      return value;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TokenError(error.message, expr.variableIdentifier);
      }
      throw new ImplementationError('Unable to assign to environment.');
    }
  }

  //======================================================================
  // HELPERS
  //======================================================================

  // turns an object into a string
  private stringify(object: LangObject): string {
    if (object === null) return "null";

    if (typeof(object) === "number") {
      return object.toString();
    } 
    if (typeof(object) === "boolean") {
      if (object) {
        return "true";
      }
      return "false";
    } 

    // if it's a string, just return it
    return object;
  }
}
