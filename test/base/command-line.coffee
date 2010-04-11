assert: require 'assert'
global.ok = assert.ok
global.equals = assert.equals

test_dir: (path, cb) ->
	process.exec("bin/coffee-spec ${path}", cb)

test_dir 'test/fixtures/pass', (fail, out, err) ->
	equals(out.split('in')[0], 'passed 2 tests')
	equals(err, '')
	ok(not fail?)

test_dir 'test/fixtures/nested', (fail, out, err) ->
	equals(out.split('in')[0], 'FAILED 1 and passed 2 tests')
	equals(err, '')
	ok fail?

test_dir 'test/fixtures/fail', (fail, out, err) ->
	ok 'AssertionError: it shall not pass!' in out
	ok 'FAILED 1 and passed 0 tests' in out
	equals err, ''
	ok fail?


