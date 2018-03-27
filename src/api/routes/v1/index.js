import express from 'express';
import authRoutes from './auth.route';
import todoRoutes from './todo.route';

const router = express.Router();

/**
 * @api {get} /status Get API Status
 * @apiGroup Utility
 * @apiDescription Get the status of the API.
 * @apiSuccess {String} status API Status
 * @apiSuccessExample {json} Success-Response
 *    HTTP/1.1 200 OK
 *    {
 *      "status": "OK"
 *    }
 */

router.get('/status', (req, res) => res.send({status: 'OK'}));

/** 
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/auth', authRoutes);
router.use('/todos', todoRoutes);

module.exports = router;