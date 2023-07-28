// created by build-examples.ts, do not edit directly

const examples: [string, string][] = [
	['hello world',
	`print 'hello world';`],
	['recursion',
	`// a simple recursion to print the 5 4 3 2 1
print 'recursive countdown';
let rec = fn (n: num) => num {
  print n;
  if n == 1 then return 1;
  return rec(n - 1);  
};

rec(5);

// fibonacci sequence
print '';
print 'fibonacci sequence';
let fib = fn(n: num) => num {
  if n <= 1 then return n;
  return fib(n - 1) + fib(n - 2);
};

let i = 1;
while i < 20 do {
  print fib(i);
  i = i + 1;
}
`],
	['resolver',
	`let a = "global";
{
  let showA = fn () => num {
    // this should resolve to "global" no matter where and when showA is called
    print a;
    return 0;
  };

  showA();
  let a = "block";
  showA();
}
`],
];

export default examples;