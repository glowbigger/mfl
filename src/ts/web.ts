// this script will be bundled using webpack for use in the web client
// NOTE completely separate from the cli interpreter

import run from './run';
import examples from './examples';

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

// add examples to dropdown menu
for (const exampleName of Object.keys(examples)) {
  exampleSelection.add(new Option(exampleName));
}

// runs the code in the editor
function runCode(): void {
  const source: string = editor.innerText;
  const [result, hadErrors]: [string, boolean] = run(source);

  if (!hadErrors) {
    outputBox.innerHTML = result;
    statusIndicator.style.color = 'green';
    statusIndicator.innerText = 'SUCCESS';
  } else {
    outputBox.innerHTML = result;
    statusIndicator.style.color = 'red';
    statusIndicator.innerText = 'FAILURE';
  }
}

function selectExample(): void {
  const exampleName: string = exampleSelection.value;
  const exampleText: string = examples[exampleName];
  editor.innerHTML = exampleText;
  highlight();
}

function highlight(): void {
  highlighter.innerHTML = editor.innerHTML;
}

exampleSelection.addEventListener('input', selectExample);
runButton.addEventListener('click', runCode);
selectExample();

// disable spellcheck in editor
editor.spellcheck = false;
editor.focus();
editor.blur();
editor.addEventListener('input', highlight);
highlight();
