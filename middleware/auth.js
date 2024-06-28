const ErrorResponse = require("../utils/errorResponse");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Session = require("../models/sessionMode");
const asyncHandler = require("../middleware/asyncHandler");
const Package = require("../models/packageModel");

// Check if user is authenticated
exports.isAuthenticated11 = async (req, res, next) => {
  const token = req.headers.token;

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized: Token not provided", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    // Check if the user exists
    if (!req.user) {
      return next(new ErrorResponse("Not authorized: Invalid token", 401));
    }

    // Check if the token has expired
    if (decoded.exp < Date.now() / 1000) {
      return next(new ErrorResponse("Not authorized: Token expired", 401));
    }

    next();
  } catch (error) {
    // Clear any stored token or session information
    // For example, you can clear the token from cookies or local storage

    return next(new ErrorResponse("Not authorized: Invalid token", 401));
  }
};

exports.isAuthenticated = async (req, res, next) => {
  const token = req.headers.token; // Buscar o token do cookie

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse("Not authorized: Token not provided", 401));
  }

  try {
    // Verificar se o token JWT é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o token expirou
    if (decoded.exp < Date.now() / 1000) {
      return next(new ErrorResponse("Not authorized: Token expired", 401));
    }

    // Verificar se o token corresponde a uma sessão ativa no banco de dados
    const session = await Session.findOne({ token }).populate("userId");

    if (!session) {
      return next(new ErrorResponse("Not authorized: Invalid token", 401));
    }

    // Anexar o usuário da sessão ao objeto da solicitação para uso posterior
    req.user = session.userId;

    // Se todas as verificações passarem, o usuário está autenticado
    next();
  } catch (error) {
    // Se houver um erro, o token não é válido
    return next(new ErrorResponse("Not authorized: Invalid token", 401));
  }
};

// Middleware for admin
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse("Access denied: No user authenticated", 401));
  }

  if (req.user.role !== 1) {
    return next(new ErrorResponse("Access denied: You must be an admin", 401));
  }

  next();
};

exports.isManager = (req, res, next) => {
  if (req.user.role !== 2 && req.user.role !== 1) {
    return next(new ErrorResponse("Access denied: You must be an admin", 401));
  }
  next();
};

exports.isCustomerManager = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logedUser = req.user;

    const user = await User.findById(id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    if (
      logedUser.role === 1 ||
      logedUser.role === 6 ||
      user.manager.toString() === logedUser.id ||
      user.agent.toString() === logedUser.id
    ) {
      // Allow access for users with role === 1 or the company manager
      next();
    } else {
      return next(
        new ErrorResponse(
          "Access denied. Only customer manager or users admin can access this account",
          403
        )
      );
    }
  } catch (error) {
    next(error);
  }
};

exports.isPartner = (req, res, next) => {
  if (req.user.role !== 6 && req.user.role !== 1) {
    return next(new ErrorResponse("Access denied: You dont have access", 401));
  }
  next();
};

// exports.isTokenValid111 = async (req, res, next) => {
//   try {
//     const token = req.headers.token;

//     // Check if token exists
//     if (!token) {
//       throw new Error("Token not provided");
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Retrieve user from the database
//     const user = await User.findById(decoded.id);

//     // Check if the user exists
//     if (!user) {
//       throw new Error("User not found");
//     }

//     // Check if the token has expired
//     const resetPasswordExpiresMilliseconds = new Date(
//       user.resetPasswordExpires
//     ).getTime();
//     const currentTimeMilliseconds = Date.now() / 1000;

//     if (resetPasswordExpiresMilliseconds < currentTimeMilliseconds) {
//       throw new Error("Reset token expired");
//       // You can handle the token expiration here
//     }

//     // Attach the user to the request object for later use
//     req.user = user;

//     // console.log("User: ", req.user);

//     // If all checks pass, move on to the next middleware
//     // next();
//     if (req.user) {
//       return res.status(200).json({ success: true, message: "token is valid" });
//     }
//   } catch (error) {
//     // Handle errors in a centralized error handler or middleware
//     // You can send a more descriptive error message if needed
//     return res
//       .status(401)
//       .json({ success: false, message: "Authentication failed" });
//   }
// };

