import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class selectTopCommand extends BaseCommand {
  async run(treeNode: TableNode) {
    // prompt for count
    const countInput: string = await vscode.window.showInputBox({ prompt: "Select how many?", placeHolder: "port" });
    if (!countInput) return;

    const count: number = parseInt(countInput);
    if (Number.isNaN(count)) {
      vscode.window.showErrorMessage('Invalid quantity for selection - should be a number');
      return;
    }

    const sql = `
      select *
      from ${treeNode.schema}.${treeNode.table}
      limit ${count};
    `
    const textDocument = await vscode.workspace.openTextDocument({content: sql, language: 'postgres'});
    await vscode.window.showTextDocument(textDocument);
    EditorState.connection = treeNode.connection;

    return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection);
  }
}