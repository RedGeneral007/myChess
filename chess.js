// default map = rnbqkbnrpppppppp11111111111111111111111111111111PPPPPPPPRNBQKBNR

let divSquareA = '<div id=sY$coordYsX$coordX class="square $color"></div>';
let divFigureA = '<div id=fY$coordYfX$coordX class="figure">$figure</div>';
let divModal = `<div class="modal_select">
                <div class="container_select">
                    <h2>Well done!</h2>
                    <p>Your pawn has reached $num square!</p>
                    <div class="box_select">
                    <p>Please select figure to replace it:</p>
                    </div>
                </div>
            </div>`;
let divSelectSquare = `<div class="square_select"><div id="$figure" class="figure_select">$figure</div></div>`;
let squareSpan = '<span></span>';
let infoModel = '<span class="turn_color">$figures_turn</span>&nbsp;turn&nbsp;$checking';
let check_modal = '<div class="check_modal"><p>CHECK</p></div>';


let isDragging = false;
let isFlipped = false;

let turn_number = 0;
let figures_turn = (turn_number % 2) ? 'black' : 'white';
let figures = "kqrbnp";
let enemy_figures = '';
let history = [];

let current_passant = {
    y: -1,
    x: -1,
};


const new_map = 'rnbqkbnrpppppppp11111111111111111111111111111111PPPPPPPPRNBQKBNR';

$(function () {
    start();
    $('.button_new').click(start);
    $('.button_flip').click(flipBoard);
    /* setInterval('showFigures(mapStringify())',3000); */
});


function start() {
    history = [];
    turn_number = 0;
    map = new Array(8);
    possible_moves = new Array();
    for (i = 0; i < 8; i++) {
        map[i] = [];
    }
    addSquares();
    showFigures(new_map);
    console.log(map);
    setHover();
    updateInfoPanel();
    showFiguresCanAttack();
}

function mapStringify () {
    str = '';
    for (y of map) {
        for (x of y) {
            str += x;
        }
    }
    return str;
}

function updateInfoPanel () {

    let info_panel = $('.info_panel');
    let infoWidth = info_panel.css('width');
    let infoHeight = info_panel.css('height');
    
    function uppCase (str) {
        str = str.charAt(0).toUpperCase() + str.substring(1);
        return str;
    }
    
    
    if (my_king_under_attack()) {

        info_panel.html('');
        info_panel.html(infoModel.replace('$figures_turn', uppCase(figures_turn)).replace('$checking', "<span class='check_text'>CHECK</span>"));
        
        $('.info_panel .turn_color').css('color', figures_turn.toLowerCase());
        $('.info_panel .check_text').css('color', figures_turn.toLowerCase());

        info_panel.css('width', infoWidth);
        info_panel.css('height', infoHeight);
        info_panel.animate({
            width: "200px",
            height: "31px"
        },10);
    }
    else {

        info_panel.html('');
        info_panel.html(infoModel.replace('$figures_turn', uppCase(figures_turn)).replace('$checking', ""));

        $('.info_panel .turn_color').css('color', figures_turn.toLowerCase());

        if (infoWidth !== "0px" || infoHeight !== "0px") {
            info_panel.css('width', infoWidth);
            info_panel.css('height', infoHeight);
            info_panel.animate({
                width: "109px",
                height: "28px"
            },10);
        }
        
    }
}

function updateHistory (fromY, fromX, toY, toX) {

    let history_object = {
        figure: map[fromY][fromX],
        fromSquare: {
            y: fromY,
            x: fromX,
        },
        toSquare: {
            y: toY,
            x: toX,
        },
        check: my_king_under_attack() ? "CHECK" : "",
    }
    history.push(history_object);
}

function is_possible_check (myking) {
    for (checkY = 0; checkY < 8; checkY++) {
        for (checkX = 0; checkX < 8; checkX++) {

            if (enemy_figures.includes(map[checkY][checkX])) {
                if (canMove(checkY, checkX, myking.y, myking.x)) {
                    return true;
                }
                else {
                    continue;
                }
            }
            else {
                continue;
            }
        }
    }
    return false;
}

