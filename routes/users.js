const cfg = require('../config/cfg');
const connect = require('../config/connect');


module.exports = function(app) {
app.use('/users', cfg.checkAuth())
app.get('/users', (request,response) => {
        const query = `select id, email, username, last_name, phone_num, to_char((date_register), 'DD Mon YYYY ') as date
                       from shop.product.users;`
         var adminId;
         if (request.user){
           adminId = request.user.is_admin
         } else {
           adminId = null
         }
         var userId;
         if(request.user){
         userId = request.user.id
         }else{
         userId = null
         }
        connect.queryDB(query, [], cfg.error_handler(request,response), function (result) {

             response.render('layouts/users.hbs',
             {
             title: "Пользователи",
             'message': request.flash('info'),
             'adminId': adminId,
             'userId': userId,
             'rows' : result.rows,
             'resultNotEmpty': result.rows.length !== 0
              });
        response.statusCode = 200;
    });
 });

app.get('/users/:id', (request,response) => {
      var adminId;
      if (request.user){
      adminId = request.user.is_admin
      } else {
      adminId = null
      }
      var userId;
      if(request.user){
      userId = request.user.id
      }else{
      userId = null
      }
         const user_id_to_show = request.params.id
         const values = [user_id_to_show]
         const orders_query = `select shop.product.orders.address as address,
                                      shop.product.orders.id as id,
                                shop.product.orders.price as price,
                                shop.product.orders.order_status as order_status,
                                to_char((shop.product.orders.order_date), 'DD Mon YYYY HH:MI:SS') as order_date

                               from shop.product.orders where user_id = $1`;

         const query = `select shop.product.users.email                                            as email,
                               shop.product.users.id                                               as id,
                               shop.product.users.username                                         as user_name,
                               shop.product.users.last_name                                        as last_name,
                               shop.product.users.phone_num                                        as phone,
                               to_char((shop.product.users.date_register), 'DD Mon YYYY ') as date_register

                        from shop.product.users
                        where id = $1`;

         connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {
         if(result.rows.length == 0){
         response.redirect('/not_found')
         }else{
         connect.queryDB(orders_query, values, cfg.error_handler(request,response), function (orders_result) {
         if (user_id_to_show == userId || adminId){
               const user = result.rows[0];
              response.render('layouts/users_id.hbs',
              {
              title: 'Пользователь ' + user.user_name,
              'message' : request.flash('info'),
              'userId': userId,
              'adminId' : adminId,
              'user': user,
              'rows' : orders_result.rows,
              'resultNotEmpty': orders_result.rows.length !== 0
               });
         response.statusCode = 200;
                  }
                    else {
                    response.redirect('back')
                    response.statusCode = 200;
                    }
         });
         }
     });
  });

app.use('/user_order/:id', cfg.checkAuth());
app.get('/user_order/:id', (request,response) => {
        var adminId;
              if (request.user){
              adminId = request.user.is_admin
              } else {
              adminId = null
              }
              var userId;
              if(request.user){
              userId = request.user.id
              }else{
              userId = null
              }
        const values = [request.params.id]
        const query = `select shop.product.orders.id                                          as id,
                              shop.product.users.username                                     as username,
                              shop.product.users.phone_num                                    as phone,
                              shop.product.users.id                                   as user_id,

                              shop.product.users.email                                        as email,
                              shop.product.orders.address                                     as address,
                              to_char(shop.product.orders.order_date, 'DD Mon YYYY HH:MI:SS') as date,
                              shop.product.orders.price                                       as price,
                              shop.product.orders.order_status                                as status,
                              shop.product.goods.name                                         as good_name,
                              shop.product.goods.price                                        as good_price,
                              shop.product.goods.image_url                                    as image,
                              shop.product.items.good_id                                      as good_id

                       from shop.product.orders
                                left join shop.product.items on orders.id = items.order_id
                                join shop.product.users on orders.user_id = users.id
                                left join shop.product.goods on items.good_id = goods.id
                       where orders.id = $1;`

        connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {
              const  date = result.rows[0].date;
              const  status = result.rows[0].order_status;

             response.render('layouts/user_order.hbs',
             {
             title: "Заказ от " + date,
             'status': status,
             'date' : date,
             'adminId': adminId,
             'userId':userId,
             'price': result.rows[0].order_price,
             'rows' : result.rows,
             'resultNotEmpty': result.rows.length !== 0
              });
        response.statusCode = 200;
    });
 });

app.post ('/user_update_name', (request,response) =>{
            const query = `update shop.product.users set username=$1  where users.id = $2;`;
            const values = [request.body.name, request.user.id]
            connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {

            request.flash('info', 'Имя пользователя изменено');
            response.redirect('back');
            });
});
app.post ('/user_update_lastname', (request,response) =>{
            const query = `update shop.product.users set last_name=$1  where users.id = $2;`;
            const values = [request.body.last_name, request.user.id]
            connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {

            request.flash('info', 'Фамилия изменена');
            response.redirect('back');
            });
});
app.post ('/user_update_email', (request,response) =>{
            const query = `update shop.product.users set email=$1  where users.id = $2;`;
            const values = [request.body.email, request.user.id]
            connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {

            request.flash('info', 'Почтовый адрес изменен');
            response.redirect('back');
            });
});
app.post ('/user_update_phone', (request,response) =>{
            const query = `update shop.product.users set phone_num=$1  where users.id = $2;`;
            const values = [request.body.phone, request.user.id]
            connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {

            request.flash('info', 'Номер телефона изменен');
            response.redirect('back');
            });
});


app.post ('/user_delete', (request,response) =>{
            const query = `delete from shop.product.users where id = $1;;`;
            const values = [request.body.id]
            const name = [request.body.name]
            connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {
            request.flash('info', 'Пользователь ' + name + 'удален!' );
            response.redirect('back');
            });
});

}

