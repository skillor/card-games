game.if(
  game.leq(game.length(game.cards(game.getStack(of('draw')))), game.max(of(1), game.getVariable(of('7counter')))),
  game.sequential(
    game.moveCards(game.getStack(of('main')), game.getStack(of('draw')), game.bottomCards(game.getStack(of('main')), game.add(game.length(game.cards(game.getStack(of('main')))), of(-1)))),
    game.shuffle(game.getStack(of('draw'))),
  )
)
