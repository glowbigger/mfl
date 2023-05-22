"use strict";
// TODO source.substring(start, current) should be a function
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Scanner_instances, _Scanner_source, _Scanner_tokens, _Scanner_errors, _Scanner_start, _Scanner_current, _Scanner_line, _Scanner_keywords, _Scanner_scanToken, _Scanner_isAtEnd, _Scanner_advance, _Scanner_peek, _Scanner_peekNext, _Scanner_addToken, _Scanner_match, _Scanner_isDigit, _Scanner_isAlpha, _Scanner_isAlphaNumeric, _Scanner_string, _Scanner_number, _Scanner_identifier;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const LangError_1 = require("./LangError");
const Token_1 = require("./Token");
const TokenType_1 = require("./TokenType");
class Scanner {
    constructor(source) {
        _Scanner_instances.add(this);
        // the source input string, which will be assigned in the constructor
        _Scanner_source.set(this, void 0);
        // the list of tokens which will be returned by scan()
        _Scanner_tokens.set(this, []);
        // the list of Errors encountered which will also be returned by scan()
        _Scanner_errors.set(this, []);
        // these variables keep track of the position of the scanner
        // start is the starting character of the current lexeme
        // current is the current UNCONSUMED character
        // line is the current line being processed (for error reporting)
        _Scanner_start.set(this, 0);
        _Scanner_current.set(this, 0);
        _Scanner_line.set(this, 1);
        // a helper lookup object which stores the identifiers which
        // are reserved keywords
        _Scanner_keywords.set(this, {
            'and': TokenType_1.TokenType.AND,
            'class': TokenType_1.TokenType.CLASS,
            'else': TokenType_1.TokenType.ELSE,
            'false': TokenType_1.TokenType.FALSE,
            'for': TokenType_1.TokenType.FOR,
            'fun': TokenType_1.TokenType.FUN,
            'if': TokenType_1.TokenType.IF,
            'nil': TokenType_1.TokenType.NIL,
            'or': TokenType_1.TokenType.OR,
            'print': TokenType_1.TokenType.PRINT,
            'return': TokenType_1.TokenType.RETURN,
            'super': TokenType_1.TokenType.SUPER,
            'this': TokenType_1.TokenType.THIS,
            'true': TokenType_1.TokenType.TRUE,
            'var': TokenType_1.TokenType.VAR,
            'while': TokenType_1.TokenType.WHILE,
        });
        __classPrivateFieldSet(this, _Scanner_source, source, "f");
        __classPrivateFieldGet(this, _Scanner_keywords, "f").and;
    }
    /*
     * MAIN METHOD
   * (the only public method)
     */
    // goes through the source string, adding tokens until the end of the
    // string is reached, then add an EOF token to make parsing easier
    scan() {
        // scan all the tokens
        while (!__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this)) {
            // we finished processing the last lexeme, so move the start
            // and then scan the next token
            __classPrivateFieldSet(this, _Scanner_start, __classPrivateFieldGet(this, _Scanner_current, "f"), "f");
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_scanToken).call(this);
        }
        // now push the EOF and return the tokens
        const endOfFileToken = new Token_1.Token(TokenType_1.TokenType.EOF, '', null, __classPrivateFieldGet(this, _Scanner_line, "f"));
        __classPrivateFieldGet(this, _Scanner_tokens, "f").push(endOfFileToken);
        return { tokens: __classPrivateFieldGet(this, _Scanner_tokens, "f"), errors: __classPrivateFieldGet(this, _Scanner_errors, "f") };
    }
}
exports.Scanner = Scanner;
_Scanner_source = new WeakMap(), _Scanner_tokens = new WeakMap(), _Scanner_errors = new WeakMap(), _Scanner_start = new WeakMap(), _Scanner_current = new WeakMap(), _Scanner_line = new WeakMap(), _Scanner_keywords = new WeakMap(), _Scanner_instances = new WeakSet(), _Scanner_scanToken = function _Scanner_scanToken() {
    var _a;
    const char = __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
    // TODO why use a break?
    // hTTps://stackoverflow.com/questions/252489/why-was-the-switch-statement-designed-to-need-a-break
    switch (char) {
        /* 	SINGLE CHARACTER TOKENS:
         *  NOTE these have no (null) literals
         */
        case '(':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.LEFT_PAREN);
            break;
        case ')':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.RIGHT_PAREN);
            break;
        case '{':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.LEFT_BRACE);
            break;
        case '}':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.RIGHT_BRACE);
            break;
        case ',':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.COMMA);
            break;
        case '.':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.DOT);
            break;
        case '-':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.MINUS);
            break;
        case '+':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.PLUS);
            break;
        case ';':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.SEMICOLON);
            break;
        case '*':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.STAR);
            break;
        /* 	POTENTIAL TWO CHARACTER TOKENS:
         *  if the first character matches, check the second character
         *  using match(), and add the appropriate token
         */
        case '!':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_match).call(this, '=') ? TokenType_1.TokenType.BANG_EQUAL : TokenType_1.TokenType.BANG);
            break;
        case '=':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_match).call(this, '=') ? TokenType_1.TokenType.EQUAL_EQUAL : TokenType_1.TokenType.EQUAL);
            break;
        case '<':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_match).call(this, '=') ? TokenType_1.TokenType.LESS_EQUAL : TokenType_1.TokenType.LESS);
            break;
        case '>':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_match).call(this, '=') ? TokenType_1.TokenType.GREATER_EQUAL : TokenType_1.TokenType.GREATER);
            break;
        /* 	SINGLE-LINE COMMENTS AND DIVISION:
         *  consume all character in the current line
         */
        case '/':
            // if a second / is found, ignore the line because it's a comment
            // otherwise, it's a division symbol
            if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_match).call(this, '/')) {
                // A comment goes until the end of the line.
                while (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this) != '\n' && !__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this))
                    __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
            }
            else {
                __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.SLASH);
            }
            break;
        // WHITESPACE AND NEW LINES:
        case ' ': break;
        case '\r': break;
        case '\t': break;
        case '\n':
            __classPrivateFieldSet(this, _Scanner_line, (_a = __classPrivateFieldGet(this, _Scanner_line, "f"), _a++, _a), "f");
            break;
        // STRINGS
        case '"':
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_string).call(this);
            break;
        // NOTE we continue scanning after catching an invalid character
        default:
            if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isDigit).call(this, char)) {
                __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_number).call(this);
            }
            else if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAlpha).call(this, char)) {
                __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_identifier).call(this);
            }
            else {
                __classPrivateFieldGet(this, _Scanner_errors, "f").push(new LangError_1.LangError('Unexpected character.', '', __classPrivateFieldGet(this, _Scanner_line, "f")));
            }
            break;
    }
}, _Scanner_isAtEnd = function _Scanner_isAtEnd() {
    return __classPrivateFieldGet(this, _Scanner_current, "f") >= __classPrivateFieldGet(this, _Scanner_source, "f").length;
}, _Scanner_advance = function _Scanner_advance() {
    var _a, _b;
    return __classPrivateFieldGet(this, _Scanner_source, "f").charAt((__classPrivateFieldSet(this, _Scanner_current, (_b = __classPrivateFieldGet(this, _Scanner_current, "f"), _a = _b++, _b), "f"), _a));
}, _Scanner_peek = function _Scanner_peek() {
    if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this))
        return '\0';
    return __classPrivateFieldGet(this, _Scanner_source, "f").charAt(__classPrivateFieldGet(this, _Scanner_current, "f"));
}, _Scanner_peekNext = function _Scanner_peekNext() {
    if (__classPrivateFieldGet(this, _Scanner_current, "f") + 1 >= __classPrivateFieldGet(this, _Scanner_source, "f").length)
        return '\0';
    return __classPrivateFieldGet(this, _Scanner_source, "f").charAt(__classPrivateFieldGet(this, _Scanner_current, "f") + 1);
}, _Scanner_addToken = function _Scanner_addToken(type, literal = null) {
    const lexeme = __classPrivateFieldGet(this, _Scanner_source, "f").substring(__classPrivateFieldGet(this, _Scanner_start, "f"), __classPrivateFieldGet(this, _Scanner_current, "f"));
    __classPrivateFieldGet(this, _Scanner_tokens, "f").push(new Token_1.Token(type, lexeme, literal, __classPrivateFieldGet(this, _Scanner_line, "f")));
}, _Scanner_match = function _Scanner_match(expected) {
    var _a;
    if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this))
        return false;
    if (__classPrivateFieldGet(this, _Scanner_source, "f").charAt(__classPrivateFieldGet(this, _Scanner_current, "f")) != expected)
        return false;
    __classPrivateFieldSet(this, _Scanner_current, (_a = __classPrivateFieldGet(this, _Scanner_current, "f"), _a++, _a), "f");
    return true;
}, _Scanner_isDigit = function _Scanner_isDigit(c) {
    return c >= '0' && c <= '9';
}, _Scanner_isAlpha = function _Scanner_isAlpha(c) {
    return (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        c == '_';
}, _Scanner_isAlphaNumeric = function _Scanner_isAlphaNumeric(c) {
    return __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAlpha).call(this, c) || __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isDigit).call(this, c);
}, _Scanner_string = function _Scanner_string() {
    var _a;
    // build the lexeme until a " is reached or the file ends
    while (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this) != '"' && !__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this)) {
        if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this) == '\n') {
            __classPrivateFieldSet(this, _Scanner_line, (_a = __classPrivateFieldGet(this, _Scanner_line, "f"), _a++, _a), "f");
        }
        __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
    }
    // if the file ends, throw and error and break
    if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAtEnd).call(this)) {
        __classPrivateFieldGet(this, _Scanner_errors, "f").push(new LangError_1.LangError('Unterminated string', '', __classPrivateFieldGet(this, _Scanner_line, "f")));
        return;
    }
    // otherwise the closing " has been reached, so consume it
    __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
    // trim surrounding quotes and create the token
    // NOTE the lexeme will include " but the literal will not
    // NOTE type String is used over string here, because String
    // is an object
    const value = __classPrivateFieldGet(this, _Scanner_source, "f").substring(__classPrivateFieldGet(this, _Scanner_start, "f") + 1, __classPrivateFieldGet(this, _Scanner_current, "f") - 1);
    __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.STRING, value);
}, _Scanner_number = function _Scanner_number() {
    // unlike string(), we don't care about eof
    // just run a pass consuming all digits, check for a .,
    // then run a second pass consuming all digits again
    while (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isDigit).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this))) {
        __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
    }
    // look for the fractional part
    // NOTE without isDigit(peekNext()), trailing '.'s would be supported
    // which we don't want
    if (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this) == '.' && __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isDigit).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peekNext).call(this))) {
        // Consume the .
        __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
        // consume digits
        while (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isDigit).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this))) {
            __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
        }
    }
    // we use js's float parser here to convert the scanned lexeme
    // into the number literal
    const value = __classPrivateFieldGet(this, _Scanner_source, "f").substring(__classPrivateFieldGet(this, _Scanner_start, "f"), __classPrivateFieldGet(this, _Scanner_current, "f"));
    __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, TokenType_1.TokenType.NUMBER, parseFloat(value));
}, _Scanner_identifier = function _Scanner_identifier() {
    // extract the identifier, it will be only letters and numbers
    // NOTE since this is triggered by an isAlpha check, the identifier
    // is guaranteed to start with a letter
    while (__classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_isAlphaNumeric).call(this, __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_peek).call(this))) {
        __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_advance).call(this);
    }
    const text = __classPrivateFieldGet(this, _Scanner_source, "f").substring(__classPrivateFieldGet(this, _Scanner_start, "f"), __classPrivateFieldGet(this, _Scanner_current, "f"));
    // check if the lexeme is a keyword, if it is not, it is an IDENTIFIER
    let type = __classPrivateFieldGet(this, _Scanner_keywords, "f")[text];
    if (type == null)
        type = TokenType_1.TokenType.IDENTIFIER;
    __classPrivateFieldGet(this, _Scanner_instances, "m", _Scanner_addToken).call(this, type);
};
