import { ObjectType } from "./types";

export enum TokenType {
	// Single-character tokens.
	LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
	COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,

	// One or two character tokens.
	BANG, BANG_EQUAL,
	EQUAL, EQUAL_EQUAL,
	GREATER, GREATER_EQUAL,
	LESS, LESS_EQUAL,

	// Literals.
	IDENTIFIER, STRING, NUMBER,

	// Keywords.
	AND, CLASS, ELSE, FALSE, FUN, FOR, IF, NIL, OR,
	PRINT, RETURN, SUPER, THIS, TRUE, VAR, WHILE,

	EOF
}

export class Token {
  type: TokenType; lexeme: string; literal: ObjectType; line: number;
  
  // the type is an enum, and can be a value like CLASS or FUNCTION
  // the lexeme is the substring the token was extracted from
  // the literal is the actual evaluation of the lexeme as js/ts object
  // the line is the line number the token was found in
  // NOTE most tokens will not have a literal, so null is an option
  constructor(type: TokenType, lexeme: string,
              literal: ObjectType, line: number) {
		this.type = type;
		this.lexeme = lexeme;
		this.literal = literal;
		this.line = line;
  }
  
  toString() {
    // by default, the string of an enum is its indexing number
    const tokenTypeString = TokenType[this.type];

    return tokenTypeString + " " + this.lexeme + " " + this.literal;
  }
}
