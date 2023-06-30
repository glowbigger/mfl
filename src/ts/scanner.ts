import { CharacterError } from './error';
import { Token, TokenType } from './token';
import { LangObject } from './types';

const EOF_CHAR: string = '\0';

const KEYWORDS = new Map<string, TokenType>([
  ["and", "AND"],
  ["else", "ELSE"],
  ["false", "FALSE"],
  ["for", "FOR"],
  ["fn", "FUNCTION"],
  ["if", "IF"],
  ["null", "NULL"],
  ["or", "OR"],
  ["print", "PRINT"],
  ["return", "RETURN"],
  ["true", "TRUE"],
  ["var", "VAR"],
  ["while", "WHILE"],
]);

export default class Scanner {
  // the source code to scan
  private readonly source: string;

  // the list of tokens to be returned after scanning
  private tokens: Token[];

  // index of the current character being scanned
  private current: number;

  // starting index of the text corresponding to the current token being scanned
  private start: number; 

  // current line being processed and the index of its starting character
  private line: number; private lineStart: number;

  // any errors encountered during scanning will be thrown all at once
  private errors: CharacterError[];

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.lineStart = 0;
    this.errors = [];
  }

  //======================================================================
  // Scanning Methods
  //======================================================================

  scan(): Token[] {
		while (!this.isAtEnd()) {
			this.scanToken();
		}

    // if there were any errors, then throw all of them (as an array)
    if (this.errors.length > 0) throw this.errors;

    // otherwise, return all of the tokens with the EOF token appended
    const endOfFileToken = 
      new Token('EOF', '', null, this.line, this.source.length + 1);
    this.tokens.push(endOfFileToken);
    return this.tokens;
  }

  private scanToken(): void {
    // update the start of the current token's text
    this.start = this.current;

		const currentChar: string = this.consume();

		switch (currentChar) {
      // text for tokens that are one character long and a part of another token
			case '(': 
        this.addToken('LEFT_PAREN'); 
        break;
			case ')': 
        this.addToken('RIGHT_PAREN'); 
        break;
			case '{': 
        this.addToken('LEFT_BRACE'); 
        break;
			case '}': 
        this.addToken('RIGHT_BRACE'); 
        break;
			case '[':
        this.addToken('LEFT_BRACKET'); 
        break;
			case ']':
        this.addToken('RIGHT_BRACKET'); 
        break;
			case ',': 
        this.addToken('COMMA'); 
        break;
			case '.': 
        this.addToken('DOT'); 
        break;
			case '-': 
        this.addToken('MINUS'); 
        break;
			case '+': 
        this.addToken('PLUS'); 
        break;
			case ';': 
        this.addToken('SEMICOLON'); 
        break;
			case '*': 
        this.addToken('STAR'); 
        break; 

      // text for tokens that may be one or two characters long
			case '!':
				this.addToken(this.consumeIfMatching('=') ? 'BANG_EQUAL' : 'BANG');
        break;
			case '=':
				this.addToken(this.consumeIfMatching('=') ? 'EQUAL_EQUAL' : 'EQUAL');
        break;
			case '<':
				this.addToken(this.consumeIfMatching('=') ? 'LESS_EQUAL' : 'LESS');
        break;
			case '>':
				this.addToken(this.consumeIfMatching('=') ? 'GREATER_EQUAL' : 'GREATER');
        break;

      // / can be a division sign or a comment
			case '/':
        // / can be either //, /*, or just /
				if (this.consumeIfMatching('/')) {
          this.scanOneLineComment();
        } else if (this.consumeIfMatching('*')) {
          this.scanMultiLineComment();
				} else {
				  this.addToken('SLASH');
				}
				break;

      // ignore whitespace
			case ' ': 	break;
			case '\r': 	break;
			case '\t': 	break;
			case '\n':  break;

      // strings start with " or '
			case '"': 
        this.scanString();
        break;
			case '\'': 
        this.scanString();
        break;

			default: 
        // if the character is a digit, then it is part of a number token,
        // if it is a letter or an underscore, it will be an identifier or a
        // keyword, and otherwise it is an invalid character
        if (this.isDigit(currentChar)) {
          this.scanNumber();
        } else if (this.isAlphaOrUnderscore(currentChar)) {
          this.scanIdentifierOrKeyword();
        } else {
          const message = `Unexpected character ${currentChar}.`;
          const column: number = (this.start - this.lineStart) + 1;
          this.addError(message, this.line, column);
        }
        break;
		}
  }

  private scanOneLineComment(): void {
    while (this.peek() != '\n' && !this.isAtEnd()) this.consume();
  }

  private scanMultiLineComment(): void {
    // starts at 1 because one /* was consumed to trigger this method
    let unpairedOpeningDelimiters = 1;

    // keep scanning characters until scanning a corresponding */ for each /*
    while (unpairedOpeningDelimiters > 0 && !this.isAtEnd()) {
      const currentChar: string = this.consume();

      // handle a potential opening delimiter
      if (currentChar === '/' && this.consumeIfMatching('*')) {
        unpairedOpeningDelimiters++;
      }
      // handle a potential closing delimiter
      if (currentChar === '*' && this.consumeIfMatching('/')) {
        unpairedOpeningDelimiters--;
      }
    }
  }

  private scanString(): void {
    // firstQuote refers to the starting ' or "
    const firstQuote: string = this.source[this.start];
    const firstQuoteLine: number = this.line;
    const firstQuoteColumn: number = (this.start - this.lineStart) + 1;

    // scan characters until a terminating " is found
    let stringLiteral = '';
    while (!this.isAtEnd() && this.peek() !== firstQuote) {
      stringLiteral += this.consume();
    }

    // if the end of the file is reached before the quote, it's an error
    if (this.isAtEnd()) {
      this.addError("Unterminated string.", firstQuoteLine, firstQuoteColumn);
      return;
    }

    // consume the final " or '
    this.consume();
    
    // create and add the token
    this.addToken('STRING', stringLiteral);
  }

  private scanNumber(): void {
    // scan all consecutive numbers
    while (this.isDigit(this.peek())) {
      this.consume();
    }

    // get the lookahead character if there is one
    let lookahead: string;
		if (this.isAtEnd(this.current + 1)) {
      // NOTE the actual value here doesn't matter as long as its a non-digit
      lookahead = EOF_CHAR;
    } else {
      lookahead = this.source[this.current + 1];
    }

    // scan the fractional part if necessary
    if (this.peek() === '.' && this.isDigit(lookahead)) {
      // Consume the .
      this.consume();

      // consume digits
      while (this.isDigit(this.peek())) {
        this.consume();
      }
    }

    const numberString: string = this.getCurrentLexeme();
    this.addToken("NUMBER", parseFloat(numberString));
  }

  private scanIdentifierOrKeyword(): void {
    while (this.isAlphaOrUnderscore(this.peek()) || this.isDigit(this.peek())) {
      this.consume();
    }
    const text: string = this.getCurrentLexeme();

    // check if the lexeme is a keyword, if it's not, it's an identifier 
    let type: TokenType | undefined = KEYWORDS.get(text);
    if (type === undefined) type = "IDENTIFIER";

    // true, false, and null have true, false and null as literal values
    if (type === 'TRUE') {
      this.addToken(type, true);
      return;
    }
    if (type === 'FALSE') {
      this.addToken(type, false);
      return;
    }
    if (type === 'NULL') {
      this.addToken(type, null);
      return;
    }

    this.addToken(type);
  }

  //======================================================================
  // Helpers
  //======================================================================

   // checks if the given index is out of the bounds of the source string,
   // if no index given, it defaults to the position of the current character
  private isAtEnd(index: number = this.current): boolean {
    // >= (as opposed to ==) is neccessary for lookahead values
		return index >= this.source.length;
  }

  // returns the current character and advances the pointer
	private consume(): string {
    const currChar: string = this.peek();
    this.current++;

    // if a new line is hit, update the line position values
    if (currChar === '\n') {
      this.line++;
      this.lineStart = this.current;
    }

    return currChar;
	}

  // peeks the current character without consuming it
	private peek(): string {
		if (this.isAtEnd()) return EOF_CHAR;
    return this.source[this.current];
	}

	// returns whether the current character matches the given one, and consumes
  // it if it does
  private consumeIfMatching(target: string): boolean {
		if (this.isAtEnd()) return false;
		if (this.source[this.current] != target) return false;

		this.consume();
		return true;
  }

  private addToken(type: TokenType, literal: LangObject = null): void {
    // get the corresponding text for the token
    const text: string = this.getCurrentLexeme();
    const column: number = (this.start - this.lineStart) + 1;

    // push the token
    this.tokens.push(new Token(type, text, literal, this.line, column));
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlphaOrUnderscore(c: string): boolean {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
            c == '_';
  }

  private addError(message: string, line: number, column: number): void {
    this.errors.push(new CharacterError(message, line, column));
  }

  private getCurrentLexeme(): string {
    return this.source.substring(this.start, this.current);
  }
}
