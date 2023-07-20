// a wrapper for a map to look up values associated with variable ids

import { ImplementationError } from "./error";

export default class Environment<R> {
  private idMap: Map<string, R>; 
  readonly enclosing: Environment<R> | null;

  constructor(enclosing: Environment<R> | null) {
    this.enclosing = enclosing;
    this.idMap = new Map<string, R>;
  }

  define(id: string, value: R): void {
    this.idMap.set(id, value);
  }

  get(id: string): R | undefined {
    const maybeValue: R | undefined = this.idMap.get(id);
    if (maybeValue !== undefined) return maybeValue;
    if (this.enclosing !== null) return this.enclosing.get(id);

    // this error is to be transformed into a LangError by the caller
    // throw new Error(`Undefined variable \'${id}\'.`);
    return undefined;
  }

  assign(id: string, value: R): void {
    if (this.idMap.has(id)) {
      this.idMap.set(id, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(id, value);
      return;
    }

    // this error is to be transformed into a LangError by the caller
    throw Error('Undefined variable.');
  }

  // NOTE the following three methods are only used in LOEnvironment, but 
  // typescript thinks LOEnvironment and Environment<LangObject> are different

  // get the variable at the environment the given distance away
  getAt(distance: number, identifier: string): R {
    const maybeValue: R | undefined
      = this.ancestor(distance).idMap.get(identifier);
    if (maybeValue === undefined) {
      throw new ImplementationError(
        `Incorrect distance given for ${identifier}.`);
    }
    return maybeValue;
  }

  // assign the variable at the environment the given distance away
  assignAt(distance: number, identifier: string, value: R): void {
    this.ancestor(distance).idMap.set(identifier, value);
  }

  // get the environment the given distance away
  ancestor(distance: number): Environment<R> {
    let environment: Environment<R> = this;
    
    for (let i = 0; i < distance; i++) {
      if (environment.enclosing === null)
        throw new ImplementationError(
          'Given distance to interpreter ancestor function is too high.');
      environment = environment.enclosing;
    }

    return environment;
  }
}
