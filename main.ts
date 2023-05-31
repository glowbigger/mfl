// TODO interactive mode
import * as fs from 'fs';
import Scanner from './scanner';
import Parser from './parser';
import AstPrinter from './astPrinter';

// import { TokenType } from './tokenType';
// import { Token } from './token';
// import * as expr from './expr';
// import AstPrinter from './astPrinter';

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
  } else {
    // parse the tokens
    const parser = new Parser(tokens);
    const { expr, errors:parseErrors } = parser.parse();
    if (parseErrors.length > 0) {
      hadError = true;
      for(const error of parseErrors){
        const str = '' + error;
        console.log(str);
      }
    } else {
      console.log(new AstPrinter().print(expr));
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

// const expression = new expr.Binary(
//         new expr.Unary(
//             new Token(TokenType.MINUS, "-", null, 1),
//             new expr.Literal(123)),
//         new Token(TokenType.STAR, "*", null, 1),
//         new expr.Grouping(
//             new expr.Literal(45.67)));

// console.log(new AstPrinter().print(expression));