function find_my_king () {
    let my_king = (turn_number % 2) ? "k" : "K";

    for (kingY = 0; kingY < 8; kingY++) {
        for (kingX = 0; kingX < 8; kingX++) {

            if (map[kingY][kingX] === my_king) {
                return {
                    y: kingY,
                    x: kingX
                }
            }
            else {
                continue;
            }
            
        }
    }

}

function showFiguresCanAttack () {

    for (removeY = 0; removeY < 8; removeY++) {
        for (removeX = 0; removeX < 8; removeX++) {
            if ($('#fY' + removeY + 'fX' + removeX).hasClass('active_figure')) {
                $('#fY' + removeY + 'fX' + removeX).removeClass("active_figure");
            }
            else {
                continue;
            }
        }
    }

    for (fromY = 0; fromY < 8; fromY++) {
        for (fromX = 0; fromX < 8; fromX++) {
            for (showY = 0; showY < 8; showY++) {
                for (showX = 0; showX < 8; showX++) {
                    if (fromY == showY && fromX == showX) {
                        continue;
                    }
                    
                        if (correctMove(fromY, fromX, showY, showX)) {
                            $('#fY' + fromY + 'fX' + fromX).addClass("active_figure");
                            break;
                        }
                        else {
                            continue;
                        }
                    
                }
            }
        }
    }

}


function setDraggable () {
    
    $('.figure').draggable({
        start: function (event,ui) {
            isDragging = true;
        },
        stop: function (e, ui) {
            if (possible_moves) {
                for (coord of possible_moves) {
                    y = coord.y;
                    x = coord.x;
                    $('#sY' + y + 'sX' + x).removeClass("active_square");
                }
            }
            if ($(this).outerHeight(true) && $(this).outerWidth(true)) {

                let fY = ui.helper.context.parentElement.id.substring(2,3);
                let fX = ui.helper.context.parentElement.id.substring(5,6);

                moveFigure(fY, fX, fY, fX);
                showFiguresCanAttack();

                isDragging = false;
            }

            setHover();
        }
    });
    
}

function setDroppable () {
    $('.square').droppable({
        drop:   function (event, ui) {

            let fromY = Number(ui.draggable.attr('id').substring(2,3));
            let fromX = Number(ui.draggable.attr('id').substring(5,6));
            let toY = Number(this.id.substring(2,3));
            let toX = Number(this.id.substring(5,6));

            if (correctMove(fromY, fromX, toY, toX)) {

                if (map[fromY][fromX] == 'P' || map[fromY][fromX] == 'p') {
                    wasEnPassant(toY, toX) ? enPassantRemove(fromY, toY, toX) : '';

                    if (pawnReachedEnd(fromY, fromX, toY)) {
                        pawnPromote(fromY, fromX, toY, toX);
                    }
                    else {
                        updateHistory(fromY, fromX, toY, toX);
                        turnContinue(fromY, fromX, toY, toX);
                    }
                }

                else if (map[fromY][fromX] == 'K' || map[fromY][fromX] == 'k') {
                    updateHistory(fromY, fromX, toY, toX);
                    turnContinue(fromY, fromX, toY, toX);
                }

                else {
                    updateHistory(fromY, fromX, toY, toX);
                    turnContinue(fromY, fromX, toY, toX);
                }

            }
            else {
                moveFigure(fromY, fromX, fromY, fromX);
                showFiguresCanAttack();
            }

            console.log(map);
            console.log(figures_turn);

            
            setHover();
            isDragging = false;


            console.log("The turn number is " + turn_number);
            console.log(history);
        }
    });
}

