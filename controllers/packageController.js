const Package = require("../models/packageModel");
const User = require("../models/userModel");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

exports.createPackage = asyncHandler(async (req, res, next) => {
  const { name, durationInDays, price } = req.body;

  const package = await Package.create({
    name,
    durationInDays,
    price,
  });

  res.status(201).json({
    success: true,
    package,
  });
});

//
exports.editPackage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, durationInDays, price } = req.body;

  const updatedPackage = await Package.findByIdAndUpdate(
    id,
    {
      name,
      durationInDays,
      price,
    },
    { new: true }
  );

  if (!updatedPackage) {
    return next(new ErrorResponse("Pacote não encontrado", 404));
  }

  res.status(200).json({
    success: true,
    package: updatedPackage,
  });
});

//
exports.deletePackage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const package = await Package.findById(id);

  if (!package) {
    return next(new ErrorResponse("Pacote não encontrado", 404));
  }

  await package.remove();

  res.status(200).json({
    success: true,
    message: "Pacote removido com sucesso",
  });
});

//
exports.findPackageById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const package = await Package.findById(id);

  if (!package) {
    return next(new ErrorResponse("Pacote não encontrado", 404));
  }

  res.status(200).json({
    success: true,
    package,
  });
});

//
exports.getAllPackages = asyncHandler(async (req, res, next) => {
  const packages = await Package.find();

  res.status(200).json({
    success: true,
    count: packages.length,
    packages,
  });
});

// -----------------------------------------------------------------

exports.subscribePackage = asyncHandler(async (req, res, next) => {
    const { packageId, userId } = req.body;
  
    // Verifique se o usuário tem permissão para assinar pacotes
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorResponse("Usuário não encontrado", 404));
    }
  
    if (user.role !== 2) {
      return next(new ErrorResponse("Apenas subscritores podem adquirir pacotes", 403));
    }
  
    // Busque o pacote pelo ID
    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage) {
      return next(new ErrorResponse("Pacote não encontrado", 404));
    }
  
    // Calcule a data de início (hoje) e a data de término (startDate + duração do pacote)
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + selectedPackage.durationInDays);
  
    // Atualize o usuário com os detalhes da assinatura
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        subscription: {
          package: selectedPackage._id,
          startDate,
          endDate,
        },
      },
      { new: true } // Retorna o documento atualizado
    );
  
    // Verifique se o usuário foi atualizado com sucesso
    if (!updatedUser) {
      return next(new ErrorResponse("Não foi possível atualizar o usuário", 500));
    }
  
    // Responda com sucesso e retorne os dados do usuário atualizados
    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  });

exports.editSubscription = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { packageId } = req.body;

  // Verifique se o usuário tem permissão para editar assinaturas
  if (req.user.role !== 2) {
    return next(
      new ErrorResponse("Apenas subscritores podem editar assinaturas", 403)
    );
  }

  // Busque o pacote pelo ID
  const selectedPackage = await Package.findById(packageId);
  if (!selectedPackage) {
    return next(new ErrorResponse("Pacote não encontrado", 404));
  }

  // Calcule a nova data de término com base no pacote selecionado
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + selectedPackage.durationInDays);

  // Atualize o usuário com os novos detalhes da assinatura
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      subscription: {
        package: selectedPackage._id,
        startDate,
        endDate,
      },
    },
    { new: true } // Retorna o documento atualizado
  );

  // Verifique se o usuário foi atualizado com sucesso
  if (!updatedUser) {
    return next(new ErrorResponse("Não foi possível atualizar o usuário", 500));
  }

  // Responda com sucesso e retorne os dados do usuário atualizados
  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

exports.getAllSubscribers = asyncHandler(async (req, res, next) => {
  try {
    // Encontre todos os usuários que têm informações de assinatura (subscritos)
    const subscribers = await User.find({
      subscription: { $exists: true, $ne: null },
    });

    // Encontre todos os usuários que não têm informações de assinatura (não subscritos)
    const nonSubscribers = await User.find({
      subscription: { $exists: false },
    });

    res.status(200).json({
      success: true,
      subscribers,
      nonSubscribers,
    });
  } catch (error) {
    next(error);
  }
});
