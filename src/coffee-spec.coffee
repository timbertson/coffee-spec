fs: require 'fs'
path: require 'path'
sys: require "sys"
debug: sys.debug
assert: require "assert"
child_process: require('child_process')

MAX_ASYNC_TRIES: 5    # how many times to check if a callback has completed (before giving up)
ASYNC_SLEEP_TIME: 0.2 # seconds between checks

test_exports: {}

# path tomfoolery - where am I? Where is Coffee-Script?
_CoffeeScript: null
CoffeeScript: ->
  return _CoffeeScript if _CoffeeScript?
  env = process.env
  require.paths.unshift(env.COFFEESCRIPT_LIB) if 'COFFEESCRIPT_LIB' in env
  _CoffeeScript: require("coffee-script")
  return _CoffeeScript


#########################################
# globals to keep track of tests
tests: undefined
unit: undefined
start_time: undefined
VERBOSITY: undefined

init: (_global, log_level) ->
  tests: []
  errors: []
  unit: "tests" # if we compile tests into intermediate files, the unit becomes "test files"
  start_time: new Date()
  VERBOSITY: log_level
  helpers.extend _global, helpers.merge(test_exports, assert)


####### spec runner and utilities

# remove all node.js and lib/spec.js lines from stack trace
cleanup_stack: (stack) ->
  stack: stack.replace /\n^.*coffee-spec\.js:\d+:\d+\)$/gm, ''
  stack: stack.replace /\n^\s+at node\.js:\d+:\d+$/gm, ''
  stack

num_failed_and_passed: ->
  failed_tests: (test for test in tests when not test.success)
  return [failed_tests.length, tests.length - failed_tests.length]

# Output a detailed report on all failing tests
report: (header) ->
  if tests.length > 0
    verbose header + "\n" if header
    test.report() for test in tests when not test.success

# Summarize entire test run
summarize: (num_fail, num_pass) ->
  time_elapsed: ((new Date() - start_time) / 1000).toFixed(2)
  message: "passed ${num_pass} ${unit} in $time_elapsed seconds${term.normal}"
  info ""
  info(if num_fail then "${term.red}FAILED ${num_fail} and $message" else "${term.green}$message")

# Runs all tests that have not yet been run
# (note that this method can be called mutliple times, and it
# will only run the new tests that have not yet been run)
exports.run_tests: run_tests: (cb) ->
  remaining: (test for test in tests when test.success is null)
  iterate: ->
    if remaining.length == 0
      cb()
      return
    test: remaining.shift()
    test.run(iterate)
  iterate()

# Run all defined tests, report and
# exit with the number of failed tests
run_standalone: () ->
  run_tests ->
    [failed, succeeded]: num_failed_and_passed()
    report()
    process.exit(failed)

# Add tests from a file and immediately run them
load_file: (file) ->
  print_file file
  code: fs.readFileSync file, "utf-8"
  CoffeeScript().run code, {source: file}

print_file: (file) ->
  verbose "\n" + file + ":"

compile_file: (file, temp_path) ->
  dir = path.dirname(file)
  file = path.basename(file)
  test: new TestFile dir, file
  tests.push(test)
  test.compile temp_path

readdirRecursive: (base) ->
  realpath ||= base
  files: []
  for file in fs.readdirSync(base)
    absfile: fs.realpathSync(path.join(base, file))
    if fs.statSync(absfile).isDirectory()
      files: files.concat(readdirRecursive(absfile))
    else
      files.push(absfile)
  return files

relativePaths: (base, paths) ->
  return p.replace(base + '/', '') for p in paths

get_log_level: (opts) ->
  log_level: verbosity.normal
  log_level: verbosity.verbose if opts.verbose
  log_level: verbosity.silent if opts.silent
  return log_level

# Run all tests in a given directory
exports.run: (dir, options, cb) ->
  options ||= {}
  filter: options.filter
  temp_dir: options.temp_dir
  init(global, get_log_level(options))
  do_end: ->
    [failed, passed]: num_failed_and_passed()
    report('\n---------------------------')
    summarize(failed, passed)
    if cb?
      cb(failed, passed)
    else
      process.exit(failed)

  do_run: ->
    try
      files: readdirRecursive dir
    catch e
      throw new Error("Error processing ${dir}: ${e}")
    files: relativePaths(process.cwd(), files)
    iterate: ->
      if files.length == 0
        return do_end()
      file: files.shift()
      return iterate() unless file.match(/\.coffee$/i)
      return iterate() if filter and file.search(filter) == -1
      if options.compile
        unit: "test files"
        compile_file file, temp_dir
      else
        load_file file
      run_tests(iterate)
    iterate()

  if options.compile
    mkdir: exec 'mkdir', ['-p', temp_dir], do_run
  else
    do_run()

# DSL-land
active_describes: []
active_test: null
test_exports.describe: describe: (desc, body) ->
  active_describes.push(desc)
  body()
  active_describes.pop()

test_exports.it: it: (desc, body) ->
  if not (typeof body == 'function')
    throw new Error("not a function: " + body)
  tests.push(new TestCase(active_describes.slice(), desc, body))

