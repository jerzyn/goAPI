import _ from 'underscore'

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
// let liberties

function getGroup(position, board, visited = [], group = [], liberties = 0) {
    // let firstIteration = visited.length > 0 ? false : true
    let pointNotVisited = visited.reduce((acc, cur) => (cur.x !== position.x || cur.y !== position.y) && acc, true)

    // if (firstIteration) liberties = 0
    console.log( /*'group', group, */ 'liberties', liberties)
    if (pointNotVisited) {
        console.log('liberties just after if', liberties)
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
                console.log('liberties after increment', liberties)
            } else if (stone.color != position.color) {
                visited.push(stone)
            }
            console.log('liberties before recursion', liberties)
            return getGroup(stone, board, visited, group, liberties)
        })
    } else {
        console.log( /*'else', 'group', group, */ 'liberties before return', liberties)
        let result = {
            "group": group,
            "liberties": liberties
        }
        console.log(result)
        return result
    }
}


// function getGroup(position, board, group = [], visited = []) {
//     let neighbours = getIntersections(position, board)
//     visited.push[position]
//     if (group.length === 0) group.push(position)
//     else if (position.color == group[0].color) group.push(position)
//     neighbours.forEach(el => {
//         //console.log(el)
//         visited.push(el)
//         if (_.isMatch(el, { color: position.color })) {
//             group.push(el)
//         }
//         //console.log('visited: ', visited, 'getIntersections(el, board): ', getIntersections(el, board), 'without: ', _.without(getIntersections(el, board), visited))
//         getGroup(_.without(getIntersections(el, board), visited), board, group, visited)
//             //console.log(group)
//     })
//     return group
// }

let board = {
    moves: [
        { x: 1, y: 3, color: "white" },
        { x: 3, y: 4, color: "white" },
        { x: 0, y: 2, color: "white" },
        { x: 0, y: 3, color: "white" },
        { x: 4, y: 5, color: "black" },
        { x: 0, y: 1, color: "black" },
        { x: 1, y: 2, color: "black" },
        { x: 2, y: 1, color: "black" },
        { x: 2, y: 3, color: "black" },
        { x: 2, y: 5, color: "black" },
        { x: 0, y: 4, color: "white" }
    ],
    size: 19
}

console.log(getGroup({ x: 0, y: 2, color: 'white' }, board))