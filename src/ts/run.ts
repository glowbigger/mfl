import Scanner from './scanner';
import { Token } from './token';
import Parser from './parser';
import TypeValidator from './typeValidator';
import Interpreter from './interpreter';
import { Stmt } from './stmt';
import Resolver from './resolver';
import { LangError } from './error';

/**
 * runs (scans, parses, etc.) a given string, which can be either a text file or
 * a line entered from the interactive prompt
 */
export default function run(source: string): void {
  // scanning
  const scanner = new Scanner(source);
  let tokens: Token[];
  try {
    tokens = scanner.scan();
  } catch(errors: unknown) {
    // if an array of errors is caught, then it must be from the scanner
    // otherwise, a js error was thrown and something is wrong with the code
    if (Array.isArray(errors)) {
      console.log('Scanning errors exist -');
      for (const error of errors) {
        console.log();
        console.log(error.toString());
      }
    } else {
      console.log(errors);
    }
    return;
  }

  // parsing
  const parser = new Parser(tokens);
  let program: Stmt[]; 
  try {
    program = parser.parse();
  } catch(errors: unknown) {
    if (Array.isArray(errors)) {
      console.log('Parsing errors exist -');

      for (const error of errors) {
        console.log();
        console.log(error.toString());
      }
    } else {
      console.log(errors);
    }
    return;
  }

  // resolving
  const interpreter = new Interpreter(program);
  const resolver = new Resolver(interpreter);
  resolver.resolveProgram(program);

  // type checking
  const typeValidator = new TypeValidator(program);
  try {
    typeValidator.validateProgram();
  } catch(errors: unknown) {
    if (Array.isArray(errors)) {
      console.log('Type checking errors exist -');

      for (const error of errors) {
        console.log();
        console.log(error.toString());
      }
    } else {
      console.log(errors);
    }
    return;
  }
  
  // interpreting, only one error stops the program
  try {
    console.log(interpreter.interpret());
  } catch(error: unknown) {
    if (error instanceof LangError) {
      console.log('Runtime error -');
      console.log();
      console.log(error.toString());
    } else {
      console.log(error);
    }
    return;
  }
}
