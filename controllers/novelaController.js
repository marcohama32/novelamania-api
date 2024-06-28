const Novel = require("../models/contentModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const path = require("path"); // Adicione esta linha para importar o módulo path
const mongoose = require('mongoose');
const fs = require('fs');

// Create novel
exports.createNovel = asyncHandler(async (req, res, next) => {
  try {
    const { title, description, release_year, genres } = req.body;

    // Verificar se o campo genres é um array
    // if (!Array.isArray(genres)) {
    //   return next(new ErrorResponse("O campo 'genres' deve ser um array", 400));
    // }

    const image_url = req.file?.path;

    const requiredFields = [
      title,
      description,
      release_year,
      // genres,
      image_url,
    ];

    if (requiredFields.some((field) => !field)) {
      return next(new ErrorResponse("Campos nao podem estar vazios", 400));
    }

    // Verificar se a extensão da imagem é válida
    const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const imageExtension = path.extname(req.file.originalname).toLowerCase();
    if (!validImageExtensions.includes(imageExtension)) {
      return next(
        new ErrorResponse(
          "Formato de imagem inválido. Apenas JPG, JPEG, PNG e GIF são permitidos",
          400
        )
      );
    }

    const existingNovel = await Novel.findOne({ title });
    if (existingNovel) {
      return next(new ErrorResponse("Novela com mesmo titulo ja existe", 400));
    }

    // Crie a novela
    const novel = await Novel.create({
      title,
      description,
      release_year,
      genres,
      image_url,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      novel,
    });
  } catch (error) {
    next(error);
  }
});

// find novel by ID
exports.findNovelById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verifique se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // Agregação para encontrar a novela e calcular o total de temporadas e episódios
    const novelData = await Novel.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "seasons",
          localField: "_id",
          foreignField: "novel",
          as: "seasons",
        },
      },
      {
        $addFields: {
          totalSeasons: { $size: "$seasons" },
          totalEpisodes: { $sum: "$seasons.episodes" },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          release_year: 1,
          genres: 1,
          image_url: 1,
          user: 1,
          totalSeasons: 1,
          totalEpisodes: 1,
          seasons: 1,
        },
      },
    ]);

    // Verifique se a novela foi encontrada
    if (novelData.length === 0) {
      return res.status(404).json({ message: "Novela nao foi encontrada" });
    }

    res.status(200).json({
      success: true,
      novel: novelData[0],
    });
  } catch (error) {
    next(error);
  }
});

// find all novels
exports.getAllNovels = asyncHandler(async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    const query = {};

    // Add search criteria if searchTerm is provided
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
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

    // Calculate the total count of novels matching the query
    const totalCount = await Novel.countDocuments(query);

    // Find novels with pagination, population, and count seasons and episodes
    const novels = await Novel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "seasons",
          localField: "_id",
          foreignField: "novel",
          as: "seasons",
        },
      },
      {
        $addFields: {
          totalSeasons: { $size: "$seasons" },
          totalEpisodes: { $sum: "$seasons.episodes" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
    ]);

    res.status(200).json({
      success: true,
      count: novels.length,
      total: totalCount,
      pageSize,
      page,
      novels,
    });
  } catch (error) {
    next(error);
  }
});

// edit novel
exports.editNovel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  // Find the novel by ID
  let checkNovel = await Novel.findById(id);

  if (!checkNovel) {
    return res.status(404).json({ message: "Novela não encontrada" });
  }

  const { title, description, release_year, genres } = req.body;

  // Verificar se a extensão da imagem é válida, se houver uma imagem enviada na requisição
  let image_url;
  if (req.file) {
    const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const imageExtension = path.extname(req.file.originalname).toLowerCase();
    if (!validImageExtensions.includes(imageExtension)) {
      return next(
        new ErrorResponse(
          "Formato de imagem inválido. Apenas JPG, JPEG, PNG e GIF são permitidos",
          400
        )
      );
    }
    image_url = req.file.path;
  }

  const requiredFields = [title, description, release_year, genres, image_url];

  if (requiredFields.some((field) => !field)) {
    return next(new ErrorResponse("Campos não podem ser nulos", 400));
  }

  const updatedNovel = await Novel.findByIdAndUpdate(
    id,
    {
      title,
      description,
      release_year,
      genres,
      image_url,
      user: req.user.id,
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    novel: updatedNovel,
  });
});
// Delete novel by ID
exports.deleteNovel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Verifique se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    // Find the novel by ID and delete it
    const deletenovel = await Novel.findByIdAndDelete(id);

    if (!deletenovel) {
      return res.status(404).json({ error: "Novela nao encontrada" });
    }

    // Delete all seasons associated with the novel
    await Season.deleteMany({ novel: id });

    // Emit an event indicating that the novel was deleted
    // const io = req.app.locals.io; // Get the Socket.IO instance
    // io.emit("novel deleted", id);

    res.status(200).json({ message: "Novela removida com sucesso" });
  } catch (err) {
    console.error("Ocorreu um erro removendo a Novela:", err);
    res.status(500).json({ error: "Ocorreu um erro removendo a Novela" });
  }
});


//pagar novela com a imagem do repositorio
// Delete novel by ID
// exports.deleteNovel = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   try {
//     // Verifique se o ID é válido
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "ID inválido" });
//     }

//     // Find the novel by ID
//     const deletenovel = await Novel.findById(id);

//     if (!deletenovel) {
//       return res.status(404).json({ error: "Novela nao encontrada" });
//     }

//     // Remove the associated image from the file system
//     if (deletenovel.image_url) {
//       const imagePath = path.join(__dirname, '..', deletenovel.image_url);
//       fs.unlink(imagePath, (err) => {
//         if (err) {
//           console.error("Erro ao remover a imagem:", err);
//         }
//       });
//     }

//     // Delete all seasons associated with the novel
//     await Season.deleteMany({ novel: id });

//     // Delete the novel itself
//     await deletenovel.remove();

//     // Emit an event indicating that the novel was deleted
//     // const io = req.app.locals.io; // Get the Socket.IO instance
//     // io.emit("novel deleted", id);

//     res.status(200).json({ message: "Novela removida com sucesso" });
//   } catch (err) {
//     console.error("Ocorreu um erro removendo a Novela:", err);
//     res.status(500).json({ error: "Ocorreu um erro removendo a Novela" });
//   }
// });