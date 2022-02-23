const express = require("express");
const morgan = require("morgan");
const path = require("path");
const exphbs = require("express-handlebars");
const session = require("express-session");
const validator = require("express-validator");
const passport = require("passport");
const flash = require("connect-flash");
const MySQLStore = require("express-mysql-session")(session);
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");

const { database } = require("./keys");
const multer = require("multer");

// Intializations
const app = express();
require("./lib/passport");


// Settings

app.set("port", process.env.PORT || 80);
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    helpers: require("./lib/handlebars"),
  })
);
app.set("view engine", ".hbs");

// Middlewares
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "faztmysqlnodemysql",
    resave: false,
    saveUninitialized: false,
    store: new MySQLStore(database),
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Global variables
app.use((req, res, next) => {
  app.locals.message = req.flash("message");
  app.locals.success = req.flash("success");
  app.locals.usuario = req.user;
  next();
});

// Routes
app.use(require("./routes/index"));
app.use(require("./routes/authentication"));
app.use(require("./routes/links_administrador"));
app.use(require("./routes/links_condominios"));
app.use(require("./routes/links_mensajes"));
app.use(require("./routes/links_pagos"));
app.use(require("./routes/links_multas"));
app.use(require("./routes/links_usuarios"));
app.use(require("./routes/links_quejas"));
app.use(require("./routes/links_reuniones"));
app.use(require("./routes/links_reservaciones"));
app.use(require("./routes/links_encuestas"));
app.use(require("./routes/links_preguntas"));
app.use(require("./routes/links_respuestas"));
app.use(require("./routes/links_usuariodatos"));
app.use(require("./routes/links_usuariopassword"));
app.use(require("./routes/links_info"));
app.use(require("./routes/links_imprimir"));

app.use(bodyParser());
// Static files
app.use(express.static(path.join(__dirname, "public")));

// Public
app.use(express.static(path.join(__dirname, "public")));

// Starting
app.listen(app.get("port"), () => {
  console.log("Server is in port", app.get("port"));
  
});
