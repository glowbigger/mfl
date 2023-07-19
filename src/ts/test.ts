import { readFileSync, readdirSync } from 'fs';
import run from './run';

// runs a given file or an interactive prompt
function test(): void {
  const testPath = __dirname + '/../../test';
  const successPath: string = `${testPath}/success/`;
  const failurePath: string = `${testPath}/failure/`;

  // run each file in the success directory, report whether the file ran or not
  const successFiles: string[] = readdirSync(successPath);
  for (const fileString of successFiles) {
    const contentBuffer = Buffer.from(fileString, 'utf8')
    const contentString = readFileSync(successPath + contentBuffer).toString();

    // run the file, report whether it was successful or not
    process.stdout.write(`Running ${fileString}... `);
    const output: [string, boolean] = run(contentString);
    const hadErrors: boolean = output[1];
    console.log(hadErrors ? 'failure' : 'success');
  }

  // process the failure directory, source code which should have errors
  const failureFiles: string[] = readdirSync(failurePath);
  for (const fileString of failureFiles) {
    const contentBuffer = Buffer.from(fileString, 'utf8')
    const contentString = readFileSync(failurePath + contentBuffer).toString();

    // run the file, report whether it was successful or not
    process.stdout.write(`Running ${fileString}... `);
    const output: [string, boolean] = run(contentString);
    const hadErrors: boolean = output[1];
    console.log(hadErrors? 'failure' : 'success');
  }
}

if (require.main === module) {
  test();
}
