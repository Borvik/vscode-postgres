'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import PostgreSQLLanguageClient from './language/client';
import { PostgreSQLTreeDataProvider } from './tree/treeProvider';
import { Global } from './common/global';
import { EditorState } from './common/editorState';
import { PreviewProvider } from './common/previewProvider';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-postgres" is now active!');
  let languageClient: PostgreSQLLanguageClient = new PostgreSQLLanguageClient(context);
  let treeProvider: PostgreSQLTreeDataProvider = PostgreSQLTreeDataProvider.getInstance(context);
  Global.context = context;
  EditorState.getInstance(languageClient);

  try {
    let commandPath = context.asAbsolutePath(path.join('out', 'commands'));
    let files = fs.readdirSync(commandPath);
    for (const file of files) {
      if (path.extname(file) === '.map') continue;
      let className = path.basename(file, '.js') + 'Command';

      let commandClass = require(path.join(commandPath, file));
      new commandClass[className](context);
    }
  }
  catch (err) {
    console.error('Command loading error:', err);
  }

  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('postgres-results', PreviewProvider.Instance));
  vscode.workspace.onDidCloseTextDocument(params => {
    PreviewProvider.Instance.onDidCloseTextDocument(params);
  });

  vscode.workspace.onDidOpenTextDocument((e: vscode.TextDocument) => {
    EditorState.setNonActiveConnection(e, null);
  });

  // EditorState.connection = null;
}

// this method is called when your extension is deactivated
export function deactivate() {
}