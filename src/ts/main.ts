import { readFileSync } from 'fs';
import Scanner from './scanner';
import { Token } from './token';
import Parser from './parser';
import TypeValidator from './typeValidator';
import Interpreter from './interpreter';
import { Stmt } from './stmt';
import Resolver from './resolver';

/**
 * the main method, runs a given file or, if no arguments are given,
 * runs an interactive prompt
 */
function main(): void {
  // ignore the first two elements of args, which are node and the script path
  const args: string[] = process.argv.slice(2);

  // if no arguments are given, run in interactive mode
  // if an argument is given, 
  if (args.length === 0) {
    const prompt = require('prompt-sync')({ sigint: true });
    console.log('Interactive mode started (Ctrl-c to exit):');
    while (true) {
      const input: string = prompt('> ');
      run(input);
    }
  } else if (args.length === 1) {
    const filePath: string = args[0];
    const contentBuffer = Buffer.from(filePath, 'utf8')
    const contentString = readFileSync(contentBuffer).toString();
    run(contentString);
  } else {
    console.log('mfl: enter a file name or none for interactive mode.');
  }
}

/**
 * runs (scans, parses, etc.) a given string, which can be either a text 
 * file or a line entered from the interactive prompt
 */
function run(source: string): void {
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
  
  // interpreting
  try {
    console.log(interpreter.interpret());
  } catch(errors: unknown) {
    if (Array.isArray(errors)) {
      console.log('Runtime errors exist -');

      for (const error of errors) {
        console.log();
        console.log(error.toString());
      }
    } else {
      console.log(errors);
    }
    return;
  }
}

if (require.main === module) {
  main();
}
