assert: require 'assert'
global.ok = assert.ok
global.equal = assert.equal
exec: require('child_process').exec

test_dir: (path, cb) ->
	exec("bin/coffee-spec ${path}", cb)

test_dir 'test/fixtures/pass', (fail, out, err) ->
	out = out.split("\n")
	summary = out[out.length-1]
	equal(summary.split('in')[0], 'passed 2 tests')
	equal(err, '')
	ok(not fail?)

test_dir 'test/fixtures/fail', (fail, out, err) ->
	equal out, 'ff'
	ok out.match /AssertionError: it shall not pass!/
	ok out.match /FAILED 1 and passed 0 tests/
	equal err, ''
	ok fail?

# test_dir 'test/fixtures/nested', (fail, out, err) ->
# 	out = out.split("\n")
# 	summary = out[out.length-1]
# 	equal(summary.split('in')[0], 'FAILED 1 and passed 2 tests')
# 	equal(err, '')
# 	ok fail?


