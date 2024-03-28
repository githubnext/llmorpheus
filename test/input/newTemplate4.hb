Mutation testing is a technique that involves modifying a program in small ways, in
order to find weaknesses in a project's test suite. For example, in the following
code fragment
```
    class Point {
			constructor(public x, public y) {}
		}
	  static foo(a, b) {
			if (<PLACEHOLDER1>) { // original value of PLACEHOLDER1 is a < 0
				throw <PLACEHOLDER2>; // original value of PLACEHOLDER0 is new Error("a must be positive")
			} else {
				const p1 = new Point(<PLACEHOLDER3>, 0); // original value of PLACEHOLDER1 is 0
				const p2 = new Point(<PLACEHOLDER4>, b); // original value of PLACEHOLDER2 is a
				const Δx = <PLACEHOLDER5> - p1.x; // original value of PLACEHOLDER5 is p2.x
				const Δy = <PLACEHOLDER6>; // original value of PLACEHOLDER6 is p2.y - p1.y
				return <PLACEHOLDER7>; // original value of PLACEHOLDER7 is Math.sqrt(Δx*Δx + Δy*Δy)
			}
		}
```
Here, one could mutate the program by replacing PLACEHOLDER1 with an expression such as a > 0
(i.e. choosing a different operator), and with an expression such as b < 0 (i.e. choosing a different
variable that is in scope). However, it would not make sense to replace PLACEHOLDER1 with a < 0.0,
because this would behave the same as the original code.
Furthermore, one could replace PLACEHOLDER2 with an expression such as new Error("b must be
positive"), or with an expression such as new Error("a must be greater than 0"). 
PLACEHOLDER3 could be replaced with an expression such as a, or with an expression such as b,
or with a constant 3. 
PLACEHOLDER4 could be replaced with an expression such as b, or with a complex expression such as a*a.
PLACEHOLDER5 could be replaced with an expression such as p1.x, or with a complex expression such as	
p2.x + 1.
PLACEHOLDER6 could be replaced with an expression such as p2.x * p2.y, or by calling a function such as
function such as Math.abs(p2.y - p1.y).
PLACEHOLDER7 could be replaced with an expression such as Math.sqrt(Δx + Δy), or by 
calling a other functions, e.g. by returning Math.abs(Δx) + Math.abs(Δy).

Your task is to apply mutation testing to the following code:
<BEGIN>
{{{code}}}
<END>

Please state three possible fragments that the PLACEHOLDER could be replaced with. 
Important: the code fragments must use different variables, functions, or constants than code indicated 
in the comment on the same line.

Provide your answer as fenced code blocks containing a single line of code, 
using the following template:

Option 1: The PLACEHOLDER should be replaced with:
```
<code fragment>
```
Option 2: The PLACEHOLDER should be replaced with:
```
<code fragment>
```
Option 3: The PLACEHOLDER should be replaced with:
```
<code fragment>
```

Please conclude your response with "DONE." 