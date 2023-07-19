import { Expr, BinaryExpr, GroupingExpr, LiteralExpr, UnaryExpr, 
          ExprVisitor, VariableExpr, AssignExpr, LogicalExpr, FunctionObjectExpr, CallExpr, ArrayObjectExpr, ArrayAccessExpr, ArrayAssignExpr } from './expr'
import { TokenError, ImplementationError, SyntaxTreeNodeError } from './error';
import { ArrayLangObject, FunctionLangObject, LangObject } from './langObject';
import { Stmt, ExpressionStmt, PrintStmt, BlankStmt, StmtVisitor,
        DeclarationStmt,
        BlockStmt,
        IfStmt,
        WhileStmt,
        BreakStmt,
        ReturnStmt} from './stmt';
import Environment from './environment';
import { BreakIndicator, ReturnIndicator } from "./indicator";

export default class Interpreter 
  implements ExprVisitor<LangObject>, StmtVisitor<void> {
  // the lines printed by the given program
  private printedLines: string[];

  // the program is defined as a list of statements
  private program: Stmt[];

  private globalEnvironment: Environment<LangObject>;
  private currentEnvironment: Environment<LangObject>;

  // a function call might set its arguments to be a new environment, 
  // if this variable is not null, then a function call was just made
  // NOTE this must be public because it is set by FunctionLangObject
  functionEnvironment: Environment<LangObject> | null;

  // set by the resolver, used to find variable values
  private localVariableDistances: Map<Expr, number>;
  
  constructor(program: Stmt[]) {
    this.program = program;
    this.printedLines = [];
    this.globalEnvironment = new Environment<LangObject>(null);
    this.currentEnvironment = this.globalEnvironment;
    this.functionEnvironment = null;
    this.localVariableDistances = new Map<Expr, number>();
  }

  // interprets the program and returns the possible printed output
  interpret(): string {
    // NOTE a single error will end interpretation
    for (const statement of this.program) {
      this.execute(statement);
    }
    
    return this.printedLines.join('\n');
  }

  evaluate(expr: Expr): LangObject {
    return(expr.accept(this));
  }

  execute(stmt: Stmt): void {
    // if an environment is provided, then execute the statement using it
    if (this.functionEnvironment !== null) {
      // save the outer environment to restore it later
      const outerEnvironment: Environment<LangObject> = this.currentEnvironment;

      // switch environments and reset the function environment to be null
      this.currentEnvironment = this.functionEnvironment;
      this.functionEnvironment = null;

      // NOTE try doesn't matter here, only the finally is used to restore the
      // outer environment regardless of any errors
      try {
        stmt.accept(this);
      } finally {
        this.currentEnvironment = outerEnvironment;
      }
    } else {
      stmt.accept(this);
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
      // NOTE functions shouldn't have their closures set here, because the
      // environment might be wrong and return statements can return functions
      this.currentEnvironment.define(id, value);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new TokenError(error.message, stmt.identifier);
      }
      throw new ImplementationError('Unable to define variable.');
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    // save the outer environment to restore it later
    const outerEnvironment: Environment<LangObject> = this.currentEnvironment;

    // create the inner blank environment that has the outer one as its parent
    let innerEnvironment: Environment<LangObject>;

    // if the block follows a function call, then the environment for the block
    // was already created with the function parameters
    if (this.functionEnvironment !== null) {
      innerEnvironment = new Environment<LangObject>(this.functionEnvironment);
      this.functionEnvironment = null;
    } else innerEnvironment = new Environment<LangObject>(outerEnvironment);

    // switch environments and execute the statements with it
    this.currentEnvironment = innerEnvironment;
    try {
      for (const statement of stmt.statements) {
        this.execute(statement);
      }
    } finally {
      // restore the outer environment regardless of any errors
      this.currentEnvironment = outerEnvironment;
    }
  }

  visitIfStmt(stmt: IfStmt): void {
    const condition: boolean = this.evaluate(stmt.condition) as boolean;
    if (condition) this.execute(stmt.thenBranch);
    else if (stmt.elseBranch !== null) this.execute(stmt.elseBranch);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.evaluate(stmt.condition) as boolean) {
      try {
        this.execute(stmt.body);
      } catch (breakOrError: unknown) {
        if (breakOrError instanceof BreakIndicator) break;
        else throw breakOrError;
      }
    }
  }

  visitBreakStmt(stmt: BreakStmt): void {
    throw new BreakIndicator();
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let returnValue: LangObject | null = null;
    if (stmt.value !== null) returnValue = this.evaluate(stmt.value);
    throw new ReturnIndicator(returnValue);
  }

  //======================================================================
  // Expression Visitor Methods
  //======================================================================

  visitBinaryExpr(expr: BinaryExpr): LangObject {
    let leftValue: LangObject; let rightValue: LangObject;

    switch(expr.operator.type) {
      case 'EQUAL_EQUAL':
        leftValue = this.evaluate(expr.leftExpr);
        rightValue = this.evaluate(expr.rightExpr);
        return leftValue === rightValue;

      case 'BANG_EQUAL':
        leftValue = this.evaluate(expr.leftExpr) as boolean;
        rightValue = this.evaluate(expr.rightExpr) as boolean;
        return leftValue != rightValue;

      case 'LESS':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue < rightValue;

      case 'LESS_EQUAL':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue <= rightValue;

      case 'GREATER':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue > rightValue;

      case 'GREATER_EQUAL':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue >= rightValue;

      case 'PLUS':
        // + can add numbers or concatenate strings
        leftValue = this.evaluate(expr.leftExpr) as number | string;
        rightValue = this.evaluate(expr.rightExpr) as number | string;

        if (typeof(leftValue) == 'number' && typeof(rightValue) == 'number') {
          // number addition
          return leftValue + rightValue;
        } else {
          // at least one of the values is a string, so concatenate them
          return leftValue.toString() + rightValue.toString();
        }

      case 'MINUS':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue - rightValue;

      case 'STAR':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        return leftValue * rightValue;

      case 'SLASH':
        leftValue = this.evaluate(expr.leftExpr) as number;
        rightValue = this.evaluate(expr.rightExpr) as number;
        if (rightValue === 0) {
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
        rightValue = this.evaluate(expr.rightExpr) as number;
        return - rightValue;

      case 'BANG':
        rightValue = this.evaluate(expr.rightExpr) as boolean;
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
    return this.lookupVariable(expr.lToken.lexeme, expr);
  }

  visitAssignExpr(expr: AssignExpr): LangObject {
    const identifier: string = expr.lToken.lexeme;
    const value: LangObject = this.evaluate(expr.value);

    const distance: number | undefined = this.localVariableDistances.get(expr);
    if (distance !== undefined) {
      this.currentEnvironment.assignAt(distance, identifier, value);    
    } else {
      this.globalEnvironment.assign(identifier, value);
    }

    return value;
  }

  visitLogicalExpr(expr: LogicalExpr): LangObject {
    const leftValue: boolean = this.evaluate(expr.leftExpr) as boolean;

    if (expr.operator.type === 'OR') {
      // or, if the left side is true, then the 'or' expression is true
      if (leftValue) return true;
    } else {
      // and, if the left side is false, then the 'and' expression is false
      if (!leftValue) return false;
    }

    const rightValue: boolean = this.evaluate(expr.rightExpr) as boolean;
    return rightValue;
  }

  visitFunctionObjectExpr(expr: FunctionObjectExpr): LangObject {
    return new FunctionLangObject(expr.parameterTokens,
                                  expr.statement,
                                  this.currentEnvironment);
  }

  visitCallExpr(expr: CallExpr): LangObject {
    const callee: FunctionLangObject
      = this.evaluate(expr.callee) as FunctionLangObject;

    let args: LangObject[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    const returnValue = callee.call(this, args);
    return returnValue;
  }

  visitArrayObjectExpr(expr: ArrayObjectExpr): LangObject {
    // evaluate the capacity
    let capacity: number;
    if (expr.capacity instanceof Expr)
      capacity = this.evaluate(expr.capacity) as number;
    else
      capacity = expr.capacity;

    // evaluate the elements
    let elements: LangObject[] = [];
    if (Array.isArray(expr.elements)) {
      // if the elements are all provided, then insert them all
      elements = []
      for (const elementExpression of expr.elements) {
        const currentElement: LangObject = this.evaluate(elementExpression);
        elements.push(currentElement);
      }
    } else {
      // otherwise, insert the given element to fill the array
      const givenElement = this.evaluate(expr.elements);
      for (let i = 0; i < capacity; i++) {
        elements.push(givenElement);
      }
    }

    return new ArrayLangObject(capacity, elements);
  }

  visitArrayAccessExpr(expr: ArrayAccessExpr): LangObject {
    const index: number = this.evaluate(expr.index) as number;
    const array: ArrayLangObject
      = this.evaluate(expr.arrayExpr) as ArrayLangObject;

    if (index < 0 || index > array.capacity - 1) {
      throw new SyntaxTreeNodeError('Index is out of range.', expr.index);
    }

    const accessed: LangObject = array.elements[index];
    return accessed;
  }

  visitArrayAssignExpr(expr: ArrayAssignExpr): LangObject {
    const arrayExpr = expr.arrayAccessExpr.arrayExpr;
    
    // this part is idential to ArrayAccessExpr, except the value is not queried
    const index: number = this.evaluate(expr.arrayAccessExpr.index) as number;
    const arrayObject: ArrayLangObject
      = this.evaluate(arrayExpr) as ArrayLangObject;

    if (index < 0 || index > arrayObject.capacity - 1) {
      throw new SyntaxTreeNodeError('Index is out of range.',
                                    expr.arrayAccessExpr.index);
    }

    // insert the value into the array
    const value: LangObject = this.evaluate(expr.assignmentValue);
    arrayObject.elements[index] = value;

    return value;
  }

  //======================================================================
  // HELPERS
  //======================================================================

  // turns an object into a string
  private stringify(object: LangObject): string {
    if (object === null) return 'void function return';

    if (typeof(object) === 'number') return object.toString();

    if (typeof(object) === 'boolean') return object ? 'true' : 'false';

    if (object instanceof FunctionLangObject ||
        object instanceof ArrayLangObject) { 
      return object.toString();
    }

    // if it's a string, just return it
    return object;
  }

  private lookupVariable(identifier: string, expr: Expr): LangObject {
    const distance: number | undefined = this.localVariableDistances.get(expr);

    if (distance !== undefined) {
      // local variables
      return this.currentEnvironment.getAt(distance, identifier);
    } else {
      // global variables
      const maybeValue: LangObject | undefined
        = this.globalEnvironment.get(identifier);
      if (maybeValue === undefined)
        throw new ImplementationError(
          `Couldn\'t find distance for ${identifier}.`);
      return maybeValue;
    }
  }

  //======================================================================
  // PUBLIC
  //======================================================================

  resolve(expr: Expr, depth: number): void {
    this.localVariableDistances.set(expr, depth);
  }
}
