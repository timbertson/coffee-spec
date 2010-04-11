(function(){
  var CoffeeScript, _CoffeeScript, add_error, assert, cleanup_stack, compile_and_run_file, current_describe, debug, describe, errors, failed, fs, global_scope, helpers, it, path, print_file, puts, report, run_file, run_standalone, run_tests, start_time, succeeded, summarize, sys, term, test_exports, tests, unit;
  var __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  path = require('path');
  sys = require("sys");
  debug = sys.debug;
  puts = sys.puts;
  assert = require("assert");
  helpers = {
    // (blatantly stolen from coffeescript-proper)
    // Merge objects, returning a fresh copy with attributes from both sides.
    // Used every time `BaseNode#compile` is called, to allow properties in the
    // options hash to propagate down the tree without polluting other branches.
    merge: (function(options, overrides) {
      var _a, _b, fresh, key, val;
      fresh = {};
      _a = options;
      for (key in _a) { if (__hasProp.call(_a, key)) {
        val = _a[key];
        (fresh[key] = val);
      }}
      if (overrides) {
        _b = overrides;
        for (key in _b) { if (__hasProp.call(_b, key)) {
          val = _b[key];
          (fresh[key] = val);
        }}
      }
      return fresh;
    }),
    // Extend a source object with the properties of another object (shallow copy).
    // We use this to simulate Node's deprecated `process.mixin`
    extend: (function(object, properties) {
      var _a, _b, key, val;
      _a = []; _b = properties;
      for (key in _b) { if (__hasProp.call(_b, key)) {
        val = _b[key];
        _a.push((object[key] = val));
      }}
      return _a;
    })
  };
  term = {
    red: '\033[0;31m',
    green: '\033[0;32m',
    normal: '\033[0m'
  };
  test_exports = {};
  // path tomfoolery - where am I? Where is Coffee-Script?
  _CoffeeScript = null;
  CoffeeScript = function CoffeeScript() {
    var env;
    if ((typeof _CoffeeScript !== "undefined" && _CoffeeScript !== null)) {
      return _CoffeeScript;
    }
    env = process.env;
    if ('COFFEESCRIPT_LIB' in env) {
      require.paths.unshift(env.COFFEESCRIPT_LIB);
    }
    _CoffeeScript = require("coffee-script");
    return _CoffeeScript;
  };
  // globals to keep track of tests / successes / errors
  tests = [];
  errors = [];
  succeeded = 0;
  failed = 0;
  unit = "tests";
  start_time = new Date();
  add_error = function add_error(err) {
    errors.push(err);
    return failed += 1;
  };
  // remove all node.js and lib/spec.js lines from stack trace
  cleanup_stack = function cleanup_stack(stack) {
    stack = stack.replace(/\n^.*lib\/spec\.js:\d+:\d+\)$/gm, '');
    stack = stack.replace(/\n^\s+at node\.js:\d+:\d+$/gm, '');
    return stack;
  };
  // Output a detailed report on all failing tests
  report = function report(verbose) {
    var _a, _b, _c, _d, description, error, stack;
    if (failed && verbose) {
      puts("\n-------------------------");
    }
    _b = errors;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      error = _b[_a];
      _d = error;
      description = _d[0];
      stack = _d[1];
      puts(("" + (term.red) + "FAILED: " + description + (term.normal)));
      puts(stack);
    }
    return failed;
  };
  // Summarize entire test run
  summarize = function summarize() {
    var message, time_elapsed;
    time_elapsed = ((new Date() - start_time) / 1000).toFixed(2);
    message = ("passed " + (succeeded) + " " + (unit) + " in " + time_elapsed + " seconds" + (term.normal));
    puts("");
    return puts(failed ? ("" + (term.red) + "FAILED " + (failed) + " and " + message) : ("" + (term.green) + message));
  };
  // Runs all tests that have not yet been run
  // (note that this method can be called mutliple times, and it
  // will only run the new tests that have not yet been run)
  exports.run_tests = (run_tests = function run_tests(verbose) {
    var _a, _b, _c, _d, body, desc, test;
    _b = tests;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      test = _b[_a];
      _d = test;
      desc = _d[0];
      body = _d[1];
      if (verbose) {
        sys.print(" - " + desc + " ... ");
      }
      try {
        body();
        succeeded += 1;
        if (verbose) {
          sys.puts(("" + (term.green) + "ok" + (term.normal)));
        }
      } catch (e) {
        if (verbose) {
          sys.puts(("" + (term.red) + "failed" + (term.normal)));
        }
        add_error([desc, cleanup_stack(e.stack)]);
      }
    }
    tests = [];
    return tests;
  });
  // Run all defined tests, report and
  // exit with the number of failed tests
  run_standalone = function run_standalone(verbose) {
    run_tests(verbose);
    report(verbose);
    return process.exit(failed);
  };
  // Add tests from a file and immediately run them
  run_file = function run_file(file, verbose) {
    var code;
    if (verbose) {
      print_file(file);
    }
    code = fs.readFileSync(file);
    CoffeeScript().run(code, {
      source: file
    });
    return run_tests(verbose);
  };
  print_file = function print_file(file) {
    return puts("\n" + file + ":");
  };
  compile_and_run_file = function compile_and_run_file(dir, file, temp_path, verbose, cb) {
    var compiled, file_path, input_code, output_file, output_path, prelude, require_path;
    output_file = file.replace(/\.coffee$/, '.js');
    file_path = ("" + dir + "/" + file);
    output_path = ("" + temp_path + "/" + output_file);
    require_path = __filename.replace(/\.js/i, '');
    prelude = ("require('" + (require_path) + "').autorun(global, " + (verbose) + ");");
    input_code = prelude + fs.readFileSync(("" + dir + "/" + file));
    compiled = CoffeeScript().compile(input_code, {
      source: file_path
    });
    fs.writeFileSync(output_path, compiled);
    return exec(("node '" + output_path + "'"), function(err, stdout, stderr) {
      if (verbose) {
        print_file(file_path);
      }
      err ? failed += 1 : succeeded += 1;
      if (stdout) {
        puts(stdout);
      }
      if (stderr) {
        puts(stderr);
      }
      return cb();
    });
  };
  // Run all tests in a given directory
  exports.run = function run(dir, options, cb) {
    var do_end, do_run, filter, mkdir, temp_dir, verbose;
    options = options || {};
    filter = options.filter;
    verbose = options.verbose;
    temp_dir = options.temp_dir;
    do_end = function do_end() {
      report(verbose);
      summarize();
      if ((typeof cb !== "undefined" && cb !== null)) {
        return cb(failed);
      } else {
        return process.exit(failed);
      }
    };
    do_run = function do_run() {
      var files, iterate;
      try {
        files = fs.readdirSync(dir);
      } catch (e) {
        throw new Error(("Error processing " + (dir) + ": " + (e)));
      }
      iterate = function iterate() {
        var file;
        if (files.length === 0) {
          return do_end();
        }
        file = files.shift();
        if (!(file.match(/\.coffee$/i))) {
          return iterate();
        }
        if (filter && file.search(filter) === -1) {
          return iterate();
        }
        if (options.compile) {
          unit = "test files";
          return compile_and_run_file(dir, file, temp_dir, options.verbose, iterate);
        } else {
          run_file(("" + dir + "/" + file), options.verbose);
          return iterate();
        }
      };
      return iterate();
    };
    if (options.compile) {
      mkdir = process.createChildProcess('mkdir', ['-p', temp_dir]);
      return mkdir.addListener('exit', do_run);
    } else {
      helpers.extend(global, global_scope);
      return do_run();
    }
  };
  // DSL-land
  current_describe = null;
  test_exports.describe = (describe = function describe(desc, body) {
    var old_describe;
    old_describe = current_describe;
    current_describe ? current_describe += ' ' + desc : (current_describe = desc);
    body();
    current_describe = old_describe;
    return current_describe;
  });
  test_exports.it = (it = function it(desc, body) {
    if (!(typeof body === 'function')) {
      throw new Error("not a function: " + body);
    }
    (typeof current_describe !== "undefined" && current_describe !== null) ? (desc = current_describe + ' ' + desc) : null;
    return tests.push([desc, body]);
  });
  exports.autorun = function autorun(_globals, verbose) {
    helpers.extend(_globals, global_scope);
    return setTimeout((function() {
      return run_standalone(verbose);
    }), 0);
  };
  global_scope = helpers.merge(test_exports, assert);
})();
