const Novel = require("../models/contentModel");
const User = require("../models/userModel");
const Package = require("../models/packageModel")
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/asyncHandler");
const Season = require("../models/seasonModel");
const path = require("path");
const mongoose = require('mongoose');
const fs = require('fs');

// Create novel or dorama
exports.createContent = asyncHandler(async (req, res, next) => {
  try {
    const { title, description, release_year, genres, type } = req.body;
    const image_url = req.file?.path;

    console.log("body :", req.body)

    console.log(image_url)

    const requiredFields = [title, description, release_year, image_url, type];

    if (requiredFields.some((field) => !field)) {
      return next(new ErrorResponse("Campos não podem estar vazios", 400));
    }

    // Verificar se a extensão da imagem é válida
    const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    const imageExtension = path.extname(req.file.originalname).toLowerCase();
    if (!validImageExtensions.includes(imageExtension)) {
      return next(new ErrorResponse("Formato de imagem inválido. Apenas JPG, JPEG, PNG e GIF são permitidos", 400));
    }

    const existingContent = await Novel.findOne({ title });
    if (existingContent) {
      return next(new ErrorResponse("Conteúdo com o mesmo título já existe", 400));
    }

    const content = await Novel.create({
      title,
      description,
      release_year,
      genres,
      image_url,
      type,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      content,
    });
  } catch (error) {
    next(error);
  }
});


// find content by ID
// Função para encontrar conteúdo pelo ID
exports.findContentById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    // Buscar o conteúdo pelo ID e incrementar views
    const content = await Novel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!content) {
      return res.status(404).json({ message: "Conteúdo não foi encontrado" });
    }

    const contentData = await Novel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "seasons",
          localField: "_id",
          foreignField: "novel",
          as: "seasons",
        },
      },
      {
        $unwind: {
          path: "$seasons",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "episodes",
          localField: "seasons._id",
          foreignField: "season",
          as: "seasons.episodes",
        },
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          description: { $first: "$description" },
          release_year: { $first: "$release_year" },
          genres: { $first: "$genres" },
          image_url: { $first: "$image_url" },
          user: { $first: "$user" },
          type: { $first: "$type" },
          views: { $first: "$views" },
          seasons: { $push: "$seasons" },
        },
      },
      {
        $addFields: {
          totalSeasons: { $size: "$seasons" },
          totalEpisodes: { $sum: { $size: "$seasons.episodes" } },
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
          type: 1,
          views: 1,
          totalSeasons: 1,
          totalEpisodes: 1,
          seasons: 1,
        },
      },
    ]);

    if (contentData.length === 0) {
      return res.status(404).json({ message: "Conteúdo não foi encontrado" });
    }

    res.status(200).json({
      success: true,
      content: contentData[0],
    });
  } catch (error) {
    next(error);
  }
});

  
  // find all contents
// Função para listar todos os conteúdos com paginação, busca, filtro por data e incluir views
// exports.getAllContents = asyncHandler(async (req, res, next) => {
//   try {
//     const pageSize = Number(req.query.pageSize) || 10;
//     const page = Number(req.query.page) || 1;
//     const searchTerm = req.query.searchTerm;
//     const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
//     const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

//     const query = {};

//     if (searchTerm) {
//       query.$or = [
//         { title: { $regex: searchTerm, $options: "i" } },
//         { description: { $regex: searchTerm, $options: "i" } },
//       ];
//     }

//     if (startDateParam && endDateParam) {
//       const startDate = new Date(startDateParam);
//       const endDate = new Date(endDateParam);
//       if (!isNaN(startDate) && !isNaN(endDate) && startDate <= endDate) {
//         query.createdAt = {
//           $gte: startDate,
//           $lte: endDate,
//         };
//       }
//     }

//     const totalCount = await Novel.countDocuments(query);

//     const contents = await Novel.aggregate([
//       { $match: query },
//       {
//         $lookup: {
//           from: "seasons",
//           localField: "seasons",
//           foreignField: "_id",
//           as: "seasons",
//         },
//       },
//       {
//         $addFields: {
//           totalSeasons: { $size: "$seasons" },
//           totalEpisodes: { $sum: "$seasons.episodes" },
//           views: "$views"
//         },
//       },
//       { $sort: { createdAt: -1 } },
//       { $skip: pageSize * (page - 1) },
//       { $limit: pageSize },
//     ]);

//     res.status(200).json({
//       success: true,
//       count: contents.length,
//       total: totalCount,
//       pageSize,
//       page,
//       contents,
//     });
//   } catch (error) {
//     next(error);
//   }
// });

