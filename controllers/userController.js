const User = require("../models/userModel");
const Package = require("../models/packageModel"); // Importe o modelo Package se necessário
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const moment = require("moment");
// Import required modules
const crypto = require("crypto");
const bcrypt = require("bcrypt");

//find all customers
exports.allUsers = asyncHandler(async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    // Query to find users with role = 2 (subscribers)
    let query = { role: 1 };

    // Add search criteria if searchTerm is provided
    if (searchTerm) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { username: { $regex: searchTerm, $options: "i" } },
        // Add more fields as needed
      ];
    }

    // Add date range criteria if both startDate and endDate are provided
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      if (!isNaN(startDate) && !isNaN(endDate) && startDate <= endDate) {
        query.createdAt = {
          $gte: startDate,
          $lte: endDate,
        };
      }
    }

    // Calculate total count of users matching the query
    const totalCount = await User.countDocuments(query);

    // Find users with pagination and populate subscription details
    const users = await User.find(query)
      .select("-password") // Exclude the 'password' field
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate({
        path: "subscription.package",
        select: "name durationInDays", // Include fields you want to retrieve from Package
      });

    // Calculate days remaining for each user's subscription
    const currentDate = new Date();
    users.forEach((user) => {
      if (user.subscription && user.subscription.endDate) {
        const endDate = new Date(user.subscription.endDate);
        const daysRemaining = Math.ceil(
          (endDate - currentDate) / (1000 * 60 * 60 * 24)
        );
        user.subscription.daysRemaining = daysRemaining;
      }
    });

    res.status(200).json({
      success: true,
      count: users.length,
      total: totalCount,
      pageSize,
      page,
      users,
    });
  } catch (error) {
    next(error);
  }
});

//load all users from db
exports.allUsers1 = async (req, res, next) => {
  //enavle pagination
  const pageSize = 20;
  const page = Number(req.query.pageNumber) || 1;
  const searchTerm = req.query.searchTerm;
  // Parse the date range parameters from the request query
  const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
  const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");
    query["$or"] = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      // Add other fields you want to search by
    ];
  }

  if (startDateParam && endDateParam) {
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    if (!isNaN(startDate) && !isNaN(endDate) && startDate <= endDate) {
      // Only add date range criteria if startDate and endDate are valid dates
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
  }

  const count = await User.find({}).estimatedDocumentCount();
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("-password")
      .populate({
        path: "plan",
        populate: {
          path: "planService",
          model: "PlanServices",
        },
      })
      .populate({
        path: "manager",
        select: "firstName lastName email",
        populate: {
          path: "lineManager",
          model: "User",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "user",
        select: "firstName lastName email",
      })
      .populate("myMembers")
      .populate("myMembers")
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    res.status(200).json({
      success: true,
      users,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
    next();
  } catch (error) {
    return next(error);
  }
};

// // findUserById
// exports.findUserById = asyncHandler(async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const currentDateTime = new Date(); // Data e hora atuais

//     // Função para calcular os dias restantes da subscrição
//     const calculateDaysRemaining = (startDate, endDate) => {
//       const endDateTime = new Date(endDate); // Data e hora de término da subscrição

//       // Calculando a diferença em milissegundos entre as datas
//       const differenceInMilliseconds = endDateTime.getTime() - currentDateTime.getTime();

//       // Convertendo a diferença de milissegundos para dias
//       const millisecondsInDay = 1000 * 60 * 60 * 24;
//       let daysRemaining = Math.floor(differenceInMilliseconds / millisecondsInDay);

//       if (daysRemaining < 0) {
//         daysRemaining = 0; // Evitar dias restantes negativos
//       }

//       console.log("Days Remaining Calculated:", daysRemaining);

//       return daysRemaining;
//     };

//     // Buscar o usuário pelo ID
//     const user = await User.findById(id);

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado" });
//     }

//     // Extrair informações da assinatura e do pacote
//     const { startDate, endDate, package } = user.subscription;
//     const { durationInDays, name: packageName } = await Package.findById(package).select('durationInDays name'); // Buscar durationInDays e name do objeto Package

//     // Calcular os dias restantes da assinatura
//     const daysRemaining = calculateDaysRemaining(startDate, endDate);

//     // Atualizar o objeto de usuário com os dias restantes da assinatura
//     user.subscription.daysRemaining = daysRemaining;

//     // Retornar resposta com os dias restantes e nome do pacote incluídos
//     res.status(200).json({
//       success: true,
//       user: {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         contact1: user.contact1,
//         subscription: {
//           ...user.subscription.toObject(), // Convertendo para objeto para incluir todos os campos
//           daysRemaining,
//           durationInDays,
//           packageName // Incluir o nome do pacote
//         }
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });
// Função para calcular os dias restantes da assinatura
const calculateDaysRemaining = (startDate, endDate) => {
  const currentDateTime = new Date();
  const endDateTime = new Date(endDate);
  const differenceInMilliseconds =
    endDateTime.getTime() - currentDateTime.getTime();
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  let daysRemaining = Math.floor(differenceInMilliseconds / millisecondsInDay);

  if (daysRemaining < 0) {
    daysRemaining = 0;
  }

  return daysRemaining;
};

