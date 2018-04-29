import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";

'use strict';

export class newQueryCommand extends BaseCommand {
  async run(treeNode: any) {
    // should have a connection object on it
    const textDocument = await vscode.workspace.openTextDocument({content: '', language: 'postgres'});
    await vscode.window.showTextDocument(textDocument);
    if (treeNode && treeNode.connection)
      EditorState.connection = treeNode.connection;
  }
}