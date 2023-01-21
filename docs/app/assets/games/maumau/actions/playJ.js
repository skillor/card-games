game.choose(
  game.currentPlayer(),
  of([
    {
      text: 'Diamonds',
      action: game.setVariable(of('lastFace'), of('D')),
    },
    {
      text: 'Hearts',
      action: game.setVariable(of('lastFace'), of('H')),
    },
    {
      text: 'Spades',
      action: game.setVariable(of('lastFace'), of('S')),
    },
    {
      text: 'Clubs',
      action: game.setVariable(of('lastFace'), of('C')),
    },
  ])
)
