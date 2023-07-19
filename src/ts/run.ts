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
 * returns a tuple with the console output and whether there was an error or not
 */
export default function run(source: string): [string, boolean] {
  // the resulting output string, can be from the execution of the program or
  // the language error messages (other errors are thrown immediately)
  let output: string = '';

  // scanning
  const scanner = new Scanner(source);
  let tokens: Token[];
  try {
    tokens = scanner.scan();
  } catch(errors: unknown) {
    // if an array of errors is caught, then it must be from the scanner
    // otherwise, a js error was thrown and something is wrong with the code
    if (Array.isArray(errors)) {
      output += 'Scanning errors exist -\n';
      for (const error of errors)
        output += `\n${error.toString()}\n`;
    } else throw errors;

    return [output, true];
  }

  // parsing
  const parser = new Parser(tokens);
  let program: Stmt[]; 
  try {
    program = parser.parse();
  } catch(errors: unknown) {
    if (Array.isArray(errors)) {
      output += 'Parsing errors exist -\n';
      for (const error of errors)
        output += `\n${error.toString()}\n`;
    } else throw errors;

    return [output, true];
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
      output += 'Type checking errors exist -\n';
      for (const error of errors) {
        output += `\n${error.toString()}\n`;
      }
    } else throw errors;

    return [output, true];
  }
  
  // interpreting, only one error stops the program
  try {
    output += interpreter.interpret();
  } catch(error: unknown) {
    if (error instanceof LangError) {
      output += 'Runtime error -\n';
      output += '\n' + error.toString() + '\n';
    } else throw error;

    return [output, true];
  }

  return [output, false];
}
