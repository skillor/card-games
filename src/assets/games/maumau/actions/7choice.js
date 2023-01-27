game.sequential(
  game.setGameVariable(of('7counter'), game.min(game.getGameVariable(of('7counter')), game.add(game.length(game.getCardsOfCardStack(game.getCardStack(of('draw')))), game.length(game.getCardsOfCardStack(game.getCardStack(of('main')))), of(-1)))),
  game.choose(
    game.currentPlayer(),
    game.concat(
      game.addCardStackTargets(
        game.cardOptions(
          game.topCards(game.getCardStack(of('draw'))),
          of(() => of(true)),
          of(() => game.sequential(
            game.runAction(of('refill')),
            game.moveCards(
              game.getCardStack(of('draw')),
              game.getCardStack(of('hand'), game.currentPlayer()),
              game.topCards(game.getCardStack(of('draw')), game.ToNumber(game.getGameVariable(of('7counter'))))
            ),
            game.setGameVariable(of('7counter'), of(0)),
          )),
        ),
        game.ToArray(game.getCardStack(of('hand'), game.currentPlayer()))
      ),
      game.addCardStackTargets(game.cardOptions(
        game.getCardsOfCardStack(game.getCardStack(of('hand'), game.currentPlayer())),
        of((cards) =>
          game.equals(game.cardType(of('type'), game.first(cards)), of('7'))
        ),
        of((cards) => game.sequential(
          game.moveCards(game.getCardStack(of('hand'), game.currentPlayer()), game.getCardStack(of('main')), cards),
          game.setGameVariable(of('lastFace'), game.cardType(of('face'), game.first(cards))),
          game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(cards)))),
        )),
      ), game.ToArray(game.getCardStack(of('main'))))
    )
  )
)
