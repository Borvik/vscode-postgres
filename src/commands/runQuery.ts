import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

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

    let editor = vscode.window.activeTextEditor;
    let querySelection = null;

    // Calculate the selection if we have a selection, otherwise we'll use null to indicate
    // the entire document is the selection
    if (!editor.selection.isEmpty) {
      let selection = editor.selection;
      querySelection = {
        startLine: selection.start.line,
        startColumn: selection.start.character,
        endLine: selection.end.line,
        endColumn: selection.end.character
      }
    } else {
      querySelection = {
        startLine: 0,
        startColumn: 0,
        endLine: editor.document.lineCount
        //endColumn: editor.document.lineAt(editor.document.lineCount).range.end.
      }
    }

    // Trim down the selection. If it is empty after selecting, then we don't execute
    let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
    if (editor.document.getText(selectionToTrim).trim().length === 0) {
      vscode.window.showWarningMessage('No SQL found to run');
      return;
    }

    let sql = editor.document.getText(selectionToTrim);
    return Database.runQuery(sql, editor, connection);
  }
}