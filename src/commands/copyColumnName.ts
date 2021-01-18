import BaseCommand from "../common/baseCommand";
import { ColumnNode } from "../tree/columnNode";
import * as vscode from 'vscode';

export class copyColumnNameCommand extends BaseCommand {

  async run(columnNode: ColumnNode) {
    vscode.env.clipboard.writeText(columnNode.column.column_name);
  }

}