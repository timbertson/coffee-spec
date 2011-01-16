(function(){
  var ASYNC_SLEEP_TIME, CoffeeScript, MAX_ASYNC_TRIES, TestCase, TestFile, VERBOSITY, _CoffeeScript, active_describes, active_test, assert, child_process, cleanup_stack, compile_file, debug, describe, exec, fs, get_log_level, helpers, info, init, it, load_file, num_failed_and_passed, path, print_file, readdirRecursive, relativePaths, report, run_standalone, run_tests, start_time, summarize, sys, term, test_exports, tests, unit, verbose, verbosity;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  path = require('path');
  sys = require("sys");
  debug = sys.debug;
  assert = require("assert");
  child_process = require('child_process');
  MAX_ASYNC_TRIES = 5;
  ASYNC_SLEEP_TIME = 0.2;
  test_exports = {};
  _CoffeeScript = null;
  CoffeeScript = function() {
    var _a, _b, env;
    if (typeof _CoffeeScript !== "undefined" && _CoffeeScript !== null) {
      return _CoffeeScript;
    }
    env = process.env;
    if (!!(function(){ for (var _a=0, _b=env.length; _a<_b; _a++) if (env[_a] === 'COFFEESCRIPT_LIB') return true; })()) {
      require.paths.unshift(env.COFFEESCRIPT_LIB);
    }
    _CoffeeScript = require("coffee-script");
    return _CoffeeScript;
  };
  tests = undefined;
  unit = undefined;
  start_time = undefined;
  VERBOSITY = undefined;
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
    var _a, _b, _c, _d, failed_tests, test;
    failed_tests = (function() {
      _a = []; _c = tests;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        test = _c[_b];
        !test.success ? _a.push(test) : null;
      }
      return _a;
    })();
    return [failed_tests.length, tests.length - failed_tests.length];
  };
  report = function(header) {
    var _a, _b, _c, _d, test;
    if (tests.length > 0) {
      if (header) {
        verbose(header + "\n");
      }
      _a = []; _c = tests;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        test = _c[_b];
        !test.success ? _a.push(test.report()) : null;
      }
      return _a;
    }
  };
  summarize = function(num_fail, num_pass) {
    var message, time_elapsed;
    time_elapsed = ((new Date() - start_time) / 1000).toFixed(2);
    message = ("passed " + (num_pass) + " " + (unit) + " in " + time_elapsed + " seconds" + (term.normal));
    info("");
    return info(num_fail ? ("" + (term.red) + "FAILED " + (num_fail) + " and " + message) : ("" + (term.green) + message));
  };
  exports.run_tests = (run_tests = function(cb) {
    var _a, _b, _c, _d, iterate, remaining, test;
    remaining = (function() {
      _a = []; _c = tests;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        test = _c[_b];
        test.success === null ? _a.push(test) : null;
      }
      return _a;
    })();
    iterate = function() {
      if (remaining.length === 0) {
        cb();
        return null;
      }
      test = remaining.shift();
      return test.run(function() {
        test.status();
        return iterate();
      });
    };
    return iterate();
  });
  run_standalone = function() {
    return run_tests(function() {
      var _a, failed, succeeded;
      _a = num_failed_and_passed();
      failed = _a[0];
      succeeded = _a[1];
      report();
      return process.exit(failed);
    });
  };
  load_file = function(file) {
    var code;
    print_file(file);
    code = fs.readFileSync(file, "utf-8");
    return CoffeeScript().run(code, {
      source: file
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
    var _a, _b, _c, absfile, file, files, realpath;
    realpath = realpath || base;
    files = [];
    _b = fs.readdirSync(base);
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      file = _b[_a];
      absfile = fs.realpathSync(path.join(base, file));
      fs.statSync(absfile).isDirectory() ? (files = files.concat(readdirRecursive(absfile))) : files.push(absfile);
    }
    return files;
  };
  relativePaths = function(base, paths) {
    var _a, _b, _c, _d, _e, p;
_a = (function() {
      _b = []; _d = paths;
      for (_c = 0, _e = _d.length; _c < _e; _c++) {
        p = _d[_c];
        _b.push(p.replace(base + '/', ''));
      }
      return _b;
    })()
    return _a;
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
    options = options || {};
    filter = options.filter;
    temp_dir = options.temp_dir;
    init(global, get_log_level(options));
    do_end = function() {
      var _a, failed, passed;
      _a = num_failed_and_passed();
      failed = _a[0];
      passed = _a[1];
      report('\n---------------------------');
      summarize(failed, passed);
      return (typeof cb !== "undefined" && cb !== null) ? cb(failed, passed) : process.exit(failed);
    };
    do_run = function() {
      var files, iterate;
      try {
        files = readdirRecursive(dir);
      } catch (e) {
        throw new Error(("Error processing " + (dir) + ": " + (e)));
      }
      files = relativePaths(process.cwd(), files);
      iterate = function() {
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
          compile_file(file, temp_dir);
        } else {
          load_file(file);
        }
        return run_tests(iterate);
      };
      return iterate();
    };
    return options.compile ? (mkdir = exec('mkdir', ['-p', temp_dir], do_run)) : do_run();
  };
  active_describes = [];
  active_test = null;
  test_exports.describe = (describe = function(desc, body) {
    active_describes.push(desc);
    body();
    return active_describes.pop();
  });
  test_exports.it = (it = function(desc, body) {
    if (!(typeof body === 'function')) {
      throw new Error("not a function: " + body);
    }
    return tests.push(new TestCase(active_describes.slice(), desc, body));
  });
  exports.autorun = function(_global, log_level) {
    init(_global, log_level);
    return setTimeout((function() {
      return run_standalone();
    }), 0);
  };
  test_exports.expect = function(num_success) {
    if (!(typeof active_test !== "undefined" && active_test !== null)) {
      raise(new Error("no active test!"));
    }
    return active_test.expect_passes(num_success);
  };
  TestCase = function(describes, name, body) {
    this.describes = describes;
    this.name = name;
    this.body = body;
    this.expected_passes = 0;
    this.success = null;
    this.started = false;
    this.async_passes = [];
    return this;
  };
  TestCase.prototype.toString = function() {
    return this.describes ? this.describes.join(" ") + " " + this.name : this.name;
  };
  TestCase.prototype.poll_for_passes = function(cb) {
    var iterate, tries;
    this.error_catcher = (function(__this) {
      var __func = function(err) {
        this.error = err;
        this.success = false;
        return this.success;
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this);
    process.addListener('uncaughtException', this.error_catcher);
    tries = 0;
    iterate = (function(__this) {
      var __func = function() {
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
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this);
    return iterate();
  };
  TestCase.prototype.expect_passes = function(num) {
    this.expected_passes = num;
    return this.expected_passes;
  };
  TestCase.prototype.async_pass = function(desc) {
    var _a;
    if (!(typeof (_a = this.async_passes) !== "undefined" && _a !== null)) {
      throw new Error("unexpected `async_pass`!");
    }
    return this.async_passes.push(desc);
  };
  TestCase.prototype.finished_async_testing = function(continuation, success) {
    var _a, _b, _c, _d, _e, _f, _g, _h, desc, msg;
    process.removeListener('uncaughtException', this.error_catcher);
    if ((typeof (_a = this.error) !== "undefined" && _a !== null)) {
      return continuation();
    }
    this.success = success;
    if (this.success) {
      return continuation();
    }
    this.error = ("Expected " + (this.expected_passes) + " async pass() events, but got " + (this.async_passes.length) + ".");
    if (this.async_passes.length && (function() {
      _e = []; _g = this.async_passes;
      for (_f = 0, _h = _g.length; _f < _h; _f++) {
        msg = _g[_f];
        (typeof msg !== "undefined" && msg !== null) ? _e.push(msg) : null;
      }
      return _e;
    }).call(this).length > 0) {
      this.error += " Passes received were:";
      _c = this.async_passes;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        desc = _c[_b];
        this.error += ("\n - " + (desc));
      }
    }
    this.async_passes = undefined;
    return continuation();
  };
  TestCase.prototype.run = function(cb) {
    this.started = true;
    active_test = this;
    verbose(" - " + this + " ... ");
    try {
      this.body((function(__this) {
        var __func = function(desc) {
          return this.async_pass(desc);
        };
        return (function() {
          return __func.apply(__this, arguments);
        });
      })(this));
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
    return this.success ? verbose(("" + (term.green) + "ok" + (term.normal) + "\n")) : verbose(("" + (term.red) + "failed" + (term.normal) + "\n"));
  };
  TestCase.prototype.report = function() {
    if (this.success) {
      return null;
    }
    info(("" + (term.red) + "FAILED: " + (this) + (term.normal)));
    return info(this.error + "\n");
  };

  TestFile = function(dir, file) {
    this.dir = dir;
    this.file = file;
    this.file_path = ("" + dir + "/" + file);
    this.success = null;
    return this;
  };
  TestFile.prototype.compile = function(temp_path) {
    var compiled, input_code, output_file, output_path, prelude, require_path;
    output_file = this.file.replace(/\.coffee$/, '.js');
    output_path = ("" + temp_path + "/" + output_file);
    require_path = fs.realpathSync(__filename).replace(/\.js/i, '');
    prelude = ("require('" + (require_path) + "').autorun(global, " + (VERBOSITY) + ");");
    input_code = prelude + fs.readFileSync(this.file_path, "utf8");
    compiled = CoffeeScript().compile(input_code, {
      source: this.file_path
    });
    fs.writeFileSync(output_path, compiled);
    this.output_path = output_path;
    return this.output_path;
  };
  TestFile.prototype.run = function(cb) {
    print_file(this.file_path);
    return exec("node", [this.output_path], (function(__this) {
      var __func = function(err, stdout, stderr) {
        this.success = !err;
        stdout = stdout.trim();
        if (stdout) {
          info(stdout);
        }
        this.stderr = stderr.trim();
        return cb();
      };
      return (function() {
        return __func.apply(__this, arguments);
      });
    })(this));
  };
  TestFile.prototype.report = function() {
    if (this.stderr) {
      return info(this.stderr);
    }
  };

  info = function() {
    var a;
    var _a = arguments.length, _b = _a >= 1;
    a = __slice.call(arguments, 0, _a - 0);
    return VERBOSITY >= verbosity.normal ? sys.puts.apply(sys, a) : null;
  };
  verbose = function() {
    var a;
    var _a = arguments.length, _b = _a >= 1;
    a = __slice.call(arguments, 0, _a - 0);
    return VERBOSITY >= verbosity.verbose ? sys.print.apply(sys, a) : null;
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
    extend: (function(object, properties) {
      var _a, _b, key, val;
      _a = []; _b = properties;
      for (key in _b) { if (__hasProp.call(_b, key)) {
        val = _b[key];
        _a.push(object[key] = val);
      }}
      return _a;
    })
  };
  term = {
    red: '\033[0;31m',
    green: '\033[0;32m',
    normal: '\033[0m'
  };
})();
