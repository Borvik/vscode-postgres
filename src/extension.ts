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
    // The path relative to the current file. In this case the extension-module file.
    let commandPathRelative = './commands/';
    
    // Only use the created commandPath to find the module name of the commands. See explanation below, above the require call.
    let commandPath = context.asAbsolutePath(path.join('out', commandPathRelative));
    let files = fs.readdirSync(commandPath);
    for (const file of files) {
      if (path.extname(file) === '.map') continue;
      let className = path.basename(file, '.js') + 'Command';

      // The commandPath seems to be always with a lower case drive letter on windows, 
      // which is not always the case for the captured path in the require function.
      // The require function uses internally a dictionary with the full module path for 
      // the case sensitive key to determine if the module is already loaded. If the same
      // module is required with different paths, then multiple module loading will happen. 
      // This has already caused following issues:
      // https://github.com/Borvik/vscode-postgres/issues/19
      // https://github.com/Borvik/vscode-postgres/issues/27
      let commandClass = require(commandPathRelative + file);
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