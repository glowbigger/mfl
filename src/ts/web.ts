// this script will be bundled using webpack for use in the web client
// NOTE completely separate from the cli interpreter

import run from './run';

const exampleSelection =
  document.getElementById('example-selection') as HTMLSelectElement;
const runButton =
  document.getElementById('run-button') as HTMLButtonElement;
const inputBox =
  document.getElementById('input') as HTMLDivElement;
const outputBox =
  document.getElementById('output') as HTMLDivElement;

// TODO get the recursion test file as a string
const RECURSION_EXAMPLE: string = ''

async function runCode(): Promise<string> {
  const source: string = inputBox.innerText;
  const [result, hadErrors]: [string, boolean] = run(source);

  return result;
}

async function runButtonPressed(): Promise<void> {
  // FIXME running the code freezes the window for now
  runButton.disabled = true;
  const output: string = await runCode();
  runButton.disabled = false;

  outputBox.innerHTML = output;
}

runButton.addEventListener('click', runButtonPressed);
