"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EOF_TOKEN = exports.Token = void 0;
class Token {
    constructor(type, lexeme, literal, line, column) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
        this.column = column;
    }
    toString() {
        const tokenTypeString = this.type;
        return tokenTypeString + ' ' + this.lexeme + ' ' + this.literal;
    }
}
exports.Token = Token;
exports.EOF_TOKEN = new Token('EOF', '', null, -1, -1);
