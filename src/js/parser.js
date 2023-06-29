"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
const expr_1 = require("./expr");
const langError_1 = require("./langError");
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
        this.errors = [];
    }
    //======================================================================
    // Parsing Methods
    //======================================================================
    parse() {
        // NOTE null is returned if and only if there are no tokens to parse
        let expr = null;
        while (!this.isAtEnd()) {
            expr = this.parseExpression();
        }
        // if (this.errors.length > 0) throw this.errors;
        return expr;
    }
    // expression     → equality ;
    parseExpression() {
        return this.parseEquality();
    }
    // equality       → comparison ( ( "!=" | "==" ) comparison )* ;
    parseEquality() {
        return this.parseBinary(() => this.parseComparison(), 'BANG_EQUAL', 'EQUAL_EQUAL');
    }
    // comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
    parseComparison() {
        return this.parseBinary(() => this.parseTerm(), 'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL');
    }
    // term           → factor ( ( "-" | "+" ) factor )* ;
    parseTerm() {
        return this.parseBinary(() => this.parseFactor(), 'MINUS', 'PLUS');
    }
    // factor         → unary ( ( "/" | "*" ) unary )* ;
    parseFactor() {
        return this.parseBinary(() => this.parseUnary(), 'SLASH', 'STAR');
    }
    // unary          → ( "!" | "-" ) unary
    //                | primary ;
    parseUnary() {
        if (this.match('BANG', 'MINUS')) {
            const operator = this.consume();
            const right = this.parseUnary();
            return new expr_1.Unary(operator, right);
        }
        else {
            return this.parsePrimary();
        }
    }
    // primary        → NUMBER | STRING | "true" | "false" | "null"
    //                | "(" expression ")" ;
    parsePrimary() {
        if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE', 'NULL')) {
            return new expr_1.Literal(this.consume().literal);
        }
        if (this.match('LEFT_PAREN')) {
            // skip the (
            this.consume();
            const primaryExpr = this.parseExpression();
            this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
            return new expr_1.Grouping(primaryExpr);
        }
        throw new langError_1.ParseError('Expect expression within parentheses.', this.peek());
    }
    // equality, comparison, term, factor have the same syntax, so they share code
    parseBinary(innerFunction, ...matchTypes) {
        let expr = innerFunction();
        while (this.match(...matchTypes)) {
            const left = expr;
            const operator = this.consume();
            const right = innerFunction();
            expr = new expr_1.Binary(left, operator, right);
        }
        return expr;
    }
    //======================================================================
    // Helpers
    //======================================================================
    peek() {
        return this.tokens[this.currentIndex];
    }
    consume() {
        return this.tokens[this.currentIndex++];
    }
    // conditionally advance if the current token has the given token type,
    // otherwise throws an error with the given message
    expect(tokenType, message) {
        if (this.peek().type === tokenType)
            return this.consume();
        throw new langError_1.ParseError('Expect closing \')\'.', this.peek());
    }
    // returns whether the current token's type matches the given token type
    match(...types) {
        // NOTE better to not have the below line and find implementation errors
        // if (this.isAtEnd()) return false;
        for (const type of types) {
            if (this.peek().type === type) {
                return true;
            }
        }
        return false;
    }
    // checks if there are no more tokens to consume
    isAtEnd() {
        return this.peek() === token_1.EOF_TOKEN;
    }
}
exports.default = Parser;
