In this task, we will change the behavior of a program by applying mutation testing.
Given the following code, where line numbers have been added for ease of reference:
<BEGIN>
{{{origCode}}}
<END>

Identify where the following rewrite rule is applicable:
		{{{rule.rule}}} ({{{rule.description}}})
Going through EACH of the lines in the code in order, please respond EITHER:
The rewriting rule is not applicable to LINE #N
OR respond by providing: 
	  (i) the line number of the code that matched the rewriting rule, 
	  (ii) a Markdown code block with the original code on that line, and
	  (iii) a Markdown code block with the rewritten code replacing the original code
using the following template:  
CHANGE LINE #N FROM:
```
<original code>
```
TO:
```
<rewritten code>
```
Please assume that each change is made in isolation and apply the rule
on every line where it is applicable.

After responding to all of the lines in the code, please conclude your response with "DONE". 
