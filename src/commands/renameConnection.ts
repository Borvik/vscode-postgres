import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Global } from "../common/global";
import { ConnectionQuickPickItem } from "../common/IConnQuickPick";
import { Constants } from "../common/constants";
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";

'use strict';

export class renameConnectionCommand extends BaseCommand {
  async run(treeNode: any) {
    let selectedConnection: IConnection = null;
    let selectedConnId: any = null;

    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) {
      vscode.window.showWarningMessage('There are no connections available to rename');
      return;
    }

    if (treeNode && treeNode.connection) {
      selectedConnection = Object.assign({}, treeNode.connection);
      delete selectedConnection.password;
      selectedConnId = treeNode.id;
    } else {
      let hosts: ConnectionQuickPickItem[] = [];
      for (const k in connections) {
        if (connections.hasOwnProperty(k))
          hosts.push({ label: connections[k].label || connections[k].host, connection_key: k });
      }

      const hostToSelect = await vscode.window.showQuickPick(hosts, {placeHolder: 'Select a connection', matchOnDetail: false});
      if (!hostToSelect) return;

      selectedConnection = Object.assign({}, connections[hostToSelect.connection_key]);
      selectedConnId = hostToSelect.connection_key;
    }

    const label = await vscode.window.showInputBox({ prompt: "The display name of the database connection", placeHolder: "label", ignoreFocusOut: true });
    selectedConnection.label = label;
    
    connections[selectedConnId] = selectedConnection;

    const tree = PostgreSQLTreeDataProvider.getInstance();
    await tree.context.globalState.update(Constants.GlobalStateKey, connections);
    tree.refresh();
  }
}