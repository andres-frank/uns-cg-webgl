h1. OBJ Models

h2. How are these files generated?

This data was obtained by exporting the models in Blender to .OBJ file.
I recommend checking the box that reads "triangulate faces" so you can then
use the `gl.TRIANGLES` primitive for drawing.

h2. Why are the files named as _*.obj.js_ ?

We are using a little hack which involves "wrapping" the .obj source code into
a Javascript variable. I renamed them with the .js extension so it's clear that
this is actually just a javascript variable, and not a stand-alone .obj file.

h2. Why are you doing this?

This is a way to solve the issue where Browsers do not allow the use of external
files unless you are running a webserver! (it's a security thing)

h2. Does it change how we use the OBJ Parser?

The OBJParser Helper Class was written so it takes the source code as input,
so instead of giving it the obj file directly, we put the code into a variable
and provide the class with that instead.

If you were to use a file chooser (in HTML) you will just provide the .obj file
directly, instead of the .obj.js one.

