<img src="http://gfxmonk.net/dist/status/project/coffee-spec.png">

# A simple spec runner for CoffeeScript.

You will need CoffeeScript: [http://coffeescript.org](http://coffeescript.org)

## Writing tests:

..is probably why you're here. It's very reminiscent of rspec. Here's a quick illustrative example:

	describe 'my lovely feature', ->
		it 'should rock your socks', ->
			socks = get_socks("yours")
			ok socks.are_rocked

`describe` blocks can be nested, and are not required. The `assert` node library is automatically imported into the global scope for you.

#### Writing _asynchronous_ tests:

Since node is pervasively (and, in some cases, painfully) asynchronous, you'll need a hand testing out all that asynchronous code. It's reasonably painless though, I promise.

If you want to have an asynchronous test, the body of your test should take a single argument, `pass`. Inside every asynchronous callback, you must call `pass()` with an optional description of what was checked (this is useful for debugging).

So that coffee-spec knows when your test is complete, you *must* also tell it how many calls to `pass` it should expect your test to make. This is done by passing the number of expected calls to the `expect` function somewhere in the function body of your test (typically the first or last line).

For example:

	it 'should iterate through a list asynchronously', (pass) ->
		[1, 2].asyncMap(((elem) -> elem + 1), (results) ->
			ok results[0] is 1
			ok results[2] is 2
			pass()

		[1].asyncMap(((elem) -> elem), (results) ->
			ok results.length is 1
			pass('length check')

		expect 2

If either of the callbacks goes astray and never gets called, coffee-spec will wait for a full second and then fail your test. If you provide unique descriptions to each `pass` call, it'll print out the ones that it *did* receive, which will help you figure out which ones went astray.

## Building / Installing Locally:

To install a symlink to the library in `~/.node_libraries`:

	make link

or if you want to copy the javascript file instead of linking it:

	make copy

If you change the source (in `src/`), you should run:

	make

to regenerate any necessary javascript (under `lib`).


## Using it in your own project:

	spec: require 'coffee-spec'
	spec.run test_dir, opts, cb

Where `cb` is optional, and `opts` is a dictionary containing any of the following:

 - **compile**: compile tests to intermediate files. If `true`, `temp_dir` bust also be given.
 - **temp\_dir**: directory to place temporary (compiled) tests. This will be created if it does not
   already exist, but will *not* be deleted afterwards
 - **verbose**: if `true`, test names will be output as they are run

If `cb` is given, it will be called after all tests have been run, with the number of passed and failed tests. e.g:

	spec.run test_dir, opts, (passed, failed) ->
		if failed > 0
			throw new Error("failed " + failed + "tests")

## Considerations:

`coffee-spec` requires access to the coffee-script source libraries (`coffee-script.js` and friends). If you use the zero install feed at http://gfxmonk.net/dist/0install/coffee-script.xml, coffee-script will be placed on `$NODE_PATH` appropriately

## TODO:

- setup/teardown for `describe` blocks
- make it fall-back to using only the `coffee` binary if libs are not available