exports.isTokenValid = async (req, res, next) => {
  try {
    // const token = req.cookies.token; // Alterado para buscar o token do cookie
    const token = req.headers.token;

    // Check if token exists
    if (!token) {
      throw new Error("Token not provided");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    // Check if the user exists
    if (!req.user) {
      return next(new ErrorResponse("Not authorized: Invalid token", 401));
    }

    // Check if the token has expired
    if (decoded.exp < Date.now() / 1000) {
      return next(new ErrorResponse("Not authorized: Token expired", 401));
    }

    // Verifique se o token corresponde a uma sessão ativa no banco de dados
    const session = await Session.findOne({ token });

    if (!session) {
      throw new Error("Session not found");
    }

    // Attach the user from the session to the request object for later use
    req.user = session.userId;

    // Se todas as verificações passarem, o token é considerado válido
    return res.status(200).json({ success: true, message: "Token is valid" });
  } catch (error) {
    // Se houver um erro, o token não é válido
    return res
      .status(401)
      .json({ success: false, message: "Token is invalid" });
  }
};

// exports.checkSubscription = asyncHandler(async (req, res, next) => {
//   // const userId = req.user.id;
//   const userId = req.params;

//   // Encontre o usuário e popule a subscrição e pacote
//   const user = await User.findById(userId).populate('subscription.package');
//   if (!user) {
//     return next(new ErrorResponse('Usuário não encontrado', 404));
//   }

//   // Verifique se o usuário é um admin
//   if (user.role === 1) {
//     return next(); // Se for admin, continue para a próxima função
//   }

//   const currentDate = new Date();

//   // Verifique se a subscrição existe e calcule a data de término
//   if (user.subscription && user.subscription.package) {
//     const startDate = new Date(user.subscription.startDate);
//     const endDate = new Date(startDate);
//     endDate.setDate(startDate.getDate() + user.subscription.package.durationInDays);

//     // Atualize o campo endDate no usuário
//     user.subscription.endDate = endDate;
//     await user.save();

//     // Verifique se a data de término é válida
//     if (endDate < currentDate) {
//       return next(new ErrorResponse('Subscrição expirada. Por favor, contate o administrador.', 403));
//     }

//     // Se a subscrição é válida, continue para a próxima função
//     return next();
//   } else {
//     return next(new ErrorResponse('Usuário não subscrito. Por favor, contate o administrador.', 403));
//   }
// });
// const token = req.headers.token;

// exports.checkSubscription = async (req, res, next) => {
//   const token = req.headers.token; // Token JWT enviado no cabeçalho Authorization

//   // Verificar se o token existe
//   if (!token) {
//     return next(new ErrorResponse("Not authorized: Token not provided", 401));
//   }

//   try {
//     // Verificar se o token JWT é válido
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Extrair o userId do token decodificado
//     const userId = decoded.id;

//     // Buscar o usuário e popule a subscrição e o pacote
//     const user = await User.findById(userId).populate('subscription.package');

//     // Verificar se o usuário existe
//     if (!user) {
//       return next(new ErrorResponse('Usuário não encontrado', 404));
//     }

//     // Verificar se a subscrição está corretamente populada
//     if (!user.subscription || !user.subscription.package) {
//       return next(new ErrorResponse('Usuário não subscrito. Por favor, contate o administrador.', 403));

//     }

//     // Verificar se o usuário é um admin
//     if (user.role === 2) {
//       return next(); // Se for admin, continue para a próxima função
//     }

//     const currentDate = new Date();

//     // Calcular a data de término da subscrição
//     const startDate = new Date(user.subscription.startDate);
//     const endDate = new Date(startDate);
//     endDate.setDate(startDate.getDate() + user.subscription.package.durationInDays);

//     // Atualizar o campo endDate no usuário
//     user.subscription.endDate = endDate;
//     await user.save();

//     // Verificar se a data de término é válida
//     if (endDate < currentDate) {
//       return next(new ErrorResponse('Subscrição expirada. Por favor, contate o administrador.', 403));
//     }

//     // Se a subscrição é válida, continuar para a próxima função
//     return next();
//   } catch (error) {
//     // Se houver um erro ao verificar o token
//     console.error("Erro ao verificar token:", error);
//     return next(new ErrorResponse("Not authorized: Invalid token", 401));
//   }
// };

exports.checkSubscription = async (req, res, next) => {
  const token = req.headers.token; // Token JWT enviado no cabeçalho Authorization

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse("Not authorized: Token not provided", 401));
  }

  try {
    // Verificar se o token JWT é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extrair o userId do token decodificado
    const userId = decoded.id;

    // Buscar o usuário e popule a subscrição e o pacote
    const user = await User.findById(userId).populate("subscription.package");

    // Verificar se o usuário existe
    if (!user) {
      return next(new ErrorResponse("Usuário não encontrado", 404));
    }

    if (user.role === 1) {
      return next(); // Se for admin (role 1), continue para a próxima função
    } 
    
    // Verificar se a subscrição está corretamente populada
    if (!user.subscription || !user.subscription.package) {
      return next(
        new ErrorResponse(
          "Usuário não subscrito. Por favor, contate o administrador.",
          403
        )
      );
    }
    
    // Se a subscrição for válida, continue para a próxima função
    // return next();

    const currentDate = new Date();

    // Calcular a data de término da subscrição
    const startDate = new Date(user.subscription.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(
      startDate.getDate() + user.subscription.package.durationInDays
    );

    // Atualizar o campo endDate no usuário
    user.subscription.endDate = endDate;
    await user.save();

    // Verificar se a data de término é válida
    if (endDate < currentDate) {
      return next(
        new ErrorResponse(
          "Subscrição expirada. Por favor, contate o administrador.",
          403
        )
      );
    }

    return next();
  } catch (error) {
    // Se houver um erro ao verificar o token
    console.error("Erro ao verificar token:", error);
    return next(new ErrorResponse("Not authorized: Invalid token", 401));
  }
};

