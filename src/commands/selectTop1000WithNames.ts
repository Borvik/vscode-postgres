import { selectTopCommand } from './selectTop';
import { TableNode } from "../tree/tableNode";

export class selectTop1000WithNamesCommand extends selectTopCommand {

  async run(treeNode: TableNode) {
    return super.run(treeNode, 1000, true);
  }

}