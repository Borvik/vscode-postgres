import { selectTopCommand } from './selectTop';
import { TableNode } from "../tree/tableNode";

export class runSelectTop1000Command extends selectTopCommand {
  async run(treeNode: TableNode) {
    return super.run(treeNode, 1000, false, true);
  }
}