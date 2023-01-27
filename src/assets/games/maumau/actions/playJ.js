game.choose(
  game.currentPlayer(),
  game.ToArray(
    game.textOption(of('Diamonds'), of(() => game.setGameVariable(of('lastFace'), of('D')))),
    game.textOption(of('Hearts'), of(() => game.setGameVariable(of('lastFace'), of('H')))),
    game.textOption(of('Spades'), of(() => game.setGameVariable(of('lastFace'), of('S')))),
    game.textOption(of('Clubs'), of(() => game.setGameVariable(of('lastFace'), of('C')))),
  )
)
