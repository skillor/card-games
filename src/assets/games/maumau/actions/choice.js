game.choose(
  game.currentPlayer(),
  game.concat(
    game.if(
      game.eq(of(1), game.add(game.length(game.cards(game.getStack(of('draw')))), game.length(game.cards(game.getStack(of('main')))))),
      of([]),
      game.addCardTargets(
        game.cardOptions(
          game.topCards(game.getStack(of('draw'))),
          of(() => of(true)),
          of(() => game.sequential(
            game.moveCards(
              game.getStack(of('draw')),
              game.getStack(of('hand'), game.currentPlayer()),
              game.topCards(game.getStack(of('draw')))
            ),
          )),
        ),
        game.getStack(of('hand'), game.currentPlayer())
      ),
    ),
    game.addCardTargets(game.cardOptions(
      game.cards(game.getStack(of('hand'), game.currentPlayer())),
      of((cards) =>
        game.or(
          game.eq(game.cardType(of('face'), game.first(cards)), game.getVariable(of('lastFace'))),
          game.eq(game.cardType(of('type'), game.first(cards)), game.cardType(of('type'), game.first(game.topCards(game.getStack(of('main')))))),
          game.eq(game.cardType(of('type'), game.first(cards)), of('J')),
        )
      ),
      of((cards) => game.sequential(
        game.setVariable(of('lastFace'), game.cardType(of('face'), game.first(cards))),
        game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(cards)))),
        game.moveCards(game.getStack(of('hand'), game.currentPlayer()), game.getStack(of('main')), cards),
      )),
    ), game.getStack(of('main')))
  )
)
