import { Compiler } from 'bnf';
import * as fs from 'fs';
import * as path from 'path';
import { DBTable, DBFunction } from './interfaces';

let rulePath = path.join(__dirname, '..', '..', 'syntaxes', 'pgsql.abnf');
let baseRules = fs.readFileSync(rulePath).toString();

export class SqlParser {
  compiler: any;

  constructor(keywords: string[], functions: DBFunction[], tables: DBTable[]) {
    this.compiler = new Compiler();
    this.updateDefinitions(keywords, functions, tables);
    // set the events
  }

  updateDefinitions(keywords: string[], functions: DBFunction[], tables: DBTable[]) {
    // build new BNF - base rules, plus keywords, functions, tables (if necessary)
    let newBnf = baseRules;
    this.compiler.AddLanguage(newBnf, 'pgsql');
    let o = newBnf;
  }

  parseSql(sql: string, dataObject: any = {}) {
    return this.compiler.ParseScript(sql, dataObject);
  }
}