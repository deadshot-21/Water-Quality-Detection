const express = require('express');
const router =  express.Router();

const homeController = require('../controllers/homeController.js');

router.get('/',homeController.index);
router.get('/mapid',homeController.mapid);
router.post('/getReflectance',homeController.getReflectance);
// router.get('/getUser', homeController.getUser);
// router.post('/addCycle', homeController.addCycle);
// router.post('/addStand', homeController.addStand);
// router.post('/prebook',  homeController.prebook);
// router.get('/getCycleData/:name', homeController.getAvailabilities);
// router.get('/getStats',  homeController.getStats);
// router.post('/book',  homeController.book);
// router.post('/end',  homeController.endRide);

module.exports = router;
