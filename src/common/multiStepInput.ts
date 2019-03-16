import { QuickPickItem, window, Disposable, CancellationToken, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';

export type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

export class InputFlowAction {
  private constructor() {}
  static Back = new InputFlowAction();
  static Cancel = new InputFlowAction();
  static Resume = new InputFlowAction();
}

export interface MultiStepInputParameters {
  title: string;
  step: number;
  totalSteps: number;
  ignoreFocusOut?: boolean;
  shouldResume?: () => Thenable<boolean>;
  buttons?: QuickInputButton[];
  placeholder?: string;
}

export interface InputBoxParameters extends MultiStepInputParameters {
  value: string;
  prompt: string;
  password?: boolean;
  validate: (value: string) => Promise<string | undefined>;
  convert?: (value: string) => Promise<any>;
}

export interface QuickPickParameters<T extends QuickPickItem> extends MultiStepInputParameters {
  matchOnDescription?: boolean;
  matchOnDetail?: boolean;
  canPickMany?: boolean;
  items: T[];
  activeItem?: T;
  convert?: (value: T) => Promise<any>;
}

export class MultiStepInput {

  private current?: QuickInput;
  private steps: InputStep[] = [];
  
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }

  get CurrentStepNumber() { return this.steps.length; }

  private async stepThrough<T>(start: InputStep): Promise<boolean> {
    let step: InputStep | void = start;
    let inputCompleted = true;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      }
      catch(err) {
        if (err === InputFlowAction.Back) {
          this.steps.pop();
          step = this.steps.pop();
        }
        else if (err === InputFlowAction.Resume) {
          step = this.steps.pop();
        }
        else if (err === InputFlowAction.Cancel) {
          step = undefined;
          inputCompleted = false;
        }
        else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
    return inputCompleted;
  }

  redoLastStep() {
    // const input = window.createInputBox();
    // if (this.current) {
    //   this.current.dispose();
    // }
    // this.current = input;
    throw InputFlowAction.Back;
  }

  async showInputBox<P extends InputBoxParameters>({title, step, totalSteps, value, prompt, placeholder, ignoreFocusOut, password, validate, convert, buttons, shouldResume}: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<any>((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value || '';
        input.prompt = prompt;
        input.placeholder = placeholder;
        input.password = !!password;
        input.ignoreFocusOut = !!ignoreFocusOut;
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || [])
        ];

        let validating = validate('');
        disposables.push(
          input.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.Back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value;
            input.enabled = false;
            input.busy = true;
            if (!(await validate(value))) {
              if (convert) {
                resolve(await convert(value))
              } else {
                resolve(value);
              }
            }
            input.enabled = true;
            input.busy = false;
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;
            const validationMessage = await current;
            if (current === validating) {
              input.validationMessage = validationMessage;
            }
          }),
          input.onDidHide(async () => {
            try {
              reject(shouldResume && await shouldResume() ? InputFlowAction.Resume : InputFlowAction.Cancel);
            }
            catch(errorInShouldResume) {
              reject(errorInShouldResume);
            }
          })
        );

        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        setTimeout(() => input.show(), 5);
      });
    }
    finally {
      disposables.forEach(d => d.dispose());
    }
  }

  async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({title, step, totalSteps, items, activeItem, placeholder, ignoreFocusOut, matchOnDescription, matchOnDetail, canPickMany, convert, buttons, shouldResume}: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<any>((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.placeholder = placeholder;
        input.ignoreFocusOut = !!ignoreFocusOut;
        input.matchOnDescription = !!matchOnDescription;
        input.matchOnDetail = !!matchOnDetail;
        input.canSelectMany = !!canPickMany;
        input.items = items;
        if (activeItem) {
          input.activeItems = [activeItem];
        }
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
					...(buttons || [])
        ];
        disposables.push(
          input.onDidTriggerButton(item => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.Back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidAccept(async () => {
            if (!convert) convert = async (value: T) => value;
            let convertedItems: any[] = await Promise.all(input.activeItems.map(v => convert(v)));
            if (canPickMany) {
              resolve(convertedItems);
            } else {
              resolve(convertedItems[0]);
            }
          }),
          input.onDidHide(async () => {
            try {
              reject(shouldResume && await shouldResume() ? InputFlowAction.Resume : InputFlowAction.Cancel);
            }
            catch(errorInShouldResume) {
              reject(errorInShouldResume);
            }
          })
        );

        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        setTimeout(() => input.show(), 5);
      });
    }
    finally {
      disposables.forEach(d => d.dispose());
    }
  }
}