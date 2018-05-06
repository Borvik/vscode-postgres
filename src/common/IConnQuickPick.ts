import { QuickPickItem } from "vscode";

export interface ConnectionQuickPickItem extends QuickPickItem {
  readonly connection_key: string;
  readonly is_new_selector?: boolean;
}

export interface SaveTableQuickPickItem extends QuickPickItem {
  readonly index: number;
}