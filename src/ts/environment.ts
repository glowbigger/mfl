// a wrapper for a map to look up values associated with variable identifiers

import { LangObject, LangObjectType } from "./types";

abstract class Environment<R> {
  private identifiersMap: Map<string, R>; 

  constructor() {
    this.identifiersMap = new Map<string, R>;
  }

  define(identifier: string, value: R): void {
    this.identifiersMap .set(identifier, value);
  }

  get(identifier: string): R | undefined {
    // NOTE returns undefined so that the caller can throw the error
    return this.identifiersMap.get(identifier);
  }
}

export class ValueEnvironment extends Environment<LangObject> {
}

export class TypeEnvironment extends Environment<LangObjectType> {
}
