import { Token } from "./token";

export interface IParserRules {
  [name: string]: (charCode: number, token: Token) => boolean
}