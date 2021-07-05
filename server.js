require("dotenv").config();
const debug = require("debug")("servidor:root");
const fetch = require("node-fetch");
const express = require("express");
const chalk = require("chalk");
const { program } = require("commander");
const fs = require("fs");
const morgan = require("morgan");

program.option("-p, --puerto <puerto>", "Puerto para el servidor");
program.parse();
const modificadoresCLI = program.opts();

const app = express();

const puerto = modificadoresCLI.puerto || process.env.PUERTO || 4000;

const server = app.listen(puerto, () => {
  debug(`Servidor escuchando en el puerto ${chalk.yellow(puerto)}`);
});

server.on("error", (err) => {
  debug(chalk.red("No se ha podido levantar el servidor"));
  if (err.code === "EADDRINUSE") {
    debug(chalk.red(`El puerto ${chalk.bold(puerto)} está ocupado`));
  }
});

app.use(morgan("dev"));
app.use(express.static("public"));
app.use(express.json());
app.use((req, res, next) => {
  debug("Soy un middleware");
  next();
});
app.use((req, res, next) => {
  debug(
    "Soy otro middleware y te voy a decir el método de la request:",
    req.method
  );
  next();
});

app.get("/", (req, res, next) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Una web absurda</title>
  </head>
  <body>
    <h1>Esto es una web</h1>
    <p>Aunque no te lo creas</p>
  </body>
</html>
`);
});
app.get(
  "/saludo",
  (req, res, next) => {
    debug("Me has pedido que te salude");
    next();
  },
  (req, res, next) => {
    debug(req.method);
    res.send("Hola");
  }
);

app.get("/despedida", (req, res, next) => {
  res.send("<h1>Adéu</h1>");
});

app.put("/saludo", (req, res, next) => {
  debug(req.body);
  const { nombre } = req.body;
  fs.readFile("saludos.txt", "utf8", (err, datos) => {
    if (err) {
      debug("No se ha podido leer el archivo");
      const error = new Error("Error al leer saludos.txt");
      error.codigo = 500;
      next(error);
      return;
    }
    res.json({ texto: `${datos}, ${nombre}`, estado: 1 });
  });
});

app.get("/articulos", async (req, res, next) => {
  try {
    const resp = await fetch("http://localhost:3001/articulos");
    const articulos = await resp.json();
    const nombresArticulos = articulos.map((articulo) => articulo.nombre);
    res.json({
      articulos: nombresArticulos,
      totalArticulos: nombresArticulos.length,
    });
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      error.message = "No hemos podido obtener los artículos";
    }
    res.status(500).json({ error: true, mensaje: error.message });
  }
});

app.use((req, res, next) => {
  debug("Esto es un 404");
  res.status(404).send("No se ha encontrado esta ruta");
});

app.use((err, req, res, next) => {
  const codigo = err.codigo || 500;
  const mensaje = err.codigo ? err.message : "Ha habido un pete general";
  res.status(codigo).send(mensaje);
});
