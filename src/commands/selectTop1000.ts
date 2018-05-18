import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class selectTop1000Command extends BaseCommand {
  async run(treeNode: TableNode) {
    const sql = `SELECT * FROM ${treeNode.getQuotedTableName()} LIMIT 1000;`
    const textDocument = await vscode.workspace.openTextDocument({content: sql, language: 'postgres'});
    await vscode.window.showTextDocument(textDocument);
    EditorState.connection = treeNode.connection;
    return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection);
  }
}