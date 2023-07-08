import { TokenValue } from './types';

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
