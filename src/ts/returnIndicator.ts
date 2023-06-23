// not really an error/exception, it is an indicator that a return 
// statement was hit so that unwinding the stack to the point before

import { Nullable, ObjectType } from "./types";

// the call is easier
export default class ReturnIndicator extends Error {
  readonly value: Nullable<ObjectType>;

  constructor(value: Nullable<ObjectType>) {
    super();
    this.value = value;
  }
}
