import { IParserRules } from "./parserInterfaces";
import { Token } from "./token";

export class Parser {

  constructor(private rules: IParserRules) {
  }

  parse(script: string) {
    let tokenStack: Token[] = [];
    let current: Token = new Token('grammar', 0, null);
    let buffer: Buffer = Buffer.from(script);
  }
}