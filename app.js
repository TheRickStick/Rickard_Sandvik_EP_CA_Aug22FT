require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var setupRouter = require('./routes/setup');
//var categoriesRouter = require('./routes/categories');
var categoryRouter = require('./routes/category');
var itemRouter = require('./routes/item');
//var itemsRouter = require('./routes/items');
var cartRouter = require('./routes/cart');
//var allCartsRouter = require('./routes/allcarts');
var cartItemRouter = require('./routes/cartItem');
var searchRouter = require('./routes/search');
//var ordersRouter = require('./routes/orders');
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

app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/setup', setupRouter);
//app.use('/categories', categoriesRouter);
app.use('/category', categoryRouter);
app.use('/item', itemRouter); 
//app.use('/items', itemsRouter);
app.use('/cart', cartRouter);
//app.use('/allcarts', allCartsRouter);
app.use('/cart_item', cartItemRouter);
app.use('/search', searchRouter);
//app.use('/orders', ordersRouter);
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
