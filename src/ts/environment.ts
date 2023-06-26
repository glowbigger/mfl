// this class serves as the variable-value lookup table for a scope level
// it is a wrapper for a dictionary/object/hashmap

import { RuntimeError } from "./interpreter";
import { Token } from "./token";
import { ObjectType, Nullable } from "./types";

export default class Environment {
  readonly enclosing: Nullable<Environment>;
  private readonly values: { [key: string] : Nullable<ObjectType> } = {};

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
  get(name: Token): ObjectType {
    if (name.lexeme in this.values) {
      return this.values[name.lexeme];
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name,
        "Undefined variable '" + name.lexeme + "'.");
  }

  // gets the nth enclosing environment, where is n is the argument
  ancestor(distance: number): Environment {
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      // only the global environment will have a null enclosing
      // environment, so we can safely assert that environment.enclosing
      // is an environment
      environment = environment.enclosing as Environment;
    }

    return environment;
  }

  // finds the value of the target variable given its known
  // distance, the number of enclosing environments in which the
  // declared variable is
  getAt(distance: number, name: string): ObjectType {
    return this.ancestor(distance).values[name];
  }

  // same as getAt except with assignment
  assignAt(distance: number, name: Token, value: ObjectType): void {
    this.ancestor(distance).values[name.lexeme] = value;
  }

  // check if a token's lexeme is in the environment and update the
  // value if it exists, otherwise thy the enclosing environment, if a
  // variable doesn't exist at the global level, a runtime error is thrown
  assign(name: Token, value: ObjectType): void {
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
  define(name: string, value: Nullable<ObjectType>): void {
    this.values[name] = value;
  }
}
