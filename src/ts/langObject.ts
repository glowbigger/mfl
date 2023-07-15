import Environment from "./environment";
import { ImplementationError } from "./error";
import Interpreter from "./interpreter";
import { BlockStmt, Stmt } from "./stmt";
import { Token } from "./token";
import { ReturnIndicator } from "./indicator";

// the objects within the language
// NOTE null is only for void returns and empty array cells
// NOTE there are no null values or types in the language
export type LangObject = number | string | boolean | 
                         FunctionLangObject | ArrayLangObject | null;

export interface Callable {
  call(interpreter: Interpreter,
       args: LangObject[]): LangObject | null;
}

//======================================================================
// Complex Objects
//======================================================================

export class FunctionLangObject implements Callable {
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

  call(interpreter: Interpreter, args: LangObject[]): LangObject | null {
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
    return null;
  }
}

export class ArrayLangObject {
  readonly capacity: number;
  readonly elements: LangObject[];
  readonly innerElements: LangObject;

  constructor(capacity: number, initialElements: LangObject[]) {
    this.innerElements = null;
    this.capacity = capacity;
    this.elements = [];

    // fill the initial elements array with empty values until it is max capacity
    while (initialElements.length < this.capacity) {
      initialElements.push(null);
    }

    this.elements = initialElements;
  }

  toString() { 
    return '[' + this.elements.toString() + ']';
  }

  // returns the empty array with this array's dimensions, ie
  // [ null, null ] or [[ null, null, null], [null, null, null]], etc.
  getEmptyArray() {
    const emptyArray: ArrayLangObject = new ArrayLangObject(this.capacity, []);

    // an array of non-arrays, is just [ null, ..., null ]
    if (!(this.elements instanceof ArrayLangObject)) {
      while (emptyArray.elements.length < this.capacity)
        emptyArray.elements.push(null);
      return emptyArray;
    }
  }
}
