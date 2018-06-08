import * as path from 'path';
import * as vscode from 'vscode';
import { INode } from './INode';
import { TreeItemCollapsibleState } from 'vscode';

export class InfoNode implements INode {
  constructor(private readonly label: string) {}

  public getTreeItem(): vscode.TreeItem {
    return {
      label: this.label.toString(),
      collapsibleState: TreeItemCollapsibleState.None,
      contextValue: 'vscode-postgres.tree.error',
      iconPath: {
        light: path.join(__dirname, '../../resources/light/error.svg'),
        dark: path.join(__dirname, '../../resources/dark/error.svg')
      }
    };
  }
  public getChildren(): INode[] { return []; }
}