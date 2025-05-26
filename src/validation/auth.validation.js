import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const validateRegister = (data) => registerSchema.validate(data);

export { validateRegister };
