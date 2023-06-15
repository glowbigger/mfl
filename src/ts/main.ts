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

  // interpret the statements
  const interpreter = new Interpreter();
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
