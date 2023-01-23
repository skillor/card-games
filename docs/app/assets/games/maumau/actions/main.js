game.if(
  game.eq(of(true), game.ToBoolean(game.getVariable(of('playedA')))),
  game.sequential(
    game.setVariable(of('playedA'), of(false)),
    game.setPhase(game.nextPlayer(), of('main'))
  ),
  game.sequential(
    game.runAction(of('refill')),
    game.if(
      game.eq(of(0), game.ToNumber(game.getVariable(of('7counter')))),
      game.runAction(of('choice')),
      game.runAction(of('7choice')),
    ),
    game.if(
      game.eq(of(0), game.length(game.cards(game.getStack(of('hand'), game.currentPlayer())))),
      game.end(of(true)),
      game.setPhase(game.nextPlayer(), of('main')),
    )
  ),
)
