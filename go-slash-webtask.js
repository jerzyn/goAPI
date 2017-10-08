'use latest'

const request = require('request')

/*

Slash Webtasks: Extend Slack with Node.js, powered by Auth0 Webtasks (https://webtask.io)
For documentation, go to https://github.com/auth0/slash
You can find us on Slack at https://webtask.slack.com (join via http://chat.webtask.io)

*/

module.exports = (ctx, cb) => {
    // TIPS:
    // 1. Input and output: https://github.com/auth0/slash#inputs-and-outputs
    // 2. Response formatting: https://api.slack.com/docs/messages/builder
    // 3. Secrets you configure using the key icon are available on `ctx.secrets`
    let path = ''
    let queryParams = {}
    let queryMethod = 'GET'
    let params = ctx.body.text.split(" ")

    switch (params[0].toLowerCase()) {
        case "create":
            queryParams.size = 19
            if (params.length > 1 && !isNaN(params[1])) {
                queryParams.size = params[1]
            }
            path = 'create-board'
            break;
        case "pass":
            if (params.length > 1 && validateJSON(params[1])) {
                queryParams.board = params[1]
                path = 'pass'
            } else {
                cb(null, { text: "Error: board not present or not sent as a valid JSON" })
            }
            //{"size":"19","moves":[],"white_prisoners":0,"black_prisoners":0,"current":"black","movesCount":0}
            break;
        case "play":
            if (params.length > 2 && validateJSON(params[1]) && validateJSON(params[2])) {
                if (!validatePosition(params[1])) {
                    cb(null, { text: 'Error: position is not valid. The only accepted format is: {"x":3,"y":5} with no whitespaces' })
                }
                if (!validateBoard(params[2])) {
                    cb(null, { text: 'Error: board is not valid. The only accepted format is: {"size":"19","moves":[{"x":4,"y":7,"color":"black"},{"x":4,"y":5,"color":"white"}],"white_prisoners":[{"x":4,"y":9}],"black_prisoners":[{"x":2,"y":7}],"current":"black","movesCount":5} with no whitespaces.' })
                }
                queryParams.position = params[1]
                queryParams.board = params[2]
                path = 'play'
                queryMethod = 'POST'
            } else {
                cb(null, { text: "Error: board and/or position not present or not a valid JSON" })
            }
            break;
        default:
            cb(null, { text: 'Welcome to SlackGo Bot\nTo generate a new board execute "\/wt mitropia create [size]"\nTo play a move type "\/wt mitropia play move board", where move is a valid JSON string without spaces and with format: {"x":3,"y":5} and board is the board returned from the previous move or create action\nTo pass your move type: "\/wt mitropia pass board"' })
    }

    let options = {
            url: 'https://wt-2585b0a1aa8f880b67bf81c93e60111c-0.run.webtask.io/' + path,
            method: queryMethod,
            headers: { 'Authorization': 'Basic ' + new Buffer(ctx.secrets.username + ":" + ctx.secrets.password).toString('base64') },
            qs: queryParams
                //{ "size": 19 } 
        }
        // console.log(options)

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            // Print out the response body
            let responseBody = JSON.parse(body)
            if (responseBody.error) {
                cb(null, { text: responseBody.error })
            }
            let board = drawBoard(responseBody)
            if (path !== 'create' && body === queryParams.board) {
                cb(null, {
                    text: board + "\nIllegal move\n"
                });
            }
            cb(null, {
                text: board + "\n" + body + "\n"
            });
        } else {
            cb(null, { text: JSON.parse(body).error })
        }
    })
}

function drawBoard(responseBody) {
    let board = "``` "
    let topLeftGrid = '0 ┌  '
    let topGrid = '┬  '
    let topRightGrid = '┐\n'
    let leftGrid = '├  '
    let rightGrid = '┤'
    let middleGrid = '┼  '
    let bottomGrid = '┴  '
    let bottomLeftGrid = '└  '
    let bottomRightGrid = '┘'
    let blackStone = '●  '
    let whiteStone = '○  '

    for (let i = 0; i < responseBody.size; i++) {
        board += i.toString() + " "
        if (i < 10) {
            board += " "
        }
        if (i === responseBody.size - 1) {
            board += "\n"
        }
    }
    for (let i = 0; i < responseBody.size; i++) {
        for (let j = 0; j < responseBody.size; j++) {
            let pending = true
            responseBody.moves.forEach(move => {
                if (move.x === i && move.y === j) {
                    if (move.color == "black") {
                        board += blackStone
                    } else {
                        board += whiteStone
                    }
                    pending = false
                }
            })
            if (pending) {
                if (i === 0 && j === 0) {
                    board += topLeftGrid
                } else if (i === 0 && j === responseBody.size - 1) {
                    board += topRightGrid
                } else if (i === 0) {
                    board += topGrid
                } else if (j === 0 && i !== responseBody.size - 1) {
                    if (i < 10) {
                        board += i + " " + leftGrid
                    } else {
                        board += i + leftGrid
                    }
                } else if (j === responseBody.size - 1 && i !== responseBody.size - 1) {
                    board += rightGrid + "\n"
                } else if (i === responseBody.size - 1 && j === 0) {
                    if (i < 10) {
                        board += i + " " + bottomLeftGrid
                    } else {
                        board += i + bottomLeftGrid
                    }
                } else if (i === responseBody.size - 1 && j === responseBody.size - 1) {
                    board += bottomRightGrid + '```\n'
                } else if (i === responseBody.size - 1) {
                    board += bottomGrid
                } else {
                    board += middleGrid
                }
            }
        }
    }
    return board
}

function validateJSON(jsonString) {
    try {
        JSON.parse(jsonString)
    } catch (e) {
        return false
    }
    return true
}

function validatePosition(position) {
    position = JSON.parse(position)
    if (position.x && position.y) {
        return true
    } else {
        return false
    }
}

function validateBoard(board) {
    board = JSON.parse(board)
    if (!board.moves && !board.current && !board.movesCount && !board.white_prisoners && !board.black_prisoners && !board.size) {
        return false
    } else {
        return true
    }
}