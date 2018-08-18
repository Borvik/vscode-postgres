import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { IColumn } from "./IColumn";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

export class ColumnNode implements INode {
  
  constructor(private readonly connection: IConnection, private readonly tablename: string, private readonly column: IColumn) {}

  public async getChildren(): Promise<INode[]> { return []; }
  public getTreeItem(): TreeItem {
    let icon = 'column';
    let label = `${this.column.column_name} : ${this.column.data_type}`;
    let tooltip = label;

    if (this.column.primary_key) icon = 'p-key';
    if (this.column.foreign_key) {
      icon = 'f-key';
      tooltip += '\n' + this.column.foreign_key.constraint;
      tooltip += ' -> ' + this.column.foreign_key.table + '.' + this.column.foreign_key.column;
    }

    return {
      label,
      tooltip,
      collapsibleState: TreeItemCollapsibleState.None,
      contextValue: 'vscode-postgres.tree.column',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/${icon}.svg`),
        dark: path.join(__dirname, `../../resources/dark/${icon}.svg`)
      }
    };
  }

}