import { LangObject } from "./langObject";

// indicates a break to be thrown in a loop
export class BreakIndicator { }

// indicates a return value to be thrown in a function
export class ReturnIndicator { 
  value: LangObject| null

  constructor(value: LangObject | null) {
    this.value = value;
  }
}
