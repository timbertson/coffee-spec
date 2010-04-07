compile: lib/coffee-spec.js

lib/coffee-spec.js: src/coffee-spec.coffee
	coffee -co lib src/coffee-spec.coffee

install: compile node_libraries
	cp lib/coffee-spec.js ~/.node_libraries/

link: compile node_libraries
	rm -f ~/.node_libraries/coffee-spec.js
	ln -s `pwd`/lib/coffee-spec.js ~/.node_libraries/

node_libraries:
	mkdir -p ~/.node_libraries

.PHONY: compile link node_libraries
