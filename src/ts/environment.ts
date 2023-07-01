// a wrapper for a map to look up values associated with variable ids

import { LangObject, LangObjectType } from "./types";

abstract class Environment<R> {
  private idMap: Map<string, R>; 
  private readonly enclosing: Environment<R> | null;

  constructor(enclosing: Environment<R> | null) {
    this.enclosing = enclosing;
    this.idMap= new Map<string, R>;
  }

  define(id: string, value: R): void {
    this.idMap.set(id, value);
  }

  get(id: string): R {
    const maybeValue: R | undefined = this.idMap.get(id);
    if (maybeValue !== undefined) return maybeValue;
    if (this.enclosing !== null) return this.enclosing.get(id);

    // this error is to be transformed into a LangError by the caller
    throw new Error('Undefined variable.');
  }

  assign(id: string, value: R): void {
    if (this.idMap.has(id)) {
      this.idMap.set(id, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(id, value);
    }

    // this error is to be transformed into a LangError by the caller
    throw Error('Undefined variable.');
  }

  has(id: string): boolean {
    return this.idMap.has(id);
  }
}

export class LOEnvironment extends Environment<LangObject> {
}

export class TypeEnvironment extends Environment<LangObjectType> {
}
