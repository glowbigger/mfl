"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeError = exports.ParseError = exports.ScanError = void 0;
class LangError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
    ;
}
class ScanError extends LangError {
    constructor(message, line, column) {
        super(message);
        this.column = column;
        this.line = line;
    }
    toString() {
        return 'Scanner error at ' +
            `line ${this.line}, ` +
            `column ${this.column}:\n` +
            `${this.message}`;
    }
}
exports.ScanError = ScanError;
class ParseError extends LangError {
    constructor(message, token) {
        super(message);
        this.token = token;
    }
    toString() {
        return 'Parser error at ' +
            `line ${this.token.line}, ` +
            `column ${this.token.column}:\n` +
            `${this.message}`;
    }
}
exports.ParseError = ParseError;
class RuntimeError extends LangError {
}
exports.RuntimeError = RuntimeError;
