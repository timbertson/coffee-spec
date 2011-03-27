# base-level testing of the in-process runner.
# This just makes sure that the runner will accept some well-known
# fixtures, and give the expected results. Since this test is run
# as pure coffeescript, it should be fairly resistant to bugs
# in the runner causing it to falsely pass.

spec = require '../../lib/coffee-spec'
equal = require('assert').equal
sys =require 'sys'
puts = sys.puts
debug = sys.debug

checks_run = 0

fixture_suites = [
	# expectancies are in the form of [fail, pass].
	# "files" is for when tests are compiled. "tests" is when tests are run directly
	['pass',       {files: [0, 1], tests: [0, 2]}],
	['fail',       {files: [1, 0], tests: [1, 0]}],
	['nested',     {files: [1, 1], tests: [1, 2]}],
	['async_pass', {files: [0, 1], tests: [0, 2]}],
	['async_fail', {files: [1, 0], tests: [3, 1]}],
]

run_tests = (path, compile, expected, on_complete) ->
	puts("running fixture in-process: #{path}")
	[expected_fail, expected_pass] = expected
	silent = true
	verbose = false
	spec.run path, {verbose: verbose, silent:silent, compile: compile, temp_dir: '/tmp'}, (failed, passed) ->
		equal failed, expected_fail, "test #{path} expected #{expected_fail} failed tests, but got #{failed}! (and #{passed} passes)"
		equal passed, expected_pass, "test #{path} expected #{expected_pass} passed tests, but got #{passed}! (and #{failed} failures)"
		checks_run += 1
		on_complete()
		return

run_suite = (suite, cb) ->
	[name, expected] = suite
	run_tests "test/fixtures/#{name}", false, expected['tests'], ->
		run_tests "test/fixtures/#{name}", true, expected['files'], cb

run_all_suites = () ->
	suites = fixture_suites.slice()
	iterate = ->
		if suites.length == 0
			return
		suite = suites.shift()
		run_suite(suite, iterate)
	iterate()

run_all_suites()

ensure_checks_run = ->
	tries = 0
	expected_checks = 2 * fixture_suites.length
	check = ->
		if checks_run == expected_checks
			puts "all checks run"
			return
		else
			tries += 1
			if tries > 10
				# taken longer than 10 seconds? doubtful...
				throw new Error("expected #{expected_checks} checks, but got #{checks_run}")
			setTimeout(check, 1000)
	check()
ensure_checks_run()

