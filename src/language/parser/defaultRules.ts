import { Token } from "./token";
import { IParserRules } from "./parserInterfaces";

const ebnfRules: IParserRules = {
  letter(token: Token): boolean {
    return false;
  },
  digit(token: Token): boolean {
    return false;
  },
  symbol(token: Token): boolean {
    return false;
  },
  character(token: Token): boolean {
    return false;
  },
  identifier(token: Token): boolean {
    return false;
  },
  terminal(token: Token): boolean {
    return false;
  },
  rule(token: Token): boolean {
    return false;
  },
  grammar(token: Token): boolean {
    return false;
  }
};
export default ebnfRules;