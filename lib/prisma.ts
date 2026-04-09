// v1.0.1 - Sincronizado con isExternal
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaForceCacheV5: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaForceCacheV5 ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaForceCacheV5 = prisma;
