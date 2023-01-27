game.choose(
  game.currentPlayer(),
  game.cardOptions(
    game.getCardsOfCardStack(game.getCardStack(of('main'))),
    of(() => of(true)),
    of(() => game.sequential(
      game.moveCards(
        game.getCardStack(of('hand'), game.currentPlayer()),
        game.getCardStack(of('main2')),
        game.getCardsOfCardStack(game.getCardStack(of('hand'), game.currentPlayer())),
      ),
      game.moveCards(
        game.getCardStack(of('main')),
        game.getCardStack(of('hand'), game.currentPlayer()),
        game.getCardsOfCardStack(game.getCardStack(of('main'))),
      ),
      game.moveCards(
        game.getCardStack(of('main2')),
        game.getCardStack(of('main')),
        game.getCardsOfCardStack(game.getCardStack(of('main2'))),
      ),
      game.setPhase(game.nextPlayer(), of('main')),
    )),
  ),
)
