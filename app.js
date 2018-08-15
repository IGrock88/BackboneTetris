var FIELD_WIDTH = 10;
var FIELD_HEIGHT = 20;
var FIGURE_MOVE_INTERVAL = 300;

var CENTRAL_FIGURE_INDEX = 1;

var FIGURES = [
    {type: 'O', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 4, y: 1}, {x: 5, y: 1}]},// квадрат
    {type: 'I', coords: [{x: 3, y: 0}, {x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}]}, // длинная палка
    {type: 'L', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 4, y: 1}]}, // г влево
    {type: 'J', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 6, y: 1}]},// г вправо
    {type: 'Z', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 5, y: 1}, {x: 6, y: 1}]}, // крякозябра влево
    {type: 'S', coords: [{x: 4, y: 1}, {x: 5, y: 1}, {x: 5, y: 0}, {x: 6, y: 0}]},// крякозябра вправо
    {type: 'T', coords: [{x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 5, y: 1}]}// t
];

var FIGURE_LETTERS = function () { // собираем информацию по буквам фигур и сразу присваиваем в константу
    var letters = '';
    for (var i = 0; i < FIGURES.length; i++) {
        letters += FIGURES[i].type + ' ';
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
            'click #start': 'startGame',
            'keydown': 'controlFigure',
            'click #stop': 'stopGame'
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
            root.append($('<button id="start">Запуск игры</button>'), $('<button id="stop">Стоп игры</button>'), table,
                $('<label for="score">Score </label><input type="number" id="score" value="0" readonly/>'),
                '<h3 id="info">Управление стрелками &#8592 &#8593 &#8594 &#8595</h3>');
        },
        startGame: function () {
            this.score = 0;
            if (this.moveFigureInterval != null) {
                clearInterval(this.moveFigureInterval);
            }
            this.droppedFigures = new DroppedFigures();
            this.respawnFigure();
            this.moveFigureInterval = setInterval(function () {
                this.moveDown();
            }.bind(this), FIGURE_MOVE_INTERVAL);
        },
        respawnFigure: function () {
            console.log('respawn figure');
            var figureNumber = getRandomInt(0, FIGURES.length);
            var figureCoords = FIGURES[figureNumber].coords;
            var figureType = FIGURES[figureNumber].type;
            this.currentFigure = new Figure();
            for (var i = 0; i < figureCoords.length; i++) {
                var figureUnit = new FigureUnit({
                    coordX: figureCoords[i].x,
                    coordY: figureCoords[i].y,
                    type: figureType
                });
                this.currentFigure.add(figureUnit);
            }
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
                console.log(numberDeleteLine);
                console.log(countDeleteLines);
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
            $('#score').val(++this.score);
        },
        stopGame: function () {
            clearInterval(this.moveFigureInterval);
        },
        render: function () {
            $('.cell').removeClass(FIGURE_LETTERS + 'figure ');
            this.currentFigure.forEach(function (figureUnit) {
                let el = $('[data-coord="' + figureUnit.get('coordX') + '-' + figureUnit.get('coordY') + '"]');
                el.addClass(figureUnit.get('type') + ' figure');
            });
            if (this.droppedFigures != null) {
                this.droppedFigures.forEach(function (figureUnit) {
                    let el = $('[data-coord="' + figureUnit.get('coordX') + '-' + figureUnit.get('coordY') + '"]');
                    el.addClass(figureUnit.get('type') + ' figure');
                });
            }
        }
    });

    var gameField = new GameField({el: '#root'});

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});