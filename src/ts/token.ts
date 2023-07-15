export class Token {
  type: TokenType; lexeme: string; value: TokenValue;
  lineString: string; lineIndex: number; column: number;
  
  constructor(type: TokenType, lexeme: string, value: TokenValue, 
              lineString: string, lineIndex: number, column: number) {
		this.type = type;
		this.lexeme = lexeme;
		this.value = value;
		this.lineString = lineString;
		this.lineIndex = lineIndex;
    this.column = column;
  }
  
  toString() {
    const tokenTypeString: string = this.type;
    return tokenTypeString + ' ' + this.lexeme + ' ' + this.value;
  }
}

export type TokenType = 
  // single character tokens
	'LEFT_PAREN' |
	'RIGHT_PAREN' |
	'LEFT_BRACE' |
	'RIGHT_BRACE' |
	'LEFT_BRACKET' |
	'RIGHT_BRACKET' |
	'COMMA' |
	'DOT' |
	'MINUS' |
	'PLUS' |
	'SEMICOLON' |
	'SLASH' |
	'STAR' |
	'COLON' |

	// one or two character tokens
	'BANG' |
	'BANG_EQUAL' |
	'EQUAL' |
	'EQUAL_EQUAL' |
	'GREATER' |
	'GREATER_EQUAL' |
	'LESS' |
	'LESS_EQUAL' |
	'RIGHTARROW' |

	// literals
	'IDENTIFIER' |
	'STRING' |
	'NUMBER' |

	// keywords
	'AND' |
	'BREAK' |
	'ELSE' |
	'FALSE' |
	'FUNCTION' |
	'FOR' |
	'IF' |
	'OR' |
	'PRINT' |
	'RETURN' |
	'THEN' |
	'TRUE' |
	'LET' |
	'VOID' |
	'WHILE' |

  // primitive type
  'NUMBER_PRIMITIVE_TYPE' |
  'STRING_PRIMITIVE_TYPE' |
  'BOOL_PRIMITIVE_TYPE' |

  // end of file
	'EOF';

// token literals have values, ie the token for "string" has the value "string"
// NOTE null indicates that a token has no value / is not a literal
export type TokenValue = number | string | boolean | null;
