"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const TokenType_1 = require("./TokenType");
class Token {
    // the type is an enum, and can be a value like CLASS or FUNCTION
    // the lexeme is the substring the token was extracted from
    // the literal is the actual evaluation of the lexeme as js/ts object
    // the line is the line number the token was found in
    // NOTE most tokens will not have a literal, so null is an option
    constructor(type, lexeme, literal, line) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }
    toString() {
        // by default, the string of an enum is its indexing number
        const tokenTypeString = TokenType_1.TokenType[this.type];
        return tokenTypeString + " " + this.lexeme + " " + this.literal;
    }
}
exports.Token = Token;
