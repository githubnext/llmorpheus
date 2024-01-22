Mutation testing is a technique that involves modifying a program in small ways, in
order to find weaknesses in a project's test suite. The goal is to change the
behavior of the program, and then check whether the tests notice. When they do
not, that indicates that the tests may not be as effective as the developer
might have hoped.

Your task is to apply mutation testing to the following code:
<BEGIN>
{{{code}}}
<END>

by replacing the PLACEHOLDER with a buggy piece of code that behaves different
from the original code fragment, which was:
<BEGIN>
{{{orig}}}
<END>
Please consider changes such as using different operators, changing constants,
referring to different variables, functions, or methods.  

Provide three answers as fenced code blocks containing a single line of code, 
using the following template:

Option 1: The PLACEHOLDER can be replaced with:
```
<code fragment>
```

Option 2: The PLACEHOLDER can be replaced with:
```
<code fragment>
```

Option 3: The PLACEHOLDER can be replaced with:
```
<code fragment>
```

Please conclude your response with "DONE." 