// booleans, numbers, and strings tokens have actual values, all other tokens

import { Stmt } from "./stmt";
import { Token } from "./token";

// have no value, indicated by null
export type TokenValueType = number | string | boolean | null;

// the type of an object within the language (LOT = Language Object Type)
export type LangObjectType = PrimitiveLOT | FunctionLOT;
export type PrimitiveLOT = 'NumberLOT' | 'StringLOT' | 'BoolLOT' ;

export class FunctionLOT {
  parameters: LangObjectType[];
  returnType: LangObjectType | null;

  constructor(parameters: LangObjectType[], returnType: LangObjectType | null) {
    this.parameters = parameters;
    this.returnType = returnType;
  }

  toString() { return 'FunctionLOT' }

  isEquals(other: FunctionLOT): boolean { 
    // check return types
    if (this.returnType instanceof FunctionLOT &&
        other.returnType instanceof FunctionLOT) {
      if (!this.returnType.isEquals(other.returnType)) 
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
              .isEquals(other.parameters[i] as FunctionLOT))
            return false;
        } else if (this.parameters[i] !== other.parameters[i]) return false;

      }
    }

    return true;
  }
};

// the representations of the objects within the language
export type LangObject = number | string | boolean | FunctionLangObject;

export class FunctionLangObject {
  parameterTokens: Token[]; 
  parameterTypes: LangObjectType[];
  returnType: LangObjectType | null;
  statement: Stmt;
  // the object can determine its own type
  type: FunctionLOT;

  constructor(parameterTokens: Token[], parameterTypes: LangObjectType[], 
              returnType: LangObjectType | null, statement: Stmt) {
    this.parameterTokens = parameterTokens;
    this.parameterTypes = parameterTypes;
    this.returnType = returnType;
    this.statement = statement;
    this.type = new FunctionLOT(parameterTypes, returnType);
  }

  toString() {
    return `anonymous function object`;
  }
}
