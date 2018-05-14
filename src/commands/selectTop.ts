import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { selectTop1000Command } from "./selectTop1000";

export class selectTopCommand extends selectTop1000Command {
  async run(treeNode: TableNode) {
    // prompt for count
    const countInput: string = await vscode.window.showInputBox({ prompt: "Select how many?", placeHolder: "port" });
    if (!countInput) return;

    const count: number = parseInt(countInput);
    if (Number.isNaN(count)) {
      vscode.window.showErrorMessage('Invalid quantity for selection - should be a number');
      return;
    }
    
    return super.run(treeNode, count);
  }
}