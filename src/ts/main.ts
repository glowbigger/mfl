import { readFileSync } from 'fs';
import Scanner from './scanner';
import { Token } from './token';
import Parser from './parser';
import { Expr } from './expr';
import { LangErrorPrinter, LangError } from './error';
import Printer from './printer';
import TypeChecker from './typeChecker';

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
      const errorPrinter = new LangErrorPrinter(source);
      for (const error of errors) {
        console.log();
        console.log(errorPrinter.print(error));
      }
    } else {
      console.log(errors);
    }
    return;
  }

  // parsing
  const parser = new Parser(tokens);
  let expr: Expr | null;
  try {
    expr = parser.parse();
  } catch(errors: unknown) {
    if (errors instanceof LangError) {
      console.log('Parsing errors exist -');
      const errorPrinter = new LangErrorPrinter(source);
      console.log();
      console.log(errorPrinter.print(errors));
    } else {
      console.log(errors);
    }
    return;
  }

  // printing (remove later)
  if (expr == null) {
    console.log(); 
    return;
  }
  const printer: Printer = new Printer();
  console.log('Syntax tree:');
  const exprString: string = printer.print(expr);
  console.log();
  console.log(exprString);
  console.log();

  // type checking
  const typeChecker = new TypeChecker(expr);
  try {
    typeChecker.validate(expr);
  } catch(errors: unknown) {
    if (errors instanceof LangError) {
      console.log('Type checking errors exist -');
      const errorPrinter = new LangErrorPrinter(source);
      console.log();
      console.log(errorPrinter.print(errors));
    } else {
      console.log(errors);
    }
  }
  
  // interpreting
}

if (require.main === module) {
  main();
}
