const cfg = require('../config/cfg');
const connect = require('../config/connect');
const logger = require ('../config/logger').logger;

module.exports = function(app) {
app.get('/goods/:id', (request,response) =>  {
      const values = [request.params.id]
      var adminId;
      if (request.user){
      adminId = request.user.is_admin
      } else {
      adminId = null
      }
      const query = `with free_items as (select id, good_id from product.items where is_sold = false and booked_by_user is null)
                     select MAX(shop.product.goods.id)          as id,
                            MAX(shop.product.goods.name)        as name,
                            MAX(shop.product.goods.category_id) as category_id,
                            MAX(shop.product.goods.description) as description,
                            MAX(shop.product.goods.full_description) as full,
                            MAX(shop.product.goods.image_url)   as image_url,
                            MAX(shop.product.goods.price)       as price,
                            count(free_items.id)                as in_stock,
                            count(free_items.id) > 0            as is_available
                     from shop.product.goods
                              left join free_items on goods.id = free_items.good_id
                     where goods.id = $1
                     order by name;`

       if (values == 'favicon.ico' ){
       response.redirect('/catalog')
       }else{

       connect.queryDB(query, values, function (result) {
       const good = result.rows[0];
        response.render('layouts/good.hbs',
          {
          title: good.name,
          'good' : good,
          'message' : request.flash('info'),
          'adminId' : adminId,
          'userId' :  request.user ? request.user.id : null,
           });
            logger.info('goods values: ' + values.toString());
        });
        }
           response.statusCode = 200;
      });



app.post ('/good_update_price', (request,response) =>{
            const query = `update shop.product.goods set price = $1 where id = $2;`;
            const values = [request.body.price, request.body.id]

            connect.queryDB(query, values, function (result) {

            request.flash('info', 'Цена товара изменена');
            response.redirect('back');
            });
});
app.post ('/user_update_description', (request,response) =>{
            const query = `update shop.product.goods set description = $1 where id = $2;`;
            const values = [request.body.description, request.body.id]

            connect.queryDB(query, values, function (result) {

            request.flash('info', 'Описание изменено');
            response.redirect('back');
            });
});
app.post ('/user_update_full', (request,response) =>{
            const query = `update shop.product.goods set full_description = $1 where id = $2`;
            const values = [request.body.full, request.body.id]

            connect.queryDB(query, values, function (result) {

            request.flash('info', 'Полное описание товара изменено');
            response.redirect('back');
            });
});

}