game.if(
  game.lessEquals(game.length(game.getCardsOfCardStack(game.getCardStack(of('draw')))), game.max(of(1), game.ToNumber(game.getGameVariable(of('7counter'))))),
  game.sequential(
    game.moveCards(game.getCardStack(of('main')), game.getCardStack(of('draw')), game.bottomCards(game.getCardStack(of('main')), game.add(game.length(game.getCardsOfCardStack(game.getCardStack(of('main')))), of(-1)))),
    game.shuffleStack(game.getCardStack(of('draw'))),
  )
)
