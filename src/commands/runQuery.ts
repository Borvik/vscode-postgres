import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';

'use strict';

export class runQueryCommand extends BaseCommand {
  async run() {
    if (!vscode.window.activeTextEditor && !vscode.window.activeTextEditor.document) {
      vscode.window.showWarningMessage('No SQL file selected');
      return;
    }

    let connection = EditorState.connection;
    if (!connection) {
      vscode.window.showWarningMessage('No PostgreSQL Server or Database selected');
      return;
    }
    
    let config = Global.Configuration;
    let editor = vscode.window.activeTextEditor;
    let querySelection = null;

    if (config.get<boolean>('queryMethod')){
      let selection = editor.selection;
      querySelection = selection

      if (!editor.selection.isEmpty) {
        querySelection._start._character = editor.document.lineAt(querySelection.start.line).range.start.character
        querySelection._end._character = editor.document.lineAt(querySelection.end.line).range.end.character
      } 
      else {
        querySelection._start._line = querySelection.active.line
        querySelection._start._character = editor.document.lineAt(querySelection.active.line).range.start.character
        querySelection._end._line = querySelection.active.line
        querySelection._end._character = editor.document.lineAt(querySelection.active.line).range.end.character
      }

      if (querySelection.start.character === 0 && querySelection.end.character === 0 && querySelection.isEmpty) {
        vscode.window.showWarningMessage('No SQL found to run');
        return;
      }
    }
    else {
      querySelection = editor.selection.isEmpty ? undefined : editor.selection;
      if (editor.document.getText(querySelection).trim().length === 0) {
        vscode.window.showWarningMessage('No SQL found to run');
        return;
      }
    }

    vscode.window.showWarningMessage('OK');
    let sql = editor.document.getText(querySelection);
    return Database.runQuery(sql, editor, connection);
  }
}