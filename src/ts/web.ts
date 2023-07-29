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
const statusIndicator =
  document.getElementById('status') as HTMLHeadingElement;

// add examples to dropdown menu
for (const exampleName of Object.keys(examples)) {
  exampleSelection.add(new Option(exampleName));
}

function runCode(): void {
  const source: string = inputBox.innerText;
  const [result, hadErrors]: [string, boolean] = run(source);

  if (!hadErrors) {
    outputBox.innerHTML = result;
    statusIndicator.innerHTML = `<span style='color: green;'>SUCCESS</span>`;
  } else {
    outputBox.innerHTML = result;
    statusIndicator.innerHTML = `<span style='color: red;'>FAILURE</span>`;
  }
}

function selectExample(): void {
  const exampleName: string = exampleSelection.value;
  inputBox.innerHTML = examples[exampleName];
}

exampleSelection.addEventListener("input", selectExample);
runButton.addEventListener('click', runCode);
selectExample();
