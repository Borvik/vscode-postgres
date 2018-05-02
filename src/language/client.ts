import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, ServerOptions, TransportKind, LanguageClientOptions } from 'vscode-languageclient';
import { ExtensionContext } from 'vscode';
import { IConnection } from '../common/IConnection';

export default class PostgreSQLLanguageClient {

  public client: LanguageClient;

  constructor(context: ExtensionContext) {
    let serverModule = context.asAbsolutePath(path.join('out', 'language', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--debug=6005', '--inspect'] };

    let serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
    };

    let clientOptions: LanguageClientOptions = {
      documentSelector: [
        { language: 'postgres', scheme: 'file' },
        { language: 'postgres', scheme: 'untitled' }
      ]
    };

    this.client = new LanguageClient('postgres', 'PostgreSQL Service', serverOptions, clientOptions);
    let disposable = this.client.start();
    context.subscriptions.push(disposable);
  }

  setConnection(connection: IConnection) {
    this.client.sendRequest('set_connection', {connection, documentUri: vscode.window.activeTextEditor.document.uri.toString()});
  }
}