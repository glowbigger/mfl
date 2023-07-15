// the type of an object within the language (LangType = Language Object Type)
// nullReturn is only ever used as the output type of a null function return
export type LangType = PrimitiveLangType | FunctionLangType | 
                             ArrayLangType | 'nullReturn' ;
export type PrimitiveLangType = 'Num' | 'Str' | 'Bool' ;

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

//======================================================================
// Complex Types
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

export class ArrayLangType {
  readonly innerType: LangType;

  constructor(innerType: LangType) {
    this.innerType = innerType;
  }

  equals(other: ArrayLangType): boolean {
    return LangTypeEqual(this.innerType, other.innerType);
  }
}
