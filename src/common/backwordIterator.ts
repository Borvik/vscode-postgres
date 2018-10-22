import { TextDocument } from "vscode-languageserver";

var _NL = '\n'.charCodeAt(0);
var _TAB = '\t'.charCodeAt(0);
var _WSB = ' '.charCodeAt(0);
var _LBracket = '['.charCodeAt(0);
var _RBracket = ']'.charCodeAt(0);
var _LCurly = '{'.charCodeAt(0);
var _RCurly = '}'.charCodeAt(0);
var _LParent = '('.charCodeAt(0);
var _RParent = ')'.charCodeAt(0);
var _Comma = ','.charCodeAt(0);
var _Period = '.'.charCodeAt(0);
var _Quote = '\''.charCodeAt(0);
var _DQuote = '"'.charCodeAt(0);
var _USC = '_'.charCodeAt(0);
var _a = 'a'.charCodeAt(0);
var _z = 'z'.charCodeAt(0);
var _A = 'A'.charCodeAt(0);
var _Z = 'Z'.charCodeAt(0);
var _0 = '0'.charCodeAt(0);
var _9 = '9'.charCodeAt(0);

var BOF = 0;

export class BackwardIterator {
  private line: string;
  private text: string;
  private lines: string[];

  constructor(private model: TextDocument, private offset: number, private lineNumber: number) {
    this.text = model.getText();
    this.lines = this.text.split(/\r?\n/g);
    this.line = this.lines[lineNumber];
  }

  public hasNext(): boolean {
    return this.lineNumber >= 0 || this.offset >= 0;
  }

  public isFowardDQuote(): boolean {
    if (!this.hasForward()) return false;
    return (this.peekForward() === _DQuote);
  }

  public isNextDQuote(): boolean {
    if (!this.hasNext()) return false;
    return (this.peekNext() === _DQuote);
  }

  public isNextPeriod(): boolean {
    if (!this.hasNext()) return false;
    return (this.peekNext() === _Period);
  }

  public peekNext(): number {
    if (this.offset < 0) {
      if (this.lineNumber > 0) {
        return _NL;
      }
      return BOF;
    }
    return this.line.charCodeAt(this.offset);
  }

  public hasForward(): boolean {
    return (this.lineNumber < this.lines.length || this.offset < this.line.length);
  }

  public peekForward(): number {
    if (this.offset === this.line.length) {
      if (this.lineNumber === this.lines.length)
        return BOF;
      return _NL;
    }
    return this.line.charCodeAt(this.offset + 1);
  }

  public next(): number {
    if (this.offset < 0) {
      if (this.lineNumber > 0) {
        this.lineNumber--;
        this.line = this.lines[this.lineNumber];
        this.offset = this.line.length - 1;
        return _NL;
      }
      this.lineNumber = -1;
      return BOF;
    }
    let ch = this.line.charCodeAt(this.offset);
    this.offset--;
    return ch;
  }

  public readArguments(): number {
    let parentNesting = 0;
    let bracketNesting = 0;
    let curlyNesting = 0;
    let paramCount = 0;
    while (this.hasNext()) {
      let ch = this.next();
      switch (ch) {
        case _LParent:
          parentNesting--;
          if (parentNesting < 0) {
            return paramCount;
          }
          break;
        case _RParent: parentNesting++; break;
        case _LCurly: curlyNesting--; break;
        case _RCurly: curlyNesting++; break;
        case _LBracket: bracketNesting--; break;
        case _RBracket: bracketNesting++; break;
        case _DQuote:
        case _Quote:
          while (this.hasNext() && ch !== this.next()) {
            // find the closing quote or double quote
          }
          break;
        case _Comma:
          if (!parentNesting && !bracketNesting && !curlyNesting) {
            paramCount++;
          }
          break;
      }
    }
    return -1;
  }

  public readIdent() {
    let identStarted = false, isQuotedIdentifier = false;
    let ident = '';
    while (this.hasNext()) {
      // Peek first and check if is part of identifier
      let ch = this.peekNext();
      if (identStarted && !isQuotedIdentifier && !this.isIdentPart(ch))
        break;

      ch = this.next();
      if (!identStarted && isQuotedIdentifier && ch === _DQuote) {
        identStarted = true;
        continue;
      }
      if (!identStarted && (ch === _WSB || ch === _TAB || ch == _NL))
        continue;
      
      if (!identStarted && (ch === _DQuote || this.isIdentPart(ch))) {
        identStarted = true;
        isQuotedIdentifier = (ch === _DQuote);
        ident = String.fromCharCode(ch) + ident;
      } else if (identStarted) {
        if (isQuotedIdentifier) {
          if (ch === BOF) break;
          ident = String.fromCharCode(ch) + ident;
          if (ch === _DQuote) break;
        } else {
          ident = String.fromCharCode(ch) + ident;
        }
      }
    }
    return ident;
  }

  public readIdents(maxlvl: number): string[] {
    let idents = [];
    while (maxlvl > 0) {
      maxlvl--;
      let ident = this.readIdent();
      if (!ident) {
        break;
      }
    
      idents.push(ident)
  
      if (!this.isNextPeriod()) {
        break;
      }
    }
    return idents.reverse();
  }

  private isIdentPart(ch: number): boolean {
    return (ch === _USC || // _
      ch >= _a && ch <= _z || // a-z
      ch >= _A && ch <= _Z || // A-Z
      ch >= _0 && ch <= _9); // 0-9
  }
}