// this script will be bundled using webpack for use in the playground

import run from '../lang/run';
import examples from './examples';
import highlight from './highlight';

//======================================================================
// labels
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

  // run the code, measure its execution time
  const start: number = performance.now();
  const [result, hadErrors]: [string, boolean] = run(source);
  const end: number = performance.now();

  // the execution time is in milliseconds by default
  const executionTime: number = end - start;

  outputBox.innerHTML = result;

  // set the status indicator
  if (hadErrors) {
    const message = `Failure (ran in ${executionTime} ms)`;
    statusIndicator.innerHTML = `<span class = 'hl_red'>${message}</span>`;
  } else {
    const message = `Success (ran in ${executionTime} ms)`;
    statusIndicator.innerHTML = `<span class = 'hl_green'>${message}</span>`;
  }
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
