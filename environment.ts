// this class serves as the variable-value lookup table for a scope level
// it is a wrapper for a dictionary/object/hashmap

import { RuntimeError } from "./interpreter";
import Token from "./token";
import { LiteralType, Nullable } from "./types";

export default class Environment {
  readonly enclosing: Nullable<Environment>;
  private readonly values:{ [key: string] : Nullable<LiteralType> } = {};

  // the global scope constructor will be the only environment
  // with an empty constructor, everything else will inherit
  // the have the appropriate enclosing environment passed in to
  // the constructor
  constructor(enclosing: Nullable<Environment> = null) {
    this.enclosing = enclosing;
  }

  // check if a token's lexeme is in the environment and return the value
  // if it exists, otherwise try the enclosing environment, if a variable 
  // doesn't exist at the global level, a runtime error is thrown
  // thus, all environments up to the global level will be searched
  get(name: Token): LiteralType {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name,
        "Undefined variable '" + name.lexeme + "'.");
  }

  // check if a token's lexeme is in the environment and update the
  // value if it exists, otherwise thy the enclosing environment, if a
  // variable doesn't exist at the global level, a runtime error is thrown
  assign(name: Token, value: LiteralType): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name,
        "Undefined variable '" + name.lexeme + "'.");
  }

  // NOTE redefining an existing variable is fine
  define(name: string, value: Nullable<LiteralType>): void {
    this.values[name] = value;
  }
}
