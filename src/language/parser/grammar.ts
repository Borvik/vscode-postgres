export class Grammar {

  private line: number;
  private column: number;
  private lines: string[];

  constructor(grammarSyntax: string, readonly name: string) {
    
  }

  private splitLines(syntax: string) {
    this.lines = syntax.replace(/\r\n/gi, "\n").replace(/\r/gi, "\n").split("\n")
      .map(line => this.prepareLine(line));
  }

  private prepareLine(line: string): string {
    let syntax = { raw: line };
    let literals = this.mapLiterals(syntax);

    if (syntax.raw.indexOf(';') !== -1) {}
  }
}