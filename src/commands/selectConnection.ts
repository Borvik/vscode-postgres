import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from "../common/global";
import { Constants } from "../common/constants";
import { ConnectionQuickPickItem } from "../common/IConnQuickPick";

'use strict';

export class selectConnectionCommand extends BaseCommand {
  async run() {
    // can we even select a connection it gets stored against a document uri
    if (!vscode.window || !vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || !vscode.window.activeTextEditor.document.uri) {
      // alert and return;
      vscode.window.showWarningMessage('Unable to select a connection - a document is not active');
      return;
    }

    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    let hosts: ConnectionQuickPickItem[] = [];
    hosts.push({
      label: '$(plus) Create new connection',
      connection_key: '',
      is_new_selector: true
    });

    for (const k in connections) {
      if (connections.hasOwnProperty(k)) {
        hosts.push({
          label: connections[k].label || connections[k].host,
          connection_key: k
        });
      }
    }

    const hostToSelect = await vscode.window.showQuickPick(hosts, {placeHolder: 'Select a connection', matchOnDetail: false});
    if (!hostToSelect) return;

    if (!hostToSelect.is_new_selector) {
      let connection: IConnection = Object.assign({}, connections[hostToSelect.connection_key]);
      if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
        connection.password = await Global.keytar.getPassword(Constants.ExtensionId, hostToSelect.connection_key);
      }
      EditorState.connection = connection;
      await vscode.commands.executeCommand('vscode-postgres.selectDatabase');
      return;
    }

    let result = await vscode.commands.executeCommand('vscode-postgres.addConnection');
    if (!result) return;
    await vscode.commands.executeCommand('vscode-postgres.selectDatabase');
  }
}