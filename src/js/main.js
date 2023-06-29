"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const scanner_1 = __importDefault(require("./scanner"));
const parser_1 = __importDefault(require("./parser"));
const langError_1 = require("./langError");
const printer_1 = __importDefault(require("./printer"));
/**
 * the main method, runs a given file or, if no arguments are given,
 * runs an interactive prompt
 */
function main() {
    // ignore the first two elements of args, which are node and the script path
    const args = process.argv.slice(2);
    // if no arguments are given, run in interactive mode
    // if an argument is given, 
    if (args.length === 0) {
        const prompt = require("prompt-sync")({ sigint: true });
        console.log("Interactive mode started (Ctrl-c to exit):");
        while (true) {
            const input = prompt("> ");
            run(input);
        }
    }
    else if (args.length === 1) {
        const filePath = args[0];
        const contentBuffer = Buffer.from(filePath, 'utf8');
        const contentString = (0, fs_1.readFileSync)(contentBuffer).toString();
        run(contentString);
    }
    else {
        console.log('mfl: enter a file name or none for interactive mode.');
    }
}
/**
 * runs (scans, parses, etc.) a given string, which can be either a text
 * file or a line entered from the interactive prompt
 *
 * @param source - the source code to run
 */
function run(source) {
    // scanning
    const scanner = new scanner_1.default(source);
    let tokens;
    try {
        tokens = scanner.scan();
    }
    catch (errors) {
        // if an array of errors is caught, then it must be from the scanner
        // otherwise, a js error was thrown and something is wrong with the code
        if (Array.isArray(errors)) {
            for (const error of errors) {
                console.log("" + error);
            }
        }
        else {
            console.log("Native Javascript error:");
            console.log(errors);
        }
        return;
    }
    // parsing
    const parser = new parser_1.default(tokens);
    let expr;
    try {
        expr = parser.parse();
    }
    catch (errors) {
        if (errors instanceof langError_1.ParseError) {
            console.log('' + errors);
        }
        else {
            console.log("Native Javascript error:");
            console.log(errors);
        }
        return;
    }
    const printer = new printer_1.default();
    if (expr === null) {
        console.log();
    }
    else {
        const exprString = printer.print(expr);
        console.log(exprString);
    }
    // type checking
    // interpreting
}
if (require.main === module) {
    main();
}
