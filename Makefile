all: lib/spec.js

lib/spec.js: src/coffee-spec.coffee
	coffee -o lib src/coffee-spec.coffee

install: node_libraries
	cp lib/coffee-spec.js ~/.node_libraries/

link: node_libraries
	rm -f ~/.node_libraries
	ln -s `pwd`/lib/coffee-spec.js ~/.node_libraries/

node_libraries:
	mkdir -p ~/.node_libraries

.PHONY: all link node_libraries
