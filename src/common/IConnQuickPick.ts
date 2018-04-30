import { QuickPickItem } from "vscode";

export interface ConnectionQuickPickItem extends QuickPickItem {
  readonly connection_key: string;
}

export interface SaveTableQuickPickItem extends QuickPickItem {
  readonly index: number;
}