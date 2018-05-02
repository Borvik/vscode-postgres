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
        resolveProvider: true,
        // triggerCharacters: []
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
      console.log(JSON.stringify(sql));
      /*
      const types: TypeResults = await connection.query(`select oid, typname from pg_type`);
      const res: QueryResults | QueryResults[] = await connection.query(sql);
      const results: QueryResults[] = Array.isArray(res) ? res : [res];

      results.forEach((result) => {
        result.fields.forEach((field) => {
          let type = types.rows.find((t) => t.oid === field.dataTypeID);
          if (type) {
            field.format = type.typname;
          }
        });
      });
      */
     try {
      const results = await dbConnection.query(`EXPLAIN ${sql.statement}`);
      let oo = results;
     }
     catch(err) {
       let o = err;
       // can use err.position (string)
       // corresponds to full position in query "EXPLAIN ${sql.statement}"
       // need to parse out where in parsed statement and lines that it is
     }
    }
  }
  connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
}

connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
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

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  item.detail = `${item.label} details`;
  item.documentation = `${item.label} documentation`;
  return item;
});

// setup the language service
connection.listen();