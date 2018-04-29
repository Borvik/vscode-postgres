import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";

'use strict';

export class setActiveConnectionCommand extends BaseCommand {
  run(connection: IConnection) {
    EditorState.connection = connection;
  }
}