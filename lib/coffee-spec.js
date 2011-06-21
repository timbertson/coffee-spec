(function() {
  var ASYNC_SLEEP_TIME, CoffeeScript, EXIT_SENT, EXIT_STATUS, MAX_ASYNC_TRIES, TestCase, TestFile, VERBOSITY, active_describes, active_test, assert, child_process, cleanup_stack, compile_file, debug, describe, exec, exit, fs, get_log_level, helpers, info, init, it, load_file, num_failed_and_passed, path, print_file, readdirRecursive, relativePaths, report, run_standalone, run_tests, start_time, summarize, sys, term, test_exports, tests, unit, verbose, verbosity;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;
  fs = require('fs');
  path = require('path');
  sys = require("sys");
  debug = sys.debug;
  assert = require("assert");
  child_process = require('child_process');
  CoffeeScript = require("coffee-script");
  MAX_ASYNC_TRIES = 5;
  ASYNC_SLEEP_TIME = 0.2;
  test_exports = {};
  tests = void 0;
  unit = void 0;
  start_time = void 0;
  VERBOSITY = void 0;
  EXIT_STATUS = 0;
  exit = function(state) {
    return EXIT_STATUS = state;
  };
  EXIT_SENT = false;
  process.on('exit', function() {
    if (!EXIT_SENT) {
      EXIT_SENT = true;
      return process.exit(EXIT_STATUS);
    }
  });
  init = function(_global, log_level) {
    var errors;
    tests = [];
    errors = [];
    unit = "tests";
    start_time = new Date();
    VERBOSITY = log_level;
    return helpers.extend(_global, helpers.merge(test_exports, assert));
  };
  cleanup_stack = function(stack) {
    return stack;
  };
  num_failed_and_passed = function() {
    var failed_tests, test;
    failed_tests = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        if (!test.success) {
          _results.push(test);
        }
      }
      return _results;
    })();
    return [failed_tests.length, tests.length - failed_tests.length];
  };
  report = function(header) {
    var test, _i, _len, _results;
    if (tests.length > 0) {
      if (header) {
        verbose(header + "\n");
      }
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        if (!test.success) {
          _results.push(test.report());
        }
      }
      return _results;
    }
  };
  summarize = function(num_fail, num_pass) {
    var message, time_elapsed;
    time_elapsed = ((new Date() - start_time) / 1000).toFixed(2);
    message = "passed " + num_pass + " " + unit + " in " + time_elapsed + " seconds" + term.normal;
    info("");
    return info(num_fail ? "" + term.red + "FAILED " + num_fail + " and " + message : "" + term.green + message);
  };
  exports.run_tests = run_tests = function(cb) {
    var iterate, remaining, test;
    remaining = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tests.length; _i < _len; _i++) {
        test = tests[_i];
        if (test.success === null) {
          _results.push(test);
        }
      }
      return _results;
    })();
    iterate = function() {
      if (remaining.length === 0) {
        cb();
        return;
      }
      test = remaining.shift();
      return test.run(function() {
        if (test.status != null) {
          test.status();
        }
        return iterate();
      });
    };
    return iterate();
  };
  run_standalone = function() {
    return run_tests(function() {
      var failed, succeeded, _ref;
      _ref = num_failed_and_passed(), failed = _ref[0], succeeded = _ref[1];
      report();
      return exit(failed);
    });
  };
  load_file = function(file) {
    var code;
    print_file(file);
    code = fs.readFileSync(file, "utf-8");
    return CoffeeScript.eval(code, {
      filename: file
    });
  };
  print_file = function(file) {
    return verbose("\n" + file + ":\n");
  };
  compile_file = function(file, temp_path) {
    var dir, test;
    dir = path.dirname(file);
    file = path.basename(file);
    test = new TestFile(dir, file);
    tests.push(test);
    return test.compile(temp_path);
  };
  readdirRecursive = function(base) {
    var absfile, file, files, _i, _len, _ref;
    files = [];
    _ref = fs.readdirSync(base);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      file = _ref[_i];
      absfile = fs.realpathSync(path.join(base, file));
      if (fs.statSync(absfile).isDirectory()) {
        files = files.concat(readdirRecursive(absfile));
      } else {
        files.push(absfile);
      }
    }
    return files;
  };
  relativePaths = function(base, paths) {
    var p, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = paths.length; _i < _len; _i++) {
      p = paths[_i];
      _results.push(p.replace(base + '/', ''));
    }
    return _results;
  };
  get_log_level = function(opts) {
    var log_level;
    log_level = verbosity.normal;
    if (opts.verbose) {
      log_level = verbosity.verbose;
    }
    if (opts.silent) {
      log_level = verbosity.silent;
    }
    return log_level;
  };
  exports.run = function(dir, options, cb) {
    var do_end, do_run, filter, mkdir, temp_dir;
    options || (options = {});
    filter = options.filter;
    temp_dir = options.temp_dir || '_coffee_specs';
    init(global, get_log_level(options));
    do_end = function() {
      var failed, passed, _ref;
      _ref = num_failed_and_passed(), failed = _ref[0], passed = _ref[1];
      report('\n---------------------------');
      summarize(failed, passed);
      if (cb != null) {
        return cb(failed, passed);
      } else {
        return exit(failed);
      }
    };
    do_run = function() {
      var files, iterate;
      try {
        files = readdirRecursive(dir);
      } catch (e) {
        throw new Error("Error processing " + dir + ": " + e);
      }
      files = relativePaths(process.cwd(), files);
      iterate = function() {
        var file;
        if (files.length === 0) {
          return do_end();
        }
        file = files.shift();
        if (!file.match(/\.coffee$/i)) {
          return iterate();
        }
        if (filter && file.search(filter) === -1) {
          return iterate();
        }
        if (options.compile) {
          unit = "test files";
          compile_file(file, temp_dir);
        } else {
          load_file(file);
        }
        return run_tests(iterate);
      };
      return iterate();
    };
    if (options.compile) {
      return mkdir = exec('mkdir', ['-p', temp_dir], do_run);
    } else {
      return do_run();
    }
  };
  active_describes = [];
  active_test = null;
  test_exports.describe = describe = function(desc, body) {
    active_describes.push(desc);
    body();
    return active_describes.pop();
  };
  test_exports.it = it = function(desc, body) {
    if (!(typeof body === 'function')) {
      throw new Error("not a function: " + body);
    }
    return tests.push(new TestCase(active_describes.slice(), desc, body));
  };
  exports.autorun = function(_global, log_level) {
    init(_global, log_level);
    return setTimeout((function() {
      return run_standalone();
    }), 0);
  };
  test_exports.expect = function(num_success) {
    if (!(active_test != null)) {
      raise(new Error("no active test!"));
    }
    return active_test.expect_passes(num_success);
  };
  TestCase = (function() {
    function TestCase(describes, name, body) {
      this.describes = describes;
      this.name = name;
      this.body = body;
      this.expected_passes = 0;
      this.success = null;
      this.started = false;
      this.async_passes = [];
    }
    TestCase.prototype.toString = function() {
      if (this.describes) {
        return this.describes.join(" ") + " " + this.name;
      } else {
        return this.name;
      }
    };
    TestCase.prototype.poll_for_passes = function(cb) {
      var iterate, tries;
      this.error_catcher = __bind(function(err) {
        this.error = err;
        return this.success = false;
      }, this);
      process.addListener('uncaughtException', this.error_catcher);
      tries = 0;
      iterate = __bind(function() {
        var passes;
        passes = this.async_passes.length;
        if (passes === this.expected_passes) {
          return this.finished_async_testing(cb, true);
        }
        if (passes > this.expected_passes) {
          return this.finished_async_testing(cb, false);
        }
        tries += 1;
        if (tries > MAX_ASYNC_TRIES) {
          return this.finished_async_testing(cb, false);
        }
        return setTimeout(iterate, 1000 * ASYNC_SLEEP_TIME);
      }, this);
      return iterate();
    };
    TestCase.prototype.expect_passes = function(num) {
      return this.expected_passes = num;
    };
    TestCase.prototype.async_pass = function(desc) {
      if (!(this.async_passes != null)) {
        throw new Error("unexpected `async_pass`!");
      }
      return this.async_passes.push(desc);
    };
    TestCase.prototype.finished_async_testing = function(continuation, success) {
      var desc, msg, _i, _len, _ref;
      process.removeListener('uncaughtException', this.error_catcher);
      if (this.error != null) {
        return continuation();
      }
      this.success = success;
      if (this.success) {
        return continuation();
      }
      this.error = "Expected " + this.expected_passes + " async pass() events, but got " + this.async_passes.length + ".";
      if (this.async_passes.length && ((function() {
        var _i, _len, _ref, _results;
        _ref = this.async_passes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          msg = _ref[_i];
          if (msg != null) {
            _results.push(msg);
          }
        }
        return _results;
      }).call(this)).length > 0) {
        this.error += " Passes received were:";
        _ref = this.async_passes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          desc = _ref[_i];
          this.error += "\n - " + desc;
        }
      }
      this.async_passes = void 0;
      return continuation();
    };
    TestCase.prototype.run = function(cb) {
      this.started = true;
      active_test = this;
      verbose("- " + this + " ... ");
      try {
        this.body(__bind(function(desc) {
          return this.async_pass(desc);
        }, this));
        if (this.expected_passes > 0) {
          return this.poll_for_passes(cb);
        } else {
          this.success = true;
          return cb();
        }
      } catch (e) {
        this.success = false;
        this.error = cleanup_stack(e.stack);
        return cb();
      } finally {
        active_test = null;
      }
    };
    TestCase.prototype.status = function() {
      if (this.success) {
        return verbose("" + term.green + "ok" + term.normal + "\n");
      } else {
        return verbose("" + term.red + "failed" + term.normal + "\n");
      }
    };
    TestCase.prototype.report = function() {
      if (this.success) {
        return;
      }
      info("" + term.red + "FAILED: " + this + term.normal);
      return info(this.error + "\n");
    };
    return TestCase;
  })();
  TestFile = (function() {
    function TestFile(dir, file) {
      this.dir = dir;
      this.file = file;
      this.file_path = "" + dir + "/" + file;
      this.success = null;
    }
    TestFile.prototype.compile = function(temp_path) {
      var compiled, input_code, output_file, output_path, prelude, require_path;
      output_file = this.file.replace(/\.coffee$/, '.js');
      output_path = "" + temp_path + "/" + output_file;
      require_path = fs.realpathSync(__filename).replace(/\.js/i, '');
      prelude = "require('" + require_path + "').autorun(global, " + VERBOSITY + ");";
      input_code = prelude + fs.readFileSync(this.file_path, "utf8");
      compiled = CoffeeScript.compile(input_code, {
        source: this.file_path
      });
      fs.writeFileSync(output_path, compiled);
      return this.output_path = output_path;
    };
    TestFile.prototype.run = function(cb) {
      print_file(this.file_path);
      return exec("node", [this.output_path], __bind(function(err, stdout, stderr) {
        this.success = !err;
        stdout = stdout.trim();
        if (stdout) {
          info(stdout);
        }
        this.stderr = stderr.trim();
        return cb();
      }, this));
    };
    TestFile.prototype.report = function() {
      if (this.stderr) {
        return info(this.stderr);
      }
    };
    return TestFile;
  })();
  info = function() {
    var a;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (VERBOSITY >= verbosity.normal) {
      return sys.puts.apply(sys, a);
    }
  };
  verbose = function() {
    var a;
    a = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (VERBOSITY >= verbosity.verbose) {
      return sys.print.apply(sys, a);
    }
  };
  verbosity = {
    silent: 0,
    normal: 1,
    verbose: 2
  };
  exec = function(command, args, cb) {
    var proc, stderr, stdout;
    proc = child_process.spawn(command, args);
    stdout = '';
    stderr = '';
    proc.stdout.addListener('data', function(data) {
      return stdout += data;
    });
    proc.stderr.addListener('data', function(data) {
      return stderr += data;
    });
    return proc.addListener('exit', function(code) {
      return cb(code, stdout, stderr);
    });
  };
  helpers = {
    merge: (function(options, overrides) {
      var fresh, key, val;
      fresh = {};
      for (key in options) {
        val = options[key];
        fresh[key] = val;
      }
      if (overrides) {
        for (key in overrides) {
          val = overrides[key];
          fresh[key] = val;
        }
      }
      return fresh;
    }),
    extend: (function(object, properties) {
      var key, val, _results;
      _results = [];
      for (key in properties) {
        val = properties[key];
        _results.push((object[key] = val));
      }
      return _results;
    })
  };
  term = {
    red: '\033[0;31m',
    green: '\033[0;32m',
    normal: '\033[0m'
  };
}).call(this);
