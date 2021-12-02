import * as vscode from 'vscode';
import { EOL } from 'os';

import * as wasm from '../rust/change_case/pkg/change_case';

const CMD_FN = {
  lower: wasm.lower,
  upper: wasm.upper,
  title: wasm.title,
  snake: wasm.snake,
  camel: wasm.camel,
  kebab: wasm.kebab,
  constant: wasm.constant
};

export function activate(context: vscode.ExtensionContext) {
	vscode.commands.registerCommand('case.lower', () => changeCase('lower'));
	vscode.commands.registerCommand('case.upper', () => changeCase('upper'));
	vscode.commands.registerCommand('case.title', () => changeCase('title'));
	vscode.commands.registerCommand('case.snake', () => changeCase('snake'));
	vscode.commands.registerCommand('case.camel', () => changeCase('camel'));
	vscode.commands.registerCommand('case.kebab', () => changeCase('kebab'));
	vscode.commands.registerCommand('case.constant', () => changeCase('constant'));
  // context.subscriptions.push(disposable);
}

function changeCase(fn: string) {
  const editor = vscode.window.activeTextEditor;
  const { document, selections } = editor;
  let replacementActions = [];
  editor.edit(editBuilder => {
    replacementActions = selections.map(selection => {
      const { text, range } = getSelectedText(selection, document);
      let replacement;
      let offset;
      if(selection.isSingleLine) {
        replacement = CMD_FN[fn](text);
        offset = replacement.length - text.length;
      } else {
          const lines = document.getText(range).split(EOL);
          const replacementLines = lines.map(x => CMD_FN[fn](x));
          replacement = replacementLines.reduce((acc, v) => (!acc ? '' : acc + EOL) + v, undefined);
          offset = replacementLines[replacementLines.length - 1].length - lines[lines.length - 1].length;
      }
      return {
        text,
        range,
        replacement,
        offset,
        newRange: isRangeSimplyCursorPosition(range)
          ? range
          : new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character + offset)
      };
    });
    replacementActions
      .filter(x => x.replacement !== x.text)
      .forEach(x => {
          editBuilder.replace(x.range, x.replacement);
      });
  }).then(()=>{
    const sortedActions = replacementActions.sort((a, b) => compareByEndPosition(a.newRange, b.newRange));
        const lineRunningOffsets = Array.from(new Set(sortedActions.map(s => s.range.end.line)))
            .map(lineNumber => ({ lineNumber, runningOffset: 0 }));

        const adjustedSelectionCoordinateList = sortedActions.map(s => {
            const lineRunningOffset = lineRunningOffsets.filter(lro => lro.lineNumber === s.range.end.line)[0];
            const range = new vscode.Range(
                s.newRange.start.line, s.newRange.start.character + lineRunningOffset.runningOffset,
                s.newRange.end.line, s.newRange.end.character + lineRunningOffset.runningOffset
            );
            lineRunningOffset.runningOffset += s.offset;
            return range;
        });
        editor.selections = adjustedSelectionCoordinateList.map(r => toSelection(r));
  });
}


function getSelectedTextIfOnlyOneSelection(): string {
  const editor = vscode.window.activeTextEditor;
  const { document, selection, selections=[] } = editor || {};
  if (selections.length > 1 || selection?.start?.line !== selection?.end?.line) {return 'undefined';}
  return getSelectedText(selections[0], document).text;
}

function getSelectedText(selection: vscode.Selection, document: vscode.TextDocument): { text: string, range: vscode.Range } {
  let range: vscode.Range;

  if (isRangeSimplyCursorPosition(selection)) {
      range = getChangeCaseWordRangeAtPosition(document, selection.end);
  } else {
      range = new vscode.Range(selection.start, selection.end);
  }

  return {
      text: range ? document.getText(range) : '',
      range
  };
}

const CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT = /([\w_\-\/$]+)/;

function getChangeCaseWordRangeAtPosition(document: vscode.TextDocument, position: vscode.Position) {

    const regex = CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT;

    const range = document.getWordRangeAtPosition(position);
    if (!range) {return undefined;}

    let startCharacterIndex = range.start.character - 1;
    while (startCharacterIndex >= 0) {
        const charRange = new vscode.Range(
            range.start.line, startCharacterIndex,
            range.start.line, startCharacterIndex + 1
        );
        const character = document.getText(charRange);
        if (character.search(regex) === -1) { // no match
            break;
        }
        startCharacterIndex--;
    }

    const lineMaxColumn = document.lineAt(range.end.line).range.end.character;
    let endCharacterIndex = range.end.character;
    while (endCharacterIndex < lineMaxColumn) {
        const charRange = new vscode.Range(
            range.end.line, endCharacterIndex,
            range.end.line, endCharacterIndex + 1
        );
        const character = document.getText(charRange);
        if (character.search(regex) === -1) {
            break;
        }
        endCharacterIndex++;
    }

    return new vscode.Range(
        range.start.line, startCharacterIndex + 1,
        range.end.line, endCharacterIndex
    );
}

function isRangeSimplyCursorPosition(range: vscode.Range): boolean {
  return range.start.line === range.end.line && range.start.character === range.end.character;
}

function toSelection(range: vscode.Range): vscode.Selection {
  return new vscode.Selection(
      range.start.line, range.start.character,
      range.end.line, range.end.character
  );
}

function compareByEndPosition(a: vscode.Range | vscode.Selection, b: vscode.Range | vscode.Selection): number {
  if (a.end.line < b.end.line) {return -1;}
  if (a.end.line > b.end.line) {return 1;}
  if (a.end.character < b.end.character) {return -1;}
  if (a.end.character > b.end.character) {return 1;}
  return 0;
}

export function deactivate() {}
