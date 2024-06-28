const User = require("../models/userModel");
const ErrorResponse = require("../utils/errorResponse");
// Import required modules
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const asyncHandler = require("../middleware/asyncHandler");
const Session = require('../models/sessionMode');


exports.signup = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    gender,
    dob,
    contact1,
    role,
    province,
    password,
    multipleFiles,
    avatar,
  } = req.body;
  console.log(req.body)

  if (
    !firstName ||
    !lastName ||
    !email ||
    !gender ||
    !contact1 ||
    !role
  ) {
    return next(new ErrorResponse("Fields cannot be null", 400));
  }

  try {
    const userExist = await User.findOne({ contact1 });

    if (userExist) {
      return next(new ErrorResponse("Usuario ja esxiste", 400));
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

    const user = await User.create({
      firstName,
      lastName,
      email,
      gender,
      dob,
      province,
      contact1,
      password: hashedPassword, // Save the hashed password
      multipleFiles,
      avatar,
      role,
      // user: req.user.id,
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

//find customer by ID
exports.findUserById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the customer by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "Usuario nao foi encontrado" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

exports.signin1111 = async (req, res, next) => {
  try {
    const { contact1, password } = req.body;

    if (!contact1 || !password) {
      return next(new ErrorResponse("Por favor insere contacto e senha", 403));
    }

    const user = await User.findOne({ contact1 });

    if (!user) {
      return next(new ErrorResponse("Credenciais invalidas", 400));
    }

    const isMatched = await user.comparePassword(password);

    if (!isMatched) {
      return next(new ErrorResponse("Credenciais invalidas", 400));
    }

    if (user.status !== "Active") {
      return next(
        new ErrorResponse(
          "Usuario esta Inactivo, contactar administrador da NovelaMania",
          401
        )
      );
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { contact1, password } = req.body;

    if (!contact1 || !password) {
      return next(new ErrorResponse("Por favor insere contacto e senha", 403));
    }

    const user = await User.findOne({ contact1 });

    if (!user) {
      return next(new ErrorResponse("Credenciais invalidas", 400));
    }

    const isMatched = await user.comparePassword(password);

    if (!isMatched) {
      return next(new ErrorResponse("Credenciais invalidas", 400));
    }

    if (user.status !== "Active") {
      return next(
        new ErrorResponse(
          "Usuario esta Inactivo, contactar administrador da NovelaMania",
          401
        )
      );
    }

    // Verificar o número de sessões ativas
    const activeSessions = await Session.find({ userId: user._id });
    if (activeSessions.length >= 2) {
      // Remover a sessão mais antiga se já houver duas sessões ativas
      await Session.findByIdAndDelete(activeSessions[0]._id);
    }

    // Criar nova sessão
    const token = user.getJwtToken();
    const newSession = new Session({
      userId: user._id,
      token,
    });
    await newSession.save();

    // Enviar token de resposta
    sendTokenResponse(user, 200, res, token);
  } catch (error) {
    next(error);
  }
};


const sendTokenResponse = async (user, codeStatus, res) => {
  const token = await user.getJwtToken();

  res
    .status(codeStatus)
    .cookie("token", token, { maxAge: 60 * 60 * 1000, httpOnly: true })
    .json({
      success: true,
      token,
      user: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
};

//log out
// exports.logout11 = (req, res, next) => {
//   res.clearCookie("token");
//   res.status(200).json({
//     success: true,
//     message: "logged out",
//   });
// };

exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.token;

    // Verifique se o token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Encontre a sessão correspondente no banco de dados
    const session = await Session.findOne({ token });

    // Se não houver uma sessão correspondente, o usuário já está desconectado
    if (!session) {
      return res.status(200).json({
        success: true,
        message: "User is already logged out",
      });
    }

    // Remova a sessão do banco de dados
    await Session.findByIdAndDelete(session._id);

    // Limpe o cookie que armazena o token
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    // Se ocorrer um erro, retorne uma resposta de erro
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//user profile
exports.userProfile = async (req, res, next) => {
  // console.log("Received headers:", req.headers);
  const user = await User.findById(req.user.id)
    .sort({ createdAt: -1 })
    .select("-password")
    .populate({
      path: "user",
      select: "firstName lastName email",
    })
  res.status(200).json({
    success: true,
    user,
  });
};

// exports.userServices = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .sort({ createdAt: -1 })
//       .select("-password")
//       .populate({
//         path: "plan",
//         populate: {
//           path: "planService",
//           model: "PlanServices",
//         },
//       });

//     if (user) {
//       let planService =
//         user.plan && user.plan[0] ? user.plan[0].planService : [];

//       // Extract search parameters from the request query
//       const {
//         serviceName,
//         servicePrice,
//         serviceDescription,
//         serviceAreaOfCover,
//       } = req.query;

//       // Implement search based on provided parameters
//       if (serviceName) {
//         planService = planService.filter((service) =>
//           service.serviceName.toLowerCase().includes(serviceName.toLowerCase())
//         );
//       }

//       if (servicePrice) {
//         planService = planService.filter(
//           (service) => service.servicePrice === Number(servicePrice)
//         );
//       }

//       if (serviceDescription) {
//         planService = planService.filter((service) =>
//           service.serviceDescription
//             .toLowerCase()
//             .includes(serviceDescription.toLowerCase())
//         );
//       }

//       if (serviceAreaOfCover) {
//         planService = planService.filter((service) =>
//           service.serviceAreaOfCover
//             .toLowerCase()
//             .includes(serviceAreaOfCover.toLowerCase())
//         );
//       }

//       // Implement pagination
//       const pageSize = Number(req.query.pageSize) || 12;
//       const page = Number(req.query.pageNumber) || 1;
//       const startIndex = (page - 1) * pageSize;
//       const endIndex = page * pageSize;

//       const totalServices = planService.length;

//       planService = planService.slice(startIndex, endIndex);

//       res.status(200).json({
//         success: true,
//         planService,
//         totalServices,
//         pageSize,
//         currentPage: page,
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         error: "User not found",
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// Initiate password reset
exports.forgotPassword = async (req, res, next) => {
  const { contact1 } = req.body;

  try {
    const user = await User.findOne({ contact1 });

    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    // Generate reset token and expiry time
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send password reset email
    const resetURL = `http://localhost:8080/reset/${resetToken}`;
    const mailOptions = {
      from: "test@clubedepetroleo.co.mz", // Update with your email
      to: "marcohama32@hotmail.com",
      subject: "Password Reset",
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process:\n\n${resetURL} \n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    // Create a transporter object using SMTP
    const transporter = nodemailer.createTransport({
      host: "mail.fra2.palosrv.com", // Hostname of the SMTP server
      port: 587, // Port for sending emails (587 for TLS)
      secure: false, // Set to true if you are using port 465 (secure)
      auth: {
        user: "test@clubedepetroleo.co.mz", // Your email address
        pass: "cE^egrq4ETB1", // Your email password
      },
    });

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Password reset email sent." });
  } catch (error) {
    if (
      error.name ===
      "Operation `users.findOne()` buffering timed out after 10000ms"
    ) {
      return res
        .status(500)
        .json({ message: "The operation timed out. Please try again later." });
    }
    next(error);
  }
};
// Reset password
exports.resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Update user's password and clear reset token fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (error) {
    next(error);
  }
};

// exports.getAllUsers = async (req, res, next) => {
//   // console.log("Received headers:", req.headers);
//   const user = await User.find().sort({ createdAt: -1 }).select("-password");

//   res.status(200).json({
//     success: true,
//     user,
//   });
// };

//show single user
// exports.singleUser = async (req, res, next) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId);

//     // Check if the user exists
//     if (!user) {
//       return res
//         .status(404)
//         .json({ success: false, error: "Usuario nao encontrado" });
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     return next(error);
//   }
// };

//update user
exports.updateUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  // Find the customer by ID
  let checkCustomer = await User.findById(id);

  if (!checkCustomer) {
    return res.status(404).json({ message: "Usuario nao existe" });
  }
  const {
    firstName,
    lastName,
    email,
    gender,
    dob,
    province,
    contact1,
    role,
    password,
  } = req.body;

  console.log(req.body)

  const requiredFields = [
    firstName,
    lastName,
    email,
    gender,
    dob,
    province,
    contact1,
    role,
  ];

  if (requiredFields.some((field) => !field)) {
    return next(new ErrorResponse("Campo nao pode ser nulo", 400));
  }
  // Check if contact is a valid number
  if (isNaN(contact1)) {
    return next(new ErrorResponse("Contacto deve ser um numero", 400));
  }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      email,
      gender,
      dob,
      province,
      contact1,
      role,
      password: hashedPassword, // Save the hashed password
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

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
