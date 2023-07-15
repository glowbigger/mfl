// booleans, numbers, and strings tokens have actual values, all other tokens

import Environment from "./environment";
import { ImplementationError } from "./error";
import Interpreter from "./interpreter";
import { BlockStmt, Stmt } from "./stmt";
import { Token } from "./token";
import { ReturnIndicator } from "./indicator";

// token literals have values, ie the token for "string" has the value "string"
// NOTE no value returns are indicated by null
export type TokenValue = number | string | boolean | null;

// the type of an object within the language (LangType = Language Object Type)
// nullReturn is only ever used as the output type of a null function return
export type LangType = PrimitiveLangType | FunctionLangType | 
                             ArrayLangType | 'nullReturn' ;
export type PrimitiveLangType = 'Num' | 'Str' | 'Bool' ;

// the objects within the language
// NOTE null is only for void returns and empty array cells
// NOTE there are no null values or types in the language
export type LangObject = number | string | boolean | 
                         FunctionLangObject | ArrayLangObject | null;

//======================================================================
// Functions
//======================================================================

export class FunctionLangType {
  parameters: LangType[];
  returnType: LangType | null;

  constructor(parameters: LangType[], returnType: LangType | null) {
    this.parameters = parameters;
    this.returnType = returnType;
  }

  toString() { return 'FunctionLangType' }

  equals(other: FunctionLangType): boolean { 
    // check return types
    if (this.returnType instanceof FunctionLangType &&
        other.returnType instanceof FunctionLangType) {
      if (!this.returnType.equals(other.returnType)) 
        return false;
    }
    else if (!LangTypeEqual(other.returnType, this.returnType)) return false;

    // check parameter types
    const thisNumParameters = this.parameters.length;
    const otherNumParameters = other.parameters.length;

    if (thisNumParameters != otherNumParameters) return false;
    else {
      for (const i in this.parameters) {

        // check type of each parameter
        if (this.parameters[i] instanceof FunctionLangType &&
            other.parameters[i] instanceof FunctionLangType) {
          if (!(this.parameters[i] as FunctionLangType)
              .equals(other.parameters[i] as FunctionLangType))
            return false;
        } else if (!LangTypeEqual(this.parameters[i], other.parameters[i]))
          return false;
      }
    }

    return true;
  }
};

export class FunctionLangObject implements Callable {
  readonly parameterTokens: Token[]; 
  readonly parameterTypes: LangType[];
  readonly returnType: LangType;
  readonly statement: Stmt;

  // the type of the object, not passed to the constructor
  readonly type: FunctionLangType;
  readonly closure: Environment<LangObject>;

  constructor(parameterTokens: Token[], parameterTypes: LangType[], 
              returnType: LangType, statement: Stmt,
              closure: Environment<LangObject>) {
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.closure = closure;

    // create and set the type
    this.type = new FunctionLangType(parameterTypes, returnType);
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

//======================================================================
// Arrays
//======================================================================

export class ArrayLangType {
  readonly innerType: LangType;

  constructor(innerType: LangType) {
    this.innerType = innerType;
  }

  equals(other: ArrayLangType): boolean {
    return LangTypeEqual(this.innerType, other.innerType);
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

//======================================================================
// Other
//======================================================================

export interface Callable {
  call(interpreter: Interpreter,
       args: LangObject[]): LangObject | null;
}

// returns whether two language object types are equal
export function LangTypeEqual(type1: LangType | null,
                         type2: LangType | null): boolean {
  if (type1 instanceof ArrayLangType && type2 instanceof ArrayLangType) {
    return type1.equals(type2);
  }
  if (type1 instanceof FunctionLangType && type2 instanceof FunctionLangType) {
    return type1.equals(type2);
  }
  return type1 === type2;
}
