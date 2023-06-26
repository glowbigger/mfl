import * as fs from 'fs';
import Scanner from './scanner';
import Parser from './parser';
import { Interpreter } from './interpreter';
import { Token } from './token';
import { TokenType as TT } from './token';
import Resolver from './resolver';

let hadSyntaxError = false;
let hadRuntimeError = false;

// allows the scanner, parser and interpreter to report errors
export default function reportLangError(lineOrToken: number | Token,
                                    message: string,
                                    isRuntimeError: boolean) {
  if (isRuntimeError) {
    hadRuntimeError = true;
  } else {
    hadSyntaxError = true;
  }
  if (typeof(lineOrToken) === "string") {
    console.log(`[line ${lineOrToken}] Error: ${message}`);
  } else {
    const token: Token = lineOrToken as Token;
    if (token.type == TT.EOF) {
      console.log("[line " + token.line + " at end]" + message);
    } else {
      console.log("[line " + token.line + " at '" +
        token.lexeme + "'] " + message);
    }
  }
}

function runFile(source: string) {
  const pathString = Buffer.from(source, 'utf8')
  const contentString = fs.readFileSync(pathString).toString();

  run(contentString);
  if (hadSyntaxError || hadRuntimeError) {
    console.log("Exiting with errors.");
    process.exit(1);
  }
}

// runs (scans, parses) a given string, can be either a text file
// or a line entered from the interactive prompt
function run(source: string) {
  // scan the characters
  const scanner = new Scanner(source);
  const tokens = scanner.scan();

  // parse the tokens
  const parser = new Parser(tokens)
  const statements = parser.parse();

  // resolve the variables, it will pass its results to the interpreter
  const interpreter = new Interpreter();
  const resolver: Resolver = new Resolver(interpreter);
  resolver.resolveStatements(statements);

  // interpret the statements if there were no errors
  if (hadSyntaxError) return;
  interpreter.interpret(statements);
}

// MAIN SCRIPT

// run the program appropriately based on the number of arguments
// the first two elements of args will be node and mfl.js
// TODO implement the interactive mode
let args = process.argv;

if (args.length == 2) {
  // interactive mode
  const prompt = require("prompt-sync")({ sigint: true });
  console.log("Interactive mode started (Ctrl-c to exit):");
  while (true) {
    const input = prompt("> ");
    run(input);
  }
} else if (args.length === 3) {
  // execute the program given the file path
  runFile(args[2]);
} else {
  console.log('Usage: mfl [script]');
  process.exit();
}
