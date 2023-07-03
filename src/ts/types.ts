// booleans, numbers, and strings tokens have actual values, all other tokens

import { Environment, LOEnvironment, TypeEnvironment } from "./environment";
import Interpreter from "./interpreter";
import { Stmt } from "./stmt";
import { Token } from "./token";

// have no value, indicated by null
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

// the representations of the objects within the language
export type LangObject = number | string | boolean | FunctionLangObject;

// TODO use an interface
export interface Callable {
  call(interpreter: Interpreter, args: LangObject[]): LangObject;
}

export class FunctionLangObject implements Callable {
  readonly parameterTokens: Token[]; 
  readonly parameterTypes: LangObjectType[];
  readonly returnType: LangObjectType | null;
  readonly statement: Stmt;
  // the object can determine its own type
  readonly type: FunctionLOT;
  // readonly closure: TypeEnvironment | LOEnvironment;

  constructor(parameterTokens: Token[], parameterTypes: LangObjectType[], 
              returnType: LangObjectType | null, statement: Stmt) {
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.type = new FunctionLOT(parameterTypes, returnType);
    // this.closure = closure;
  }

  toString() {
    return `anonymous function object`;
  }

  call(interpreter: Interpreter, args: LangObject[]): LangObject {
    return 5;
  }
}