exports.getAllContents = asyncHandler(async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    const query = {};

    if (searchTerm) {
      // Busca difusa básica usando regex
      const fuzzySearchTerm = searchTerm.split('').join('.*');
      query.$or = [
        { title: { $regex: fuzzySearchTerm, $options: "i" } },
        { description: { $regex: fuzzySearchTerm, $options: "i" } },
      ];
    }

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

    const totalCount = await Novel.countDocuments(query);

    const contents = await Novel.aggregate([
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
          views: "$views"
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
    ]);

    res.status(200).json({
      success: true,
      count: contents.length,
      total: totalCount,
      pageSize,
      page,
      contents,
    });
  } catch (error) {
    next(error);
  }
});
  
  // edit content
exports.editContent = asyncHandler(async (req, res, next) => {
    const id = req.params.id;
  
    let content = await Novel.findById(id);
  
    if (!content) {
      return res.status(404).json({ message: "Conteúdo não encontrado" });
    }
  
    const { title, description, release_year, genres, type } = req.body;
    let image_url;
  
    if (req.file) {
      const validImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
      const imageExtension = path.extname(req.file.originalname).toLowerCase();
      if (!validImageExtensions.includes(imageExtension)) {
        return next(new ErrorResponse("Formato de imagem inválido. Apenas JPG, JPEG, PNG e GIF são permitidos", 400));
      }
      image_url = req.file.path;
    } else {
      image_url = content.image_url;
    }
  
    const requiredFields = [title, description, release_year, genres, image_url, type];
  
    if (requiredFields.some((field) => !field)) {
      return next(new ErrorResponse("Campos não podem ser nulos", 400));
    }
  
    const updatedContent = await Novel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        release_year,
        genres,
        image_url,
        type,
        user: req.user.id,
      },
      { new: true }
    );
  
    res.status(200).json({
      success: true,
      content: updatedContent,
    });
  });

  
  // Delete content by ID
  exports.deleteContent = asyncHandler(async (req, res) => {
    const { id } = req.params;
  
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
  
      const deleteContent = await Novel.findById(id);
  
      if (!deleteContent) {
        return res.status(404).json({ error: "Conteúdo não encontrado" });
      }
  
      if (deleteContent.image_url) {
        const imagePath = path.join(__dirname, '..', deleteContent.image_url);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error("Erro ao remover a imagem:", err);
          }
        });
      }
  
      await Season.deleteMany({ novel: id });
      await Novel.deleteOne({ _id: id });
  
      res.status(200).json({ message: "Conteúdo removido com sucesso" });
    } catch (err) {
      console.error("Ocorreu um erro removendo o conteúdo:", err);
      res.status(500).json({ error: "Ocorreu um erro removendo o conteúdo" });
    }
  });
  
// find all doramas
exports.getAllDoramas = asyncHandler(async (req, res, next) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Format: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Format: YYYY-MM-DD

    const query = { type: "dorama" };

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

    // Calculate the total count of doramas matching the query
    const totalCount = await Novel.countDocuments(query);

    // Find doramas with pagination, population, and count seasons and episodes
    const doramas = await Novel.aggregate([
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
          views: "$views" // Incluir o campo views
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
    ]);

    res.status(200).json({
      success: true,
      count: doramas.length,
      total: totalCount,
      pageSize,
      page,
      doramas,
    });
  } catch (error) {
    next(error);
  }
});
  
// find all novels
exports.getAllNovels = asyncHandler(async (req, res, next) => {
  try {
    // Definindo o tamanho da página e a página atual
    const pageSize = parseInt(req.query.pageSize, 10) || 8;
    const page = parseInt(req.query.page, 10) || 1;
    const searchTerm = req.query.searchTerm;
    const startDateParam = req.query.startDate; // Formato: YYYY-MM-DD
    const endDateParam = req.query.endDate; // Formato: YYYY-MM-DD

    // Inicializando a consulta com o tipo "novela"
    const query = { type: "novela" };

    // Adicionando critérios de busca se searchTerm for fornecido
    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Adicionando critérios de intervalo de datas se startDate e endDate forem fornecidos
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

    // Calculando o total de documentos que correspondem à consulta
    const totalCount = await Novel.countDocuments(query);

    // Encontrando as novelas com paginação, população, e contagem de temporadas e episódios
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
          views: "$views", // Incluir o campo views
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: pageSize * (page - 1) },
      { $limit: pageSize },
    ]);

    // Enviando a resposta com os dados paginados
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



