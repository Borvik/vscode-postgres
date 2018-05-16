import { Token } from "./token";
import { IParserRules } from "./parserInterfaces";

const ebnfRules: IParserRules = {
  letter(charCode: number, token: Token): boolean {
    return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  },
  digit(charCode: number, token: Token): boolean {
    return (charCode >= 48 && charCode <= 57);
  },
  symbol(charCode: number, token: Token): boolean {
    return false;
  },
  character(charCode: number, token: Token): boolean {
    return false;
  },
  identifier(charCode: number, token: Token): boolean {
    return false;
  },
  terminal(charCode: number, token: Token): boolean {
    return false;
  },
  lhs(charCode: number, token: Token): boolean {
    return false;
  },
  rhs(charCode: number, token: Token): boolean {
    return false;
  },
  rule(charCode: number, token: Token): boolean {
    return false;
  },
  grammar(charCode: number, token: Token): boolean {
    return false;
  }
};
export default ebnfRules;