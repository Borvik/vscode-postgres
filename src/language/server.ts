import {
  IPCMessageReader, IPCMessageWriter, createConnection, IConnection,
  TextDocuments, TextDocument, InitializeResult,
  Diagnostic, DiagnosticSeverity, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind
} from 'vscode-languageserver';
import { Client } from 'pg';
import * as fs from 'fs';
import { Validator } from './validator';
import { IConnection as IDBConnection } from '../common/IConnection';

export interface ISetConnection { 
  connection: IDBConnection
  documentUri?: string;
}

export interface ExplainResults {
  rowCount: number;
  command: string;
  rows?: any[];
  fields?: any[];
}

export interface DBField {
  attisdropped: boolean,
  attname: string,
  attnum: number,
  attrelid: string,
  data_type: string
}

export interface DBTable {
  tablename: string,
  columns: DBField[]
}

export interface DBFunctionsRaw {
  schema: string
  name: string
  result_type: string
  argument_types: string
  type: string
}

export interface DBFunctionArgList {
  args: string[]
}

export interface DBFunction {
  schema: string
  name: string
  result_type: string
  overloads: DBFunctionArgList[],
  type: string
}

let tableCache: DBTable[] = [];
let functionCache: DBFunction[] = [];

/**
 * To Debug the language server
 * 
 * 1. Start the extension via F5
 * 2. Under vscode Debug pane, switch to "Attach to Language Server"
 * 3. F5
  */

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let dbConnection: Client = null,
    dbConnOptions: IDBConnection = null;

console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);

let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

let shouldSendDiagnosticRelatedInformation: boolean = false;

connection.onInitialize((_params) : InitializeResult => {
  shouldSendDiagnosticRelatedInformation = _params.capabilities && _params.capabilities.textDocument && _params.capabilities.textDocument.publishDiagnostics && _params.capabilities.textDocument.publishDiagnostics.relatedInformation;
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        triggerCharacters: [' ', '.']
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ',']
      }
    }
  }
});

function dbConnectionEnded() {
  dbConnection = null;
}

async function setupDBConnection(connectionOptions: IDBConnection, uri: string): Promise<void> {
  if (connectionOptions) {
    // dbConnection = await Database.createConnection(conn);
    if (connectionOptions.certPath && fs.existsSync(connectionOptions.certPath)) {
      connectionOptions.ssl = {
        ca: fs.readFileSync(connectionOptions.certPath).toString()
      }
    }
    
    dbConnection = new Client(connectionOptions);
    await dbConnection.connect();
    dbConnection.on('end', dbConnectionEnded);

    // setup database caches for functions, tables, and fields
    tableCache = [];
    functionCache = [];

    if (connectionOptions.database) {
      try {
        let tablesAndColumns = await dbConnection.query(`
          SELECT
            tablename,
            json_agg(a) as columns
          FROM
            pg_tables
            LEFT JOIN (
              SELECT
                attrelid,
                attname,
                format_type(atttypid, atttypmod) as data_type,
                attnum,
                attisdropped
              FROM
                pg_attribute
            ) as a ON (a.attrelid = pg_tables.tablename::regclass AND a.attnum > 0 AND NOT a.attisdropped)
          WHERE schemaname not in ('information_schema', 'pg_catalog')
          GROUP BY tablename;
          `);
        tableCache = tablesAndColumns.rows;

        let functions = await dbConnection.query(`
          SELECT n.nspname as "schema",
            p.proname as "name",
            pg_catalog.pg_get_function_result(p.oid) as "result_type",
            pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
          CASE
            WHEN p.proisagg THEN 'agg'
            WHEN p.proiswindow THEN 'window'
            WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
            ELSE 'normal'
          END as "type"
          FROM pg_catalog.pg_proc p
              LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE pg_catalog.pg_function_is_visible(p.oid)
            AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
                AND n.nspname <> 'information_schema'
          ORDER BY 1, 2, 4;
          `);
        
        functions.rows.forEach((fn:DBFunctionsRaw) => {
          // return new ColumnNode(this.connection, this.table, column);
          let existing = functionCache.find(f => f.name === fn.name);
          if (!existing) {
            existing = {
              name: fn.name,
              schema: fn.schema,
              result_type: fn.result_type,
              type: fn.type,
              overloads: []
            }
            functionCache.push(existing);
          }
          let args = fn.argument_types.split(',').filter(a => a).map<string>(a => a.trim());
          existing.overloads.push({args});
        });
        
      }
      catch (err) {
        let o = err;
      }
    }

    if (uri) {
      let document = documents.get(uri);
      if (document && document.languageId === 'postgres') {
        validateTextDocument(document);
      }
    }
  }
  dbConnOptions = connectionOptions;
}

connection.onRequest('set_connection', async function() {
  let newConnection: ISetConnection = arguments[0];
  console.log('Set Connection on server:' + JSON.stringify(newConnection));
  if (dbConnection) {
    // kill the connection first
    await dbConnection.end();
  }
  await setupDBConnection(newConnection.connection, newConnection.documentUri);
});

