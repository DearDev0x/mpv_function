let router = require("express").Router();
const paymentController = require("../../controller/paymentController");
// Payment routes
router.post('/success', paymentController.success);
router.post('/create', paymentController.create);
// Export API routes
module.exports = router;
