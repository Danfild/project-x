const cfg = require('../config/cfg');
const connect = require('../config/connect');

var API_KEY = '61a2a5c98415ef7254a7718dfb18b8d2-a65173b1-b7a11065';
var DOMAIN = 'sandbox418a125f2b3b481f83772bef160ce34b.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});


module.exports = function(app) {

//заказы
app.use('/order', cfg.checkAuth());
app.get('/order', (request,response) => {
         const values = [request.user.id];

          var username;
          var userId;
          if (request.user && request.user.username ){
           userId = request.user.id,
           username = request.user.username
          } else {
           userId = null,
           username = null
          }
        const query = `select shop.product.items.id       as good_id,
                       shop.product.goods.name            as good_name,
                       shop.product.goods.price           as good_price,
                       shop.product.users.username        as user_name,
                       shop.product.users.email           as email

                       from shop.product.items
                       join shop.product.goods on items.good_id = goods.id
                       join shop.product.users on items.booked_by_user = users.id
                       where shop.product.users.id = $1`

        connect.queryDB(query, values, function (result) {
        const user = result.rows[0];
        const total = result.rows.map(function(row) {
                           return row.good_price;
                         }).reduce((a, b) => a + b, 0)
        response.render('./layouts/order.hbs', {
              title: "Корзина",
              'total': total,
              'userId' : userId,
              'user' : user,
              'username': username,
              'message' : request.flash('info'),
              'rows' : result.rows,
              'resultNotEmpty': result.rows.length !== 0
              })
              response.statusCode = 200;
              });
    });

app.post('/order', (request,response) => {

            const values = [request.user.id , request.body.address, request.body.price];
            const order_query = `insert into shop.product.orders (user_id, address, price, order_date)
                          values ($1, $2, $3, 'now') returning orders.id`;

            const items_query =`update shop.product.items
                                set order_id = $1, is_sold = true, booked_by_user = null
                                where booked_by_user = $2`;
             const email = [request.body.email]
             const data = {
             from: 'Excited User <me@samples.mailgun.org>',
             to: email,
             subject: 'Информация о заказе',
             text: 'Спасибо за покупку в нашем магазине,курьер в скором времени свяжется с вами для уточнения деталей получения заказа.'
             };

            connect.queryDB(order_query, values, function (result) {
                order_id = [result.rows[0].id, request.user.id]

                    connect.queryDB(items_query, order_id, function (result) {

                    request.flash('info', 'Заказ оформлен');
                    response.redirect('back');
                     })
                      mailgun.messages().send(data, (error, body) => {
                                   if (error){
                                   console.log(error)
                                   }
                                 console.log(body);
                                 });
                });

            });

app.use('/orders', cfg.checkAdmin());
app.get('/orders', (request,response) => {
            const query = `select (shop.product.users.email)                                      as email,
                                  (shop.product.orders.id)                                        as id,
                                  (shop.product.users.username)                                   as username,
                                  (shop.product.users.phone_num)                                  as phone,
                                  (shop.product.orders.address)                                   as address,
                                  to_char(shop.product.orders.order_date, 'DD Mon YYYY HH:MI:SS') as date,
                                  (shop.product.orders.price)                                     as price,
                                  (shop.product.orders.order_status)                              as status


                           from shop.product.items
                                    join shop.product.orders on items.order_id = orders.id
                                    join shop.product.users on orders.user_id = users.id`
connect.queryDB(query, [], function (result) {
        response.render('./layouts/admin_orders.hbs',
        {
            title: "Информация о заказах",
            'rows' : result.rows,
            'message' :request.flash('info'),
            'resultNotEmpty': result.rows.length !== 0
             });
        response.statusCode = 200;
     });
    });


app.post('/update_order', (request,response) => {
        const values = [request.body.id,request.body.order_status ];
        const query = `update shop.product.orders
                       set order_status = $2
                       where id = $1;`
        connect.queryDB(query, values, function (result) {

                request.flash('info', 'Стасус заказа обновлен');
                response.redirect('back');
                })
            });

}




