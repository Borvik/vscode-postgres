import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Global } from "../common/global";

'use strict';

export class setActiveConnectionCommand extends BaseCommand {
  run(connection: IConnection) {
    let config = Global.Configuration.get<string>("setConnectionFromExplorer");
    if (config == "always" || (config == "ifunset" &&
      (!EditorState.connection || !EditorState.connection.host ||
        (connection.database && !EditorState.connection.database)))) {
      EditorState.connection = connection;
    }
  }
}