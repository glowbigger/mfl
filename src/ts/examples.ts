// created by build-examples.ts, do not edit directly

const examples: { [key: string]: string } = {
	'hello world':
	`print 'hello world';`,

	'array-access':
	`// simple
let primes = [2, 3, 5, 7, 11];
print primes[1]; // 3

// accessing an element in a multi-dimensional array
let identity_matrix: [[ num ]] = [[ 1, 0 ], 
                                  [ 0, 1 ]];
print identity_matrix[1][1]; // 1

// accessing an element in an array returned from a function
let fun: () => [[ num ]] = fn () => [[ num ]] {
  return [[ 0 ]];
};
print fun()[0];

let get_3x3_identity_matrix: () => [[ num ]] =
fn () => [[ num ]] {
  let identity_matrix: [[ num ]] = [[ 1, 0, 0 ], 
                                    [ 0, 1, 0 ],
                                    [ 0, 0, 1 ]];
  return identity_matrix;
};
print get_3x3_identity_matrix()[0][0]; // 1

// calling a function in an array
let arr: [ () => str ] = [ fn () => str { return 'hi0'; },
                           fn () => str { return 'hi1'; } ];
print arr[1](); // hi1

// calling an anonymous array
print [ 5 of 'a' ][4]; // a
`,

	'array-assignment':
	`// changing a one-dimensional array
let arr: [ str ] = [ 'a', 'b', 'c' ];
print arr[0]; // a
arr[0] = 'z';
print arr[0];

// changing a two-dimensional array
let arr: [[ num ]] = [[1, 2], [3, 4]];
print arr; // 1
arr[0][0] = 2;
print arr;
arr[0] = [5, 6];
print arr;
`,

	'array-declaration':
	`// basic array of bools
let array = [ true, true, false ];
print array;

// 2d array (5x5) array of 0s
let array = [ 5 of [ 5 of 0 ] ];
print array;

// empty array of string array type
let array: [ str ] = [ 0 of '' ];
print array;

// array of arrays
let array: [ str ] = [ 'str' ];
print array;

// array of array of functions
let fun = fn () => str return 'hi'; ;
let array: [[ () => str ]] = [ [ fun, fun ], [ fun ] ];
print array;
`,

	'basic-variables':
	`let number: num = 5;
let string: str = "hey";
let boolean: bool = true;
print number;
print string;
print boolean;
`,

	'break':
	`let i = 0;
while i < 10 do {
  print i;
  if i == 3 then { 
    print "break";
    break; 
  }
  i = i + 1;
}
`,

	'function-calls':
	`let fun = fn(x: str) => str { return x; };
print fun('hello functions');

let add = fn(x: num, y: num) => num {
  return x + y;
};

print add(2, 2);
`,

	'function-return-function':
	`let returnAdder = fn () => () => num {
  let counter = 0;
  return fn () => num { 
    counter = counter + 1;
    return counter;
  };
};

// this adder has its own counter variable
let adder1 = returnAdder();
print adder1(); // 1
print adder1(); // 2
print adder1(); // 3

// this adder has its own counter variable
let adder2 = returnAdder();
print adder2(); // 1
print adder2(); // 2

// modifying adder2's counter won't affect adder1's counter
print adder1(); // 4

// this adder has its own counter variable that is not bound to a variable
print returnAdder()(); // 1

// so the counter is not permanent
print returnAdder()(); // 1
`,

	'function-return-values':
	`let return3 = fn () => num return 3; ;

let returnX = fn (x: str) => str return x; ;

let add = fn (x: num, y: num) => num {
  return x + y;
};

print return3();
print add(2, 2);
print returnX('hello returns');
`,

	'if-else':
	`if (1 < 2)
then
  print "yes";
else
  print "no";
`,

	'logical-or-and':
	`if (true or false) then
  print "hi";
if (true and false) then
  print "hello";

print false or false and true;
`,

	'pass-by-value':
	`// all values are passed by value
let x = 2;
print x;
let changer = fn (n: num) => num {
  n = 1;
  return 0;
};
changer(x);
print x;

print x; // x is still 2

let array = [1, 1];
let changer = fn (arr: [ num ]) => num {
  arr = [0, 0];
  return 0;
};
changer(array);
print array; // the array did not change
`,

	'recursion':
	`// a simple recursion to print 5 4 3 2 1
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
`,

	'resolver':
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
`,

	'scope':
	`let a: str = "global a";
let b: str = "global b";
let c: str = "global c";
{
  let a: str = "outer a";
  let b: str = "outer b";
  {
    let a: str = "inner a";
    print a;
    print b;
    print c;
  }
  print a;
  print b;
  print c;
}
print a;
print b;
print c;
`,

	'variable-assignment':
	`let x: num = 5;
print x;

let y: num = 4;
let z: num = 3;
x = y = z; // the same as x = (y = z);

print x; // y becomes z, which is 3, and x becomes y, which became 3
`,

	'while':
	`print 'while';

let i = 0;

while i < 10 do {
  print i;
  i = i + 1;
}

// nested while
print '';
print 'nested while';

let i = 0;

while i <= 5 do {
  print 'i: ' + i;
  i = i + 1;

  let j = 0;
  while j < i do {
    print 'j: ' + j;
    j = j + 1;
  }
}
`,

};

export default examples;