exports.autorun: (_global, log_level) ->
  init(_global, log_level)
  setTimeout(( -> run_standalone()), 0)

test_exports.expect: (num_success) ->
  raise new Error("no active test!") if not active_test?
  active_test.expect_passes num_success


# test files and cases
# a single (evaluated) test case
class TestCase
  constructor: (describes, name, body) ->
    @describes: describes
    @name: name
    @body: body
    @expected_passes: 0
    @success: null
    @started: false
    @async_passes: []

  toString: ->
    if @describes
      @describes.join(" ") + " " + @name
    else
      @name

  poll_for_passes: (cb) ->
    @error_catcher: (err) =>
      @error: err
      @success: false
    process.addListener 'uncaughtException', @error_catcher

    tries: 0
    iterate: =>
      passes: @async_passes.length
      if passes == @expected_passes
        return @finished_async_testing cb, true
      if passes > @expected_passes
        return @finished_async_testing cb, false
      tries += 1
      if tries > MAX_ASYNC_TRIES
        return @finished_async_testing cb, false
      setTimeout(iterate, 1000 * ASYNC_SLEEP_TIME)
    iterate()

  expect_passes: (num) ->
    @expected_passes: num

  async_pass: (desc) ->
    if not @async_passes?
      throw new Error("unexpected `async_pass`!")
    @async_passes.push(desc)

  finished_async_testing: (continuation, success) ->
    process.removeListener('uncaughtException', @error_catcher)
    if @error? # this can happen from exceptions inside callbacks
      return continuation()
    @success: success
    return continuation() if @success

    verbose "${term.red}failed (async)${term.normal}"
    @error: "Expected ${@expected_passes} async pass() events, but got ${@async_passes.length}."
    if @async_passes.length and (msg for msg in @async_passes when msg?).length > 0
      @error += " Passes received were:"
      @error += "\n - ${desc}" for desc in @async_passes
    @async_passes: undefined
    continuation()

  run: (cb) ->
    @started: true
    active_test: this
    verbose " - " + this + " ... "
    try
      @body((desc) => @async_pass(desc))
      if @expected_passes > 0
        @poll_for_passes(cb)
      else
        @success: true
        verbose "${term.green}ok${term.normal}"
        cb()
    catch e
      @success: false
      @error: cleanup_stack e.stack
      verbose "${term.red}failed${term.normal}"
      cb()
    finally
      active_test: null

  report: ->
    return if @success
    info "${term.red}FAILED: ${this}${term.normal}\n"
    info @error + "\n"


# a test-like object that represents a file to be compiled and run
class TestFile
  constructor: (dir, file) ->
    @dir: dir
    @file: file
    @file_path: "$dir/$file"
    @success: null

  compile: (temp_path) ->
    output_file: @file.replace /\.coffee$/, '.js'
    output_path: "$temp_path/$output_file"
    require_path = fs.realpathSync(__filename).replace(/\.js/i, '')
    prelude: "require('${require_path}').autorun(global, ${VERBOSITY});"
    input_code: prelude + fs.readFileSync(@file_path, "utf8")
    compiled: CoffeeScript().compile input_code, {source:@file_path}
    fs.writeFileSync(output_path, compiled)
    @output_path: output_path

  run: (cb) ->
    print_file(@file_path)
    exec "node", [@output_path], (err, stdout, stderr) =>
      @success: not err
      stdout: stdout.trim()
      info stdout if stdout
      @stderr: stderr.trim()
      cb()

  report: ->
    info @stderr if @stderr


# ----------------------------------
# handy helper functions
# ----------------------------------
info: (a...) ->
  if VERBOSITY >= verbosity.normal
    sys.puts(a...)

verbose: (a...) ->
  if VERBOSITY >= verbosity.verbose
    sys.puts(a...)

verbosity: {
  silent: 0,
  normal: 1,
  verbose: 2,
}

exec: (command, args, cb) ->
  proc: child_process.spawn(command, args)
  stdout: ''
  stderr: ''
  proc.stdout.addListener 'data', (data) -> stdout += data
  proc.stderr.addListener 'data', (data) -> stderr += data
  proc.addListener 'exit', (code) -> cb(code, stdout, stderr)

helpers: {
  # (blatantly stolen from coffeescript-proper)
  # Merge objects, returning a fresh copy with attributes from both sides.
  # Used every time `BaseNode#compile` is called, to allow properties in the
  # options hash to propagate down the tree without polluting other branches.
  merge: ((options, overrides) ->
    fresh: {}
    (fresh[key]: val) for key, val of options
    (fresh[key]: val) for key, val of overrides if overrides
    fresh),

  # Extend a source object with the properties of another object (shallow copy).
  # We use this to simulate Node's deprecated `process.mixin`
  extend: ((object, properties) ->
    (object[key]: val) for key, val of properties),
}

term: {
  red: '\033[0;31m',
  green: '\033[0;32m',
  normal: '\033[0m',
}
