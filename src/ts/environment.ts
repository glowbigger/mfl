// a wrapper for a map to look up values associated with variable identifiers

import { LangObject, LangObjectType } from "./types";

abstract class Environment<R> {
  private identifiersMap: Map<string, R>; 

  constructor() {
    this.identifiersMap = new Map<string, R>;
  }

  define(identifier: string, value: R): void {
    this.identifiersMap.set(identifier, value);
  }

  get(identifier: string): R | undefined {
    // NOTE returns undefined so that the caller can throw the error
    return this.identifiersMap.get(identifier);
  }

  assign(identifier: string, value: R): void {
    if (this.identifiersMap.has(identifier)) {
      this.identifiersMap.set(identifier, value);
      return;
    }

    // this error is to be transformed into a LangError
    throw Error('Undefined variable.');
  }

  has(identifier: string): boolean {
    return this.identifiersMap.has(identifier);
  }
}

export class ValueEnvironment extends Environment<LangObject> {
}

export class TypeEnvironment extends Environment<LangObjectType> {
}
