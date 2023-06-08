require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var getRouter = require('./routes/get');
var usersRouter = require('./routes/users');
var setupRouter = require('./routes/setup');
var categoryRouter = require('./routes/category');
var itemRouter = require('./routes/item');
var cartRouter = require('./routes/cart');
var cartItemRouter = require('./routes/cartItem');
var searchRouter = require('./routes/search');
var orderRouter = require('./routes/order');


var app = express();

var db = require("./models/db")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

db.sequelize.sync()

app.use('/', getRouter);
app.use('/', usersRouter);
app.use('/setup', setupRouter);
app.use('/category', categoryRouter);
app.use('/item', itemRouter); 
app.use('/cart', cartRouter);
app.use('/cart_item', cartItemRouter);
app.use('/search', searchRouter);
app.use('/order', orderRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
