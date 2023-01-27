game.if(
  game.equals(of(true), game.ToBoolean(game.getGameVariable(of('playedA')))),
  game.sequential(
    game.setGameVariable(of('playedA'), of(false)),
    game.setPhase(game.nextPlayer(), of('main'))
  ),
  game.sequential(
    game.runAction(of('refill')),
    game.if(
      game.equals(of(0), game.ToNumber(game.getGameVariable(of('7counter')))),
      game.runAction(of('choice')),
      game.runAction(of('7choice')),
    ),
    game.if(
      game.equals(of(0), game.length(game.getCardsOfCardStack(game.getCardStack(of('hand'), game.currentPlayer())))),
      game.endGame(of(true)),
      game.setPhase(game.nextPlayer(), of('main')),
    )
  ),
)
