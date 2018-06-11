import { selectTopCommand } from "../commands/selectTop";
import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class selectTop1000Command extends selectTopCommand {
   async run(treeNode: TableNode) {
    return super.run(treeNode, 1000);
   }
}
