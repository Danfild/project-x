const cfg = require('../config/cfg');
const connect = require('../config/connect');
const logger = require ('../config/logger').logger;

module.exports = function (app) {
//каталог товаров
app.get('/catalog', (request,response) => {
        const query = 'SELECT name, id, image_url FROM shop.product.categories;';
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
            response.render('layouts/catalog.hbs',
            {
            title: "Каталог товаров",
            'rows' : result.rows,
            'userId' : userId,
            'adminId' : adminId,
            'resultNotEmpty': result.rows.length !== 0
            });


        });
        response.statusCode = 200;
    });

app.get('/catalog/:id', (request,response) => {
       const values = [request.params.id]
       const query= `with free_items as (select id, good_id from product.items where is_sold = false and booked_by_user is null)
                     select MAX(shop.product.goods.id)          as good_id,
                            MAX(shop.product.goods.name)        as name,
                            MAX(shop.product.goods.category_id) as category_id,
                            MAX(shop.product.goods.description) as description,
                            MAX(shop.product.goods.image_url)   as image_url,
                            MAX(shop.product.goods.price)       as price,
                            count(free_items.id)        as in_stock,
                            count(free_items.id) > 0            as is_available
                     from shop.product.goods
                             left join free_items on goods.id = free_items.good_id
                     where  goods.category_id = $1
                     group by goods.id
                     order by name;`
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
             if (values == 'favicon.ico' ){
                   response.redirect('/catalog')
                   }else{


        connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {

            response.render('layouts/catalog_per_category.hbs',
            {
            title: "Каталог товаров",
            'rows' : result.rows,
            'adminId' :adminId,
            'message' : request.flash('info'),
            'userId' :  userId,
            'resultNotEmpty': result.rows.length !== 0
            });
            logger.info('catalog values: ' + values.toString());
        });
        }
        response.statusCode = 200;
    });
}