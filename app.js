// // const express = require("express");
// // const mongoose = require("mongoose");
// // const morgan = require("morgan");
// // const bodyParser = require("body-parser");
// // require("dotenv").config();
// // const cors = require("cors");
// // const cookieParser = require("cookie-parser");
// // const { errorHandler, notFound } = require("./middleware/error");
// // const websocketHandler = require("./middleware/websocketHandler");
// // const http = require("http");

// // // Import socket.io and initialize it with the http server
// // const socketIo = require("socket.io");

// // const app = express();

// // app.use(morgan("dev"));
// // app.use(bodyParser.json({ limit: "30mb", extended: true }));
// // app.use(
// //   bodyParser.urlencoded({
// //     limit: "30mb",
// //     extended: true,
// //   })
// // );
// // app.use(cookieParser());

// // mongoose.set("strictQuery", false);

// // mongoose
// //   .connect(process.env.DATABASE, {
// //     // useNewUrlParser: true,
// //     // useUnifiedTopology: true,
// //   })
// //   .then(() => {
// //     console.log("DB connected");
// //   })
// //   .catch((error) => {
// //     if (error.code === "ETIMEOUT" && error.syscall === "querySrv") {
// //       console.error("MongoDB connection timed out. Please try again later.");
// //     } else {
// //       console.error("MongoDB connection error:", error);
// //     }
// //   });

// // // Configurar CORS
// // app.use(cors({
// //   origin: '*', // Permitir acesso de qualquer origem (ajuste conforme necessário)
// //   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
// //   allowedHeaders: ['Content-Type', 'token'], // Cabeçalhos permitidos
// // }));

// // // Servir arquivos estáticos e definir headers CORS
// // app.use('/uploads', express.static('uploads', {
// //   setHeaders: (res, path, stat) => {
// //     res.setHeader('Access-Control-Allow-Origin', '*'); // Permitir acesso de qualquer origem
// //     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // Definir CORP para cross-origin
// //   },
// // }));

// // const sseRoutes = require("./routes/sseRoutes");
// // app.use("/api", sseRoutes.router);

// // const authRoutes = require("./routes/authRoutes");
// // const userRoutes = require("./routes/userRoutes");

// // const Dashboard = require("./routes/dashboard/dashboardRoutes");
// // const Servico = require("./routes/servicos/servicoRoutes");
// // const Customer = require("./routes/customer/customerRoutes");
// // const Expense = require("./routes/expense/expenseRoutes");
// // const Charge = require("./routes/charges/chargesRoutes");
// // const Report = require("./routes/report/expenseRoutes");
// // //
// // const Novel = require("./routes/novelRoutes");
// // const Season = require("./routes/seasonRoutes");
// // const Episode = require("./routes/episodeRoutes")
// // const Packege = require("./routes/packageRoutes")

// // app.use("/api", authRoutes);
// // app.use("/api", userRoutes);

// // app.use("/api", Dashboard);
// // app.use("/api", Customer);
// // app.use("/api", Expense);
// // app.use("/api", Servico);
// // app.use("/api", Charge);
// // app.use("/api", Report);

// // //
// // app.use("/api", Novel);
// // app.use("/api", Season);
// // app.use("/api", Episode);
// // app.use("/api", Packege);

// // app.use(notFound);
// // app.use(errorHandler);

// // app.use((req, res, next) => {
// //   console.log("Received headers:", req.headers);
// //   next();
// // });

// // const server = http.createServer(app);

// // // Initialize socket.io with the server
// // const io = socketIo(server);

// // // Connect the websocketHandler
// // websocketHandler(io);

// // app.locals.io = io; // Store io instance for later use in your application

// // const port = process.env.PORT || 8000;

// // server.listen(port, () => {
// //   console.log(`Server running on port ${port}`);
// // });


// const express = require("express");
// const mongoose = require("mongoose");
// const morgan = require("morgan");
// const bodyParser = require("body-parser");
// require("dotenv").config();
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const { errorHandler, notFound } = require("./middleware/error");
// const websocketHandler = require("./middleware/websocketHandler");
// const http = require("http");

// // Import socket.io and initialize it with the http server
// const socketIo = require("socket.io");

// const app = express();

// app.use(morgan("dev"));
// app.use(bodyParser.json({ limit: "30mb", extended: true }));
// app.use(
//   bodyParser.urlencoded({
//     limit: "30mb",
//     extended: true,
//   })
// );
// app.use(cookieParser());

