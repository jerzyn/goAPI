# goAPI

A simple REST API to play a game of Go

## How to deploy using webtask.io

You can upload the functions either by copy pasting the function code in the webtask.io web editor or using [Webtask CLI](https://webtask.io/cli "Webtask CLI"):

```wt create create-board.js
wt create pass.js
wt create play.js --secret USERNAME=YOUR_USERNAME --secret PASSWORD=YOUR_PASSWORD
```

This will create 3 webtask endpoints: `create a board`, `pass` a move and `play` a move.

Next you will have to integrate it with your slack team. To do that please follow the steps described here: [Slash Webtasks](https://webtask.io/slack "Slash Webtasks").
While creating give your slash webtask a name such as goSlack, goAPI, etc.

## How does it work

Your API currently consists of 3 functions (endpoints): create board, play and pass. Being RESTful endpoints (even though they use verbs-actions instead of resources) they all are stateless and need to pass the state in every call.

Additionally there is a Slash Webtask function to play a simple game of go within your slack team. It uses all the aforementioned webtask endpoints and can pass states and arguments in a crude way.

### create_board.js

`create_board` function runs with an optional `size` parameter which specifies the board size. The default size is 19. The function returns a new board as a JSON

Request:
`curl https://YOUR_WEBTASK_URL/create_board?size=12`

Response:
```{
  "size": "12",
  "moves": [],
  "white_prisoners": 0,
  "black_prisoners": 0,
  "current": "black",
  "movesCount": 0
}
```

### pass.js

`pass` function needs the current board state as a parameter. It is passed as a JSON file in request's query or header. The function returns an updated board state as a JSON

Request:
`curl https://YOUR_WEBTASK_URL/pass?board={"size":"19","moves":[{"x":4,"y":7,"color":"black"},{"x":4,"y":5,"color":"white"}],"white_prisoners":[],"black_prisoners":[],"current":"black","movesCount":0}`

Response:
```{
  "size": "19",
  "moves": [
    {
      "x": 4,
      "y": 7,
      "color": "black"
    },
    {
      "x": 4,
      "y": 5,
      "color": "white"
    }
  ],
  "white_prisoners": [],
  "black_prisoners": [],
  "current": "white",
  "movesCount": 1
}
```

### play.js

`play` function is POST endpoint which needs two parameters: the move a player is trying to make and the current board state. They both need to be passed as JSON in request's query or headers. Play function detects if the move is valid (played on an occupied or non-existend field) and legal (if it's a suicide move). It also checks if the move captures stones and applies this in the result. It returns board's state as a JSON. It uses Basic Auth for authentication and has to receive Base64 encoded username and password parameters to match the ones saved as a secret within webtask.io.

Request:
`curl -X POST https://YOUR_WEBTASK_URL/play?position={"x":4,"y":1}&board={"size":"19","moves":[{"x":4,"y":7,"color":"black"},{"x":4,"y":5,"color":"white"}],"white_prisoners":[],"black_prisoners":[],"current":"black","movesCount":0}`

Response:
```{
  "size": "19",
  "moves": [
    {
      "x": 4,
      "y": 7,
      "color": "black"
    },
    {
      "x": 4,
      "y": 5,
      "color": "white"
    },
    {
      "x": 4,
      "y": 1,
      "color": "black"
    }
  ],
  "white_prisoners": [],
  "black_prisoners": [],
  "current": "white",
  "movesCount": 0
}
```

### Slash Webtask

To play the game you can use slash webtask after setting it up. It consists of 4 functtions:

- webtask description - `/wt goAPI`
- create_board - `/wt goAPI create_board [size]`
- pass - `/wt goAPI pass BOARD` where BOARD is the current board state in JSON
- play - `/wt goAPI play MOVE BOARD` where MOVE is the intended new move and BOARD is the current board state, both in JSON

The webtask will return an ASCII representation of the new boards state and its JSON representation. 

Remember that to run correctly you have to set the webtask up with both username and password matching the ones in play.js webtask for authentication.

## Further development

- Add functionality to detect end-game and count the score
- Improve slash webtask's UX and pass the params in an easier and more errorproof way
- Create a web client to play the game
