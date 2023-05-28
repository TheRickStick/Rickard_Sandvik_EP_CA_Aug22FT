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
  sku: Sequelize.STRING,
  name: Sequelize.STRING, 
  price: Sequelize.DECIMAL,
  stock: Sequelize.INTEGER 
});

const Cart = sequelize.define('Cart', {
  // ...
});

const CartItem = sequelize.define('CartItem', {
  quantity: Sequelize.INTEGER,
  purchasePrice: Sequelize.DECIMAL
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

// Establish the association between Cart and CartItem
Cart.belongsToMany(Item, { through: CartItem });
Item.belongsToMany(Cart, { through: CartItem });

User.hasMany(Order);
Order.belongsTo(User);

OrderItem.belongsTo(Order);
OrderItem.belongsTo(Item);
Order.hasMany(OrderItem);

// Establish the association between Cart and CartItem
Cart.hasMany(CartItem);
CartItem.belongsTo(Cart);

// Establish the association between Item and CartItem
Item.hasMany(CartItem); // Add this line
CartItem.belongsTo(Item); // Add this line

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