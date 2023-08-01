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

// hex color codes taken from style.css
const YELLOW_HEX =
  getComputedStyle(document.body).getPropertyValue('--yellow');
const GREEN_HEX =
  getComputedStyle(document.body).getPropertyValue('--green');
const RED_HEX =
  getComputedStyle(document.body).getPropertyValue('--red');

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

  // run the code, measure its execution time, render its output
  const start: number = performance.now();
  const [result, hadErrors]: [string, boolean] = run(source);
  const end: number = performance.now();
  outputBox.innerHTML = result;

  // the execution time is in milliseconds by default
  // const executionTime: number = Number((end - start).toFixed(3));
  const executionTime: number = Math.round(end - start);

  // set the status indicator
  if (hadErrors) {
    let message: string;
    if (executionTime >= 1000)
      message = `Failure (ran in ~${executionTime / 1000} s)`;
    else
      message = `Failure (ran in ~${executionTime} ms)`;

    statusIndicator.style.color = RED_HEX;
    statusIndicator.innerText = message;
  } else {
    let message: string;
    if (executionTime >= 1000)
      message = `Success (ran in ~${executionTime / 1000} s)`;
    else
      message = `Success (ran in ~${executionTime} ms)`;

    statusIndicator.style.color = GREEN_HEX;
    statusIndicator.innerText = message;
  }
}

//======================================================================
// script
//======================================================================

// create examples dropdown
for (const exampleName of Object.keys(examples))
  exampleSelection.add(new Option(exampleName));
exampleSelection.addEventListener('input', selectExample);
selectExample(); // set the default example

// run button functionality, display a loading message before running the code
runButton.addEventListener('click', () => {
  statusIndicator.style.color = YELLOW_HEX;
  statusIndicator.innerText = 'Running...';
  // this forces the page to be redrawn to show the above indicator
  setTimeout(runCode, 1);
});

// disable spellcheck in editor, requires refreshing the editor
editor.spellcheck = false;
editor.focus();
editor.blur();

// highlight the editor code by default and whenever the editor code changes
editor.addEventListener('input', applyHighlight);
applyHighlight();
