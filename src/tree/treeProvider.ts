import * as vscode from 'vscode';
import { INode } from './INode';
import { Constants } from '../common/constants';
import { Global } from '../common/global';
import { IConnection } from '../common/IConnection';
import { ConnectionNode } from './connectionNode';

export class PostgreSQLTreeDataProvider implements vscode.TreeDataProvider<INode> {

  public _onDidChangeTreeData: vscode.EventEmitter<INode> = new vscode.EventEmitter<INode>();
  public readonly onDidChangeTreeData: vscode.Event<INode> = this._onDidChangeTreeData.event;
  private static _instance: PostgreSQLTreeDataProvider = null;

  constructor(public context: vscode.ExtensionContext){ this.refresh(); }

  public static getInstance(context?: vscode.ExtensionContext): PostgreSQLTreeDataProvider {
    if (context && !this._instance) {
      this._instance = new PostgreSQLTreeDataProvider(context);
      context.subscriptions.push(vscode.window.registerTreeDataProvider("postgres", this._instance));
    }
    return this._instance;
  }
  
  public refresh(element?: INode): void {
    this._onDidChangeTreeData.fire(element);
  }

  public getTreeItem(element: INode): Promise<vscode.TreeItem> | vscode.TreeItem {
    return element.getTreeItem();
  }

  public getChildren(element?: INode): Promise<INode[]> | INode[] {
    if (!element) {
      return this.getConnectionNodes();
    }
    return element.getChildren();
  }

  // private async getConnectionNodes(): Promise<ConnectionNode[]> {
  //   const connections = this.context.globalState.get<{[key: string]: IConnection}>(Constants.GlobalStatePostgresSQLConectionsKey);
  //   const ConnectionNodes = [];
  //   if (connections) {
  //     for (const id of Object.keys(connections)) {
  //       const password = await Global.keytar.getPassword(Constants.ExtensionId, id);
  //       ConnectionNodes.push(new ConnectionNode(id, connections[id].host, connections[id].user, password, connections[id].port, connections[id].certPath));
  //       if (!Global.activeConnection) {
  //         Global.activeConnection = {
  //           host: connections[id].host,
  //           user: connections[id].user,
  //           password,
  //           port: connections[id].port,
  //           certPath: connections[id].certPath
  //         };
  //       }
  //     }
  //   }
  //   return ConnectionNodes;
  // }
  private async getConnectionNodes(): Promise<INode[]> {
    const connections = this.context.globalState.get<{[key: string]: IConnection}>(Constants.GlobalStateKey);
    const ConnectionNodes = [];
    if (connections) {
      for (const id of Object.keys(connections)) {
        let connection: IConnection = Object.assign({}, connections[id]);
        if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
          connection.password = await Global.keytar.getPassword(Constants.ExtensionId, id);
        }
        ConnectionNodes.push(new ConnectionNode(id, connection));
      }
    }
    return ConnectionNodes;
  }
}