import * as fs from 'fs';
import Scanner from './scanner';
import Parser from './parser';
import { Interpreter } from './interpreter';

let hadSyntaxError = false;
let hadRuntimeError = false;

// allows the scanner, parser and interpreter to report errors
export default function reportLangError(line: number,
                                    message: string,
                                    isRuntimeError: boolean) {
  if (isRuntimeError) {
    hadRuntimeError = true;
  } else {
    hadSyntaxError = true;
  }
  console.log(`[line ${line}] Error: ${message}`);
}

// runs (scans, parses) a given string, can be either a text file
// or a line entered from the interactive prompt
function run(source: string) {
  // scan the characters
  const scanner = new Scanner(source);
  const tokens = scanner.scan();
  if (hadSyntaxError) {
    console.log("Exiting with scanning errors.");
    process.exit(1);
  }

  // parse the tokens
  const parser = new Parser(tokens)
  const statements = parser.parse();
  if (hadSyntaxError) {
    console.log("Exiting with parsing errors.");
    process.exit(1);
  }

  // interpret the statements
  const interpreter = new Interpreter();
  interpreter.interpret(statements);
  if (hadRuntimeError) {
    console.log("Exiting with runtime errors.");
    process.exit(1);
  }
      
  //     // if there were no parsing errors, then expr is definitely not null
  //     expr = expr as Expr;
  //     const error: Nullable<RuntimeError> = interpreter.interpret(expr);
  //     if (error) {
  //       console.log("[line " + error.token.line + "] Error: "
  //         + error.message);
  //       process.exit(1);
  //     }
  //   }
  // }
}

// MAIN SCRIPT

// run the program appropriately based on the number of arguments
// the first two elements of args will be node and mfl.js
// TODO implement the interactive mode
let args = process.argv;

if (args.length != 3) {
  console.log('Usage: mfl [script]');
  process.exit();
} else {
  // execute the program given the file path
  const pathString = Buffer.from(args[2], 'utf8')
  const contentString = fs.readFileSync(pathString).toString();
  run(contentString);
}