// mongoose.set("strictQuery", false);

// mongoose
//   .connect(process.env.DATABASE, {
//     // useNewUrlParser: true,
//     // useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("DB connected");
//   })
//   .catch((error) => {
//     if (error.code === "ETIMEOUT" && error.syscall === "querySrv") {
//       console.error("MongoDB connection timed out. Please try again later.");
//     } else {
//       console.error("MongoDB connection error:", error);
//     }
//   });

// // Configurar CORS
// const allowedOrigins = ['https://novelamania.vercel.app', 'http://localhost:8080', 'http://localhost:8081'];
// app.use(cors({
//   origin: function(origin, callback) {
//     // allow requests with no origin (like mobile apps, curl, postman)
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) {
//       const msg = 'The CORS policy for this site does not allow access from the specified origin.';
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'token'],
// }));

// // Servir arquivos estáticos e definir headers CORS
// app.use('/uploads', express.static('uploads', {
//   setHeaders: (res, path, stat) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
//   },
// }));

// const sseRoutes = require("./routes/sseRoutes");
// app.use("/api", sseRoutes.router);

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");

// const Dashboard = require("./routes/dashboard/dashboardRoutes");
// const Servico = require("./routes/servicos/servicoRoutes");
// const Customer = require("./routes/customer/customerRoutes");
// const Expense = require("./routes/expense/expenseRoutes");
// const Charge = require("./routes/charges/chargesRoutes");
// const Report = require("./routes/report/expenseRoutes");

// const Novel = require("./routes/novelRoutes");
// const Season = require("./routes/seasonRoutes");
// const Episode = require("./routes/episodeRoutes");
// const Packege = require("./routes/packageRoutes");

// app.use("/api", authRoutes);
// app.use("/api", userRoutes);

// app.use("/api", Dashboard);
// app.use("/api", Customer);
// app.use("/api", Expense);
// app.use("/api", Servico);
// app.use("/api", Charge);
// app.use("/api", Report);

// app.use("/api", Novel);
// app.use("/api", Season);
// app.use("/api", Episode);
// app.use("/api", Packege);

// app.use(notFound);
// app.use(errorHandler);

// app.use((req, res, next) => {
//   console.log("Received headers:", req.headers);
//   next();
// });

// const server = http.createServer(app);

// // Initialize socket.io with the server
// const io = socketIo(server);

// // Connect the websocketHandler
// websocketHandler(io);

// app.locals.io = io; // Store io instance for later use in your application

// const port = process.env.PORT || 8000;

// server.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });


const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middleware/error");
const websocketHandler = require("./middleware/websocketHandler");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());

mongoose.set("strictQuery", false);

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("DB connected");
  })
  .catch((error) => {
    if (error.code === "ETIMEOUT" && error.syscall === "querySrv") {
      console.error("MongoDB connection timed out. Please try again later.");
    } else {
      console.error("MongoDB connection error:", error);
    }
  });

// Configurar CORS para permitir todas as origens
app.use(cors());
app.options('*', cors()); // Habilita CORS pré-vôo para todos os métodos

// Servir arquivos estáticos e definir headers CORS
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// Middleware para definir cabeçalhos CORS em todas as respostas
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token');
  next();
});

const sseRoutes = require("./routes/sseRoutes");
app.use("/api", sseRoutes.router);

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const Dashboard = require("./routes/dashboard/dashboardRoutes");
const Servico = require("./routes/servicos/servicoRoutes");
const Customer = require("./routes/customer/customerRoutes");
const Expense = require("./routes/expense/expenseRoutes");
const Charge = require("./routes/charges/chargesRoutes");
const Report = require("./routes/report/expenseRoutes");
const Novel = require("./routes/novelRoutes");
const Season = require("./routes/seasonRoutes");
const Episode = require("./routes/episodeRoutes");
const Packege = require("./routes/packageRoutes");

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", Dashboard);
app.use("/api", Customer);
app.use("/api", Expense);
app.use("/api", Servico);
app.use("/api", Charge);
app.use("/api", Report);
app.use("/api", Novel);
app.use("/api", Season);
app.use("/api", Episode);
app.use("/api", Packege);

app.use(notFound);
app.use(errorHandler);

app.use((req, res, next) => {
  console.log("Received headers:", req.headers);
  next();
});

const server = http.createServer(app);
const io = socketIo(server);

websocketHandler(io);
app.locals.io = io;

const port = process.env.PORT || 8000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
