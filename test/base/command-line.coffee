assert: require 'assert'
global.ok = assert.ok
global.equal = assert.equal
exec: require('child_process').exec
puts: require('sys').puts

strip_control_chars: (text) ->
	text.split(/\[0;3\dm/)[1]

test_dir: (path, cb) ->
	exec("bin/coffee-spec ${path}", (fail, out, err) ->
		outlines = out.split("\n")
		summary = outlines[outlines.length-2]
		try
			cb(fail, out, err, summary)
		catch e
			puts "OUT: ${out}"
			puts "ERR: ${err}"
			throw e
	)

test_dir 'test/fixtures/pass', (fail, out, err, summary) ->
	# passed 2 tests in [___ seconds]
	equal(strip_control_chars(summary.split(' in ')[0]), 'passed 2 tests')
	equal(err, '')
	ok(not fail?)

test_dir 'test/fixtures/fail', (fail, out, err) ->
	ok out.match /FAILED 1 and passed 0 tests/
	ok out.match /AssertionError: true == false/
	ok out.match /FAILED: it shall not pass!/
	equal err, ''
	ok fail?

test_dir 'test/fixtures/nested', (fail, out, err, summary) ->
	equal(strip_control_chars(summary.split(' in ')[0]), 'FAILED 1 and passed 2 tests')
	equal(err, '')
	ok fail?


