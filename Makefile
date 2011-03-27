compile: lib/coffee-spec.js

COFFEE=0launch http://gfxmonk.net/dist/0install/coffee-script.xml

lib/coffee-spec.js: src/coffee-spec.coffee
	${COFFEE} -co lib src/coffee-spec.coffee

copy: compile node_libraries
	cp lib/coffee-spec.js ~/.node_libraries/

link: compile node_libraries
	rm -f ~/.node_libraries/coffee-spec.js
	ln -s `pwd`/lib/coffee-spec.js ~/.node_libraries/

test: compile
	$(COFFEE) test/base/command-line.coffee
	$(COFFEE) test/base/in-process.coffee

node_libraries:
	mkdir -p ~/.node_libraries

0: compile
	mkzero-gfxmonk -p bin -p lib coffee-spec.xml

clean:
	rm lib/*
.PHONY: compile link copy node_libraries test
