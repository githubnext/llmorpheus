Mutation testing is a technique that involves modifying a program in small ways, in
order to find weaknesses in a project's test suite. For example, in the following
code fragment
```
	  static calculateBearing(point1: GeoPoint, point2: GeoPoint): number {
		    const φ1 = deg2rad(point1.latitude), φ2 = deg2rad(point2.latitude);
		    const Δλ = deg2rad(point2.longitude - point1.longitude);
		
		    const y = sin(<PLACEHOLDER>) * cos(φ2); // original code for PLACEHOLDER was Δλ
		    const x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ);
		    const θ = atan2(y, x);
		
		    return (rad2deg(θ) + 360) % 360;
		  }
```
Here, one could mutate the program by replacing PLACEHOLDER with a constant such as 0.5, 
with a different variable that is in scope such as φ1, or with a complex expression
such as cos(φ2) * sin(Δλ). However, it would not make sense to replace PLACEHOLDER with
cos(φ1)*1, because this would behave the same as the original code.

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