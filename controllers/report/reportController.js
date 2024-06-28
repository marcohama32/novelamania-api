const ExcelJS = require("exceljs");
const moment = require("moment");
const Charge = require("../../models/charges/chargeModel");
const Expense = require("../../models/expenses/expenseModel");
const Customer = require("../../models/customer/customerModel");
const Service = require("../../models/servicos/servicoModel");

const exportDataToExcel = async (Model, startDate, endDate) => {
  try {
    let query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const allData = await Model.find(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(Model.modelName);

    const headers = Object.keys(Model.schema.paths).filter(
      (key) => !key.startsWith("_")
    );
    sheet.addRow(headers);

    allData.forEach((data) => {
      const rowData = headers.map((key) => data[key]);
      sheet.addRow(rowData);
    });

    const filePath = `${Model.modelName.toLowerCase()}s.xlsx`; // File name based on the model
    await workbook.xlsx.writeFile(filePath);
    console.log(`${Model.modelName} exported to Excel successfully:`, filePath);
    return filePath; // Return the file path once export is done
  } catch (error) {
    console.error(`Error exporting ${Model.modelName}:`, error);
    throw error;
  }
};

// Function to send the file as a download response
const sendFileAsDownload = (res, filePath, fileName) => {
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Error sending file");
    } else {
      console.log("File sent successfully");
    }
  });
};

// Usage of individual export functions with date range and download response
exports.exportCharges = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filePath = await exportDataToExcel(Charge, startDate, endDate);
  sendFileAsDownload(res, filePath, "charges.xlsx");
};

exports.exportExpenses = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filePath = await exportDataToExcel(Expense, startDate, endDate);
  sendFileAsDownload(res, filePath, "expenses.xlsx");
};

exports.exportCustomers = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filePath = await exportDataToExcel(Customer, startDate, endDate);
  sendFileAsDownload(res, filePath, "customers.xlsx");
};

exports.exportServices = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filePath = await exportDataToExcel(Service, startDate, endDate);
  sendFileAsDownload(res, filePath, "services.xlsx");
};
