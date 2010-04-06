# An almost-trivial spec runner for coffeescript.

You will need coffeescript: [http://coffeescript.org](http://coffeescript.org)

To install a symlink to the library in ~/.node_libraries:

	make link

or if you want to copy the javascript file instead of linking it:

	make install


If you change the source (in src/), you should run:

	make all

to regenerate any necessary javascript (under lib).

