import * as vscode from 'vscode';
import { IConnection } from './IConnection';
import PostgreSQLLanguageClient from '../language/client';

export class EditorState {

  private metadata: Map<string, IConnection> = new Map<string, IConnection>();
  private static _instance: EditorState = null;
  private statusBarDatabase: vscode.StatusBarItem;
  private statusBarServer: vscode.StatusBarItem;

  constructor(private readonly languageClient: PostgreSQLLanguageClient) {
    vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this);
    vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this);
    vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this);
  }

  static getInstance(languageClient?: PostgreSQLLanguageClient) {
    if (!EditorState._instance && languageClient) EditorState._instance = new EditorState(languageClient);
    return EditorState._instance;
  }

  public static get connection(): IConnection {
    let window = vscode.window;
    let te = window ? window.activeTextEditor : null;
    let doc = te ? te.document : null;
    let uri = doc ? doc.uri : null;

    if (!uri) return null;
    return EditorState.getInstance().metadata.get(uri.toString());
  }

  public static set connection(newConn: IConnection) {
    let window = vscode.window;
    let te = window ? window.activeTextEditor : null;
    let doc = te ? te.document : null;
    let uri = doc ? doc.uri : null;

    if (!uri) return;
    EditorState.getInstance().metadata.set(uri.toString(), newConn);
    EditorState.getInstance().onDidChangeActiveTextEditor(te);
  }

  public static setNonActiveConnection(doc: vscode.TextDocument, newConn: IConnection) {
    if (!doc && !doc.uri) return;
    EditorState.getInstance().metadata.set(doc.uri.toString(), newConn);
  }

  onDidChangeActiveTextEditor(e: vscode.TextEditor) {
    let conn: IConnection = e && e.document && e.document.uri ? this.metadata.get(e.document.uri.toString()) : null;
    this.languageClient.setConnection(conn);
    if (conn) {
      // set the status buttons
      this.setStatusButtons(conn);
    } else {
      // clear the status buttons
      this.removeStatusButtons();
    }
  }

  setStatusButtons(conn: IConnection) {
    if (!this.statusBarServer) {
      this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarServer.tooltip = 'Change Active Server';
    }
    
    this.statusBarServer.text = `$(server) ${conn.label}`;
    this.statusBarServer.command = 'vscode-postgres.selectConnection';
    this.statusBarServer.show();

    if (!conn.database) {
      if (this.statusBarDatabase)
        this.statusBarDatabase.hide();
      return;
    }

    if (!this.statusBarDatabase) {
      this.statusBarDatabase = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarDatabase.tooltip = 'Change Active Database';
    }

    this.statusBarDatabase.text = `$(database) ${conn.database}`;
    this.statusBarDatabase.command = 'vscode-postgres.selectDatabase';
    this.statusBarDatabase.show();
  }

  removeStatusButtons() {
    if (this.statusBarDatabase) this.statusBarDatabase.hide();

    if (!this.statusBarServer) {
      this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarServer.tooltip = 'Change Active Server';
    }
    
    this.statusBarServer.text = `$(server) Select Postgres Server`;
    this.statusBarServer.command = 'vscode-postgres.selectConnection';
    this.statusBarServer.show();
  }

  onDidCloseTextDocument(e: vscode.TextDocument) {
    this.metadata.delete(e.uri.toString());
  }

  onDidOpenTextDocument(e: vscode.TextDocument) {
    this.metadata.set(e.uri.toString(), null);
  }

}