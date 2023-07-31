// this script will be bundled using webpack for use in the web client

import run from '../run';
import examples from './examples';
import highlight from './highlight';

//======================================================================
// variables for html elements
//======================================================================

const exampleSelection =
  document.getElementById('example-selection') as HTMLSelectElement;
const runButton =
  document.getElementById('run-button') as HTMLButtonElement;
const editor =
  document.getElementById('editor') as HTMLDivElement;
const highlighter =
  document.getElementById('highlighter') as HTMLDivElement;
const outputBox =
  document.getElementById('outputBox') as HTMLDivElement;
const statusIndicator =
  document.getElementById('status') as HTMLHeadingElement;

//======================================================================
// helpers
//======================================================================

// set the editor text to be whatever example is selected
function selectExample(): void {
  const exampleName: string = exampleSelection.value;
  const exampleText: string = examples[exampleName];
  editor.innerHTML = exampleText;
  applyHighlight();
}

// see highlight.ts
function applyHighlight(): void {
  highlighter.innerHTML = highlight(editor.innerHTML);
}

function runCode(): void {
  const source: string = editor.innerText;
  const [result, hadErrors]: [string, boolean] = run(source);
  outputBox.innerHTML = result;

  // set the status indicator
  if (hadErrors)
    statusIndicator.innerHTML = `<span class='hl_red'>Failure</span>`;
  else
    statusIndicator.innerHTML = `<span class='hl_green'>Success</span>`;
}

//======================================================================
// script
//======================================================================

// create examples dropdown
for (const exampleName of Object.keys(examples))
  exampleSelection.add(new Option(exampleName));
exampleSelection.addEventListener('input', selectExample);
runButton.addEventListener('click', runCode);
selectExample(); // set the default example

// disable spellcheck in editor, requires refreshing the editor
editor.spellcheck = false;
editor.focus();
editor.blur();

// highlight the editor code by default and whenever the editor code changes
editor.addEventListener('input', applyHighlight);
applyHighlight();
