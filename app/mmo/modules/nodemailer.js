const nodemailer = require('nodemailer')

module.exports.emailWithPromise = (user, teamname) => {
  var email = user.email;
  var password = user.password;
  var userrole = user.userrole;

  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: '465',
    secure: true,
    auth: {
      user: 'tech-support@qwikcut.com',
      pass: 'Qwikcut?123'
    },
  });
  var str = 'https://access.qwikcut.com/login'
  let mailOptions = {
    from: 'QwikCut <tech-support@qwikcut.com>',
    to: email,
    subject: 'Welcome to QwikCut!',
    text: 'Hello, you have been invited to join ' + teamname + ' as a ' + userrole + '!\n' +
      'We hope you enjoy instant access to your games and statistics.\n' +
      'A temporary password has been created for your account\n' +
      'Username: ' + email + '\n' +
      'Password: ' + password + '\n\n\n' +
      'Please login at: ' + str,
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        printError(err, {
          errorTag: 'SEND_EMAIL',
          logInfo: {
            user
          }
        });
        resolve(false);
      } else {
        logApiSuccess('SEND_EMAIL', {
          email
        });
        resolve(true);
      }
    });
  });
}

module.exports.validateEmail = (email) => {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

module.exports.validateUsername = (username) => {
  return username.length > 3 && username.length < 17 ? true : false
}

module.exports.validatePassword = (password) => {
  var re = /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/
  return re.test(password)
}
