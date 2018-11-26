import * as vscode from 'vscode';
import { IConnection } from './IConnection';
import PostgreSQLLanguageClient from '../language/client';
import { Global } from './global';
import { Constants } from './constants';
import { Database } from './database';

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

  public static async setNonActiveConnection(doc: vscode.TextDocument, newConn: IConnection) {
    if (!doc && !doc.uri) return;
    if (!newConn) {
      newConn = await EditorState.getDefaultConnection();
    }
    EditorState.getInstance().metadata.set(doc.uri.toString(), newConn);
    if (vscode.window && vscode.window.activeTextEditor) {
      EditorState.getInstance().onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
    }
  }

  public static async getDefaultConnection(): Promise<IConnection> {
    let defaultConnection = Global.Configuration.get<string>("defaultConnection");
    if (!defaultConnection) return null;

    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    let connection: IConnection = null;
    for (const k in connections) {
      if (connections.hasOwnProperty(k)) {
        let connFound = (k === defaultConnection);
        if (!connFound) {
          let connName = connections[k].label || connections[k].host;
          connFound = (connName === defaultConnection);
        }

        if (connFound) {
          connection = Object.assign({}, connections[k]);
          if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
            connection.password = await Global.keytar.getPassword(Constants.ExtensionId, k);
          }
          break;
        }
      }
    }

    let defaultDatabase = Global.Configuration.get<string>("defaultDatabase");
    if (defaultDatabase) {
      const conn = await Database.createConnection(connection, 'postgres');

      let databases: string[] = [];
      try {
        const res = await conn.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
        databases = res.rows.map<string>(database => database.datname);
      } finally {
        await conn.end();
      }

      if (databases.indexOf(defaultDatabase)) {
        connection = Database.getConnectionWithDB(connection, defaultDatabase);
      }
    }
    return connection;
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
    
    this.statusBarServer.text = `$(server) ${conn.label || conn.host}`;
    this.statusBarServer.command = 'vscode-postgres.selectConnection';
    this.statusBarServer.show();

    // if (!conn.database) {
    //   if (this.statusBarDatabase) {

    //   }
    //     // this.statusBarDatabase.hide();
    //   return;
    // }

    if (!this.statusBarDatabase) {
      this.statusBarDatabase = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBarDatabase.tooltip = 'Change Active Database';
    }

    if (!conn.database) {
      this.statusBarDatabase.text = `$(database)`;
    } else {
      this.statusBarDatabase.text = `$(database) ${conn.database}`;
    }
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