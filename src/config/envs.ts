import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars{
  PORT: number;
  NATS_SERVERS: string;
  SECRET: string;
}

const envVarsSchema = joi.object({
  PORT: joi.number().required(),
  NATS_SERVERS: joi.string().required(),
  SECRET: joi.string().required()
})
.unknown(true);

const { error, value } = envVarsSchema.validate(process.env);


if (error) throw new Error(`Config validation error: ${error.message}`);
const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
  natsServers: envVars.NATS_SERVERS,
  secret: envVars.SECRET
};