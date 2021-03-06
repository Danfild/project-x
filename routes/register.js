const cfg = require('../config/cfg');
const connect = require('../config/connect');
const bcrypt = require('bcryptjs');

module.exports = function(app) {

function telephoneCheck(str) {
  var patt = new RegExp(/\+7\d{3}\d{3}\d{2}\d{2}/);
  return patt.test(str);
}


app.post('/register', (request,response) => {
     const query = `select exists (select 1 from shop.product.users where email= $1)`;
     const values = [request.body.email]

     connect.queryDB(query, values , cfg.error_handler(request,response),function (user_exists) {
          if  (user_exists.rows[0].exists != true){
                if (telephoneCheck(request.body.phone_num))
                {
                const query = `insert into product.users (email,username,last_name,password,phone_num,date_register, is_admin) values ($1, $2, $3, $4, $5, 'now', false)`
                const passwordToSave = bcrypt.hashSync(request.body.password, '$2b$10$1rLs8U9ML1jEMpekTBFX3.');
                const values = [request.body.email , request.body.username, request.body.last_name, passwordToSave, request.body.phone_num];
                const username = request.body.email;

                 connect.queryDB(query, values, cfg.error_handler(request,response), function (result) {
                 request.flash('registration', 'Регистарация завершена ' + username);
                 response.redirect('/login');
                  });
            }else{
             request.flash('danger', 'Номер телефона задан не корректно');
             response.redirect('back');
            }
          }else{
          request.flash('danger', 'Пользователь с таким логином ' + values + ' уже существует');
          response.redirect('back');
          }
     })
});

//регистрация
app.get('/register', (request,response) => {

    response.render('./layouts/register.hbs' , {
            title: 'Регистарация пользователя',
            'message' : request.flash('danger')
        });
        response.statusCode = 200;
});
}