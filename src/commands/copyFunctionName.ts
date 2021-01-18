import BaseCommand from "../common/baseCommand";
import { FunctionNode } from "../tree/functionNode";
import * as vscode from 'vscode';

export class copyFunctionNameCommand extends BaseCommand {

  async run(functionNode: FunctionNode) {
    vscode.env.clipboard.writeText(functionNode.func);
  }

}