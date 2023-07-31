// in the html, a div for syntax highlighting is placed over a transparent 
// contenteditable div, this function creates the highlighted visible text
// the idea comes from https://stackoverflow.com/a/41885674

// NOTE it's not worth it to highlight operators because the symbols <, >, and /
// are used in html

const EOF_CHAR: string = '\0';

const KEYWORDS: string[] = [
  'and',
  'break',
  'do',
  'else',
  'for',
  'fn',
  'if',
  'of',
  'or',
  'print',
  'return',
  'then',
  'let',
  'while',
];

const TRUE_FALSE_KEYWORDS: string[] = [ 'true', 'false' ]

const TYPE_KEYWORDS: string[] = [
  'num',
  'str',
  'bool',
]

export default function highlight(source: string): string {
  // index of the current character being scanned
  let current = 0;

  // the source code inner html with the highlights applied
  let highlighted = '';

  //======================================================================
  // helpers
  //======================================================================
  
  function isAtEnd(index: number): boolean {
    return index>= source.length;
  }

  function currentChar(): string {
    return source[current];
  }

  function consume(): string {
    return source[current++];
  }

  function isAlphaOrUnderscore(index: number): boolean {
    const c = source[index];
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           (c === '_');
  }

  function isDigit(index: number): boolean {
    const c = source[index];
    return (c >= '0' && c <= '9');
  }

  function addSubstring(substring: string): void {
    highlighted += substring;
  }

  //======================================================================
  // scanning methods
  //======================================================================

  // just adds the current character without highlighting it
  function scanCurrentCharacter(): void {
    addSubstring(consume());
  }

  function scanNumber(): void {
    let substring = '';
    while ( !isAtEnd(current) && isDigit(current) )
      substring += consume();
    addSubstring(`<span class='hl_green'>${substring}</span>`);
  }

  function scanWord(): void {
    let word = '';
    while ( !isAtEnd(current) &&
            (isAlphaOrUnderscore(current) || isDigit(current)) )
      word += consume();

    // if the word is a keyword, highlight it
    if (KEYWORDS.includes(word))
      word = `<span class='hl_purple'>${word}</span>`;
    if (TYPE_KEYWORDS.includes(word))
      word = `<span class='hl_blue'>${word}</span>`;
    if (TRUE_FALSE_KEYWORDS.includes(word))
      word = `<span class='hl_green'>${word}</span>`;
    else
      // otherwise, it is an identifier
      // word = `<span class='hl_blue'>${word}</>`;
      word = word;

    addSubstring(word);
  }

  function scanCommentOrDivision(): void {
    // if the / is the last character, it is a division symbol
    if (isAtEnd(current + 1)) {
      // substring = `<span class='hl_blue'>${currentChar()}</span>`;
      scanCurrentCharacter();
      return;
    }

    // single line comment, ignore the characters until end of line or file
    if (source[current + 1] === '/') {
      let substring = '';

      while (!isAtEnd(current) && currentChar() !== '\n')
        substring += consume();

      addSubstring(`<span class='hl_gray'>${substring}</span>`);
      return;
    }

    // TODO multiline comments
    if (source[current + 1] === '*') {
      // initialize the substring with the /*
      let substring = consume() + consume();

      let unpairedOpeningDelimiters = 1;

      // scan characters until a corresponding */ is found for each /*
      while (unpairedOpeningDelimiters > 0 && !isAtEnd(current)) {
        if (!isAtEnd(current + 1)) {
          // potential opening delimiter
          if (currentChar() === '/' && source[current + 1] === '*') {
            substring += consume() + consume();
            unpairedOpeningDelimiters++;
            continue;
          }

          // potential closing delimiter
          if (currentChar() === '*' && source[current + 1] === '/') {
            substring += consume() + consume();
            unpairedOpeningDelimiters--;
            continue;
          }
        }

        substring += consume();
      }

      addSubstring(`<span class='hl_gray'>${substring}</span>`);
      return;
    }

    // default, division character
    scanCurrentCharacter();
    return;
  }

  function scanString(): void {
    const quoteType: string = currentChar();
    let substring = consume();

    // scan characters until a terminating ' is found
    while (!isAtEnd(current) && currentChar() !== quoteType)
      substring += consume();

    // unterminated string
    if (isAtEnd(current)) {
      addSubstring(`<span class='hl_red'>${substring}</span>`);
      return;
    }

    // consume the final ' or " and return the highlighted string
    substring += consume();
    addSubstring(`<span class='hl_red'>${substring}</span>`);
  }

  function scanDelimiter(): void {
    // const hl = `<span class='hl_yellow'>${consume()}</span>`;
    const hl = `<span class='hl_lightgray'>${consume()}</span>`;
    addSubstring(hl);
  }

  //======================================================================
  // main loop
  //======================================================================

  if (source.length === 0) return '';

  // go through the source string and add words one by one
  while (!isAtEnd(current)) {
    switch (currentChar()) {
      // tokens that are one character long have no highlight
			case ',': 
			case '.': 
			case '-': 
			case '+': 
			case ';': 
			case '*': 
			case ':': 
        scanCurrentCharacter();
        break;

      // delimiters
			case '(': 
			case ')': 
			case '{': 
			case '}': 
			case '[':
			case ']':
        scanDelimiter();
        break;

      // text for tokens that are one or two characters long
      case '!':
      case '=':
      case '<':
      case '>':
        // treated as one character tokens and are unhighlighted
        // NOTE slightly inefficient, but trivial
        scanCurrentCharacter();
        break;

      // whitespace characters are unhighlighted
      case ' ':
      case '\n':
      case '\t':
      case '\r':
        scanCurrentCharacter();
        break;

      // a '/' can start a comment or be a division sign
      case '/':
        scanCommentOrDivision();
        break;

      case '"':
      case `'`:
        scanString();
        break;

      default:
        // number
        if (isDigit(current)) {
          scanNumber();
          break;
        }

        // identifier or keyword
        if (isAlphaOrUnderscore(current)) {
          scanWord();
          break;
        }

        // skip unrecognized characters
        scanCurrentCharacter();
        break;
    }
  }

  return highlighted;
}