// Buscar os 4 conteúdos mais recentes e os 4 com mais visualizações
exports.getRecentAndTopViewedContents = asyncHandler(async (req, res, next) => {
  try {
    // Encontrar os 4 conteúdos mais recentes
    const recentContents = await Novel.aggregate([
      { $match: {} }, // Pode adicionar filtros aqui, se necessário
      { $sort: { createdAt: -1 } }, // Ordena por data de criação decrescente
      { $limit: 4 } // Limita a 4 documentos
    ]);

    // Encontrar os 4 conteúdos com mais visualizações
    const topViewedContents = await Novel.aggregate([
      { $match: {} }, // Pode adicionar filtros aqui, se necessário
      { $sort: { views: -1 } }, // Ordena por views decrescente
      { $limit: 4 } // Limita a 4 documentos
    ]);

    res.status(200).json({
      success: true,
      recentContents,
      topViewedContents
    });
  } catch (error) {
    next(error);
  }
});


exports.getDashboardData = async (req, res, next) => {
  try {
    console.log('Iniciando consulta do dashboard...');

    // Contagem de novelas
    const novelsCount = await Novel.countDocuments({ type: 'novela' });
    console.log('Novelas count:', novelsCount);

    // Contagem de doramas
    const doramasCount = await Novel.countDocuments({ type: 'dorama' });
    console.log('Doramas count:', doramasCount);

    // Contagem de clientes com role=2
    const clientsRole2Count = await User.countDocuments({ role: 2 });
    console.log('Clientes com role=2 count:', clientsRole2Count);

    // Contagem de clientes com role=1
    const clientsRole1Count = await User.countDocuments({ role: 1 });
    console.log('Clientes com role=1 count:', clientsRole1Count);

    // Encontrar todos os clientes subscritos
    const subscribedClients = await User.find({ 'subscription.package': { $exists: true } });

    // Array para armazenar o revenue mensal
    const revenueMonthly = [];

    // Loop sobre cada cliente subscrito para calcular o revenue mensal
    for (const client of subscribedClients) {
      const packageId = client.subscription.package;

      // Encontrar o pacote pelo ID
      const package = await Package.findById(packageId);

      if (package) {
        // Calcular o revenue mensal com base no preço do pacote e a quantidade de meses
        const startDate = new Date(client.subscription.startDate);
        const endDate = new Date(client.subscription.endDate);
        const numberOfMonths = calculateNumberOfMonths(startDate, endDate);

        for (let i = 0; i < numberOfMonths; i++) {
          const month = startDate.getMonth() + i;
          const year = startDate.getFullYear();

          // Exemplo: Suponha que o revenue mensal seja o preço do pacote
          const monthlyRevenue = {
            month: getMonthName(month),
            year: year,
            revenue: package.price,
          };

          revenueMonthly.push(monthlyRevenue);
        }
      }
    }

    // Estatísticas de views mensais de novelas (dados reais do banco)
    const monthlyNovelasViews = await getMonthlyViewsData('novela');

    // Estatísticas de views mensais de doramas (dados reais do banco)
    const monthlyDoramasViews = await getMonthlyViewsData('dorama');

    res.status(200).json({
      success: true,
      data: {
        novelsCount,
        doramasCount,
        clientsRole2Count,
        clientsRole1Count,
        revenueMonthly,
        monthlyNovelasViews,
        monthlyDoramasViews,
        // Adicione outras estatísticas conforme necessário
      },
    });
  } catch (error) {
    console.error('Erro ao recuperar dados do dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao recuperar dados do dashboard',
    });
  }
};

// Função auxiliar para calcular o número de meses entre duas datas
function calculateNumberOfMonths(startDate, endDate) {
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();

  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

// Função auxiliar para obter o nome do mês a partir do número do mês (0 a 11)
function getMonthName(monthNumber) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthNumber];
}

// Função para obter dados mensais de visualizações de um determinado tipo de conteúdo
// Função para obter dados mensais de visualizações de um determinado tipo de conteúdo
async function getMonthlyViewsData(contentType) {
  try {
    let pipeline = [
      { 
        $match: { type: contentType } 
      },
      { 
        $project: { 
          month: { $month: "$createdAt" }, 
          year: { $year: "$createdAt" } 
        } 
      },
      { 
        $group: { 
          _id: { month: "$month", year: "$year" }, 
          views: { $sum: "$views" } 
        } 
      },
      { 
        $sort: { "_id.year": 1, "_id.month": 1 } 
      },
      {
        $project: {
          _id: 0,
          month: { $concat: [{ $substr: ["$_id.month", 0, -1] }, "/", { $substr: ["$_id.year", 0, -1] }] },
          views: 1
        }
      }
    ];

    let monthlyViews = await Novel.aggregate(pipeline);

    return monthlyViews.map(item => ({
      month: item.month,
      views: item.views
    }));
  } catch (error) {
    console.error(`Erro ao obter dados mensais de visualizações para ${contentType}:`, error);
    return [];
  }
}
