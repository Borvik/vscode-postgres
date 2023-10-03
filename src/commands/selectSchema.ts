import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

'use strict';

export class selectSchemaCommand extends BaseCommand {
  async run() {
    // vscode.window.showInformationMessage('Select Database!');
    let connectionDetails: IConnection = EditorState.connection;
    if (!connectionDetails) return;
    
    const connection = await Database.createConnection(connectionDetails, connectionDetails.database);

    let schemas: string[] = [];
    try {
      const res = await connection.query('SELECT schema_name as sch FROM information_schema.schemata;');
      schemas = res.rows.map<string>(schema => schema.sch);
    } finally {
      await connection.end();
    }

    //vscode.window.showInputBox
    const schema = await vscode.window.showQuickPick(schemas, {placeHolder: 'Select a schema'});
    if (!schema) return;
    connectionDetails.schema = schema;
    EditorState.connection = Database.getConnectionWithDB(connectionDetails, connectionDetails.database);
  }
}