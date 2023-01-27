game.sequential(
  game.fillStack(game.getCardStack(of('draw'))),
  game.shuffleStack(game.getCardStack(of('draw'))),
  game.map(
    game.players(),
    of((player) => game.sequential(
      game.moveCards(
        game.getCardStack(of('draw')),
        game.getCardStack(of('hand'), player),
        game.topCards(game.getCardStack(of('draw')), game.ToString(game.getGameVariable(of('startHandCards'))))
      )
    ))
  ),
  game.moveCards(
    game.getCardStack(of('draw')),
    game.getCardStack(of('main')),
    game.topCards(game.getCardStack(of('draw')))
  ),
  game.setGameVariable(of('lastFace'), game.cardType(of('face'), game.first(game.topCards(game.getCardStack(of('main')))))),
  game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(game.topCards(game.getCardStack(of('main'))))))),
  game.setPhase(game.randomChoice(game.players()), of('main'))
)
