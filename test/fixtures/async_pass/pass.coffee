it 'should pass', (pass) ->
	setTimeout(pass, 0)
	setTimeout(pass, 2)
	expect(2)

it 'should pass even when expectencies are set later', (pass) ->
	pass()
	expect(1)
