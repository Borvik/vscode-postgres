import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { ConnectionNode } from "../tree/connectionNode";
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { IConnection } from "../common/IConnection";
import { Constants } from "../common/constants";
import { Global } from "../common/global";
import { ConnectionQuickPickItem } from "../common/IConnQuickPick";

'use strict';

export class deleteConnectionCommand extends BaseCommand {
  async run(connectionNode: ConnectionNode) {
    let connections = Global.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    if (connectionNode) {
      await deleteConnectionCommand.deleteConnection(connections, connectionNode.id);
      return;
    }
    
    let hosts: ConnectionQuickPickItem[] = [];
    for (const k in connections) {
      if (connections.hasOwnProperty(k)) {
        hosts.push({
          label: connections[k].label || connections[k].host,
          connection_key: k
        });
      }
    }

    const hostToDelete = await vscode.window.showQuickPick(hosts, {placeHolder: 'Select a connection to delete', matchOnDetail: false});
    if (!hostToDelete) return;

    await deleteConnectionCommand.deleteConnection(connections, hostToDelete.connection_key);
  }

  private static async deleteConnection(connections: { [key: string]: IConnection }, key: string) {
    delete connections[key];
    
    await Global.context.globalState.update(Constants.GlobalStateKey, connections);
    await Global.keytar.deletePassword(Constants.ExtensionId, key);

    PostgreSQLTreeDataProvider.getInstance().refresh();
    vscode.window.showInformationMessage('Connection Deleted');
  }
}