exports.findUserById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Buscar o usuário pelo ID e selecionar apenas os campos necessários
    const user = await User.findById(id).select(
      "firstName lastName email gender dob province contact1 status subscription"
    );
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    let daysRemaining = null;
    let durationInDays = null;
    let packageName = null;

    if (user.subscription && user.subscription.package) {
      const { startDate, endDate, package: packageId } = user.subscription;

      // Buscar detalhes do pacote
      const packageDetails = await Package.findById(packageId).select(
        "durationInDays name"
      );
      if (packageDetails) {
        durationInDays = packageDetails.durationInDays;
        packageName = packageDetails.name;
      }

      // Calcular os dias restantes da assinatura
      daysRemaining = calculateDaysRemaining(startDate, endDate);
    }

    // Retornar resposta com os detalhes do usuário e, se disponível, os detalhes da assinatura
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        province: user.province,
        contact1: user.contact1,
        status: user.status,
        subscription: user.subscription
          ? {
              ...user.subscription.toObject(),
              daysRemaining,
              durationInDays,
              packageName,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// single user profile || i use this to get profile to a customer *
// exports.singleUserProfile = asyncHandler(async (req, res, next) => {
//   try {
//     const id = req.user.id; // Corrigido para acessar diretamente o id
//     console.log(id);
//     const currentDateTime = new Date(); // Data e hora atuais

//     // Função para calcular os dias restantes da subscrição
//     const calculateDaysRemaining = (startDate, endDate) => {
//       const endDateTime = new Date(endDate); // Data e hora de término da subscrição

//       // Calculando a diferença em milissegundos entre as datas
//       const differenceInMilliseconds = endDateTime.getTime() - currentDateTime.getTime();

//       // Convertendo a diferença de milissegundos para dias
//       const millisecondsInDay = 1000 * 60 * 60 * 24;
//       let daysRemaining = Math.floor(differenceInMilliseconds / millisecondsInDay);

//       if (daysRemaining < 0) {
//         daysRemaining = 0; // Evitar dias restantes negativos
//       }

//       console.log("Days Remaining Calculated:", daysRemaining);

//       return daysRemaining;
//     };

//     // Buscar o usuário pelo ID
//     const user = await User.findById(id);

//     if (!user) {
//       return res.status(404).json({ message: "Usuário não encontrado" });
//     }

//     if (!user.subscription) {
//       return res.status(404).json({ message: "Assinatura não encontrada para este usuário" });
//     }

//     // Extrair informações da assinatura e do pacote
//     const { startDate, endDate, package } = user.subscription;
//     const { durationInDays, name: packageName } = await Package.findById(package).select('durationInDays name'); // Buscar durationInDays e name do objeto Package

//     // Calcular os dias restantes da assinatura
//     const daysRemaining = calculateDaysRemaining(startDate, endDate);

//     // Atualizar o objeto de usuário com os dias restantes da assinatura
//     user.subscription.daysRemaining = daysRemaining;

//     // Retornar resposta com os dias restantes e nome do pacote incluídos
//     res.status(200).json({
//       success: true,
//       user: {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         contact1: user.contact1,
//         subscription: {
//           ...user.subscription.toObject(), // Convertendo para objeto para incluir todos os campos
//           daysRemaining,
//           durationInDays,
//           packageName // Incluir o nome do pacote
//         }
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

exports.singleUserProfile = asyncHandler(async (req, res, next) => {
  try {
    const id = req.user.id; // Corrigido para acessar diretamente o id
    console.log(id);
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

    // Buscar o usuário pelo ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Se não houver assinatura ou se a assinatura não for válida, configurar dias restantes como 0
    if (!user.subscription || !user.subscription.package) {
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contact1: user.contact1,
          subscription: {
            daysRemaining: 0,
            durationInDays: 0,
            packageName: "Sem assinatura",
          },
        },
      });
    }

    // Extrair informações da assinatura e do pacote
    const { startDate, endDate, package } = user.subscription;
    const packageData = await Package.findById(package).select(
      "durationInDays name"
    ); // Buscar durationInDays e name do objeto Package

    if (!packageData) {
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          contact1: user.contact1,
          subscription: {
            daysRemaining: 0,
            durationInDays: 0,
            packageName: "Pacote inválido",
          },
        },
      });
    }

    const { durationInDays, name: packageName } = packageData;

    // Calcular os dias restantes da assinatura
    const daysRemaining = calculateDaysRemaining(startDate, endDate);

    // Atualizar o objeto de usuário com os dias restantes da assinatura
    user.subscription.daysRemaining = daysRemaining;

    // Retornar resposta com os dias restantes e nome do pacote incluídos
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contact1: user.contact1,
        subscription: {
          ...user.subscription.toObject(), // Convertendo para objeto para incluir todos os campos
          daysRemaining,
          durationInDays,
          packageName, // Incluir o nome do pacote
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

//update user
// exports.updateUser = asyncHandler(async (req, res, next) => {
//   const id = req.params.id;

//   // Find the customer by ID
//   let checkCustomer = await User.findById(id);

//   if (!checkCustomer) {
//     return res.status(404).json({ message: "Usuario nao existe" });
//   }
//   const {
//     firstName,
//     lastName,
//     email,
//     gender,
//     dob,
//     idType,
//     idNumber,
//     address,
//     contact1,
//     role,
//     username,
//     password,
//   } = req.body;

//   console.log(req.body)

//   const requiredFields = [
//     firstName,
//     lastName,
//     email,
//     gender,
//     dob,
//     idType,
//     idNumber,
//     address,
//     contact1,
//     role,
//     username,
//   ];

//   if (requiredFields.some((field) => !field)) {
//     return next(new ErrorResponse("Campo nao pode ser nulo", 400));
//   }
//   // Check if contact is a valid number
//   if (isNaN(contact1)) {
//     return next(new ErrorResponse("Contacto deve ser um numero", 400));
//   }
//   // Hash the password
//   const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

//   const updatedUser = await User.findByIdAndUpdate(
//     id,
//     {
//       firstName,
//       lastName,
//       email,
//       gender,
//       dob,
//       idType,
//       idNumber,
//       address,
//       contact1,
//       role,
//       username,
//       password: hashedPassword, // Save the hashed password
//     },
//     { new: true }
//   );

//   res.status(200).json({
//     success: true,
//     user: updatedUser,
//   });
// });

//delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new ErrorResponse("Usuario nao encontrado", 404));
    }
    res.status(200).json({
      success: true,
      message: "Usuario apagado",
    });
  } catch (error) {
    return next(error);
  }
};

