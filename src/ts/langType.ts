// the type of an object within the language (LangType = Language Object Type)
// nullReturn is only ever used as the output type of a null function return
export type LangType = PrimitiveLangType | ComplexLangType | 'nullReturn' ;
export type PrimitiveLangType = 'Num' | 'Str' | 'Bool' ;
export abstract class ComplexLangType {
  abstract equals(other: LangType): boolean;
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

//======================================================================
// Complex Types
//======================================================================

export class FunctionLangType extends ComplexLangType {
  parameters: LangType[];
  returnType: LangType | null;

  constructor(parameters: LangType[], returnType: LangType | null) {
    super();
    this.parameters = parameters;
    this.returnType = returnType;
  }

  toString() { return 'FunctionLangType' }

  equals(other: LangType): boolean { 
    if (!(other instanceof FunctionLangType)) return false;

    // check return types
    if (!LangTypeEqual(other.returnType, this.returnType)) return false;

    // check parameter lengths
    const thisNumParameters = this.parameters.length;
    const otherNumParameters = other.parameters.length;
    if (thisNumParameters != otherNumParameters) return false;

    // check parameter types
    for (const i in this.parameters) {
      if (!LangTypeEqual(this.parameters[i], other.parameters[i])) return false;
    }

    return true;
  }
};

export class ArrayLangType extends ComplexLangType {
  readonly innerType: LangType;

  constructor(innerType: LangType) {
    super();
    this.innerType = innerType;
  }

  equals(other: LangType): boolean {
    if (other instanceof ArrayLangType)
      return LangTypeEqual(this.innerType, other.innerType);
    return false;
  }
}
