// booleans, numbers, and strings tokens have actual values, all other tokens

import { Environment, LOEnvironment, TypeEnvironment } from "./environment";
import { ImplementationError } from "./error";
import Interpreter from "./interpreter";
import { Stmt } from "./stmt";
import { Token } from "./token";
import { ReturnIndicator } from "./indicator";

// no value returns, indicated by null
export type TokenValueType = number | string | boolean | null;

// the type of an object within the language (LOT = Language Object Type)
// nullReturn is only ever used as the output type of a null function return
export type LangObjectType = PrimitiveLOT | FunctionLOT | 'nullReturn';
export type PrimitiveLOT = 'NumberLOT' | 'StringLOT' | 'BoolLOT' ;

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

// returns whether two language object types are equal
export function LOTequal(type1: LangObjectType, type2: LangObjectType): boolean {
  if (type1 instanceof FunctionLOT && type2 instanceof FunctionLOT) {
    return type1.equals(type2);
  }
  return type1 == type2;
}

// the objects within the language, null is only for void returns
export type LangObject = number | string | boolean | FunctionLangObject | null;

// TODO use an interface
export interface Callable {
  call(interpreter: Interpreter,
       args: LangObject[]): LangObject | null;
}

export class FunctionLangObject implements Callable {
  readonly parameterTokens: Token[]; 
  readonly parameterTypes: LangObjectType[];
  readonly returnType: LangObjectType | null;
  readonly statement: Stmt;
  // the object can determine its own type
  readonly type: FunctionLOT;

  // the closure will be set by the interpreter, but the object is first made
  // during the parsing stage, so this can't go in the constructor
  closure: LOEnvironment | null;

  constructor(parameterTokens: Token[], parameterTypes: LangObjectType[], 
              returnType: LangObjectType | null, statement: Stmt) {
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.type = new FunctionLOT(parameterTypes, returnType);
    this.closure = null;
  }

  toString() {
    return `anonymous function object`;
  }

  call(interpreter: Interpreter, args: LangObject[]): LangObject | null {
    // create the inner environment, make sure it exists
    if (this.closure == null)
      // FIXME if a function is returned from a function it has no closure
      throw new ImplementationError('Function called with no closure set.');
    const innerEnvironment: LOEnvironment = new LOEnvironment(this.closure);

    // define the arguments in the inner environment
    for (const i in this.parameterTokens) {
      const id = this.parameterTokens[i].lexeme;
      innerEnvironment.define(id, args[i]);
    }

    try {
      interpreter.execute(this.statement, innerEnvironment);
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
