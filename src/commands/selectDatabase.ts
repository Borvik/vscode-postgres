import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

'use strict';

export class selectDatabaseCommand extends BaseCommand {
  async run() {
    // vscode.window.showInformationMessage('Select Database!');
    let connectionDetails: IConnection = EditorState.connection;
    if (!connectionDetails) return;
    
    const connection = await Database.createConnection(connectionDetails, 'postgres');

    let databases: string[] = [];
    try {
      const res = await connection.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
      databases = res.rows.map<string>(database => database.datname);
    } finally {
      await connection.end();
    }

    //vscode.window.showInputBox
    const db = await vscode.window.showQuickPick(databases, {placeHolder: 'Select a database'});
    if (!db) return;
    EditorState.connection = Database.getConnectionWithDB(connectionDetails, db);
  }
}