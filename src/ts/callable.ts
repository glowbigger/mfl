import { Interpreter } from "./interpreter";
import { ObjectType } from "./types";

type Callable = {
  arity(): number;
  call(interpreter: Interpreter, args: Array<ObjectType>): ObjectType;
  toString(): string;
};

export default Callable;
