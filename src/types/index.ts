import * as zg from 'zapatos/generate'

const zapCfg: zg.Config = { db: { connectionString: 'postgres://localhost/mydb' } };

export const generateTypes = async () => {
  await zg.generate(zapCfg)
}
