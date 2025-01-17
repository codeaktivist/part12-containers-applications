const express = require('express');
const { Todo } = require('../mongo')
const router = express.Router();
const redis = require('../redis')

/* GET todos listing. */
router.get('/', async (_, res) => {
  const todos = await Todo.find({})
  res.send(todos);
});

/* POST todo to listing. */
router.post('/', async (req, res) => {
  try {
    const redisCounter = await redis.getAsync('todoCounter')
    const todoCounter = !Number(redisCounter) ? 0 : Number(redisCounter) 
    const todo = await Todo.create({
      text: req.body.text,
      done: false
    })
    await redis.setAsync('todoCounter', todoCounter + 1)
    res.send(todo);
  } catch (error) {
    res.sendStatus(400)
  }
});

const singleRouter = express.Router();

const findByIdMiddleware = async (req, res, next) => {
  const { id } = req.params
  try {
    req.todo = await Todo.findById(id)
    if (!req.todo) return res.sendStatus(404)    
  } catch (error) {
    return res.sendStatus(400)
  }
  next()
}

/* DELETE todo. */
singleRouter.delete('/', async (req, res) => {
  await req.todo.delete()  
  res.sendStatus(200);
});

/* GET todo. */
singleRouter.get('/', async (req, res) => {
  res.json(req.todo)
});

/* PUT todo. */
singleRouter.put('/', async (req, res) => {
  const updatedText = req.body.text
  if(!updatedText) return res.sendStatus(400)
  const updatedTodo = await Todo.findByIdAndUpdate(req.todo._id, { text: updatedText }, { useFindAndModify: false, new: true })
  res.json(updatedTodo);
});

router.use('/:id', findByIdMiddleware, singleRouter)


module.exports = router;
