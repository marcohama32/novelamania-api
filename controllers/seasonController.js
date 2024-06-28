const Season = require("../models/seasonModel");
const Novel = require("../models/novelaModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");

// Create season
exports.createSeason = asyncHandler(async (req, res, next) => {
  try {
    const { novel, season_number, title, description, release_year, episodes } = req.body;

    const requiredFields = [novel, season_number, title, release_year];

    if (requiredFields.some((field) => !field)) {
      return next(new ErrorResponse("Campos nao podem estar vazios", 400));
    }

    // Verificar se já existe uma temporada com o mesmo número na mesma novela
    const existingSeasonNumber = await Season.findOne({ novel, season_number });
    if (existingSeasonNumber) {
      return next(new ErrorResponse("Temporada com mesmo numero ja existe", 400));
    }

    // Verificar se já existe uma temporada com o mesmo título na mesma novela
    const existingSeasonTitle = await Season.findOne({ novel, title });
    if (existingSeasonTitle) {
      return next(new ErrorResponse("Temporada com mesmo titulo ja existe", 400));
    }

    // Criar nova temporada
    const season = await Season.create({
      novel,
      season_number,
      title,
      description,
      release_year,
      episodes,
      user: req.user.id,
    });

    // Atualizar a novela para incluir o ID da nova temporada
    await Novel.findByIdAndUpdate(novel, { $push: { seasons: season._id } });

    res.status(201).json({
      success: true,
      season,
    });
  } catch (error) {
    next(error);
  }
});


// Find season by ID
exports.findSeasonById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the season by ID and populate related fields
    const season = await Season.findById(id)
      .populate('novel')
      .populate('episodes');

    if (!season) {
      return res.status(404).json({ message: "A Temporada nao foi encontrada" });
    }

    res.status(200).json({
      success: true,
      season,
    });
  } catch (error) {
    next(error);
  }
});


// Find all seasons
exports.getAllSeasons = asyncHandler(async (req, res, next) => {
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
        { release_year: { $regex: searchTerm, $options: "i" } },
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

    // Calculate the total count of seasons matching the query
    const totalCount = await Season.countDocuments(query);

    // Find seasons with pagination and populate relations
    const seasons = await Season.find(query)
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize)
      .populate('novel')
      .populate('episodes');

    res.status(200).json({
      success: true,
      count: seasons.length,
      total: totalCount,
      pageSize,
      page,
      seasons,
    });
  } catch (error) {
    next(error);
  }
});


// Edit season
exports.editSeason = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  // Encontrar a temporada por ID
  let season = await Season.findById(id);

  if (!season) {
    return res.status(404).json({ message: "Temporada nao encontrada" });
  }

  const { novel, season_number, title, description, release_year, episodes } = req.body;

  const requiredFields = [novel, season_number, title, release_year];

  if (requiredFields.some((field) => !field)) {
    return next(new ErrorResponse("Campos nao podem ser nulos", 400));
  }

  // Verificar se já existe uma temporada com o mesmo número na nova novela
  const existingSeasonNumber = await Season.findOne({ novel, season_number, _id: { $ne: id } });
  if (existingSeasonNumber) {
    return next(new ErrorResponse("Temporada com mesmo numero ja existe na nova novela", 400));
  }

  // Verificar se já existe uma temporada com o mesmo título na nova novela
  const existingSeasonTitle = await Season.findOne({ novel, title, _id: { $ne: id } });
  if (existingSeasonTitle) {
    return next(new ErrorResponse("Temporada com mesmo titulo ja existe na nova novela", 400));
  }

  const oldNovelId = season.novel;

  // Atualizar a temporada
  const updatedSeason = await Season.findByIdAndUpdate(
    id,
    {
      novel,
      season_number,
      title,
      description,
      release_year,
      episodes,
      user: req.user.id,
    },
    { new: true }
  );

  // Se a novela foi alterada, atualizar as novelas antiga e nova
  if (oldNovelId.toString() !== novel) {
    // Remover a temporada da novela antiga
    await Novel.findByIdAndUpdate(oldNovelId, { $pull: { seasons: id } });
    // Adicionar a temporada à nova novela
    await Novel.findByIdAndUpdate(novel, { $push: { seasons: id } });
  }

  res.status(200).json({
    success: true,
    season: updatedSeason,
  });
});


// Delete season by ID
exports.deleteSeason = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the season by ID
    const season = await Season.findById(id);

    if (!season) {
      return res.status(404).json({ error: "Temporada nao encontrada" });
    }

    const novelId = season.novel;

    // Delete the season
    await Season.findByIdAndDelete(id);

    // Remove the season from the novel's seasons array
    await Novel.findByIdAndUpdate(novelId, { $pull: { seasons: id } });

    res.status(200).json({ message: "Temporada removida com sucesso" });
  } catch (err) {
    console.error("Ocorreu um erro removendo a Temporada:", err);
    res.status(500).json({ error: "Ocorreu um erro removendo a Temporada" });
  }
});

