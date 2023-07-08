// booleans, numbers, and strings tokens have actual values, all other tokens

import { Environment, LOEnvironment, TypeEnvironment } from "./environment";
import { ImplementationError } from "./error";
import Interpreter from "./interpreter";
import { BlockStmt, Stmt } from "./stmt";
import { Token } from "./token";
import { ReturnIndicator } from "./indicator";

// token literals have values, ie the token for "string" has the value "string"
// NOTE no value returns are indicated by null
export type TokenValue = number | string | boolean | null;

// the type of an object within the language (LOT = Language Object Type)
// nullReturn is only ever used as the output type of a null function return
export type LangObjectType = PrimitiveLOT | FunctionLOT | 
                             ArrayLOT | 'nullReturn';
export type PrimitiveLOT = 'NumberLOT' | 'StringLOT' | 'BoolLOT' ;

// the objects within the language
// NOTE null is only for void returns and empty array cells
// NOTE there are no null values or types in the language
export type LangObject = number | string | boolean | 
                         FunctionLangObject | ArrayLangObject | null;

//======================================================================
// Functions
//======================================================================

export class FunctionLOT {
  parameters: LangObjectType[];
  returnType: LangObjectType | null;

  constructor(parameters: LangObjectType[], returnType: LangObjectType | null) {
    this.parameters = parameters;
    this.returnType = returnType;
  }

  toString() { return 'FunctionLOT' }

  equals(other: FunctionLOT): boolean { 
    // check return types
    if (this.returnType instanceof FunctionLOT &&
        other.returnType instanceof FunctionLOT) {
      if (!this.returnType.equals(other.returnType)) 
        return false;
    }
    else if (other.returnType !== this.returnType) return false;

    // check parameter types
    const thisNumParameters = this.parameters.length;
    const otherNumParameters = other.parameters.length;

    if (thisNumParameters != otherNumParameters) return false;
    else {
      for (const i in this.parameters) {

        // check type of each parameter
        if (this.parameters[i] instanceof FunctionLOT &&
            other.parameters[i] instanceof FunctionLOT) {
          if (!(this.parameters[i] as FunctionLOT)
              .equals(other.parameters[i] as FunctionLOT))
            return false;
        } else if (this.parameters[i] !== other.parameters[i]) return false;

      }
    }

    return true;
  }
};

export class FunctionLangObject implements Callable {
  readonly parameterTokens: Token[]; 
  readonly parameterTypes: LangObjectType[];
  readonly returnType: LangObjectType;
  readonly statement: Stmt;

  // the type of the object, not passed to the constructor
  readonly type: FunctionLOT;
  readonly closure: LOEnvironment;

  constructor(parameterTokens: Token[], parameterTypes: LangObjectType[], 
              returnType: LangObjectType, statement: Stmt,
              closure: LOEnvironment) {
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.closure = closure;

    // create and set the type
    this.type = new FunctionLOT(parameterTypes, returnType);
  }

  toString() {
    return `anonymous function object`;
  }

  call(interpreter: Interpreter, args: LangObject[]): LangObject | null {
    // create the inner environment, make sure it exists
    if (this.closure == null)
      throw new ImplementationError('Function called with no closure set.');

    const innerEnvironment: LOEnvironment = new LOEnvironment(this.closure);

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

export class ArrayLOT {
  readonly innerType: LangObjectType;

  constructor(innerType: LangObjectType) {
    this.innerType = innerType;
  }

  equals(other: ArrayLOT): boolean {
    return LOTequal(this.innerType, other.innerType);
  }
}

export class ArrayLangObject {
  // NOTE we don't care about the array's type at runtime, the type validator
  // will make sure that all elements have the same type
  readonly capacity: number;
  readonly elements: LangObject[];

  constructor(capacity: number, initialElements: LangObject[]) {
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
}

//======================================================================
// Other
//======================================================================

export interface Callable {
  call(interpreter: Interpreter,
       args: LangObject[]): LangObject | null;
}

// returns whether two language object types are equal
export function LOTequal(type1: LangObjectType, type2: LangObjectType): boolean {
  if (type1 instanceof ArrayLOT && type2 instanceof ArrayLOT) {
    return type1.equals(type2);
  }
  if (type1 instanceof FunctionLOT && type2 instanceof FunctionLOT) {
    return type1.equals(type2);
  }
  return type1 === type2;
}
