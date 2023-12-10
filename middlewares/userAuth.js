module.exports = {

    isUserLogin: async (req, res, next) => {
      try {
        if (req.session.user_id) {
          next();
        } else {
          res.redirect('/login'); 
        }
      }
      catch (error) {
        console.log(error.message);
      }
    }
  
  }