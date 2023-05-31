// a dedicated error class for language errors
// is preferred over js's native Error class because:
// 1) language errors (whether in parsing or scanning) are not js errors
// 2) js's Error contains superfluous features
// 3) are never thrown using js's throw, are just printed instead

export class LangError {

  #message:string; #where:string; #line:number;

  constructor(message:string, where:string, line:number){
    this.#message = message;
    this.#where = where;
    this.#line = line;
  }

  toString() {
    return `[line ${this.#line}] Error${this.#where}: ${this.#message}`;
  }

}
