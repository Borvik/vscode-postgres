import BaseCommand from "../common/baseCommand";
import { SchemaNode } from "../tree/schemaNode";
import * as vscode from 'vscode';

export class copySchemaNameCommand extends BaseCommand {

  async run(schemaNode: SchemaNode) {
    vscode.env.clipboard.writeText(schemaNode.schemaName);
  }

}