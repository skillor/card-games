game.choose(
  game.currentPlayer(),
  game.ToArray(
    game.textOption(of('Diamonds'), of(() => game.setVariable(of('lastFace'), of('D')))),
    game.textOption(of('Hearts'), of(() => game.setVariable(of('lastFace'), of('H')))),
    game.textOption(of('Spades'), of(() => game.setVariable(of('lastFace'), of('S')))),
    game.textOption(of('Clubs'), of(() => game.setVariable(of('lastFace'), of('C')))),
  )
)
