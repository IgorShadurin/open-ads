import { prisma } from "@/server/prisma";

export const getRegistrationState = async (): Promise<boolean> => {
  const settings = await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isRegistrationOpen: false },
    select: { isRegistrationOpen: true },
  });

  return settings.isRegistrationOpen;
};

export const setRegistrationState = async (isRegistrationOpen: boolean): Promise<boolean> => {
  const settings = await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: { isRegistrationOpen },
    create: { id: 1, isRegistrationOpen },
    select: { isRegistrationOpen: true },
  });

  return settings.isRegistrationOpen;
};
