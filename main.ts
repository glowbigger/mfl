// TODO interactive mode
import * as fs from 'fs';
import { Scanner } from './Scanner';
// import { Token } from './Token';

let hadError = false;
let hadRuntimeError = false;

// runs (scans, parses) a given string, can be either a text file
// or a line entered from the interactive prompt
function run(source:string) {
  const scanner = new Scanner(source);
  const { tokens, errors } = scanner.scan();

  // print errors, if any exist, and raise the hadError flag
  if (errors.length > 0) {
    hadError = true;
    for(const error of errors ){
      const str = '' + error;
      console.log(str);
    }
  } else {
    // For now, just print the tokens.
    // tokens.forEach(token => console.log(token));
    for(const token of tokens){
      const str = '' + token;
      console.log(str);
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
