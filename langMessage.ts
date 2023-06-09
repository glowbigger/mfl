// 

export class LangMessage {

  private message:string; private where:string; private line:number;

  constructor(message: string, where: string, line: number){
    this.message = message;
    this.where = where;
    this.line = line;
  }

  toString() {
    return `[line ${this.line}] Error${this.where}: ${this.message}`;
  }

}
