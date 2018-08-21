var FIELD_WIDTH = 10;
var FIELD_HEIGHT = 20;
var NEW_FIGURE_FIELD_SIZE = 4;
var FIGURE_MOVE_INTERVAL = 300;
var SCORE_BY_LINE = 10;

var CENTRAL_FIGURE_INDEX = 1;

var FIGURE_START_COORDS = [
    {type: 'O', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 4, y: 1}, {x: 5, y: 1}]},// квадрат
    {type: 'I', coords: [{x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}]}, // длинная палка
    {type: 'L', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 4, y: 1}]}, // г влево
    {type: 'J', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 6, y: 1}]},// г вправо
    {type: 'Z', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 5, y: 1}, {x: 6, y: 1}]}, // крякозябра влево
    {type: 'S', coords: [{x: 4, y: 1}, {x: 5, y: 1}, {x: 5, y: 0}, {x: 6, y: 0}]},// крякозябра вправо
    {type: 'T', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 5, y: 1}]}// t
];

var FIGURE_TMP_COORDS = [
    {type: 'O', coords: [{x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 1}, {x: 2, y: 2}]},// квадрат
    {type: 'I', coords: [{x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}]}, // длинная палка
    {type: 'L', coords: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 0, y: 2}]}, // г влево
    {type: 'J', coords: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 2, y: 2}]},// г вправо
    {type: 'Z', coords: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}]}, // крякозябра влево
    {type: 'S', coords: [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 2, y: 1}]},// крякозябра вправо
    {type: 'T', coords: [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}]}// t
];

var FIGURE_LETTERS = function () { // собираем информацию по буквам фигур и сразу присваиваем в константу
    var letters = '';
    for (var i = 0; i < FIGURE_START_COORDS.length; i++) {
        letters += FIGURE_START_COORDS[i].type + ' ';
    }
    return letters;
}();

var KEY_CODE = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

var ACTIONS = {
    left: 11,
    top: 22,
    right: 33,
    bottom: 44,
    rotate: 55
};


