spec: require '../lib/coffee-spec'

run_tests: (path, cb) ->
	spec.run path, {}, cb
	spec.run path, {compile:true}, cb

test_dir 'test/fixtures/pass', (failed, passed) ->
	equals failed, 0
	equals passed, 2

test_dir 'test/fixtures/nested', (fail, out, err) ->
	equals failed, 1
	equals passed, 2

test_dir 'test/fixtures/fail', (fail, out, err) ->
	equals failed, 1
	equals passed, 0


