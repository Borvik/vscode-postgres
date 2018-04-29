import {
  IPCMessageReader, IPCMessageWriter, createConnection, IConnection,
  TextDocuments, TextDocument, InitializeResult,
  Diagnostic, DiagnosticSeverity, TextDocumentPositionParams,
  CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

/**
 * To Debug the language server
 * 
 * 1. Start the extension via F5
 * 2. Under vscode Debug pane, switch to "Attach to Language Server"
 * 3. F5
  */

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

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
        
      }
    }
  }
});

connection.onRequest('set_connection', function() {
  console.log('Set Connection on server:', arguments);
});

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

function validateTextDocument(textDocument: TextDocument): void {
  let diagnostics: Diagnostic[] = [];
  // parse and find issues
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