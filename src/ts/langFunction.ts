import Callable from "./callable";
import Environment from "./environment";
import { Interpreter } from "./interpreter";
import ReturnIndicator from "./returnIndicator";
import { Fun } from "./stmt";
import { ObjectType } from "./types";

export default class LangFunction implements Callable {
  private readonly declaration: Fun;
  // the surrounding environment, which must be kept
  // https://en.wikipedia.org/wiki/Closure_(computer_programming)
  private readonly closure: Environment;

  constructor(declaration: Fun, closure: Environment) {
    this.closure = closure;
    this.declaration = declaration;
  }

  call( interpreter: Interpreter,
        args: Array<ObjectType>): ObjectType {

    // each function has its own environment, which is taken
    // from the surrounding environment, which is what a closure is
    const environment: Environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme,
          args[i]);
    }

    // a return indicator is an error that is used just so that if
    // a return statement is hit, then unwinding the stack to the point
    // before the call is done easily by simply catching the error
    try { 
      interpreter.executeBlock(this.declaration.body, environment);
    } catch(error) {
      if (error instanceof ReturnIndicator) {
        return error.value;
      } else {
        // this should not ever happen, but just in case
        console.log("(you shouldn't ever get this, something went wrong)");
        console.log("There was a native error thrown while trying"
                    + "to catch a return statement.");
        console.log(error);
        process.exit(1);
      }
    }
    return null;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  toString(): string {
    return "<fn " + this.declaration.name.lexeme + ">";
  }
}
