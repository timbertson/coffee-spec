spec: require '../../lib/coffee-spec'

run_tests: (path, cb) ->
	spec.run path, {silent:true}, cb
	spec.run path, {silent:true, compile:true, temp_dir:'/tmp/'}, cb

run_tests 'test/fixtures/pass', (failed, passed) ->
	equal failed, 0
	equal passed, 2

run_tests 'test/fixtures/nested', (failed, passed) ->
	equal failed, 1
	equal passed, 2

run_tests 'test/fixtures/fail', (failed, passed) ->
	equal failed, 1
	equal passed, 0


