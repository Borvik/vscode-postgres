import * as fs from 'fs';

export class Compiler {

  private grammars: any;
  private parsers: any;
  private events: any;
  private grammarEvents: any;
  private defaultId: string;

  constructor() {}

  /**
   * Loads grammar rules from a file.
   * 
   * @param file The file containing the BNF rules to load
   * @param grammarId An id to identify the grammar for parsing
   * @param setAsDefault Used to set the grammar as the default
   */
  loadGrammarFile(file: string, grammarId: string, setAsDefault: boolean = false) {
    this.loadGrammar(fs.readFileSync(file).toString(), grammarId, setAsDefault);
  }

  /**
   * Loads grammar rules from a string.
   * 
   * @param grammar A string containing the grammar rules
   * @param grammarId An id to identify the grammar for parsing
   * @param setAsDefault Used to set the grammar as the default
   */
  loadGrammar(grammar: string, grammarId: string, setAsDefault: boolean = false) {
    if (!grammar) throw new Error('Failed to load empty grammar');
    if (!grammarId) throw new Error('An id must be specified for the grammar');

    this.grammars[grammarId] = new Grammar(grammar, grammarId);

    if (!this.grammarEvents[grammarId]) this.grammarEvents[grammarId] = {};

    if (!this.defaultId || setAsDefault) this.defaultId = grammarId;

    this.parsers[grammarId] = new Parser(this.grammars[grammarId], this);
  }
}