function setHover () {
    
    function showMoves (fromY, fromX) {
        possible_moves = [];
        for (s = 0; s < 8; s++) {
            for (m = 0; m < 8; m++) {
                if (fromY === s && fromX === m) {
                    continue;
                }
                if (correctMove(fromY, fromX, s, m)) {
                    possible_moves.push({
                        y: s,
                        x: m
                    });
                    $('#sY' + s + 'sX' + m).addClass("active_square");
                }
                else {
                    continue;
                }
            }
        }
    }
    
    $('.figure').hover(
        function () {
            let fromY = Number($(this).attr('id').substring(2,3));
            let fromX = Number($(this).attr('id').substring(5,6));
            showMoves(fromY, fromX);
        },
        function () {
            for (coord of possible_moves) {
                y = coord.y;
                x = coord.x;
                $('#sY' + y + 'sX' + x).removeClass("active_square");
            }
        }
    );
} 


function my_king_under_attack () {
    let check;

    figures_turn = (turn_number % 2) ? 'white' : 'black';
    check = is_possible_check(find_my_king());
    figures_turn = (turn_number % 2) ? 'black' : 'white';

    return check;
}

function canMove (fromY, fromX, toY, toX) {

    figure = map[fromY][fromX];

    if (figures_turn == 'black' && figures.toUpperCase().includes(map[fromY][fromX])) {
        return false;
    }
    else if (figures_turn == 'white' && figures.includes(map[fromY][fromX])) {
        return false;
    }
    

    if (fromY == toY && fromX == toX) {
        return false;
    }
    else if (isSameColor(map[fromY][fromX], map[toY][toX])) {
        return false;
    }

    
    switch (figure) {
        
        //King rules
        case 'k' : 
        case 'K' : 

            if (Math.abs(fromY - toY) == 1 && Math.abs(fromX - toX) == 1) {
                return true;
            }
            if (Math.abs(fromY - toY) == 1 && Math.abs(fromX - toX) == 0) {
                return true;
            }
            if (Math.abs(fromY - toY) == 0 && Math.abs(fromX - toX) == 1) {
                return true;
            }
            else {
                return false;
            }

            //Queen rules 
        case 'q' :
        case 'Q' : 

        let sign_x = Math.sign(toX - fromX);
        let sign_y = Math.sign(toY - fromY);

            if (Math.abs(fromY - toY) == Math.abs(fromX - toX)) {
                do {
                    fromY += sign_y;
                    fromX += sign_x;
                    if (fromY == toY) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_y + 1) ? fromY < 8 : fromY > 0)
            }

            if (fromY == toY && fromX !== toX) {
                do {
                    fromX += sign_x;
                    if (fromX == toX) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_x + 1) ? fromX < 8 : fromX > 0)
            }

            if (fromX == toX && fromY !== toY) {
                do {
                    fromY += sign_y;
                    if (fromY == toY) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_y + 1) ? fromY < 8 : fromY > 0)
            }

            else {
                return false;
            }

            //Rook rules
        case 'r' :
        case 'R' : 

            if (fromY == toY && fromX !== toX) {

                let sign_x = Math.sign(toX - fromX);

                do {
                    fromX += sign_x;
                    if (fromX == toX) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_x + 1) ? fromX < 8 : fromX > 0)
            }

            if (fromX == toX && fromY !== toY) {
                let sign_y = Math.sign(toY - fromY);

                do {
                    fromY += sign_y;
                    if (fromY == toY) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_y + 1) ? fromY < 8 : fromY > 0)
            }
            else {
                return false;
            };

            //Bishop rules
        case 'b' :
        case 'B' : 

            if (Math.abs(fromY - toY) == Math.abs(fromX - toX)) {
                let sign_x = Math.sign(toX - fromX);
                let sign_y = Math.sign(toY - fromY);

                do {
                    fromY += sign_y;
                    fromX += sign_x;
                    if (fromY == toY && fromX == toX) {
                        return true;
                    }
                    if (map[fromY][fromX] != '1') {
                        return false;
                    }
                } while ((sign_y + 1) ? fromY < 8 : fromY > 0)
            }
            else {
                return false;
            }

            //Knight rules
        case 'n' :
        case 'N' : 

            if (Math.abs(fromX - toX) == 2 && Math.abs(fromY - toY) == 1) {
                return true;
            }
            if (Math.abs(fromX - toX) == 1 && Math.abs(fromY - toY) == 2) {
                return true;
            }
            else {
                return false;
            };

            //Pawn rules
        case 'p' :
        case 'P' : 

            
            if (figure === 'P') {
                if ((fromY - toY) == 1 && Math.abs(fromX - toX) == 1) {
                    if (wasEnPassant(toY, toX)) {
                        return true;
                    }
                    else if (map[toY][toX] != '1') {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                if (fromY == 6) {
                    if (fromY - toY == 1 && fromX == toX) {
                        if (map[toY][toX] != '1') {
                            return false;
                        }
                        return true;
                    }
                    else if (fromY - toY == 2 && fromX == toX) {
                        if (map[toY][toX] != '1' || map[toY + 1][toX] != '1') {
                            return false;
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
                }

                else if (fromY - toY == 1 && fromX == toX) {
                    if (map[toY][toX] != '1') {
                        return false;
                    }
                    return true;
                }

                else {
                    return false;
                }
            }
            else {
                if ((fromY - toY) == -1 && Math.abs(fromX - toX) == 1) {
                    if (wasEnPassant(toY, toX)) {
                        return true;
                    }
                    else if (map[toY][toX] != '1') {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                if (fromY == 1) {
                    if (fromY - toY == -1 && fromX == toX) {
                        if (map[toY][toX] != '1') {
                            return false;
                        }
                        return true;
                    }
                    else if (fromY - toY == -2 && fromX == toX) {
                        if (map[toY][toX] != '1' || map[toY - 1][toX] != '1') {
                            return false;
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                if (fromY - toY == -1 && fromX == toX) {
                    if (map[toY][toX] != '1') {
                        return false;
                    }
                    return true;
                }
                else {
                    return false;
                }
            }
            
        default : return false;
    }
}

function correctMove (fromY, fromX, toY, toX) {

    
    if(canMove(fromY, fromX, toY, toX)) {
        let check = false;
        let king = '';
        let prev_figure;

        if (map[toY][toX] != '1') {
            prev_figure = map[toY][toX];
        }

        function move (fromY, fromX, toY, toX) {
            figureMove = map[fromY][fromX];
            map[toY][toX] = figureMove;
            map[fromY][fromX] = '1';
        }
        
        move(fromY, fromX, toY, toX);
        figures_turn = (turn_number % 2) ? 'white' : 'black';

        king = find_my_king();

        check = is_possible_check(king);
        
        figures_turn = (turn_number % 2) ? 'black' : 'white';
        move(toY, toX, fromY, fromX);
        prev_figure ? map[toY][toX] = prev_figure : '';
        prev_figure = '';

        return !check;
    }
    else {
        return false;
    }
}


function enPassantRemove (fromY, toY, toX) {
    let sign_y = Math.sign(fromY - toY);
    showFigureAt((toY + sign_y), toX, '1');
}

function wasEnPassant (toY, toX) {
    
    if (toY == current_passant.y && toX == current_passant.x) {
        return true;
    }
    else {
        return false;
    }

}

function twoSquaresPawnMove (fromY, fromX, toY) {
    if (Math.abs(fromY - toY) == 2 && (map[fromY][fromX] == 'P' || map[fromY][fromX] == 'p')) {
        current_passant.x = fromX;
        current_passant.y = (fromY + toY) / 2;
    }
    else {
        current_passant.x = -1;
        current_passant.y = -1;
    }
}

function pawnReachedEnd (fromY, fromX, toY) {

    figure = map[fromY][fromX];

    if ( (figure === 'P' && toY == 0) || (figure === 'p' && toY == 7) ) {
        return true;
    }
    else {
        return false;
    }
}

function pawnPromote (fromY, fromX, toY, toX) {
    figure = map[fromY][fromX];

    if (figure === 'P') {
        promote_figures = 'RNBQ';
    }
    else if (figure === 'p') {
        promote_figures = 'rnbq';
    }

    $('.modal').html(divModal.replace('$num', toY));
    for (i = 0; i < promote_figures.length; i++) {
        $('.box_select').append(divSelectSquare.replace('$figure', promote_figures.charAt(i)).replace('$figure', getChessSymbol(promote_figures.charAt(i))));

        for (s = 0; s < 4; s++) {
            $(`#${promote_figures.charAt(i)}`).append(squareSpan);
        }
    }

    $('.figure_select').click(selectFigure);

    function selectFigure () {
        updateHistory(fromY, fromX, toY, toX);
        promotedPawn = $(this).attr('id');
        showFigureAt(fromY, fromX, promotedPawn);
        turnContinue(fromY, fromX, toY, toX);
        $('.modal').html('');
    }

}


function isSameColor (fromFigure, toFigure) {
    if ( (figures.includes(fromFigure) && figures.includes(toFigure)) || (figures.toUpperCase().includes(fromFigure) && figures.toUpperCase().includes(toFigure)) ) {
        return true;
    } else {
        return false;
    }
}

function turnContinue (fromY, fromX, toY, toX) {

    twoSquaresPawnMove(fromY, fromX, toY);
    moveFigure(fromY, fromX, toY, toX);

    turn_number = history.length;
    figures_turn = (turn_number % 2) ? 'black' : 'white';
    enemy_figures = (turn_number % 2) ? 'KQRBNP' : 'kqrbnp';
    updateInfoPanel();
    showFiguresCanAttack();
                
    if (my_king_under_attack()) {
        $('body').append(check_modal);

        setTimeout(function() {
            $('.check_modal').remove();
        }, 2500)
    }

    if($('.modal').html()) {
        $('.modal').html('');
    }
}

function showFigures (figures) {
    for (let coordY = 0; coordY < 8; coordY++) {
        for (coordX = 0; coordX < 8; coordX++) {
            showFigureAt(coordY, coordX, figures.charAt(coordY ? (coordY * 8) + coordX : coordX));
        }
    };
}


function moveFigure(fromY, fromX, toY, toX) {
    figure = map[fromY][fromX];
    showFigureAt(fromY, fromX, '1');
    showFigureAt(toY, toX, figure);
}


function showFigureAt (coordY, coordX, figure) {
    if (map[coordY][coordX] == figure) return;
    map[coordY][coordX] = figure;
    $('#sY' + coordY + 'sX' + coordX).html(divFigureA.replace('$coordY', coordY).replace('$coordX', coordX).replace('$figure',getChessSymbol(figure)));
    setDraggable();
}


function addSquares () {
    $('.board').html('');
    for (let coordY = 0; coordY < 8; coordY++) {
        for (coordX = 0; coordX < 8; coordX++) {
            $('.board').append(divSquareA.replace('$coordY', coordY).replace('$coordX', coordX).replace('$color', isBlackSquareAt(coordY ? (coordY * 8) + coordX : coordX) ? 'black' : 'white'));
        }
    };
    setDroppable();
}


function getChessSymbol (figure) {
    switch(figure) {
        case 'K' : return '&#9812';
        case 'Q' : return '&#9813';
        case 'R' : return '&#9814';
        case 'B' : return '&#9815';
        case 'N' : return '&#9816';
        case 'P' : return '&#9817';
        case 'k' : return '&#9818';
        case 'q' : return '&#9819';
        case 'r' : return '&#9820';
        case 'b' : return '&#9821';
        case 'n' : return '&#9822';
        case 'p' : return '&#9823';
        default : return '';
    }
}


function isBlackSquareAt(coord) {
    return (coord % 8 + Math.floor(coord / 8)) % 2;
}

function moveFigurePHP (fromY, fromX, toY, toX) {
    $.get('chess.php?moveFigure' + '&fromY=' + fromY + '&fromX=' + fromX + '&toY=' + toY + '&toX=' + toX, showFigures);
}

function showFiguresPHP () {
    if (isDragging) return;
    $.get('chess.php?getFigures', showFigures);
}

function newFiguresPHP () {
    $.get('chess.php?newFigures', showFigures);
}

function flipBoard () {
    isFlipped = !isFlipped;
    start();
}