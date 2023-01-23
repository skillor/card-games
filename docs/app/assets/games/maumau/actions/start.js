game.sequential(
  game.populate(game.getStack(of('draw'))),
  game.shuffle(game.getStack(of('draw'))),
  game.map(
    game.players(),
    of((player) => game.sequential(
      game.moveCards(
        game.getStack(of('draw')),
        game.getStack(of('hand'), player),
        game.topCards(game.getStack(of('draw')), game.ToString(game.getVariable(of('startHandCards'))))
      )
    ))
  ),
  game.moveCards(
    game.getStack(of('draw')),
    game.getStack(of('main')),
    game.topCards(game.getStack(of('draw')))
  ),
  game.setVariable(of('lastFace'), game.cardType(of('face'), game.first(game.topCards(game.getStack(of('main')))))),
  game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(game.topCards(game.getStack(of('main'))))))),
  game.setPhase(game.randomChoice(game.players()), of('main'))
)
