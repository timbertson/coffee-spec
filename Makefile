compile: lib/coffee-spec.js

lib/coffee-spec.js: src/coffee-spec.coffee
	coffee -co lib src/coffee-spec.coffee

copy: compile node_libraries
	cp lib/coffee-spec.js ~/.node_libraries/

link: compile node_libraries
	rm -f ~/.node_libraries/coffee-spec.js
	ln -s `pwd`/lib/coffee-spec.js ~/.node_libraries/

test: compile
	coffee test/base/command-line.coffee
	coffee test/base/in-process.coffee

node_libraries:
	mkdir -p ~/.node_libraries

clean:
	rm lib/*
.PHONY: compile link copy node_libraries test
