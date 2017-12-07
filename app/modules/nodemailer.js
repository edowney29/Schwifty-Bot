const nodemailer = require('nodemailer')

const emailWithPromise = (user, teamname) => {
  let email = user.email;
  let password = user.password;
  let userrole = user.userrole;

  let transporter = nodemailer.createTransport({
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