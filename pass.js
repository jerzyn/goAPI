'use latest'

module.exports = function(context, cb) {

    if (!context.data.board) {
        cb("Board is missing!")
    } else {
        let board = JSON.parse(context.data.board)
        let next = board.current == "black" ? "white" : "black"

        board.current = next
        board.movesCount++
            cb(null, board)
    }
}