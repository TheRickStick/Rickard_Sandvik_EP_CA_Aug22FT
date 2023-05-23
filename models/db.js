require('dotenv').config();
const Sequelize = require('sequelize');
const sequelize = new Sequelize('StockSalesDB', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const Role = sequelize.define('Role', {
  name: Sequelize.STRING
});

const User = sequelize.define('User', {
    username: Sequelize.STRING, 
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    discount: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    }
  });

const Category = sequelize.define('Category', {
  name: Sequelize.STRING
});

const Item = sequelize.define('Item', {
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  price: Sequelize.DECIMAL,
  stock: Sequelize.INTEGER
});

const Cart = sequelize.define('Cart', {
  // ...
});

const CartItem = sequelize.define('CartItem', {
  quantity: Sequelize.INTEGER
  // ...
});

const Order = sequelize.define('Order', {
  status: Sequelize.STRING
});

const OrderItem = sequelize.define('OrderItem', {
  quantity: Sequelize.INTEGER
});

// Define relationships
User.belongsTo(Role);
Role.hasMany(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Category.hasMany(Item);
Item.belongsTo(Category);

CartItem.belongsTo(Cart);
CartItem.belongsTo(Item);
Cart.hasMany(CartItem);

Order.belongsTo(User);
User.hasMany(Order);

OrderItem.belongsTo(Order);
OrderItem.belongsTo(Item);
Order.hasMany(OrderItem);

module.exports = {
  Role,
  User,
  Category,
  Item,
  Cart,
  CartItem,
  Order,
  OrderItem,
  sequelize,
};
