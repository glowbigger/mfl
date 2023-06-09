// TODO interactive mode
import * as fs from 'fs';
import Scanner from './scanner';
import Parser from './parser';
import AstPrinter from './astPrinter';
import { RuntimeError, Interpreter } from './interpreter';
import { Nullable } from './types';
import { Expr } from './expr';

let hadError = false;
let hadRuntimeError = false;

// runs (scans, parses) a given string, can be either a text file
// or a line entered from the interactive prompt
function run(source:string) {
  const scanner = new Scanner(source);
  const { tokens, errors: scanErrors } = scanner.scan();

  // print errors, if any exist, and raise the hadError flag
  if (scanErrors.length > 0) {
    hadError = true;

    for(const error of scanErrors){
      const str = '' + error;
      console.log(str);
    }
    process.exit(1);
  } else {
    // parse the tokens
    const parser = new Parser(tokens);
    let { expr, errors:parseErrors } = parser.parse();

    // if there were any parsing errors, print them and exit
    if (parseErrors.length > 0) {
      hadError = true;

      for(const error of parseErrors){
        const str = '' + error;
        console.log(str);
        process.exit(1);
      }
    } else {
      // interpret the tokens
      // console.log(new AstPrinter().print(expr));
      const interpreter = new Interpreter();
      
      // if there were no parsing errors, then expr is definitely not null
      expr = expr as Expr;
      const error: Nullable<RuntimeError> = interpreter.interpret(expr);
      if (error) {
        console.log("[line " + error.token.line + "] Error: "
          + error.message);
        process.exit(1);
      }
    }
  }
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
