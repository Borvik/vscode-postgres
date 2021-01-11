import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { FunctionNode } from "./functionNode";
import { InfoNode } from "./infoNode";
import { SqlQueryManager } from '../queries';

export class FunctionFolderNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly schemaName: string)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: "Functions",
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.function-folder',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/func-folder.svg`),
        dark: path.join(__dirname, `../../resources/dark/func-folder.svg`)
      }
    };
  }
  
  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetFunctions, [this.schemaName]);

      return res.rows.map<FunctionNode>(func => {
        var args = func.argument_types != null ? func.argument_types.split(',').map(arg => {
          return String(arg).trim();
        }) : [];
        return new FunctionNode(this.connection, func.name, args, func.result_type, func.schema, func.description);
      })
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}