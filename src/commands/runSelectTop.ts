import { selectTopCommand } from './selectTop';
import { TableNode } from "../tree/tableNode";

export class runSelectTopCommand extends selectTopCommand {
  async run(treeNode: TableNode) {
    return super.run(treeNode, 0, false, true);
  }
}