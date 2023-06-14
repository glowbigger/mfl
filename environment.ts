// this class serves as the variable-value lookup table for a scope level
// it is a wrapper for a dictionary/object/hashmap

import { RuntimeError } from "./interpreter";
import Token from "./token";
import { LiteralType, Nullable } from "./types";

export default class Environment {
  private readonly values:{ [key: string] : Nullable<LiteralType> } = {};

  // check if a token's lexeme is in the environment and return the value
  // if it exists, otherwise throw a runtime error
  get(name: Token): LiteralType {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }

    throw new RuntimeError(name,
        "Undefined variable '" + name.lexeme + "'.");
  }

  // check if a token's lexeme is in the environment and update the
  // value if it exists, otherwise throw a runtime error
  assign(name: Token, value: LiteralType): void {
    if (name.lexeme in this.values) {
      this.values[name.lexeme] = value;
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
