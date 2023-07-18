import { Token } from "./token";

export default abstract class SyntaxTreeNode {
  // the starting and ending tokens of the node, used for error reporting
  // example: in 'if x < 6 then print x;', lToken is 'if', and rToken is ';'
  lToken: Token;
  rToken: Token;

  constructor(lToken: Token, rToken: Token) {
    this.lToken = lToken;
    this.rToken = rToken;
  }
}
