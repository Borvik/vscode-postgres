import * as vscode from 'vscode';
import { ResultView } from './resultView';
import { disposeAll } from './common';
import { QueryResults } from '../common/database';

export class ResultsManager implements vscode.WebviewPanelSerializer {
  private static readonly pgsqlResultContextKey = 'vscodePostgresResultFocus';
  private readonly _results: ResultView[] = [];
  private _activeResults: ResultView | undefined = undefined;
  private readonly _disposables: vscode.Disposable[] = [];

  public constructor() {
    this._disposables.push(vscode.window.registerWebviewPanelSerializer(ResultView.viewType, this));
  }

  public dispose(): void {
    disposeAll(this._disposables);
    disposeAll(this._results);
  }

  public refresh() {
    for (const view of this._results) {
      view.refresh();
    }
  }

  public showResults(resource: vscode.Uri, viewColumn: vscode.ViewColumn, res: QueryResults[]): void {
    let view = this.getExistingView(resource);
    if (view) {
      view.reveal(viewColumn);
    } else {
      view = this.createNewView(resource, viewColumn);
    }
    view.update(resource, res);
  }

  public get activeWinResults() {
    if (!this._activeResults) return null;
    return this._activeResults.currentResults;
  }

  public async deserializeWebviewPanel(webview: vscode.WebviewPanel, state: any): Promise<void> {
    const view = await ResultView.revive(webview, state);
    this.registerView(view);
  }

  private getExistingView(resource: vscode.Uri): ResultView | undefined {
    return this._results.find(view => {
      return view.matchesResource(resource);
    });
  }

  private createNewView(resource: vscode.Uri, viewColumn: vscode.ViewColumn): ResultView {
    const view = ResultView.create(resource, viewColumn);

    this._activeResults = view;
    return this.registerView(view);
  }

  private registerView(view: ResultView): ResultView {
    this._results.push(view);

    view.onDispose(() => {
      const existing = this._results.indexOf(view);
      if (existing === -1) return;

      this._results.splice(existing, 1);
      if (this._activeResults === view) {
        this._activeResults = undefined;
      }
    });

    view.onDidChangeViewState(({ webviewPanel }) => {
      disposeAll(this._results.filter(otherView => view !== otherView && view!.matches(otherView)));
      vscode.commands.executeCommand('setContext', ResultsManager.pgsqlResultContextKey, webviewPanel.visible && webviewPanel.active);

      this._activeResults = webviewPanel.active ? view : undefined;
    });

    return view;
  }
}