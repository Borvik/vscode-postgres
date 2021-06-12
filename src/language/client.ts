import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient, ServerOptions, TransportKind, LanguageClientOptions } from 'vscode-languageclient/node';
import { ExtensionContext } from 'vscode';
import { IConnection } from '../common/IConnection';
import { EditorState } from '../common/editorState';

export default class PostgreSQLLanguageClient {

  public client: LanguageClient;
  private lang_server_ready: boolean;

  constructor(context: ExtensionContext) {
    this.lang_server_ready = false;
    let serverModule = context.asAbsolutePath(path.join('out', 'language', 'server.js'));
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6005'] };

    let serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    let clientOptions: LanguageClientOptions = {
      documentSelector: [
        { language: 'postgres', scheme: 'file' },
        { language: 'postgres', scheme: 'untitled' }
      ]
    };

    this.client = new LanguageClient('postgres', 'PostgreSQL Service', serverOptions, clientOptions);
    this.client.onReady().then(async () => {
      this.lang_server_ready = true;
      EditorState.connection = await EditorState.getDefaultConnection();
    });
    let disposable = this.client.start();
    context.subscriptions.push(disposable);
  }

  setConnection(connection: IConnection) {
    if (!vscode.window.activeTextEditor) return;
    if (!this.lang_server_ready) {
      this.client.onReady().then(async () => {
        this.doSetConnection(connection);
      });
    } else {
      this.doSetConnection(connection);
    }
  }

  private doSetConnection(connection: IConnection) {
    this.client.sendRequest('set_connection', {connection, documentUri: vscode.window.activeTextEditor.document.uri.toString()})
    .then(() => {}, (reason: any) => {
      console.error(reason);
    });
  }
}