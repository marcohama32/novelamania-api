const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const subscriptionSchema = new Schema({
  package: {
    type: Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
});

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "O primeiro nome é obrigatório"],
      maxlength: 32,
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "O último nome é obrigatório"],
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Por favor, adicione um e-mail válido",
      ],
    },
    gender: {
      type: String,
      required: [true, "Gênero é obrigatório"],
      enum: ["masculino", "feminino", "outro"],
    },
    dob: {
      type: Date,
      required: [true, "Data de nascimento é obrigatória"],
    },
    province: {
      type: String,
      required: [true, "Endereço é obrigatório"],
    },
    contact1: {
      type: String,
      unique: true,
      required: function () {
        return this.isNew; // Torna obrigatório apenas ao criar um novo documento
      },
    },
    username: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      trim: true,
      default: "senha123", // Defina uma senha padrão, mas lembre-se de criptografar
    },
    subscription: subscriptionSchema,
    avatar: {
      type: String,
    },
    role: {
      type: Number,
      default: 0, // 0 para usuário normal, 1 para administrador
    },
    status: {
      type: String,
      default: "Active", // Status padrão ativo
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Método para comparar senha
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para gerar token JWT
userSchema.methods.getJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: 3600, // Token expira em 1 hora
  });
  return token;
};

module.exports = mongoose.model("User", userSchema);
