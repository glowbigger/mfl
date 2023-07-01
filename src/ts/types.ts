// booleans, numbers, and strings tokens have actual values, all other tokens
// have no value, indicated by null
export type TokenValueType = number | string | boolean | null;

// the type of an object within the language
export type LangObjectType = PrimitiveLOT;
export type PrimitiveLOT = 'NumberLOT' | 'StringLOT' | 'BoolLOT';
// NOTE functions and classes and union types will be classes

// the objects in the languages themselves
// NOTE will eventually include functions, union types, etc.
export type LangObject = number | string | boolean;
