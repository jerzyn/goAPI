'use latest'

module.exports = function(context, cb) {
    let board = {
        // colors: [ "white", "black"],
        size: context.data.size ? context.data.size : 19,
        moves: [], // { x: coord, y: coord, color: white/black/empty }
        white_prisoners: 0,
        black_prisoners: 0,
        current: "black",
        movesCount: 0
    }

    cb(null, board);
};