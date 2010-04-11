spec: require '../lib/coffee-spec'

run_tests: (path, cb) ->
	spec.run path, {}, cb
	spec.run path, {compile:true}, cb

test_dir 'test/fixtures/pass', (failed, passed) ->
	equal failed, 0
	equal passed, 2

test_dir 'test/fixtures/nested', (fail, out, err) ->
	equal failed, 1
	equal passed, 2

test_dir 'test/fixtures/fail', (fail, out, err) ->
	equal failed, 1
	equal passed, 0


