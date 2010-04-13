it 'should fail if not enough passes are encountered', (pass) ->
	expect 3
	pass()
	pass()

it 'should at least have one passing test', (pass) ->
	expect 1
	pass()

it 'should fail if there are too many passes', (pass) ->
	setTimeout((-> pass(); pass(); pass()), 1)
	expect 2

it 'should fail the current test if an exception occurs outside the call stack', (pass) ->
	setTimeout(
		( ->
			return #TODO: we'll need global error handlers if the below is to work...
			equal 1, 2, "different numbers are different! (this is expected)"
			pass()
		), 0)
	expect 1
