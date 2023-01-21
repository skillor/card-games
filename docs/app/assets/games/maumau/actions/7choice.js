game.sequential(
  game.setVariable(of('7counter'), game.min(game.getVariable(of('7counter')), game.add(game.length(game.cards(game.getStack(of('draw')))), game.length(game.cards(game.getStack(of('main')))), of(-1)))),
  game.choose(
    game.currentPlayer(),
    game.concat(
      game.addCardTargets(
        game.cardOptions(
          game.topCards(game.getStack(of('draw'))),
          of(() => of(true)),
          of(() => game.sequential(
            game.runAction(of('refill')),
            game.moveCards(
              game.getStack(of('draw')),
              game.getStack(of('hand'), game.currentPlayer()),
              game.topCards(game.getStack(of('draw')), game.getVariable(of('7counter')))
            ),
            game.setVariable(of('7counter'), of(0)),
          )),
        ),
        game.getStack(of('hand'), game.currentPlayer())
      ),
      game.addCardTargets(game.cardOptions(
        game.cards(game.getStack(of('hand'), game.currentPlayer())),
        of((cards) =>
          game.eq(game.cardType(of('type'), game.first(cards)), of('7'))
        ),
        of((cards) => game.sequential(
          game.moveCards(game.getStack(of('hand'), game.currentPlayer()), game.getStack(of('main')), cards),
          game.setVariable(of('lastFace'), game.cardType(of('face'), game.first(cards))),
          game.runAction(game.add(of('play'), game.cardType(of('type'), game.first(cards)))),
        )),
      ), game.getStack(of('main')))
    )
  )
)
