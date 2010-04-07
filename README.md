# An almost-trivial spec runner for coffeescript.

You will need coffeescript: [http://coffeescript.org](http://coffeescript.org)

## Writing tests:

..is probably why you're here. It's very reminiscent of rspec. Here's a quick illustrative example:

	describe 'my lovely feature', ->
		it 'should rock your socks', ->
			socks = get_socks("yours")
			ok socks.are_rocked

`describe` blocks can be nested, and are not required. The `assert` node library is automatically imported into the global scope for you.

## Building / Installing:

To install a symlink to the library in `~/.node_libraries`:

	make link

or if you want to copy the javascript file instead of linking it:

	make install

If you change the source (in `src/`), you should run:

	make

to regenerate any necessary javascript (under `lib`).


## Using it in your own project:

	spec: require 'coffee-spec'
	spec.run test_dir, opts

the `run` call will return instantly, but you should not try to do anything after that - it will run asynchronously, and will call `process.exit` with the appropriate return code when all tests are complete.

Where `opts` is a dictionary containing any of the following:

 - **compile**: compile tests to intermediate files. If `true`, `temp_dir` bust also be given.
 - **temp\_dir**: directory to place temporary (compiled) tests. This will be created if it does not
	 already exist, but will *not* be deleted afterwards
 - **verbose**: if `true`, test names will be output as they are run

## Considerations:

`coffee-spec` requires access to the coffee-script source libraries (`coffee-script.js` and friends).

If these files are not on the `require.path` already, you can set the environment variable `COFFEESCRIPT_LIB` to the location of the coffee-script `lib` directory.
Alternately, you can add this path to require.paths before running `coffee-spec`.

## TODO:

- tests! (ironically)
- load directories recursively
- setup/teardown for `describe` blocks
- make it fall-back to using only the `coffee` binary if libs are not available
- a `bin/coffee-spec` command for use on projects that aren't coffee-script itself
- add a callback paramater to `run`, to make coffee-spec return the results instead of exiting the process

