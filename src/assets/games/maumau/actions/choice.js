game.choose(
  game.currentPlayer(),
  game.concat(
    game.if(
      game.equals(of(1), game.add(game.length(game.getCardsOfCardStack(game.getCardStack(of('draw')))), game.length(game.getCardsOfCardStack(game.getCardStack(of('main')))))),
      game.emptyOptions(),
      game.addCardStackTargets(
        game.cardOptions(
          game.topCards(game.getCardStack(of('draw'))),
          of(() => of(true)),
          of(() => game.sequential(
            game.moveCards(
              game.getCardStack(of('draw')),
              game.getCardStack(of('hand'), game.currentPlayer()),
              game.topCards(game.getCardStack(of('draw')))
            ),
          )),
        ),
        game.ToArray(game.getCardStack(of('hand'), game.currentPlayer()))
      ),
    ),
    game.addCardStackTargets(game.cardOptions(
      game.getCardsOfCardStack(game.getCardStack(of('hand'), game.currentPlayer())),
      of((cards) =>
        game.or(
          game.equals(game.cardType(of('face'), game.first(cards)), game.ToString(game.getGameVariable(of('lastFace')))),
          game.equals(game.cardType(of('type'), game.first(cards)), game.cardType(of('type'), game.first(game.topCards(game.getCardStack(of('main')))))),
          game.equals(game.cardType(of('type'), game.first(cards)), of('J')),
        )
      ),
      of((cards) => game.sequential(
        game.setGameVariable(of('lastFace'), game.cardType(of('face'), game.first(cards))),
        game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(cards)))),
        game.moveCards(game.getCardStack(of('hand'), game.currentPlayer()), game.getCardStack(of('main')), cards),
      )),
    ), game.ToArray(game.getCardStack(of('main'))))
  )
)
