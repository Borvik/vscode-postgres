import BaseCommand from "../common/baseCommand";
import { TableNode } from "../tree/tableNode";
import * as vscode from 'vscode';

export class copyTableNameCommand extends BaseCommand {

  async run(tableNode: TableNode) {
    vscode.env.clipboard.writeText(tableNode.table);
  }

}