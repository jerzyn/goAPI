'use latest'
var express = require('express');
var Webtask = require('webtask-tools');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json());

app.post('/', function(req, res) {
    console.log(req.webtaskContext.headers.authorization)
    if (!req.webtaskContext.headers.authorization) {
        console.log('missing auth')
        res.status(401).send({ error: "Missing authorization token" })
    } else {
        let creds = req.webtaskContext.headers.authorization.split(" ")
        console.log(new Buffer(creds[1], 'base64').toString('utf-8'))
        creds = new Buffer(creds[1], 'base64').toString('ascii')
        creds = creds.split(":")
        if (creds[0] !== req.webtaskContext.secrets.username || creds[1] !== req.webtaskContext.secrets.password) {
            res.status(401).send({ error: "Incorrect authorization token" })
        } else {
            if (!req.webtaskContext.data.board) {
                // cb("Missing board parameter")
                // res.writeHead(400, { 'Content-Type': 'application/json '});
                res.status(400).send({ error: "Missing board parameter" });
            }

            if (!req.webtaskContext.data.position) {
                // cb("Missing position parameter")
                // res.writeHead(400, { 'Content-Type': 'application/json '});
                res.status(400).send({ error: "Missing position parameter" });
            }

            let board = JSON.parse(req.webtaskContext.data.board)
            let position = JSON.parse(req.webtaskContext.data.position)
            let result = play(position, board)

            res.send(result)
                // cb(null, play(position, board));
                // res.writeHead(200, { 'Content-Type': 'application/json '});
        }
    }
});

module.exports = Webtask.fromExpress(app);

// module.exports = function (context, req, res) {

//   if (!context.data.board) {
//     // cb("Missing board parameter")
//     res.writeHead(400, { 'Content-Type': 'application/json '});
//     res.end({error: "Missing board parameter"}, 'utf-8');
//   } else {
//     let board = JSON.parse(context.data.board)
//   }

//   if(!context.data.position) {
//     // cb("Missing position parameter")
//     res.writeHead(400, { 'Content-Type': 'application/json '});
//     res.end({error: "Missing position parameter"});
//   } else {
//     let position = JSON.parse(context.data.position)
//   }

//   console.log(board)
//   // cb(null, play(position, board));
//   res.writeHead(200, { 'Content-Type': 'application/json '});
//   let result = play(position, board)
//   res.end(result);
// };

function getNeighbours(position, board) {
    let x = position.x
    let y = position.y
    let up = false
    let right = false
    let down = false
    let left = false

    if (position.x > board.size - 1 || position.y > board.size - 1) return []

    let neighbours = board.moves.reduce((acc, curr) => {
        if (curr.x === x - 1 && curr.y === y) {
            left = true
            return acc.concat(curr)
        } else if (curr.x === x + 1 && curr.y == y) {
            right = true
            return acc.concat(curr)
        } else if (curr.x === x && curr.y == y - 1) {
            up = true
            return acc.concat(curr)
        } else if (curr.x === x && curr.y == y + 1) {
            down = true
            return acc.concat(curr)
        } else {
            return acc
        }
    }, [])

    if (!up && y > 0) {
        neighbours.push({ x: x, y: y - 1, color: 'empty' })
    }
    if (!right && x < board.size - 1) {
        neighbours.push({ x: x + 1, y: y, color: 'empty' })
    }
    if (!down && y < board.size - 1) {
        neighbours.push({ x: x, y: y + 1, color: 'empty' })
    }
    if (!left && x > 0) {
        neighbours.push({ x: x - 1, y: y, color: 'empty' })
    }

    return neighbours
}
// 

function getGroup(position, board) {
    let liberties = 0
    let visited = []
    let group = []

    return groupClosure(position, board)

    function groupClosure(position, board) {
        let pointNotVisited = visited.reduce((acc, cur) => acc = (cur.x !== position.x || cur.y !== position.y) && acc, true)

        if (pointNotVisited) {
            let neighbours = getNeighbours(position, board)

            group.push(position)
            visited.push(position)

            let unvisitedNeighbours = neighbours.reduce((acc, cur) => {
                let neighbourVisited = visited.filter(el => (el.x === cur.x && el.y === cur.y))
                if (neighbourVisited.length > 0) {
                    return acc
                } else {
                    return acc.concat(cur)
                }
            }, [])

            unvisitedNeighbours.forEach(stone => {
                if (stone.color == 'empty') {
                    liberties++
                    visited.push(stone)
                } else if (stone.color != position.color) {
                    visited.push(stone)
                }
                groupClosure(stone, board)
            })
            return {
                "group": group,
                "liberties": liberties
            }
        } else {
            return {
                "group": group,
                "liberties": liberties
            }
        }
    }
}

function play(position, board) {
    let captured = []
    let color = board.current
    let opponent_color = color === "white" ? "black" : "white"
    let containsPosition = board.moves.filter(el => el.x === position.x && el.y === position.y).length > 0

    position.color = color

    if (containsPosition || position.x >= board.size || position.y >= board.size || position.x < 0 || position.y < 0) {
        console.log('illegal move')
        return board //illegal move
    } else {
        let neighbours = getNeighbours(position, board)
        let opponentNeighbours = neighbours.filter(el => el.color != 'empty' && el.color !== position.color)
        if (opponentNeighbours.length > 0) {
            opponentNeighbours.forEach(el => {
                let neighbouringGroup = getGroup(el, board)
                if (neighbouringGroup.liberties <= 1) { // not counting the stone which is being placed now - assumes it's there, hence liberties += 1
                    captured.push(neighbouringGroup.group)
                }
            })
            captured = captured.reduce((flat, current) => flat.concat(current), [])
            board.moves = board.moves.reduce((acc, cur) => {
                let prisoners = captured.filter(el => {
                    return (el.x === cur.x && el.y === cur.y)
                })
                if (prisoners.length > 0) {
                    return acc
                } else {
                    return acc.concat(cur)
                }
            }, [])
        }

        if (getGroup(position, board).liberties === 0) {
            console.log('suicide move')
            return board //suicide move
        } else {
            board.moves.push(position)
            board.current === 'white' ? board.black_prisoners = captured : board.white_prisoners = captured
            board.current = opponent_color
            return board
        }
    }

}