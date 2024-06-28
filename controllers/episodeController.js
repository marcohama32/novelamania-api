const Episode = require("../models/episodeModel");
const Season = require("../models/seasonModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");

//create episode
exports.createEpisode = asyncHandler(async (req, res, next) => {
  try {
    const { season, title, episode_number, video_url, release_year } = req.body;

    console.log(req.body);

    // Verificar campos obrigatórios
    const requiredFields = [season, title, episode_number, video_url];
    if (requiredFields.some((field) => !field)) {
      return next(new ErrorResponse("Campos nao podem estar vazios", 400));
    }

    // Verificar se já existe um episódio com o mesmo número
    const existingEpisodeNumber = await Episode.findOne({
      season,
      episode_number,
    });
    if (existingEpisodeNumber) {
      return next(
        new ErrorResponse("Episodio com mesmo numero ja existe", 400)
      );
    }

    // Verificar se já existe um episódio com o mesmo título na mesma temporada
    const existingSeasonTitle = await Episode.findOne({ season, title });
    if (existingSeasonTitle) {
      return next(
        new ErrorResponse("Episodio com mesmo titulo ja existe", 400)
      );
    }

    // Criar novo episódio
    const episodio = await Episode.create({
      season,
      title,
      episode_number,
      video_url,
      release_year,
      user: req.user.id,
    });

    // Atualizar a temporada para incluir o ID do novo episódio
    await Season.findByIdAndUpdate(season, {
      $push: { episodes: episodio._id },
    });

    res.status(201).json({
      success: true,
      episodio,
    });
  } catch (error) {
    next(error);
  }
});

// Find episode by ID with relations
exports.findEpisodelById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Encontrar o episódio por ID e popular relações
    const episode = await Episode.findById(id).populate({
      path: "season",
      populate: {
        path: "novel",
        model: "Novel",
      },
    });

    if (!episode) {
      return res.status(404).json({ message: "O Episodio nao foi encontrado" });
    }

    res.status(200).json({
      success: true,
      episode,
    });
  } catch (error) {
    next(error);
  }
});

// find episodes by season ID
// exports.findEpisodesBySeasonId = asyncHandler(async (req, res, next) => {
//   try {
//     const { seasonId } = req.params;

//     // Encontrar todos os episódios pela temporada ID e popular relações
//     const episodes = await Episode.find({ season: seasonId })
//       .populate({
//         path: 'season',
//         populate: {
//           path: 'novel',
//           model: 'Novel'
//         }
//       });

//     if (!episodes || episodes.length === 0) {
//       return res.status(404).json({ message: "Nenhum episódio encontrado para esta temporada" });
//     }

//     res.status(200).json({
//       success: true,
//       episodes,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

exports.findEpisodesBySeasonId = asyncHandler(async (req, res, next) => {
  try {
    const { seasonId } = req.params;
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    // Create the query object
    const query = { season: seasonId };

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

    // Calculate the total count of episodes matching the query
    const totalCount = await Episode.countDocuments(query);

    // Find episodes with pagination and populate relations
    const episodes = await Episode.find(query)
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate({
        path: "season",
        populate: {
          path: "novel",
          model: "Novel",
        },
      });

    if (!episodes || episodes.length === 0) {
      return res
        .status(404)
        .json({ message: "Nenhum episódio encontrado para esta temporada" });
    }

    res.status(200).json({
      success: true,
      count: episodes.length,
      total: totalCount,
      pageSize,
      page,
      episodes,
    });
  } catch (error) {
    next(error);
  }
});

// Get all episodes with relations
exports.getAllEpisodes = asyncHandler(async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    // Create the query object
    const query = {};

    // Add search criteria if searchTerm is provided
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { amount: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
        { paymentMethod: { $regex: searchTerm, $options: "i" } },
        { notes: { $regex: searchTerm, $options: "i" } },
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

    // Calculate the total count of episodes matching the query
    const totalCount = await Episode.countDocuments(query);

    // Find episodes with pagination and populate relations
    const episodes = await Episode.find(query)
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate({
        path: "season",
        populate: {
          path: "novel",
          model: "Novel",
        },
      });

    res.status(200).json({
      success: true,
      count: episodes.length,
      total: totalCount,
      pageSize,
      page,
      episodes,
    });
  } catch (error) {
    next(error);
  }
});

// edit episode
exports.editEpisode = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  // Encontrar o episódio por ID
  let episode = await Episode.findById(id);

  if (!episode) {
    return res.status(404).json({ message: "Episodio nao encontrado" });
  }

  const { title, episode_number, video_url, release_year } = req.body;

  const requiredFields = [title, episode_number, video_url];

  if (requiredFields.some((field) => !field)) {
    return next(new ErrorResponse("Campos nao podem ser nulos", 400));
  }

  // Verificar se já existe um episódio com o mesmo número na nova temporada
  const existingEpisodeNumber = await Episode.findOne({
    episode_number,
    _id: { $ne: id },
  });
  if (existingEpisodeNumber) {
    return next(
      new ErrorResponse(
        "Episodio com mesmo numero ja existe na nova temporada",
        400
      )
    );
  }

  // Verificar se já existe um episódio com o mesmo título na nova temporada
  const existingSeasonTitle = await Episode.findOne({
    title,
    _id: { $ne: id },
  });
  if (existingSeasonTitle) {
    return next(
      new ErrorResponse(
        "Episodio com mesmo titulo ja existe na nova temporada",
        400
      )
    );
  }

  const oldSeasonId = episode.season;

  // Atualizar o episódio
  const updatedEpisode = await Episode.findByIdAndUpdate(
    id,
    {
      title,
      episode_number,
      video_url,
      release_year,
      user: req.user.id,
    },
    { new: true }
  );

  // Se a temporada foi alterada, atualizar as temporadas antigas e novas
  // if (oldSeasonId.toString() !== season) {
  //   // Remover o episódio da temporada antiga
  //   await Season.findByIdAndUpdate(oldSeasonId, { $pull: { episodes: id } });
  //   // Adicionar o episódio à nova temporada
  //   await Season.findByIdAndUpdate(season, { $push: { episodes: id } });
  // }

  res.status(200).json({
    success: true,
    episode: updatedEpisode,
  });
});

// Delete episode by ID
exports.deleteEpisode = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the episode by ID
    const episode = await Episode.findById(id);

    if (!episode) {
      return res.status(404).json({ error: "Episodio nao encontrado" });
    }

    const seasonId = episode.season;

    // Delete the episode
    await Episode.findByIdAndDelete(id);

    // Remove the episode from the season's episodes array
    await Season.findByIdAndUpdate(seasonId, { $pull: { episodes: id } });

    res.status(200).json({ message: "Episodio removido com sucesso" });
  } catch (err) {
    console.error("Ocorreu um erro removendo o Episodio:", err);
    res.status(500).json({ error: "Ocorreu um erro removendo o Episodio" });
  }
});
