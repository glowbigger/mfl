// this script will be bundled using webpack for use in the web client
// NOTE completely separate from the cli interpreter

import run from './run';
import examples from './examples';

const exampleSelection =
  document.getElementById('example-selection') as HTMLSelectElement;
const runButton =
  document.getElementById('run-button') as HTMLButtonElement;
const inputBox =
  document.getElementById('input') as HTMLDivElement;
const outputBox =
  document.getElementById('output') as HTMLDivElement;

function runCode(): void {
  runButton.disabled = true;
  const source: string = inputBox.innerText;
  const [result, hadErrors]: [string, boolean] = run(source);

  if (!hadErrors)
    outputBox.innerHTML = result;
  else {
    outputBox.innerHTML = result;
  }

  runButton.disabled = false;
}

runButton.addEventListener('click', runCode);
inputBox.innerHTML = examples[0][1];
