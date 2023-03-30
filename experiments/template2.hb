In this task, we will change the behavior of a program by applying mutation testing.
Given the following code, where line numbers have been added for ease of reference:
<BEGIN>
{{{origCode}}}
<END>

Consider the following rewrite rule:
		{{{rule.rule}}} ({{rule.description}})
Going through EACH of the lines in the code in order, please respond EITHER:

IF line#N contains one of the following symbols
		{{{symbols}}}
then show how the line would be rewritten by the rule by providing:
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

OTHERWISE, if line#N does not contain any of the symbols
		{{{rule.symbols}}}
then please respond with:
	The rewriting rule is not applicable to LINE #N

Please assume that each change is made in isolation and apply the rule
on every line where it is applicable.

After responding to all of the lines in the code, please conclude your response with "DONE". 
