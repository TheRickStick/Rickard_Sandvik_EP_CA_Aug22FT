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
  stock: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
});

const Cart = sequelize.define('Cart', {
 
});

const CartItem = sequelize.define('CartItem', {
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  originalPrice: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  purchasePrice: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  totalPrice: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
  moneySaved: {
    type: Sequelize.DECIMAL,
    allowNull: false,
  },
});

const Order = sequelize.define('Order', {
  status: Sequelize.STRING
});

const OrderItem = sequelize.define('OrderItem', {
  quantity: Sequelize.INTEGER,
  purchasePrice: Sequelize.DECIMAL,
  totalPrice: Sequelize.DECIMAL,
  moneySaved: Sequelize.DECIMAL
});


User.belongsTo(Role);
Role.hasMany(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Category.hasMany(Item);
Item.belongsTo(Category);

Cart.belongsToMany(Item, { through: CartItem });
Item.belongsToMany(Cart, { through: CartItem });

User.hasMany(Order);
Order.belongsTo(User);

OrderItem.belongsTo(Order);
OrderItem.belongsTo(Item);
Order.hasMany(OrderItem);


Cart.hasMany(CartItem);
CartItem.belongsTo(Cart);


Item.hasMany(CartItem); 
CartItem.belongsTo(Item);

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