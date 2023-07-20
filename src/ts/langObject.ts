import Environment from "./environment";
import { ImplementationError } from "./error";
import Interpreter from "./interpreter";
import { BlockStmt, Stmt } from "./stmt";
import { Token } from "./token";
import { ReturnIndicator } from "./indicator";

// the objects within the language
export type LangObject = number | string | boolean | 
                         FunctionLangObject | ArrayLangObject ;

//======================================================================
// Complex Objects
//======================================================================

export class FunctionLangObject {
  readonly parameterTokens: Token[]; 
  readonly statement: Stmt;

  // the type of the object, not passed to the constructor
  readonly closure: Environment<LangObject>;

  constructor(parameterTokens: Token[],
              statement: Stmt,
              closure: Environment<LangObject>) {
    this.parameterTokens = parameterTokens;
    this.statement = statement;
    this.closure = closure;
  }

  toString() {
    return 'anonymous function object';
  }

  call(interpreter: Interpreter, args: LangObject[]): LangObject {
    // create the inner environment, make sure it exists
    if (this.closure == null)
      throw new ImplementationError('Function called with no closure set.');

    const innerEnvironment: Environment<LangObject> = new Environment<LangObject>(this.closure);

    // define the arguments in the inner environment
    for (const i in this.parameterTokens) {
      const id = this.parameterTokens[i].lexeme;
      innerEnvironment.define(id, args[i]);
    }

    // provide the environment with the function parameter
    interpreter.functionEnvironment = innerEnvironment;

    try {
      // check if the next statement is a block statement or a normal one to
      // avoid a redundant empty environment around a block statment
      if (this.statement instanceof BlockStmt)
        interpreter.visitBlockStmt(this.statement);
      else
        interpreter.execute(this.statement);
    } catch (returnOrError: unknown) {
      // return was thrown
      if (returnOrError instanceof ReturnIndicator) return returnOrError.value;

      // error
      throw returnOrError;
    }

    // if no value was returned with no errors, then the function was a void
    throw new ImplementationError('No return value was thrown by a function.');
  }
}

export class ArrayLangObject {
  readonly capacity: number;
  readonly elements: LangObject[];

  constructor(capacity: number, elements: LangObject[]) {
    this.capacity = capacity;
    this.elements = elements;
  }

  toString() { 
    return '[' + this.elements.toString() + ']';
  }
}
