// created by build-examples.ts, do not edit directly

const examples: { [key: string]: string } = {
	'1-introduction':
	`// Welcome to the playground for mfl, which stands for 'my first language',
// a statically-typed scripting language.

// The dropdown menu above can be used to load different scripts demonstrating
// different features of the language.

// Click the run button above to run code written here (nothing will happen for
// this file, of course).
`,

	'2-statements':
	`// MFL programs consist of statements ending with a closing semicolon.

// Print statements use the built-in 'print' keyword.
print 'hello';

// Variables can be declared with 'let'. The types will be discussed later.
let x = 69; let y = 'im a string'; let z = true;
print x; print y; print z;

// Variables can then be assigned.
x = 5; y = 'hello'; z = false;
print x; print y; print z;

// Block statements are wrapped in '{' and '}' and have their own scope.
let x = 'outer'; let y = 'outer';
{
  let x = 'inner, not outer';
  print x; print y;
}

// If-else statements use a 'if' statement 'then' statement 'else' syntax.
if 1 > 0 then
  print 'yes';

if 1 > 0 then
  print 'yes';
else
  print 'no';

// WARNING: be sure to use '{' and '}' for multi-line statements
if true then {
  print 'line 1';
  print 'line 2';
}

// While loops use a 'while' condition 'do' statement syntax.
let i = 0;
while i < 5 do {
  print i;
  i = i + 1;
}

// Use the 'break' keyword to escape a while loop.
while true do {
  print 'forever?';
  break;
}

// Finally, C-style comments are supported.

// this is a one-line comment
/* this is a multi-line comment */
/* this is a /* nested */ comment */
`,

	'3-types':
	`// The primitive variable types are numbers, strings, and booleans. The types can
// be hinted ('num' for number, 'str' for string, 'bool' for boolean).
let a: num = 0;
let b: num = 1.5;
let c: str = 'string';
let d: bool = true;
print a; print b; print c; print d;

// These statements are commented out, but will result in type-checking errors.
/*
let a: num = true;
let b: str = 5;
*/

// Types are not mutable, since the language is statically-typed.
/*
let n: num = 5;
n = 'string'; // error here
*/
let n: num = 5;
let n: str = 'string'; // this is fine

// Type inference is supported, so hints can be ommitted.
let x = 5; // x is a num
let y = true; // y is a bool
print x; print y;

// Basic arithmetic operators are supported, as well as negative numbers.
let x = (((1 + 1) / 2) * 5) - 1; print x;
let x = -0.5 / 1.2; print x;

// The standard relations are also supported.
print 1 > 0;
print 1 >= 0;
print 1 < 0;
print 1 <= 0;
print 1 == 0;
print 1 != 0;

// Strings can be concatenated to numbers and other strings using '+'.
let s1 = 'abc'; let s2 = 'def';
print s1 + (s2 + 5);

// The basic boolean operators are supported.
print (true or false);
print (true and false);

// There are two other types not shown here, functions and arrays. They are the
// subjects of the next sections.
`,

	'4-functions':
	`// Functions are created with the 'fn' keyword, and are anonymous (unnamed) by
// default. The following anonymous functions sit in their own statements, and so
// the ending semicolon is necessary.

// This is a function that returns a string.
// NOTE the return type must be specified.
fn() => str { return 'a string'; } ;

// This is a function that takes a number and returns it.
// NOTE the types of the parameters must be specified.
fn(x: num) => num { return x; } ;

// Functions are first-class objects, and can be assigned to variables so that
// they can be called.
// NOTE void functions are not supported.

let returnHello = fn() => str {
  return 'hello';
};
print returnHello();

let addNums = fn(x: num, y: num) => num {
  return x + y;
};
print addNums(1, 2);

// Functions can be type-hinted too using () => notation.
let conditionalPrint: (num, str) => str =
fn(x: num, message: str) => str {
  if x > 0 then return 'x greater than 0';
  return message;
};
print conditionalPrint(1, 'i wont get printed');
print conditionalPrint(0, 'i will get printed');

// Functions can return other functions, since functions are first-class.
// NOTE this function returns a function taking no arguments and returning a num
let returnAFunctionThatReturnsFive =
fn() => () => num { 
  return fn() => num { return 5; } ;
};
let iReturnFive = returnAFunctionThatReturnsFive();
print iReturnFive();

// Naturally, functions can also take other functions as arguments.
let returnSumOfOutputs = fn(func1: () => num, func2: () => num) => num {
  return func1() + func2();
};
print returnSumOfOutputs(iReturnFive, iReturnFive);

// Recursion works too. Here's the first 20 fibonacci numbers.
let fib = fn(n: num) => num {
  if n <= 1 then return n;
  return fib(n - 1) + fib(n - 2);
};

let i = 1; let max = 20; // WARNING: setting max to more than 25 or so will make
                         // the printing take a long time
while i < max do {
  print fib(i);
  i = i + 1;
}
`,

	'5-arrays':
	`// Arrays are also first-class objects. They can be created by specifying the
// elements in brackets or by providing a number along with an expression
print [ 1, 2, 3 ];
print [ 'a', 'b', 'c' ];
print [ 5 of true ];

let fnArr = [ fn () => num { return 0; }, fn () => num { return 1; } ];
print fnArr[0]();
print fnArr[1]();

// Array types given by wrapping '[' and ']' around the inner type in the array
let arr1: [ num ] = [ 1, 2, 3 ];
let arr2: [ str ] = [ 'a', 'b', 'c' ];
let arr3: [ bool ] = [ 5 of true ];

let getFirstNum = fn (arr: [ num ]) => num {
  return arr[0];
};
print getFirstNum([3, 2, 1, 0]);

// NOTE empty arrays can only be specified using 0 along with some expression
/*
let arr = []; // this won't work because the type of the array is unknown
*/
let emptyNumArr = [ 0 of 0 ]; // this is fine, the type is [ num ]
let emptyStrArr = [ 0 of '' ]; // this is fine too, the type is [ str ]
print emptyNumArr; print emptyStrArr;

// Array values can be reassigned by specifying the index
let arr = [ 0, 1 ]; print arr;
arr[0] = 1; print arr;

let arr = [[ 0, 0 ], [ 0, 0 ]]; print arr;
arr[0][1] = 4; print arr;

// Arrays can only contain a single type, and they are not dynamic, in other
// words the capacity cannot be changed
let arr: [ num ] = [ 0, 1, 2 ];
/*
arr[0] = 'a'; // error, type of an element must be a num
arr[3] = 3; // error, index out of range
*/

// Arrays can contain other arrays, allowing for multi-dimensional arrays
let arr: [[ str ]] = [3 of [ 'dog', 'cat' ]];
let idMatrix: [[ num ]] = [[ 1, 0, 0],
                           [ 0, 1, 0],
                           [ 0, 0, 1]];

// NOTE the reason why fixed-length arrays are the only supported data structure
// is because other common data structures, linked lists, dictionaries, dynamic 
// arrays, etc. can be built in the language using fixed-length arrays and
// classes. Unfortunately, classes are not supported at the moment.
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

while true do {
  print 'forever?';
  break;
}
`,

	'fizzbuzz':
	``,

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