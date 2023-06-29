import { readFileSync } from 'fs';
import Scanner from './scanner';
import { Token } from './token';
import Parser from './parser';
import { Expr } from './expr';
import { ParseError } from './langError';

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
    const prompt = require("prompt-sync")({ sigint: true });
    console.log("Interactive mode started (Ctrl-c to exit):");
    while (true) {
      const input: string = prompt("> ");
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
 *
 * @param source - the source code to run
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
      for (const error of errors) {
        console.log("" + error);
      }
    } else {
      console.log("Native Javascript error:");
      console.log(errors);
    }
    return;
  }
  // console.log('\nTokens:');
  // console.log(tokens)

  // parsing
  const parser = new Parser(tokens);
  let expr: Expr | null;
  try {
    expr = parser.parse();
  } catch(errors: unknown) {
    if (errors instanceof ParseError) {
      console.log(errors);
    } else {
      console.log("Native Javascript error:");
      console.log(errors);
    }
    return;
  }
  console.log();
  console.log(expr);
  console.log();

  // type checking
  
  // interpreting
}

if (require.main === module) {
    main();
}
