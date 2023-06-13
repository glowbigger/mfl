import Token from './token';
import { TokenType as TT } from './tokenType';
import { Nullable, Primitive } from './types';
import reportLangError from './main';

export default class Scanner {
  // the source input string, which will be assigned in the constructor
  private source: string;

  // the list of tokens which will be returned by scan()
  private tokens: Array<Token> = [];

  // these variables keep track of the position of the scanner
  // start is the starting character of the current lexeme
  // current is the current UNCONSUMED character
  // line is the current line being processed (for error reporting)
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;

  // a helper lookup object which stores the identifiers which
  // are reserved keywords
  private keywords: { [key: string]: TT } = {
    'and':    TT.AND,
    'class':  TT.CLASS,
    'else':   TT.ELSE,
    'false':  TT.FALSE,
    'for':    TT.FOR,
    'fun':    TT.FUN,
    'if':     TT.IF,
    'nil':    TT.NIL,
    'or':     TT.OR,
    'print':  TT.PRINT,
    'return': TT.RETURN,
    'super':  TT.SUPER,
    'this':   TT.THIS,
    'true':   TT.TRUE,
    'var':    TT.VAR,
    'while':  TT.WHILE,
  }

  constructor(source: string) {
    this.source = source;
    this.keywords.and;
  }

	/***********************************************************************
	 * MAIN SCANNING METHODS
	 **********************************************************************/

  // goes through the source string, adding tokens until the end of the
  // string is reached, then add an EOF token to make parsing easier
  scan(): Array<Token> {
    // scan all the tokens
		while (!this.isAtEnd()) {
			// we finished processing the last lexeme, so move the start
      // and then scan the next token
			this.start = this.current;
			this.scanToken();
		}

    // now push the EOF and return the tokens
    const endOfFileToken = new Token(TT.EOF, '', null, this.line);
    this.tokens.push(endOfFileToken);
    return this.tokens;
  }

  private scanToken(): void {
		const char = this.advance();
		// TODO why use a break?
		// hTTps://stackoverflow.com/questions/252489/why-was-the-switch-statement-designed-to-need-a-break
		switch (char) {
			/* 	SINGLE CHARACTER TOKENS:
			 *  NOTE these have no (null) literals
			 */
			case '(': this.addToken(TT.LEFT_PAREN); break;
			case ')': this.addToken(TT.RIGHT_PAREN); break;
			case '{': this.addToken(TT.LEFT_BRACE); break;
			case '}': this.addToken(TT.RIGHT_BRACE); break;
			case ',': this.addToken(TT.COMMA); break;
			case '.': this.addToken(TT.DOT); break;
			case '-': this.addToken(TT.MINUS); break;
			case '+': this.addToken(TT.PLUS); break;
			case ';': this.addToken(TT.SEMICOLON); break;
			case '*': this.addToken(TT.STAR); break; 

			/* 	POTENTIAL TWO CHARACTER TOKENS:
			 *  if the first character matches, check the second character
			 *  using match(), and add the appropriate token
			 */
			case '!':
				this.addToken(this.match('=') ? TT.BANG_EQUAL : TT.BANG);
				break;
			case '=':
				this.addToken(this.match('=') ? TT.EQUAL_EQUAL : TT.EQUAL);
				break;
			case '<':
				this.addToken(this.match('=') ? TT.LESS_EQUAL : TT.LESS);
				break;
			case '>':
				this.addToken(this.match('=') ? TT.GREATER_EQUAL : TT.GREATER);
				break;

			/* 	SINGLE-LINE COMMENTS AND DIVISION:
			 *  consume all character in the current line
			 */
			case '/':
        // if a second / is found, ignore the line because it's a comment
        // otherwise, it's a division symbol
				if (this.match('/')) {
				  // A comment goes until the end of the line.
				  while (this.peek() != '\n' && !this.isAtEnd()) this.advance();
				} else {
				  this.addToken(TT.SLASH);
				}
				break;

			// WHITESPACE AND NEW LINES:
			case ' ': 	break;
			case '\r': 	break;
			case '\t': 	break;
			case '\n':
				this.line++;
				break;

			// STRINGS
			case '"': 	this.string(); break;

			// NOTE we continue scanning after catching an invalid character
			default: 
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          reportLangError(this.line, 'Unexpected character.', false);
        }
        break;
		}
  }

	/***********************************************************************
	 * HELPER FUNCTIONS
	 **********************************************************************/

	private isAtEnd(): boolean {
		return this.current >= this.source.length;
	}

  // returns the current unconsumed character and advances the pointer
	// (like peek, but advances the pointer)
  // NOTE this is always called before checking for isAtEnd() !!!
	private advance(): string {
		return this.source.charAt(this.current++);
	}

	// returns the current unconsumed character
	// (like peek, but without advancing the pointer)
	private peek(): string {
		if (this.isAtEnd()) return '\0';
	    return this.source.charAt(this.current);
	}

  // returns the next character after current
  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

	// add a token, if no literal is given, it is null
	private addToken(type: TT, literal: Nullable<Primitive> = null): void {
		const lexeme = this.getCurrentLexeme();
		this.tokens.push(new Token(type, lexeme, literal, this.line));
	}

	// conditionally advance if the current character matches the given one
	private match(expected: string): boolean {
		if (this.isAtEnd()) return false;
		if (this.source.charAt(this.current) != expected) return false;

		this.current++;
		return true;
	}

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  // NOTE _ is considered alpha?
  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
            c == '_';
  }

  // so that identifiers can have numbers, but cannot start with numbers
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private getCurrentLexeme(): string {
    return this.source.substring(this.start, this.current);
  }

	private string(): void {
    // build the lexeme until a " is reached or the file ends
	  while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == '\n') {
        this.line++;
      }
      this.advance();
    }

    // if the file ends, throw an error and break
    if (this.isAtEnd()) {
      reportLangError(this.line, 'Unterminated string.', false);
      return;
    }

    // otherwise the closing " has been reached, so consume it
    this.advance();

    // trim surrounding quotes and create the token
    // NOTE the lexeme will include " but the literal will not
    // NOTE type String is used over string here, because String
    // is an object
    const value: string =
        this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TT.STRING, value);
	}

	private number(): void {
    // unlike string(), we don't care about eof
    // just run a pass consuming all digits, check for a .,
    // then run a second pass consuming all digits again
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // look for the fractional part
    // NOTE without isDigit(peekNext()), trailing '.'s would be supported
    // which we don't want
    if (this.peek() == '.' && this.isDigit(this.peekNext())) {
      // Consume the .
      this.advance();

      // consume digits
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // we use js's float parser here to convert the scanned lexeme
    // into the number literal
    const value: string = this.getCurrentLexeme();
    this.addToken(TT.NUMBER, parseFloat(value));
	}

  private identifier(): void {
    // extract the identifier, it will be only letters and numbers
    // NOTE since this is triggered by an isAlpha check, the identifier
    // is guaranteed to start with a letter
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }
    const text: string = this.getCurrentLexeme();

    // check if the lexeme is a keyword, if it is not, it is an IDENTIFIER
    let type: TT = this.keywords[text];
    if (type == null) type = TT.IDENTIFIER;
    this.addToken(type);
  }
}
