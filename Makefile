compile: lib/coffee-spec.js

lib/coffee-spec.js: src/coffee-spec.coffee
	coffee -co lib src/coffee-spec.coffee

copy: compile node_libraries
	cp lib/coffee-spec.js ~/.node_libraries/

link: compile node_libraries
	rm -f ~/.node_libraries/coffee-spec.js
	ln -s `pwd`/lib/coffee-spec.js ~/.node_libraries/

test:
	# the base specs ensure that the command actually *works*
	# on a very basic level on some known test fixtures
	coffee test/base/command-line.coffee
	coffee test/base/in-process.coffee
	# specs are run using coffee-spec itself
	coffee bin/coffee-spec test/spec

node_libraries:
	mkdir -p ~/.node_libraries

.PHONY: compile link copy node_libraries test
