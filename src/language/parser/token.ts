export class Token {
  children: Token[] = [];
  hasError: boolean = false;
  errorMsg: string;

  constructor(readonly name: string, readonly startIndex: number, readonly parent: Token) {
    parent.children.push(this);
  }
}