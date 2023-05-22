"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO interactive mode
const fs = __importStar(require("fs"));
const Scanner_1 = require("./Scanner");
// import { Token } from './Token';
let hadError = false;
let hadRuntimeError = false;
// runs (scans, parses) a given string, can be either a text file
// or a line entered from the interactive prompt
function run(source) {
    const scanner = new Scanner_1.Scanner(source);
    const { tokens, errors } = scanner.scan();
    // print errors, if any exist, and raise the hadError flag
    if (errors.length > 0) {
        hadError = true;
        for (const error of errors) {
            const str = '' + error;
            console.log(str);
        }
    }
    else {
        // For now, just print the tokens.
        // tokens.forEach(token => console.log(token));
        for (const token of tokens) {
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
}
else {
    // execute the program given the file path
    const pathString = Buffer.from(args[2], 'utf8');
    const contentString = fs.readFileSync(pathString).toString();
    run(contentString);
}