exports.validate = async (req, res, next) => {
  const token = req.headers.token; // Token JWT enviado no cabeçalho Authorization

  // Verificar se o token existe
  if (!token) {
    return next(new ErrorResponse("Not authorized: Token not provided", 401));
  }

  try {
    // Verificar se o token JWT é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extrair o userId do token decodificado
    const userId = decoded.id;

    // Buscar o usuário e popule a subscrição e o pacote
    const user = await User.findById(userId).populate("subscription.package");

    // Verificar se o usuário existe
    if (!user) {
      return next(new ErrorResponse("Usuário não encontrado", 404));
    }

    // Verificar se a subscrição está corretamente populada
    if (!user.subscription || !user.subscription.package) {
      return next(
        new ErrorResponse(
          "Usuário não inscrito. Contate o administrador para assinar um pacote.",
          403
        )
      );
    }

    console.log("user.role", user.role);
    // Verificar se o usuário é um admin
    if (user.role === 1) {
      return next(
        new ErrorResponse(
          "Apenas clientes devidamente cadastrados podem aceder.",
          403
        )
      );
    }

    const currentDateTime = new Date(); // Data e hora atuais

    // Função para calcular os dias restantes da subscrição
    const calculateDaysRemaining = (startDate, endDate) => {
      const endDateTime = new Date(endDate); // Data e hora de término da subscrição

      // Calculando a diferença em milissegundos entre as datas
      const differenceInMilliseconds =
        endDateTime.getTime() - currentDateTime.getTime();

      // Convertendo a diferença de milissegundos para dias
      const millisecondsInDay = 1000 * 60 * 60 * 24;
      let daysRemaining = Math.floor(
        differenceInMilliseconds / millisecondsInDay
      );

      if (daysRemaining < 0) {
        daysRemaining = 0; // Evitar dias restantes negativos
      }

      console.log("Days Remaining Calculated:", daysRemaining);

      return daysRemaining;
    };

    // Extrair informações da assinatura e do pacote
    const { startDate, endDate, package } = user.subscription;
    const { durationInDays, name: packageName } = await Package.findById(
      package
    ).select("durationInDays name"); // Buscar durationInDays e name do objeto Package

    // Calcular os dias restantes da assinatura
    const daysRemaining = calculateDaysRemaining(startDate, endDate);

    // Atualizar o objeto de usuário com os dias restantes da assinatura
    user.subscription.daysRemaining = daysRemaining;

    res.status(200).json({
      success: true,
      daysRemaining: daysRemaining,
    });
  } catch (error) {
    // Se houver um erro ao verificar o token
    console.error("Erro ao verificar token:", error);
    return next(new ErrorResponse("Not authorized: Invalid token", 401));
  }
};
