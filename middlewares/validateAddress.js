// validateAddress.js
const validateAddress = (req, res, next) => {
    const { pin, mobile } = req.body;
  
    // Validate pincode (6 digits)
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(pin)) {
      return res.status(400).render('error', { message: 'Invalid pincode format. Pincode must be 6 digits.' });
    }
  
    // Validate mobile number (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).render('error', { message: 'Invalid mobile number format. Mobile number must be 10 digits.' });
    }
  
    // If validation passes, move to the next middleware or route handler
    next();
  };
  
  module.exports = validateAddress;
  