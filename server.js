/* eslint-disable import/no-extraneous-dependencies */
// the project is configured only for development mode
const path = require("path");
const app = require("express")();
const bodyParser = require("body-parser");
const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");

process.stdout.write(`
 ${chalk.bgHex("#224dff").white("--- frontend-tech-test ---")}
 The server is available on ${chalk.hex("#f7c132")("http://localhost:9001/")}
\n`);

const config = require("./webpack.config");

const compiler = webpack(config);

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
    stats: {
      builtAt: false,
      children: false,
      colors: true,
      modules: false,
    },
  })
);

app.use(webpackHotMiddleware(compiler));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

const generateID = () => {
  return `_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
};

/**
 * GET /tasks
 *
 * Return the list of tasks with status code 200.
 */
app.get("/tasks", (req, res) => {
  const tasksContainer = fs.readJsonSync("./tasks.json");
  return res.status(200).json(tasksContainer);
});

/**
 * Get /task/:id
 *
 * id: Number
 *
 * Return the task for the given id.
 *
 * If found return status code 200 and the resource.
 * If not found return status code 404.
 * If id is not valid number return status code 400.
 */
app.get("/task/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isNaN(id)) {
    const tasksContainer = fs.readJsonSync("./tasks.json");
    const task = tasksContainer.find(item => item.id === id);

    if (task !== null) {
      return res.status(200).json({
        task,
      });
    }
    return res.status(404).json({
      message: "Not found.",
    });
  }
  return res.status(400).json({
    message: "Bad request.",
  });
});

/**
 * PUT /task/update/:id/:title/:description
 *
 * id: string
 * title: string
 * description: string
 *
 * Update the task with the given id.
 * If the task is found and update as well, return a status code 204.
 * If the task is not found, return a status code 404.
 * If the provided id is not a valid number return a status code 400.
 */
app.put("/task/update", (req, res) => {
  if (!req.body.title && !req.body.description) {
    return res.status(400).send({
      message: "Please complete at least one of the fields",
    });
  }

  if (req.body.title.length > 40) {
    return res.status(400).send({
      message: "Amount of charachters for field 'title' is more than 40",
    });
  }

  if (req.body.description.length > 300) {
    return res.status(400).send({
      message: "Amount of charachters for field 'description' is more than 300",
    });
  }
  const { id } = req.body;

  if (id) {
    const tasksContainer = fs.readJsonSync("./tasks.json");
    const task = tasksContainer.tasks.find(item => item.id === id);

    if (task !== null) {
      task.title = req.body.title;
      task.description = req.body.description;

      fs.writeJsonSync("./tasks.json", tasksContainer);

      return res.status(201).send({
        message: "Task updated",
        ...tasksContainer,
      });
    }
    return res.status(404).json({
      message: "Not found",
    });
  }
  return res.status(400).json({
    message: "Bad request",
  });
});

/**
 * POST /task/create/:title/:description
 *
 * title: string
 * description: string
 *
 * Add a new task to the array tasksContainer.tasks with the given title and description.
 * Return status code 201.
 */
app.post("/task/create", (req, res) => {
  if (!req.body.title && !req.body.description) {
    return res.status(400).send({
      message: "Please complete at least one of the fields",
    });
  }

  if (req.body.title.length > 40) {
    return res.status(400).send({
      message: "Amount of charachters for field 'title' is more than 40",
    });
  }

  if (req.body.description.length > 300) {
    return res.status(400).send({
      message: "Amount of charachters for field 'description' is more than 300",
    });
  }

  const tasksContainer = fs.readJsonSync("./tasks.json");

  if (tasksContainer.tasks.length >= 50) {
    return res.status(400).send({
      message:
        "You reached a maximum amount of available tasks that you can create.",
    });
  }

  const task = {
    id: generateID(),
    title: req.body.title,
    description: req.body.description,
  };

  tasksContainer.tasks.push(task);

  fs.writeJsonSync("./tasks.json", tasksContainer);

  return res.status(201).json({
    message: "Task created",
    ...tasksContainer,
  });
});

/**
 * DELETE /task/delete/:id
 *
 * id: string
 *
 * Delete the task linked to the  given id.
 * If the task is found and deleted as well, return a status code 204.
 * If the task is not found, return a status code 404.
 * If the provided id is not a valid number return a status code 400.
 */
app.delete("/task/delete", (req, res) => {
  const { id } = req.body;

  if (id) {
    const tasksContainer = fs.readJsonSync("./tasks.json");
    const task = tasksContainer.tasks.find(item => item.id === id);

    if (task !== null) {
      const taskIndex = tasksContainer.tasks;
      tasksContainer.tasks.splice(taskIndex, 1);
      fs.writeJsonSync("./tasks.json", tasksContainer);

      return res.status(200).json({
        ...tasksContainer,
        message: "Deleted successfully",
      });
    }
    return res.status(404).json({
      message: "Not found",
    });
  }
  return res.status(400).json({
    message: "Bad request",
  });
});

app.listen(9001);