documents.onDidOpen((change) => {
  validateTextDocument(change.document);
});

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  let diagnostics: Diagnostic[] = [];
  // parse and find issues
  if (dbConnection) {
    let sqlText = textDocument.getText();
    for (let sql of Validator.prepare_sql(sqlText)) {
      try {
        const results = await dbConnection.query(`EXPLAIN ${sql.statement}`);
      }
      catch(err) {
        // can use err.position (string)
        // corresponds to full position in query "EXPLAIN ${sql.statement}"
        // need to parse out where in parsed statement and lines that it is
        let errPosition = parseInt(err.position) - 9; // removes "EXPLAIN " and turn to zero based
        let errLine = 0;
        while (errPosition > sql.lines[errLine].length) {
          errPosition -= (sql.lines[errLine].length + 1);
          errLine++;
        }
        // should have the line - and column
        // find next space after position
        let spacePos = errPosition;
        if (errPosition < sql.lines[errLine].length) {
          spacePos = sql.lines[errLine].indexOf(' ', errPosition);
          if (spacePos < 0) {
            spacePos = sql.lines[errLine].length;
          }
        }
        if (errLine === 0) {
          errPosition += sql.column; // add the column back in - only for first line
        }
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: sql.line + errLine, character: errPosition },
            end: {line: sql.line + errLine, character: spacePos }
          },
          message: err.message,
          source: dbConnOptions.host
        });
      }
    }
  }
  connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
}

connection.onCompletion((e: any): CompletionItem[] => {

  /*
  p.context.triggerKind:number = 1?
  p.context.triggerKind 2 - via character
    triggerCharacter = '.' or whatever
  p.position
    .line: number
    .character: number

  p.textDocument.uri: string
  */
  let items: CompletionItem[] = [];
  let tableFound = false;
  if (e.context.triggerKind === 2 && e.context.triggerCharacter === '.') {
    // triggered via . Character
    // look back and grab the text immediately prior to match to table
    let document = documents.get(e.textDocument.uri);
    let o = document;
    let line = document.getText({
      start: {line: e.position.line, character: 0},
      end: {line: e.position.line, character: e.position.character}
    });

    let prevSpace = line.lastIndexOf(' ', e.position.character) + 1;
    let keyword = line.substring(prevSpace, e.position.character - 1);
    let table = tableCache.find(t => t.tablename.toLocaleLowerCase() == keyword);
    if (table) {
      tableFound = true;
      table.columns.forEach(field => {
        items.push({
          label: field.attname,
          kind: CompletionItemKind.Property,
          detail: field.data_type
        });
      });
    }
  }
  if (!tableFound) {
    tableCache.forEach(table => {
      items.push({
        label: table.tablename,
        kind: CompletionItemKind.Class
      });
      table.columns.forEach(field => {
        items.push({
          label: field.attname,
          kind: CompletionItemKind.Property,
          detail: field.data_type,
          documentation: table.tablename
        });
      });
    });
    functionCache.forEach(fn => {
      items.push({
        label: fn.name,
        kind: CompletionItemKind.Function,
        detail: fn.result_type
      });
    });
  }
  return items;
  return [
    {
      label: 'Text',
      kind: CompletionItemKind.Text,
      data: 1
    },
    {
      label: 'Method',
      kind: CompletionItemKind.Method,
      data: 2
    },
    {
      label: 'Function',
      kind: CompletionItemKind.Function,
      data: 3
    },
    {
      label: 'Constructor',
      kind: CompletionItemKind.Constructor,
      data: 4
    },
    {
      label: 'Field',
      kind: CompletionItemKind.Field,
      data: 5
    },
    {
      label: 'Variable',
      kind: CompletionItemKind.Variable,
      data: 6
    },
    {
      label: 'Class',
      kind: CompletionItemKind.Class,
      data: 7
    },
    {
      label: 'Interface',
      kind: CompletionItemKind.Interface,
      data: 8
    },
    {
      label: 'Module',
      kind: CompletionItemKind.Module,
      data: 9
    },
    {
      label: 'Property',
      kind: CompletionItemKind.Property,
      data: 10
    },
    {
      label: 'Unit',
      kind: CompletionItemKind.Unit,
      data: 11
    },
    {
      label: 'Value',
      kind: CompletionItemKind.Value,
      data: 12
    },
    {
      label: 'Enum',
      kind: CompletionItemKind.Enum,
      data: 13
    },
    {
      label: 'Keyword',
      kind: CompletionItemKind.Keyword,
      data: 14
    },
    {
      label: 'Snippet',
      kind: CompletionItemKind.Snippet,
      data: 15
    },
    {
      label: 'Color',
      kind: CompletionItemKind.Color,
      data: 16
    },
    {
      label: 'File',
      kind: CompletionItemKind.File,
      data: 17
    },
    {
      label: 'Reference',
      kind: CompletionItemKind.Reference,
      data: 18
    },
    {
      label: 'Folder',
      kind: CompletionItemKind.Folder,
      data: 19
    },
    {
      label: 'EnumMember',
      kind: CompletionItemKind.EnumMember,
      data: 20
    },
    {
      label: 'Constant',
      kind: CompletionItemKind.Constant,
      data: 21
    },
    {
      label: 'Struct',
      kind: CompletionItemKind.Struct,
      data: 22
    },
    {
      label: 'Event',
      kind: CompletionItemKind.Event,
      data: 23
    },
    {
      label: 'Operator',
      kind: CompletionItemKind.Operator,
      data: 24
    },
    {
      label: 'TypeParameter',
      kind: CompletionItemKind.TypeParameter,
      data: 25
    },
  ]
});

// connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
//   item.detail = `${item.label} details`;
//   item.documentation = `${item.label} documentation`;
//   return item;
// });

// setup the language service
connection.listen();