// desactive user
exports.desactiveUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const { status } = req.body;

  const requiredFields = [status];

  if (requiredFields.some((field) => !field)) {
    return next(new ErrorResponse("Fields cannot be null", 400));
  }

  // verificar se esses esse user
  const validUser = await User.findById(id);
  if (!validUser) {
    return next(new ErrorResponse("User not found, please check", 400));
  }

  const InactiveUser = await User.findByIdAndUpdate(
    id,
    {
      status,
      user: req.user.id,
    },
    { new: true }
  );

  if (!InactiveUser) {
    return next(new ErrorResponse("Service not found", 404));
  }

  res.status(200).json({
    success: true,
    user: InactiveUser.status,
  });
});


// ---------------------------------------------------------------------
//load all customers from db
exports.allCustomers = async (req, res, next) => {
  // Habilitar paginação
  const pageSize = 20;
  const page = Number(req.query.pageNumber) || 1;
  const searchTerm = req.query.searchTerm;
  // Parse dos parâmetros de intervalo de datas da query
  const startDateParam = req.query.startDate; // Formato: YYYY-MM-DD
  const endDateParam = req.query.endDate; // Formato: YYYY-MM-DD

  // Inicializar a query com a condição de role
  let query = { role: 2 };

  if (searchTerm) {
    const regex = new RegExp(searchTerm, "i");
    query["$or"] = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      // Adicione outros campos que deseja pesquisar
    ];
  }

  if (startDateParam && endDateParam) {
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    if (!isNaN(startDate) && !isNaN(endDate) && startDate <= endDate) {
      // Adicionar critérios de intervalo de datas somente se startDate e endDate forem datas válidas
      query.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }
  }

  try {
    const count = await User.countDocuments(query); // Usar a query para contar os documentos
    const users = await User.find(query) // Usar a query para buscar os documentos
      .sort({ createdAt: -1 })
      .select("-password")
      .populate('subscription.package', 'name durationInDays') // Popula o campo 'package' com nome e durationInDays do pacote
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    // Mapear os usuários para adicionar os campos de dias restantes e nome do pacote
    const mappedUsers = users.map(user => {
      let daysRemaining = "N/A";
      let packageName = "N/A";
      let durationInDays = null;

      if (user.subscription && user.subscription.package) {
        const { startDate, endDate, package: packageId } = user.subscription;
        const packageDetails = user.subscription.package; // Pacote populado

        if (packageDetails) {
          packageName = packageDetails.name;
          durationInDays = packageDetails.durationInDays;
        }

        // Calcular os dias restantes da assinatura
        daysRemaining = calculateDaysRemaining(startDate, endDate);
      }

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        dob: user.dob,
        province: user.province,
        contact1: user.contact1,
        status: user.status,
        subscription: user.subscription
          ? {
              ...user.subscription.toObject(), // Verifica se user.subscription existe antes de chamar toObject()
              daysRemaining,
              packageName,
              durationInDays,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      users: mappedUsers,
      page,
      pages: Math.ceil(count / pageSize),
      count,
    });
  } catch (error) {
    return next(error);
  }
};
