game.sequential(
  game.fillStack(game.getCardStack(of('draw'))),
  game.shuffleStack(game.getCardStack(of('draw'))),
  game.map(
    game.players(),
    of((player) => game.sequential(
      game.moveCards(
        game.getCardStack(of('draw')),
        game.getCardStack(of('hand'), player),
        game.topCards(game.getCardStack(of('draw')), game.ToString(game.getGameVariable(of('handCards'))))
      )
    ))
  ),
  game.moveCards(
    game.getCardStack(of('draw')),
    game.getCardStack(of('main')),
    game.topCards(game.getCardStack(of('draw')), game.ToString(game.getGameVariable(of('handCards'))))
  ),
  game.setPhase(game.randomChoice(game.players()), of('main'))
)