$(function () {
    var FigureUnit = Backbone.Model.extend({});

    var Figure = Backbone.Collection.extend({
        initialize: function () {
            this.bind('add remove change', function () {
                gameField.render();
            });
        },
        model: FigureUnit
    });

    var TmpFigure = Backbone.Collection.extend({
        initialize: function () {
            this.bind('add remove change', function () {
                tmpField.render();
            })
        },
        model: FigureUnit
    });

    var DroppedFigures = Backbone.Collection.extend({
        initialize: function () {
            this.bind('add', function () {
                gameField.checkLines();
            })
        },
        model: FigureUnit
    });

    var GameField = Backbone.View.extend({
        events: {
            'keydown': 'controlFigure',
            'click #stop': 'stopGame',
            'click #start': 'startGame'
        },
        initialize: function () {
            this.drawField();
        },
        drawField: function () {
            let root = $('#root');
            root.empty();
            let table = $('<table/>', {
                class: 'gameField'
            });

            for (let y = 0; y < FIELD_HEIGHT; y++) {
                let row = $('<tr/>');
                for (let x = 0; x < FIELD_WIDTH; x++) {
                    row.append($('<td/>', {
                        class: 'cell',
                        'data-coord': x + '-' + y
                    }));
                }
                table.append(row);
            }

            table.append('<div id="gameOver">GAME<br> OVER</div>');


            root.append($('<button id="start">Запуск игры</button>'), $('<button id="stop">Стоп игры</button>'), table,
                $('<label for="score">Score </label><input type="number" id="score" value="0" readonly/>'),
                '<h3 id="info">Управление стрелками &#8592 &#8593 &#8594 &#8595</h3>');
        },
        startGame: function () {
            $('#gameOver').css('top', '-200px').hide();
            this.score = 0;
            $('#score').val(this.score);
            if (this.moveFigureInterval != null) {
                return;
            }
            this.droppedFigures = new DroppedFigures();
            this.respawnFigure();
            this.moveFigureInterval = setInterval(function () {
                this.moveDown();
            }.bind(this), FIGURE_MOVE_INTERVAL);

        },
        respawnFigure: function () {
            var figureNumber;
            if (tmpField.tmpFigure === null || typeof tmpField.tmpFigure === 'undefined') {
                figureNumber = getRandomInt(0, FIGURE_START_COORDS.length);
            }
            else {
                figureNumber = tmpField.figureNumber;
            }

            var figureCoords = FIGURE_START_COORDS[figureNumber].coords;
            var figureType = FIGURE_START_COORDS[figureNumber].type;
            this.currentFigure = new Figure();
            for (var i = 0; i < figureCoords.length; i++) {
                if (this.isFigure(figureCoords[i].x, figureCoords[i].y)) {
                    this.stopGame();
                    return;
                }
                var figureUnit = new FigureUnit({
                    coordX: figureCoords[i].x,
                    coordY: figureCoords[i].y,
                    type: figureType
                });
                this.currentFigure.add(figureUnit);
            }
            tmpField.respawnTmpFigure(figureNumber);

            return this.currentFigure;
        },
        moveDown: function () {
            var newCoordinates = this.getNewCoordinates(ACTIONS.bottom);
            if (newCoordinates.length === this.currentFigure.length) {
                this.setNewCoordinates(newCoordinates);
            }
            else {
                this.addToDropped();
                this.respawnFigure();
            }
        },
        moveLeft: function () {
            var newCoordinates = this.getNewCoordinates(ACTIONS.left);
            if (newCoordinates.length === this.currentFigure.length) {
                this.setNewCoordinates(newCoordinates);
            }
        },
        moveRight: function () {
            var newCoordinates = this.getNewCoordinates(ACTIONS.right);
            if (newCoordinates.length === this.currentFigure.length) {
                this.setNewCoordinates(newCoordinates);
            }
        },
        getNewCoordinates: function (action) {
            var newCoordinates = [];
            this.currentFigure.forEach(function (unit) {
                var newX = unit.get('coordX');
                var newY = unit.get('coordY');
                if (action === ACTIONS.left) {
                    newX--;
                }
                else if (action === ACTIONS.right) {
                    newX++;
                }
                else if (action === ACTIONS.bottom) {
                    newY++;
                }
                else if (action === ACTIONS.rotate) {
                    var centralUnit = this.currentFigure.at(CENTRAL_FIGURE_INDEX);
                    var centralX = centralUnit.get('coordX');
                    var centralY = centralUnit.get('coordY');
                    var tmpX = newX;
                    newX = newY + centralX - centralY;
                    newY = centralX + centralY - tmpX;
                }
                if (!(this.checkBorder(newX, newY) || this.isFigure(newX, newY))) {
                    newCoordinates.push({coordX: newX, coordY: newY});
                }
            }.bind(this));
            return newCoordinates;
        },
        setNewCoordinates: function (newCoordinates) {
            this.currentFigure.forEach(function (unit, index) {
                unit.set({coordY: newCoordinates[index].coordY, coordX: newCoordinates[index].coordX});
            });
        },
        rotateFigure: function () {
            var centralUnit = this.currentFigure.at(CENTRAL_FIGURE_INDEX);
            if (centralUnit.get('type') === 'O') {
                return;
            }
            var newCoordinates = this.getNewCoordinates(ACTIONS.rotate);
            if (newCoordinates.length === this.currentFigure.length) {
                this.setNewCoordinates(newCoordinates);
            }
        },
        controlFigure: function (event) {
            var key = event.keyCode;
            switch (key) {
                case KEY_CODE.left: {
                    this.moveLeft();
                    break;
                }
                case KEY_CODE.right: {
                    this.moveRight();
                    break;
                }
                case KEY_CODE.down: {
                    this.moveDown();
                    break;
                }
                case KEY_CODE.up: {
                    this.rotateFigure();
                    break;
                }
            }
        },
        checkBorder: function (newX, newY) {
            return newX < 0 || newX >= FIELD_WIDTH || newY < 0 || newY >= FIELD_HEIGHT;
        },
        isFigure: function (newX, newY) {
            var isFigure = false;
            this.droppedFigures.forEach(function (droppedUnit) {
                if (newX === droppedUnit.get('coordX') && newY === droppedUnit.get('coordY')) {
                    isFigure = true;
                }
            });
            return isFigure;
        },
        checkLines: function () {
            var countDeleteLines = 0;
            var numberDeleteLine = 0;
            for (var y = FIELD_HEIGHT - 1; y >= 0; y--) {

                var figureLine = this.droppedFigures.where({coordY: y});
                if (figureLine.length === FIELD_WIDTH) {
                    this.deleteLine(figureLine);
                    countDeleteLines++;
                    if (numberDeleteLine === 0) {
                        numberDeleteLine = y - 1;
                    }
                }

            }
            if (countDeleteLines !== 0) {
                this.droppedFigures.forEach(function (unit) {
                    if (unit.get('coordY') <= numberDeleteLine) {
                        unit.set({coordY: unit.get('coordY') + countDeleteLines});
                    }
                })
            }

        },
        addToDropped: function () {
            this.droppedFigures.add(this.currentFigure.models);
        },
        deleteLine: function (models) {
            this.droppedFigures.remove(models);
            this.score += SCORE_BY_LINE;
            $('#score').val(this.score);
        },
        stopGame: function () {
            clearInterval(this.moveFigureInterval);
            this.moveFigureInterval = null;
            this.currentFigure.reset();
            $('#gameOver').show().animate({
                top: '140px',
                'text-shadow': '8px 8px 4px black;'
            }, 1000);
        },
        render: function () {
            $('.cell').removeClass(FIGURE_LETTERS + 'figure ');
            this.currentFigure.forEach(function (figureUnit) {
                let el = $('.cell[data-coord="' + figureUnit.get('coordX') + '-' + figureUnit.get('coordY') + '"]');
                el.addClass(figureUnit.get('type') + ' figure');
            });
            if (this.droppedFigures != null) {
                this.droppedFigures.forEach(function (figureUnit) {
                    let el = $('.cell[data-coord="' + figureUnit.get('coordX') + '-' + figureUnit.get('coordY') + '"]');
                    el.addClass(figureUnit.get('type') + ' figure');
                });
            }
        }
    });

    var TmpField = Backbone.View.extend({
        initialize: function () {
            this.figureNumber;
            this.drawTmpField();

        },
        drawTmpField: function () {
            let tmpFigureTable = $('<table class="tmpFigure gameField"><caption>Следующая фигура</caption></table>');

            for (let y = 0; y < NEW_FIGURE_FIELD_SIZE; y++) {
                let row = $('<tr/>');
                for (let x = 0; x < NEW_FIGURE_FIELD_SIZE; x++) {
                    row.append($('<td/>', {
                        class: 'tmpCell',
                        'data-coord': x + '-' + y
                    }));
                }
                tmpFigureTable.append(row);
            }
            $('#root').append(tmpFigureTable);
        },
        respawnTmpFigure: function () {
            var figureNumber = getRandomInt(0, FIGURE_START_COORDS.length);
            var figureCoords = FIGURE_TMP_COORDS[figureNumber].coords;
            var figureType = FIGURE_TMP_COORDS[figureNumber].type;
            this.tmpFigure = new TmpFigure();
            for (var i = 0; i < figureCoords.length; i++) {
                var figureUnit = new FigureUnit({
                    coordX: figureCoords[i].x,
                    coordY: figureCoords[i].y,
                    type: figureType
                });
                this.tmpFigure.add(figureUnit);
            }
            this.figureNumber = figureNumber;
            return figureNumber;
        },
        render: function () {
            $('.tmpCell').removeClass(FIGURE_LETTERS + 'figure ');

            this.tmpFigure.forEach(function (unit) {
                let el = $('.tmpCell[data-coord="' + unit.get('coordX') + '-' + unit.get('coordY') + '"]');
                el.addClass(unit.get('type') + ' figure');
            });
        }
    });

    var gameField = new GameField({el: '#root'});
    var tmpField = new TmpField({el: '#root'});

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

});