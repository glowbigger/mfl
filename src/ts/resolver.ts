/*
 * the resolver checks that:
 * each variable resolves to the same one, no matter where and
 * when it is called
 * undefined variables are not called
 * return and break statements are called properly
 * variables are used
 * variables are not defined to be their own value
 */

import { ExprVisitor } from "./expr";
import Interpreter from "./interpreter";
import { StmtVisitor } from "./stmt";

//class Resolver implements ExprVisitor, StmtVisitor {
//  private readonly interpreter: Interpreter;
  
//  constructor(interpreter: Interpreter) {
//    this.interpreter = interpreter;
//  }

//  //======================================================================
//  // Resolving methods
//  //======================================================================


//}
