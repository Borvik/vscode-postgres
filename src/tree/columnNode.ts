import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { IColumn } from "./IColumn";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

export class ColumnNode implements INode {
  
  constructor(private readonly connection: IConnection, private readonly tablename: string, private readonly column: IColumn) {}

  public async getChildren(): Promise<INode[]> { return []; }
  public getTreeItem(): TreeItem {
    let icon = this.column.primary_key ? 'p-key' : 'column';
    return {
      label: `${this.column.column_name} : ${this.column.data_type}`,
      collapsibleState: TreeItemCollapsibleState.None,
      contextValue: 'vscode-postgres.tree.column',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/${icon}.svg`),
        dark: path.join(__dirname, `../../resources/dark/${icon}.svg`)
      }
    };
  }

}